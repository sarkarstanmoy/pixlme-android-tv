import React, { useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  BackHandler,
  Button,
} from 'react-native';
import ListView from '../../components/ListView';
import * as Helper from '../../utils/helper';
import HomeHeader from '../../components/HomeHeader';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { getCollections } from '../../store/actions/collectionActions';
import { getUserInfo, getUserProfilePic } from '../../store/actions/userActions';
import { useFocusEffect } from '@react-navigation/native';
import WebSocketComponent from '../../utils/websocket';
import Ionicons from 'react-native-vector-icons/Ionicons';
import KeyEvent, { KeyEventProps } from 'react-native-keyevent';
import { useAuth } from '../../utils/authProvider';
import { isTokenRefreshing } from '../../utils/axios_instance';
import { logInfo, logWarn } from '../../utils/logger';
import { collectionItem } from '../../models';
import LinearGradient from 'react-native-linear-gradient';
import HorizontalTransaction from '../../components/HomeHeader/AnimatedCarosel';
const MAX_RETRIES = 3;
const LOAD_TIMEOUT = 30000; // 30 seconds timeout
const Home = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { setAuth } = useAuth();
  const [globalFocus, setGlobalFocus] = useState('PROFILEBUTTON');
  const { collections, status } = useSelector((state: RootState) => state.collections);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnceRef = useRef(false);
  const isFetchingRef = useRef(false);
  const retryCountRef = useRef(0);
  const isMountedRef = useRef(true);
  const [error, setError] = useState<string | null>(null);



  const logoutUser = React.useCallback(async () => {
    try {
      await Helper.storeAsyncData('auth_data', null);
      setAuth();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [setAuth]);

  // Function to load data (memoized)
  const loadData = useCallback(async (opts?: { fetchCollections?: boolean }) => {
    try {
      const tokenObj = await Helper.getAsyncData('auth_data');
      const tokenVal = tokenObj?.tokenValue?.accessToken || tokenObj?.tokenValue?.access_token;
      if (!tokenVal) throw new Error('Missing token');

      const bodyObj = { AuthStr: `Bearer ${tokenVal}` };
      await Promise.all([
        opts?.fetchCollections !== false && dispatch(getCollections()),
        dispatch(getUserInfo(bodyObj)),
        dispatch(getUserProfilePic(bodyObj))
      ].filter(Boolean));
    } catch {
      logoutUser();
    }
  }, [dispatch, logoutUser]);

  const refreshCollections = useCallback(async () => {
    try {
      await dispatch(getCollections()).unwrap();
    } catch {
      const hasToken = !!(await Helper.getAsyncData('auth_data'))?.tokenValue?.accessToken;
      !hasToken && logoutUser();
    }
  }, [dispatch, logoutUser]);

  // Data fetching with timeout
  const fetchDataWithTimeout = useCallback(async () => {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), LOAD_TIMEOUT)
    );

    return Promise.race([
      loadData({ fetchCollections: true }),
      timeoutPromise
    ]);
  }, [loadData]);

  // Main data fetching function
  const fetchDataIfNeeded = useCallback(async () => {
    // Prevent multiple concurrent fetches
    if (isFetchingRef.current) {
      return;
    }

    // Check if we have a valid token before fetching
    const tokenObj = await Helper.getAsyncData('auth_data');
    const hasToken = tokenObj?.tokenValue?.accessToken || tokenObj?.tokenValue?.access_token;

    if (!hasToken) {
      return;
    }

    // Skip if already loaded successfully
    if (!isMountedRef.current || hasLoadedOnceRef.current) {
      return;
    }

    isFetchingRef.current = true;

    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }

    try {
      await fetchDataWithTimeout();
      if (isMountedRef.current) {
        hasLoadedOnceRef.current = true;
        retryCountRef.current = 0;
      }
    } catch (e) {
      if (!isMountedRef.current) return;

      retryCountRef.current++;
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';

      if (retryCountRef.current >= MAX_RETRIES) {
        setError(`Unable to load data after ${MAX_RETRIES} attempts. Please try again.`);
        retryCountRef.current = 0;
      } else if (errorMessage === 'Request timed out') {
        setError('Loading timed out. Please check your connection.');



      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      isFetchingRef.current = false;
    }
  }, [fetchDataWithTimeout]);

  // Load data and recover focus
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      const fetchDataIfNeeded = async () => {
        console.log('[Home] useFocusEffect triggered - hasLoadedOnce:', hasLoadedOnceRef.current);

        // Only fetch collections on the first load or when they are empty
        const needCollections = !hasLoadedOnceRef.current;

        if (!needCollections) {
          // Already have data, refetch collections in background without loader
          console.log('[Home] Returning from stream page - refetching collections in background');
          refreshCollections();
          return;
        }

        console.log('[Home] First load - fetching all data with loader');

        // Check if we have a valid token before fetching
        const tokenObj = await Helper.getAsyncData('auth_data');
        const hasToken = tokenObj?.tokenValue?.accessToken || tokenObj?.tokenValue?.access_token;

        if (!hasToken || cancelled) {
          return;
        }

        isFetchingRef.current = true;
        setLoading(true);
        setError(null);

        try {
          await fetchDataWithTimeout();
          if (!cancelled) {
            hasLoadedOnceRef.current = true;
            retryCountRef.current = 0;
          }
        } catch (e) {
          if (cancelled) return;

          retryCountRef.current++;
          const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';

          if (retryCountRef.current >= MAX_RETRIES) {
            setError(`Unable to load data after ${MAX_RETRIES} attempts. Please try again.`);
            retryCountRef.current = 0;
          } else if (errorMessage === 'Request timed out') {
            setError('Loading timed out. Please check your connection.');
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
          isFetchingRef.current = false;
        }
      };

      isMountedRef.current = true;
      fetchDataIfNeeded();

      return () => {
        cancelled = true;
        isMountedRef.current = false;
      };
    }, [fetchDataWithTimeout, refreshCollections]),
  );

  const DataList = collections && collections.length > 0
    ? collections.filter((collection: collectionItem) => {
      logInfo('[Home]', 'Filtering collection:', {
        name: collection.name,
        exactMatch: collection.name.toLowerCase() === 'my-library',
        trimmedMatch: collection.name.trim().toLowerCase() === 'my-library',
      });
      return collection.name.toLowerCase() !== 'single-image-stream' &&
        collection.name.toLowerCase() !== 'my-library' &&
        collection.name.trim().toLowerCase() !== 'my-library';
    })
    : [];
  const isLoading = loading && DataList.length === 0;
  const listLoading = !isLoading && DataList.length === 0 && status === 'loading';

  // In your Home component, add state for ListView focus
  const [listViewFocusedIndex, setListViewFocusedIndex] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') {
        return () => { };
      }

      const keyHandler = (keyEvent: KeyEventProps) => {
        switch (keyEvent.keyCode) {
          case 4: // KEYCODE_BACK - ignore on Home to avoid navigating to login
            return;
          case 23: // KEYCODE_DPAD_CENTER (OK/Select button)
            if (globalFocus === 'REFRESH') {
              refreshCollections();
            }
            break;
          case 19: // KEYCODE_DPAD_UP
            if (globalFocus === 'REFRESH') {
              setGlobalFocus('PROFILEBUTTON');
            } else if (globalFocus === 'COLLECTIONS') {
              setGlobalFocus('REFRESH');
            }
            break;
          case 20: // KEYCODE_DPAD_DOWN
            if (globalFocus === 'PROFILEBUTTON') {
              setGlobalFocus('REFRESH');
            } else if (globalFocus === 'REFRESH') {
              setGlobalFocus('COLLECTIONS');
            }
            break;
          case 21: // KEYCODE_DPAD_LEFT
            if (globalFocus === 'REFRESH') {
              setGlobalFocus('PROFILEBUTTON');
            } else if (globalFocus === 'COLLECTIONS') {
              if (listViewFocusedIndex > 0) {
                setListViewFocusedIndex(listViewFocusedIndex - 1);
              } else {
                setGlobalFocus('REFRESH');
              }
            }
            break;
          case 22: // KEYCODE_DPAD_RIGHT
            if (globalFocus === 'PROFILEBUTTON') {
              setGlobalFocus('REFRESH');
            } else if (globalFocus === 'REFRESH') {
              setGlobalFocus('COLLECTIONS');
            } else if (globalFocus === 'COLLECTIONS') {
              if (collections && listViewFocusedIndex < collections.length - 1) {
                setListViewFocusedIndex(listViewFocusedIndex + 1);
              }
            }
            break;
        }
      };

      KeyEvent.onKeyDownListener(keyHandler);
      const onBack = () => true; // consume back on Home only when focused
      const backSub = BackHandler.addEventListener('hardwareBackPress', onBack);

      return () => {
        KeyEvent.removeKeyDownListener();
        backSub.remove();
      };
    }, [
      globalFocus,
      refreshCollections,
      listViewFocusedIndex,
      collections,
      setGlobalFocus,
      setListViewFocusedIndex,
    ]),
  );

  // Stable focus change handler (no unnecessary dependency re-renders)
  const handleGlobalFocusChange = useCallback((newFocus: string) => {
    setGlobalFocus(prev => (prev === newFocus ? prev : newFocus));
  }, []);

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill}>
        <HorizontalTransaction />
        <LinearGradient
          colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.85)']}
          style={StyleSheet.absoluteFill}
        />
      </View>
      {isLoading === undefined || isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={Helper.Colors.item_blank_bg} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View>
            <HomeHeader
              globalFocus={globalFocus}
              setGlobalFocus={handleGlobalFocusChange}
            />
            <View style={styles.titleContainer}>
              {DataList?.length > 0 && (
                <View style={styles.headerContainer}>
                  <Text style={styles.collectionsHeader}>
                    {Helper.Strings.yourCollections}
                  </Text>
                  <TouchableOpacity
                    focusable={true}
                    hasTVPreferredFocus={globalFocus === 'REFRESH'}
                    style={[
                      styles.refreshButton,
                      globalFocus === 'REFRESH' && styles.refreshButtonFocused,
                    ]}
                    onPress={refreshCollections}
                    onFocus={() => setGlobalFocus('REFRESH')}>
                    <Text style={styles.refreshButtonText}>Refresh Collections</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <View>
              <ListView
                listData={DataList}
                globalFocus={globalFocus}
                setGlobalFocus={handleGlobalFocusChange}
                focusedIndex={listViewFocusedIndex}
                setFocusedIndex={setListViewFocusedIndex}
                isLoading={listLoading}
              />
            </View>
          </View>
        </View>
      )}
      <WebSocketComponent />
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Helper.Colors.background,
    flex: 1,
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  collectionsHeader: {
    fontSize: Platform.OS !== 'ios' ? 18 : 28,
    color: Helper.Colors.foreground,
  },
  titleContainer: {
    fontSize: 18,
    paddingHorizontal: Helper.screenWidth * 0.05,
    paddingBottom: Helper.screenHeight * 0.03,
    color: Helper.Colors.foreground,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '3%',
  },
  refreshButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Helper.Colors.primary,
  },
  refreshButtonFocused: {
    borderColor: 'white',
    borderWidth: 2,
  },
  refreshButtonText: {
    color: Helper.Colors.primary_foreground,
    fontSize: 14,
    fontWeight: '600',
  },
});
