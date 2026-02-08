import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { AppState } from 'react-native';
import { getAsyncData } from './helper';
import { setAuthContext } from './authContext';
import { refreshTokenAsync } from './axios_instance';
import { logInfo, logWarn } from './logger';

interface AuthContextProps {
  isAuthenticated: boolean;
  loading: boolean; // true only during initial boot or forced refresh
  setAuth: () => void; // trigger a re-check
  refreshing: boolean; // indicates a background refresh
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [changeInAuth, setChangeInAuth] = useState<number>(0);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const parseExp = (token: string): number | null => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')),
      );
      return payload.exp ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  };

  const setAuth = useCallback(() => {
    logInfo('[AuthProvider]', 'setAuth called - triggering auth recheck');
    setChangeInAuth(prev => prev + 1);
  }, []);

  const checkAuth = async () => {
    logInfo('[AuthProvider]', 'checkAuth starting...');
    setLoading(true);
    try {
      const tokenObj = await getAsyncData('auth_data');

      const accessToken = tokenObj?.tokenValue?.accessToken || tokenObj?.tokenValue?.access_token;
      if (!accessToken) {
        logInfo('[AuthProvider]', 'No token found - forcing navigation to login screen');
        // Force navigation to login by setting states in correct order
        setIsAuthenticated(false);
        setLoading(false);
        // Ensure AuthContext is updated to reflect logout state immediately
        setAuthContext({ isAuthenticated: false, loading: false, setAuth, refreshing: false });
        return;
      }

      // Determine expiry
      const expMs = tokenObj?.tokenValue?.expiresIn
        ? Date.now() + tokenObj.tokenValue.expiresIn * 1000
        : parseExp(accessToken);

      const nearExpiry = expMs ? expMs - Date.now() < 60000 : false; // expires in < 60s

      if (nearExpiry) {
        // Try proactive refresh once
        setRefreshing(true);
        try {
          const newAccess = await refreshTokenAsync();
          if (newAccess) {
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        } catch (e) {
          logWarn('[AuthProvider]', 'Proactive refresh failed', e);
          setIsAuthenticated(false);
        } finally {
          setRefreshing(false);
        }
      } else {
        setIsAuthenticated(true);
      }
    } catch (error) {
      logWarn('[AuthProvider]', 'Authentication Error', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Update context immediately so axios interceptor has access
    setAuthContext({ isAuthenticated, loading, setAuth, refreshing });
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changeInAuth]);

  // Re-check auth when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        logInfo('[AuthProvider]', 'App came to foreground, re-checking auth');
        checkAuth();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Update context whenever auth state changes
  useEffect(() => {
    logInfo('[AuthProvider]', 'Auth state changed:', { isAuthenticated, loading, refreshing });
    setAuthContext({ isAuthenticated, loading, setAuth, refreshing });
  }, [isAuthenticated, loading, setAuth, refreshing]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, setAuth, refreshing }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
