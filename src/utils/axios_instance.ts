import axios from 'axios';
import { APP_BASE_URL } from '../store/types';
import { getAuthContext } from './authContext';
import * as Helper from './helper';
import { Platform, AppState } from 'react-native';
import Toast from 'react-native-toast-message';
import { logInfo, logError, logWarn } from './logger';

// Constants for refresh token handling
const REFRESH_TIMEOUT = 10000; // 10s timeout


// Improved refresh token state management
interface TokenData {
  tokenValue: {
    accessToken?: string;
    access_token?: string;
    refreshToken?: string;
    expiresIn?: number;
    exp?: number;
  };
}

class RefreshState {
  private isRefreshing = false;
  private refreshAttempts = 0;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private refreshSubscribers: Array<{
    resolve: (token: string) => void;
    reject: (error: Error) => void;
  }> = [];

  // Simple listener set for overlay / UI updates
  private listeners: Set<(e: RefreshLifecycleEvent) => void> = new Set();

  constructor() {
    // Clean up when React Native app is closed/backgrounded
    // Handle app state changes
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      AppState.addEventListener('change', (nextState) => {
        if (nextState === 'active') {
          console.log('[RefreshState] App came to foreground, checking token status...');
          this.init();
        } else if (nextState === 'background' || nextState === 'inactive') {
          console.log('[RefreshState] App went to background, pausing refresh timer...');
          this.cleanup();
        }
      });
    }
  }

  public async init() {
    try {
      const tokenObj = await Helper.getAsyncData('auth_data');
      if (tokenObj?.tokenValue) {
        await this.scheduleTokenRefresh(tokenObj);
      }
    } catch (e) {
      console.warn('[RefreshState] init failed', e);
    }
  }

  private cleanup() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.refreshSubscribers = [];
  }

  public addListener(fn: (e: RefreshLifecycleEvent) => void) {
    this.listeners.add(fn);
  }
  public removeListener(fn: (e: RefreshLifecycleEvent) => void) {
    this.listeners.delete(fn);
  }
  private emit(e: RefreshLifecycleEvent) {
    this.listeners.forEach(l => {
      try { l(e); } catch (err) { /* swallow */ }
    });
  }

  // Parse JWT token to get expiration
  private parseJwt(token: string): { exp?: number } {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.warn('[RefreshState] Failed to parse JWT:', e);
      return {};
    }
  }

  // Calculate when token expires (supports expiresIn in seconds OR ms)
  private getTokenExpiration(tokenObj: TokenData): number | null {
    try {
      const accessToken = tokenObj.tokenValue.accessToken || tokenObj.tokenValue.access_token;
      if (!accessToken) {
        return null;
      }

      // Check explicit expiry first
      if (tokenObj.tokenValue.expiresIn) {
        const raw = tokenObj.tokenValue.expiresIn;
        // Heuristic: if raw > 100000 treat as milliseconds already
        const ms = raw > 100000 ? raw : raw * 1000;
        return Date.now() + ms;
      }

      // Then check JWT exp claim
      const decoded = this.parseJwt(accessToken);
      if (decoded.exp) {
        return decoded.exp * 1000; // Convert to milliseconds
      }

      return null;
    } catch (e) {
      console.warn('[RefreshState] Error calculating token expiration:', e);
      return null;
    }
  }

  // Validate presence of refresh token (do NOT block refresh if access token expired)
  private hasRefreshPrerequisites(tokenObj: any): boolean {
    if (!tokenObj?.tokenValue?.refreshToken) {
      return false;
    }
    if (!(tokenObj?.tokenValue?.accessToken || tokenObj?.tokenValue?.access_token)) {
      // We can still attempt if only refresh token exists (some flows allow this)
      return true;
    }
    return true;
  }

  // Queue a subscriber waiting for refresh
  private addSubscriber(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.refreshSubscribers.push({ resolve, reject });
    });
  }

  // Update stored tokens (access + optionally refresh) and reset attempt counter
  private async updateStoredTokens(tokenObj: any, newAccessToken: string, newRefreshToken?: string, newExpiresIn?: number) {
    tokenObj.tokenValue.accessToken = newAccessToken;
    if (newRefreshToken) {
      tokenObj.tokenValue.refreshToken = newRefreshToken;
    }
    if (typeof newExpiresIn === 'number') {
      tokenObj.tokenValue.expiresIn = newExpiresIn;
    }
    await Helper.storeAsyncData('auth_data', tokenObj);
    this.refreshAttempts = 0;
    logInfo('[RefreshState]', 'Token updated successfully');
  }

  // Handle force logout with optional notification
  public async handleForceLogout(showNotification = true) {
    console.warn('[RefreshState] Force logout initiated');
    await Helper.storeAsyncData('auth_data', null);
    const currentAuth = getAuthContext();
    if (currentAuth?.setAuth) {
      if (showNotification) {
        try {
          Toast.show({ type: 'error', text1: 'Session expired', text2: 'Please log in again.' });
        } catch { }
      }
      currentAuth.setAuth();
    }
    this.refreshAttempts = 0;
  }

  // Notify all waiting subscribers
  private notifySubscribers(token: string) {
    this.refreshSubscribers.forEach(sub => sub.resolve(token));
    this.refreshSubscribers = [];
  }

  // Reject all waiting subscribers
  private rejectSubscribers(error: Error) {
    this.refreshSubscribers.forEach(sub => sub.reject(error));
    this.refreshSubscribers = [];
  }

  // Schedule next refresh before token expires
  private async scheduleTokenRefresh(tokenObj: TokenData) {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    const expiry = this.getTokenExpiration(tokenObj);
    if (!expiry) {
      logInfo('[RefreshState]', 'No expiry found, skipping refresh schedule');
      return;
    }

    const timeUntilExpiry = expiry - Date.now();
    if (timeUntilExpiry <= 0) {
      logInfo('[RefreshState]', 'Token already expired');
      return;
    }

    const targetDelay = Math.max(1000, timeUntilExpiry - 300000); // Proactive refresh 5 minutes before expiry

    this.refreshTimer = setTimeout(() => {
      logInfo('[RefreshState]', 'Executing scheduled refresh');
      this.refreshToken().catch(err => {
        logError('[RefreshState]', 'Scheduled refresh failed:', err);
      });
    }, targetDelay);
    // Add jitter (up to ~2s) so multiple clients don't hammer simultaneously
    // const jitter = Math.min(2000, Math.random() * 2000);
    // const adjustedDelay = Math.max(1000, targetDelay - jitter);

    // if (adjustedDelay > 0) {
    //   logInfo('[RefreshState]', `Scheduling refresh in ${Math.round(adjustedDelay / 1000)}s (timeUntilExpiry=${Math.round(timeUntilExpiry / 1000)}s)`);
    //   this.emit({ type: 'scheduled', expiresAt: Date.now() + adjustedDelay });
    //   this.refreshTimer = setTimeout(() => {
    //     logInfo('[RefreshState]', 'Executing scheduled refresh');
    //     this.refreshToken().catch(err => {
    //       logError('[RefreshState]', 'Scheduled refresh failed:', err);
    //     });
    //   }, adjustedDelay);
    // } else {
    //   logInfo('[RefreshState]', 'Skipping schedule due to non-positive delay, will rely on 401-triggered refresh');
    // }
  }

  // Main refresh token method
  async refreshToken(): Promise<string> {
    // If already refreshing, queue this request
    if (this.isRefreshing) {
      logInfo('[RefreshState]', 'Refresh in progress, queuing request');
      return this.addSubscriber();
    }

    this.isRefreshing = true;
    logInfo('[RefreshState]', 'Starting token refresh');
    this.emit({ type: 'start' });

    try {
      const tokenObj = await Helper.getAsyncData('auth_data');

      if (!this.hasRefreshPrerequisites(tokenObj)) {
        throw new Error('Missing refresh token');
      }
      const expiry = tokenObj ? this.getTokenExpiration(tokenObj) : null;
      if (expiry && expiry <= Date.now()) {
        logInfo('[RefreshState]', 'Access token already expired; proceeding with refresh');
      } else if (expiry && expiry - Date.now() < 30000) {
        logInfo('[RefreshState]', 'Access token expiring soon; proactive refresh now');
      }

      interface RefreshResponse {
        status: number;
        data: {
          value?: {
            accessToken?: string;
            refreshToken?: string;
            expiresIn?: number;
          };
          message?: string;
        };
      }

      // Attempt refresh with timeout
      const response = (await Promise.race([
        axios.post(`${APP_BASE_URL}api/auth/refresh_token`, {
          refresh_token: tokenObj.tokenValue.refreshToken,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Refresh token request timeout')), REFRESH_TIMEOUT)),
      ])) as RefreshResponse;

      // Treat 400/401/500 from refresh endpoint as errors requiring action
      if (response.status === 400 || response.status === 401 || response.status === 500) {
        logWarn('[RefreshState]', `Refresh token error (${response.status}), logging out user`);
        await this.handleForceLogout(true); // Show notification on first error
        throw new Error(response.status === 500 ? 'Server error during refresh' : 'Refresh token expired');
      }

      if (response.status === 201 || response.status === 200) {
        logInfo('[RefreshState]', 'Refresh response:', response.data?.value || {});
        const newAccessToken = response.data?.value?.accessToken;
        const newRefreshToken = response.data?.value?.refreshToken;
        let newExpiresIn = response.data?.value?.expiresIn;
        if (!newAccessToken) {
          throw new Error('Invalid refresh response: missing access token');
        }
        // If expiresIn is missing, try derive from JWT exp
        if (typeof newExpiresIn !== 'number') {
          try {
            const decoded = this.parseJwt(newAccessToken);
            if (decoded.exp) {
              const msRemaining = decoded.exp * 1000 - Date.now();
              if (msRemaining > 0) {
                newExpiresIn = Math.round(msRemaining / 1000); // store seconds for consistency
                logInfo('[RefreshState]', 'Derived expiresIn from JWT exp:', newExpiresIn);
              }
            }
          } catch { }
        }

        await this.updateStoredTokens(tokenObj, newAccessToken, newRefreshToken, newExpiresIn);

        // Schedule next refresh based on new token
        await this.scheduleTokenRefresh({
          tokenValue: {
            ...tokenObj.tokenValue,
            accessToken: newAccessToken,
          },
        });

        const expTs = this.getTokenExpiration({ tokenValue: { accessToken: newAccessToken, expiresIn: newExpiresIn } } as any);
        this.emit({ type: 'success', token: newAccessToken, expiresAt: expTs || undefined });
        this.notifySubscribers(newAccessToken);
        return newAccessToken;
      }

      throw new Error(`Invalid refresh response status: ${response.status}`);

    } catch (err: any) {
      this.refreshAttempts++;
      // Handle various error status codes (400, 401, 500)
      const status = err?.response?.status;
      if (status === 400 || status === 401 || status === 500) {
        console.warn('[RefreshState] Token refresh failed with status', status, '— logging out');
        await this.handleForceLogout(true); // Show notification on first error
      }

      const error = err instanceof Error ? err : new Error('Unknown error during refresh');
      console.error('[RefreshState] Refresh failed:', error.message);
      this.emit({ type: 'failure', reason: error.message });
      this.rejectSubscribers(error);
      throw error;

    } finally {
      this.isRefreshing = false;
    }
  }
}

// Create axios instance with timeout
const axiosInstance = axios.create({
  timeout: 10000, // 10 seconds timeout
});

// Initialize refresh state
const refreshState = new RefreshState();
refreshState.init();

// Event type & listener helpers
export interface RefreshLifecycleEvent {
  type: 'start' | 'success' | 'failure' | 'scheduled';
  token?: string;
  expiresAt?: number;
  reason?: string;
}
export const addRefreshListener = (fn: (e: RefreshLifecycleEvent) => void) => (refreshState as any).addListener(fn);
export const removeRefreshListener = (fn: (e: RefreshLifecycleEvent) => void) => (refreshState as any).removeListener(fn);
export const forceRefresh = () => refreshState.refreshToken();

export const isTokenRefreshing = () => (refreshState as any).isRefreshing === true;

// Request interceptor - add auth token
axiosInstance.interceptors.request.use(
  async config => {
    try {
      const tokenObj = await Helper.getAsyncData('auth_data');
      const accessToken = tokenObj?.tokenValue?.accessToken || tokenObj?.tokenValue?.access_token;

      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
        // Proactive refresh if access token TTL < 10s
        try {
          let ttl: number | null = null;
          if (tokenObj?.tokenValue?.expiresIn) {
            const raw = tokenObj.tokenValue.expiresIn;
            const ms = raw > 100000 ? raw : raw * 1000;
            ttl = (tokenObj.__cachedExpiryTs || (Date.now() + ms)) - Date.now();
          } else {
            // Parse JWT exp
            const parts = accessToken.split('.');
            if (parts.length === 3) {
              try {
                const payload = JSON.parse(
                  atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')),
                );
                if (payload.exp) {
                  ttl = payload.exp * 1000 - Date.now();
                }
              } catch { }
            }
          }
          if (ttl !== null && ttl > 0 && ttl <= 10000) {
            // Refresh before proceeding so current request uses new token
            const newToken = await refreshState.refreshToken();
            config.headers.Authorization = `Bearer ${newToken}`;
          }
        } catch (e) {
          // Silent fail; normal flow continues
        }
      }
    } catch (error) {
      console.warn('[Axios] Error in request interceptor:', error);
    }
    return config;
  },
  error => Promise.reject(error),
);

