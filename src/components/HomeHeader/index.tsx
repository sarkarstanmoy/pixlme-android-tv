/* eslint-disable react/no-unstable-nested-components */
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  Image,
  Platform,
  BackHandler,
} from 'react-native';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as Helper from '../../utils/helper';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { useAuth } from '../../utils/authProvider';
import { addRefreshListener, removeRefreshListener } from '../../utils/axios_instance';
import FastImageView from '../FastImageView';

import KeyEvent, { KeyEventProps } from 'react-native-keyevent';

type Props = {
  globalFocus: string;
  setGlobalFocus: (key: string) => void;
};

const HomeHeader: React.FC<Props> = ({ globalFocus, setGlobalFocus }: Props) => {
  const { userInfo, userProfilePic } = useSelector(
    (state: RootState) => state.userAuth,
  );
  const { setAuth } = useAuth();
  const userFullName = `${userInfo?.firstName || ''}`;
  const userName =
    userFullName && userFullName !== '' && userFullName !== undefined
      ? userFullName
      : Helper.Strings.welcomeUser;
  const profileUrl =
    userProfilePic && userProfilePic?.url && userProfilePic?.url !== undefined
      ? userProfilePic?.url
      : '';

  const [focusedElement, setFocusedElement] = useState('PROFILEBUTTON');
  // Access token countdown ring state
  const [accessTTL, setAccessTTL] = useState<number | null>(null);
  // we rely on TTL + initialDurationRef; we don't need to keep exp state
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const parseExp = useCallback((jwt?: string): number | null => {
    try {
      if (!jwt) { return null; }
      const parts = jwt.split('.');
      if (parts.length !== 3) { return null; }
      const payload = JSON.parse(
        atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')),
      );
      return payload.exp ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  }, []);

  const computeAccessTTL = useCallback(async () => {
    try {
      const tokenObj: any = await Helper.getAsyncData('auth_data');
      const access = tokenObj?.tokenValue?.accessToken || tokenObj?.tokenValue?.access_token;
      if (!access) { setAccessTTL(null); return; }
      let exp = parseExp(access);
      if (!exp && tokenObj?.tokenValue?.expiresIn) {
        const raw = tokenObj.tokenValue.expiresIn;
        const ms = raw > 100000 ? raw : raw * 1000;
        exp = Date.now() + ms;
      }
      if (exp) { setAccessTTL(exp - Date.now()); } else { setAccessTTL(null); }
    } catch {
      setAccessTTL(null);
    }
  }, [parseExp]);

  // Start interval to tick TTL each second
  useEffect(() => {
    computeAccessTTL();
    if (intervalRef.current) { clearInterval(intervalRef.current); }
    intervalRef.current = setInterval(() => {
      setAccessTTL(prev => {
        if (prev === null) { return null; }
        const next = prev - 1000;
        return next < 0 ? 0 : next;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); }
    };
  }, [computeAccessTTL]);

  // Listen to refresh events to recompute exp/ttl immediately
  useEffect(() => {
    const listener = (e: any) => {
      if (e.type === 'start') {
        // About to refresh – no change yet, but ensure we don't treat stale 0 as final
        return;
      }
      if (e.type === 'success') {
        if (e.expiresAt) {
          const ttl = e.expiresAt - Date.now();
          if (ttl > 0) {
            // Reset initial duration reference so ring restarts from GREEN band
            initialDurationRef.current = ttl;
            setAccessTTL(ttl);
            return;
          }
        }
        // Fallback if no expiresAt provided
        computeAccessTTL();
      }
    };
    addRefreshListener(listener);
    return () => removeRefreshListener(listener);
  }, [computeAccessTTL]);

  const ringColor = (() => {
    if (accessTTL === null) { return 'rgba(255,255,255,0.25)'; }
    if (accessTTL <= 0) { return '#ff4d4f'; }
    if (accessTTL < 15000) { return '#ff4d4f'; }
    if (accessTTL < 60000) { return '#faad14'; }
    return '#52c41a';
  })();


  // We'll store initial duration once (so percent remains linear)
  const initialDurationRef = useRef<number | null>(null);
  useEffect(() => {
    if (accessTTL === null) { initialDurationRef.current = null; return; }
    if (initialDurationRef.current === null) { initialDurationRef.current = accessTTL; return; }
    // reset if we just refreshed and TTL jumped higher than initial (allow >5s increase)
    if (accessTTL - initialDurationRef.current > 5000) {
      initialDurationRef.current = accessTTL;
    }
  }, [accessTTL]);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalFocusedButton, setModalFocusedButton] = useState('CLOSE');
  const carosalContainerRef = useRef<View>(null);

  // Move logoutUser before useEffect to avoid dependency issues
  const logoutUser = React.useCallback(async () => {
    try {
      await Helper.storeAsyncData('auth_data', null);
      setAuth();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [setAuth]);

  // Handle key events when modal is NOT visible
  useEffect(() => {
    if (Platform.OS === 'android' && !modalVisible) {
      const keyHandler = (keyEvent: KeyEventProps) => {
        if (globalFocus === 'PROFILEBUTTON') {
          switch (keyEvent.keyCode) {
            case 23: // KEYCODE_DPAD_CENTER (OK/Select button)
              if (focusedElement === 'PROFILEBUTTON') {
                setModalVisible(true);
                setModalFocusedButton('CLOSE');
              }
              break;
            case 19: // KEYCODE_DPAD_UP
              setGlobalFocus('PROFILEBUTTON');
              break;
            case 20: // KEYCODE_DPAD_DOWN
              setGlobalFocus('REFRESH');
              break;
            case 21: // KEYCODE_DPAD_LEFT
              setGlobalFocus('PROFILEBUTTON');
              break;
            case 22: // KEYCODE_DPAD_RIGHT
              setGlobalFocus('REFRESH');
              break;
          }
        }
      };

      KeyEvent.onKeyDownListener(keyHandler);
      return () => {
        KeyEvent.removeKeyDownListener();
      };
    }
  }, [focusedElement, globalFocus, modalVisible, setGlobalFocus]);

  // Handle key events when modal IS visible - using a different approach
  useEffect(() => {
    if (Platform.OS === 'android' && modalVisible) {
      const keyHandler = (keyEvent: KeyEventProps) => {
        switch (keyEvent.keyCode) {
          case 23: // KEYCODE_DPAD_CENTER (OK/Select button)
            if (modalFocusedButton === 'CLOSE') {
              handleModalClose();
            } else if (modalFocusedButton === 'LOGOUT') {
              logoutUser();
              handleModalClose();
            }
            break;
          case 19: // KEYCODE_DPAD_UP
            if (modalFocusedButton === 'LOGOUT') {
              setModalFocusedButton('CLOSE');
            }
            break;
          case 20: // KEYCODE_DPAD_DOWN
            if (modalFocusedButton === 'CLOSE') {
              setModalFocusedButton('LOGOUT');
            }
            break;
          case 4: // KEYCODE_BACK
            handleModalClose();
            break;
        }
      };

      // Use a timeout to ensure the modal is fully rendered
      const timeout = setTimeout(() => {
        KeyEvent.onKeyUpListener(keyHandler);
      }, 100);

      return () => {
        clearTimeout(timeout);
        KeyEvent.removeKeyDownListener();
      };
    }
  }, [modalVisible, modalFocusedButton, logoutUser]);

  // Handle Android back button for modal
  useEffect(() => {
    if (Platform.OS === 'android' && modalVisible) {
      const backAction = () => {
        handleModalClose();
        return true; // Prevent default back action
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        backAction,
      );
      return () => backHandler.remove();
    }
  }, [modalVisible]);

  const CloseButton = ({
    focused,
    onFocus,
    onPress,
  }: {
    focused: boolean;
    onFocus: () => void;
    onPress: () => void;
  }) => {
    return (
      <TouchableOpacity
        hasTVPreferredFocus={focused}
        focusable={true}
        onFocus={onFocus}
        onPress={onPress}
        activeOpacity={0.7}
        style={[styles.closeButton, focused && styles.focusedButton]}
        accessible={true}
        accessibilityLabel="Close Button"
        accessibilityHint="Closes the modal">
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    );
  };

  const LogoutButton = ({
    focused,
    onFocus,
    onPress,
  }: {
    focused: boolean;
    onFocus: () => void;
    onPress: () => void;
  }) => {
    return (
      <TouchableOpacity
        hasTVPreferredFocus={focused}
        onFocus={onFocus}
        onPress={onPress}
        activeOpacity={0.7}
        style={[styles.logoutButton, focused && styles.focusedButton]}
        accessible={true}
        accessibilityLabel="Logout Button"
        accessibilityHint="Logs out the user">
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    );
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setFocusedElement('PROFILEBUTTON');
    setModalFocusedButton('CLOSE');
  };

  return (
    <>
      <TouchableOpacity
        hasTVPreferredFocus={
          globalFocus === 'PROFILEBUTTON' &&
          focusedElement === 'PROFILEBUTTON' &&
          !modalVisible
        }
        focusable={true}
        style={styles.avatarWrapper}
        onFocus={() => setFocusedElement('PROFILEBUTTON')}
        onPress={() => {
          setModalVisible(true);
          setModalFocusedButton('CLOSE');
        }}
        accessible={true}
        accessibilityLabel="User Avatar"
        accessibilityHint="Opens user options">
        {(() => {
          const active =
            globalFocus === 'PROFILEBUTTON' &&
            focusedElement === 'PROFILEBUTTON' &&
            !modalVisible;
          const dynamicStyles = {
            borderColor: ringColor,
            // Slight scale or shadow when focused to preserve focus affordance
            transform: active ? [{ scale: 1.05 }] : [],
            shadowColor: active ? ringColor : undefined,
            shadowOpacity: active ? 0.7 : 0,
            shadowRadius: active ? 6 : 0,
          } as any;
          return (
            <View style={[styles.ring, dynamicStyles]}>
              <FastImageView
                url={
                  profileUrl ||
                  'https://www.shareicon.net/data/2016/09/15/829459_man_512x512.png'
                }
                style={styles.userImg}
                defaultSrc={require('../../assets/user_sample.jpg')}
              />
              {/* TTL text removed per request; ring color still reflects state */}
            </View>
          );
        })()}

      </TouchableOpacity>

      <View style={styles.container}>
        <View
          ref={carosalContainerRef}
          accessible={false}
          style={{ height: Helper.screenHeight * 0.4 }}
        />

        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/pixleMelogo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <Modal
          animationType="slide"
          hardwareAccelerated={true}
          transparent={true}
          visible={modalVisible}
          onRequestClose={handleModalClose}
          onShow={() => {
            setModalFocusedButton('CLOSE');
          }}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalView}>
              <Text style={styles.modalText}>Hello, {userName}!</Text>
              <Text style={styles.instructionText}>
                Use UP/DOWN arrows to navigate, OK to select
              </Text>
              <CloseButton
                focused={modalFocusedButton === 'CLOSE'}
                onFocus={() => {
                  setModalFocusedButton('CLOSE');
                }}
                onPress={handleModalClose}
              />
              <LogoutButton
                focused={modalFocusedButton === 'LOGOUT'}
                onFocus={() => {
                  setModalFocusedButton('LOGOUT');
                }}
                onPress={() => {
                  logoutUser();
                  handleModalClose();
                }}
              />
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
};

export default HomeHeader;

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  logoContainer: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    zIndex: 999,
  },
  logoImage: {
    width: 120,
    height: 40,
  },
  avatarWrapper: {
    position: 'absolute',
    top: 20,
    right: 30,
    zIndex: 999,
  },
  ring: {
    width: Platform.OS !== 'ios' ? 48 : 72,
    height: Platform.OS !== 'ios' ? 48 : 72,
    borderRadius: Platform.OS !== 'ios' ? 24 : 36,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  userImg: {
    width: Platform.OS !== 'ios' ? 40 : 60,
    height: Platform.OS !== 'ios' ? 40 : 60,
    borderRadius: Platform.OS !== 'ios' ? 20 : 30,
    resizeMode: 'cover',
  },
  ttlText: {
    position: 'absolute',
    bottom: -12,
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  gradientOverlay: {
    position: 'absolute',
    width: '100%',
    height: Platform.OS !== 'ios' ? 100 : 300,
    bottom: 0,
    zIndex: 999,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 10,
    textAlign: 'center',
    color: Helper.Colors.black_bg,
    fontSize: 18,
    fontWeight: '600',
  },
  instructionText: {
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
  },
  closeButton: {
    backgroundColor: '#2196F3',
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    marginVertical: 8,
    minWidth: Helper.screenWidth / 5,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: 'red',
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    marginVertical: 8,
    minWidth: Helper.screenWidth / 5,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  focusedButton: {
    borderWidth: 1,
    borderColor: 'thistle',
    transform: [{ scale: 1.1 }],
    elevation: 8,
  },
});