// Response interceptor - handle refresh flow
axiosInstance.interceptors.response.use(
  async response => {
    // Some backends return HTTP 200 with an auth failure in the body
    try {
      const data = response?.data;
      const bodyStatus = data?.statusCode ?? data?.StatusCode ?? data?.status;
      const bodyMessage: string | undefined = data?.message;
      if (bodyStatus === 401 || bodyStatus === 403 || bodyMessage === 'Authentication failed.') {
        logWarn('[Axios]', 'Detected 401 in response body:', { bodyStatus, bodyMessage, url: response.config?.url });
        const syntheticError: any = new Error(bodyMessage || 'Authentication failed');
        syntheticError.config = response.config;
        syntheticError.response = { status: 401, data, config: response.config };
        return Promise.reject(syntheticError);
      }
    } catch { }
    return response;
  },
  async error => {
    const originalRequest = error.config;

    // Handle network errors
    if (!error.response) {
      return Promise.reject(
        new Error('Network error. Please check your internet connection.'),
      );
    }

    const status = error.response.status;

    // Handle 401/403/500 with single retry via refresh, then logout globally
    if (status === 401 || status === 403 || status === 500) {
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const newAccessToken = await refreshState.refreshToken();
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosInstance(originalRequest);
        } catch (refreshError: any) {
          // Refresh failed or was rejected -> logout
          logWarn('[Axios]', 'Refresh failed, logging out user...');
          try {
            await refreshState.handleForceLogout(false); // Don't show notification on retry failure
            logInfo('[Axios]', 'Auth data cleared after refresh failure');
          } catch (err) {
            console.error('[Axios] Error during logout after refresh failure:', err);
          }
          return Promise.reject(
            refreshError instanceof Error ? refreshError : new Error('Authentication error. Please login again.')
          );
        }
      } else {
        // Already retried: force logout
        logWarn('[Axios]', '401 after retry, forcing logout...');
        try {
          // Handle logout through refresh state's cleanup mechanism
          await Helper.storeAsyncData('auth_data', null);
          const currentAuth = getAuthContext();
          if (currentAuth?.setAuth) {
            currentAuth.setAuth();
          }
        } catch (err) {
          logError('[Axios]', 'Error during logout:', err);
        }
        return Promise.reject(new Error('Unauthorized. Please login again.'));
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
// Export refresh function for proactive refresh
export const refreshTokenAsync = () => refreshState.refreshToken();