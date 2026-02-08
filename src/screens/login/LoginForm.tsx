import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Helper from '../../utils/helper';
import { TouchInput } from '../../components/TxtInput';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import Ionicons from 'react-native-vector-icons/Ionicons';
import KeyEvent, { KeyEventProps } from 'react-native-keyevent';

interface LoginFormProps {
  onSubmit: (username: string, password: string) => void;
  onSubmitCode: (code: string) => void;
  formState: {
    username: string;
    password: string;
  };
  code: string;
  currentFocus?: any;
  isLoginWithCode?: any;
  setIsLoginWithCode?: any;
  globalFocus: string;
  setGlobalFocus: (key: string) => void;
  setCurrentFocus: (focus: number) => void; // Added prop
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onSubmitCode,
  formState,
  code,
  currentFocus,
  isLoginWithCode,
  setIsLoginWithCode,
  globalFocus,
  setGlobalFocus,
  setCurrentFocus,
}) => {
  const [codeError, setCodeError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [focusedElement, setFocusedElement] = useState(
    isLoginWithCode && globalFocus === 'LOGINFORM'
      ? 'SUBMIT'
      : 'PASSWORDTOGGLE',
  );

  const [showPassword, setShowPassword] = useState(false);
  const passwordInputRef: any = useRef(null);
  const showPasswordRef: any = useRef(null);
  const submitRef: any = useRef(null);

  const { loading } = useSelector((state: RootState) => state.userAuth);

  const validate = () => {
    let isValid = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formState?.username) {
      setUsernameError('Please enter your email');
      isValid = false;
    } else if (!emailRegex.test(formState?.username)) {
      setUsernameError('Please enter a valid email address');
      isValid = false;
    } else {
      setUsernameError('');
    }
    if (!formState?.password) {
      setPasswordError('Please enter your password');
      isValid = false;
    } else {
      setPasswordError('');
    }
    return isValid;
  };

  const isValidCode = () => {
    let isValid = true;
    const regex = /^\d{5}$/;
    if (!code) {
      setCodeError('Please enter the code');
      isValid = false;
    } else if (!regex.test(code)) {
      setCodeError('Please enter a valid code');
      isValid = false;
    } else {
      setCodeError('');
    }
    return isValid;
  };

  const handleSignIn = () => {
    if (isLoginWithCode) {
      if (isValidCode()) {
        onSubmitCode(code);
      }
    } else if (validate()) {
      onSubmit(formState?.username, formState?.password);
    }
  };

  useEffect(() => {
    if (code && code.length === 5 && isValidCode()) {
      onSubmitCode(code);
    }
  }, [code]);

  useEffect(() => {
    if (globalFocus === 'LOGINFORM' && Platform.OS === 'android') {
      const keyHandler = (keyEvent: KeyEventProps) => {
        switch (keyEvent.keyCode) {
          case 23: // KEYCODE_DPAD_CENTER (OK/Select button)
            if (focusedElement === 'PASSWORDTOGGLE') {
              setShowPassword(!showPassword);
            } else if (focusedElement === 'SUBMIT') {
              handleSignIn();
            } else if (focusedElement === 'LOGINTOGGLE') {
              setIsLoginWithCode(!isLoginWithCode);
            } else if (focusedElement === 'USERNAME_INPUT') {
              setCurrentFocus(1);
              setGlobalFocus('KEYBOARD');
            } else if (focusedElement === 'PASSWORD_INPUT') {
              setCurrentFocus(2);
              setGlobalFocus('KEYBOARD');
            }
            break;
          case 19: // KEYCODE_DPAD_UP
            if (focusedElement === 'PASSWORDTOGGLE') {
              setFocusedElement('PASSWORD_INPUT');
            } else if (focusedElement === 'SUBMIT') {
              setFocusedElement('PASSWORDTOGGLE');
            } else if (focusedElement === 'LOGINTOGGLE') {
              setFocusedElement('SUBMIT');
            } else if (focusedElement === 'PASSWORD_INPUT') {
              setFocusedElement('USERNAME_INPUT');
            }
            break;
          case 20: // KEYCODE_DPAD_DOWN
            if (focusedElement === 'PASSWORDTOGGLE') {
              setFocusedElement('SUBMIT');
            } else if (focusedElement === 'SUBMIT') {
              setFocusedElement('LOGINTOGGLE');
            } else if (focusedElement === 'LOGINTOGGLE') {
              setFocusedElement('LOGINTOGGLE');
            } else if (focusedElement === 'USERNAME_INPUT') {
              setFocusedElement('PASSWORD_INPUT');
            } else if (focusedElement === 'PASSWORD_INPUT') {
              setFocusedElement('PASSWORDTOGGLE');
            }
            break;
          case 21: // KEYCODE_DPAD_LEFT
            setGlobalFocus('KEYBOARD');
            break;
          case 22: // KEYCODE_DPAD_RIGHT
            break;
          case 4: // KEYCODE_BACK
            break;
        }
      };

      // Add key event listener
      KeyEvent.onKeyDownListener(keyHandler);

      // Cleanup
      return () => {
        KeyEvent.removeKeyDownListener();
      };
    }
  }, [focusedElement, globalFocus, setGlobalFocus, formState, isLoginWithCode]);

  useEffect(() => {
    if (globalFocus === 'LOGINFORM') {
      if (currentFocus === 1) {
        setFocusedElement('USERNAME_INPUT');
      } else if (currentFocus === 2) {
        setFocusedElement('PASSWORD_INPUT');
      } else {
        setFocusedElement('USERNAME_INPUT');
      }
    }
  }, [globalFocus, currentFocus]);

  return (
    <View style={styles.container}>
      {isLoginWithCode ? (
        <View style={{ marginBottom: 5 }}>
          <Text style={styles.label}>Code</Text>
          <TouchInput
            value={code}
            isFocused={currentFocus === 1}
            placeholder="Enter code shown in your mobile app"
          />
          {codeError ? <Text style={styles.error}>{codeError}</Text> : null}
          <Text
            style={{
              fontSize: 12,
              color: '#CCCCCC',
              textAlign: 'center',
              marginTop: 15,
            }}>
            Get code from mobile app → Connect New Device
          </Text>
        </View>
      ) : (
        <>
          <View>
            <Text style={styles.label}>Email Address</Text>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {
                setFocusedElement('USERNAME_INPUT');
                setCurrentFocus(1);
                setGlobalFocus('KEYBOARD');
              }}
              style={[
                focusedElement === 'USERNAME_INPUT' &&
                globalFocus === 'LOGINFORM' && {
                  borderColor: 'white',
                  borderWidth: 1,
                  borderRadius: 7,
                },
              ]}>
              <TouchInput
                value={formState?.username}
                isFocused={
                  currentFocus === 1 && globalFocus === 'KEYBOARD'
                }
                placeholder="Enter your Email ID"
              />
            </TouchableOpacity>
            {usernameError ? (
              <Text style={styles.error}>{usernameError}</Text>
            ) : null}
          </View>
          <View>
            <Text style={styles.label}>Password</Text>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {
                setFocusedElement('PASSWORD_INPUT');
                setCurrentFocus(2);
                setGlobalFocus('KEYBOARD');
              }}
              style={[
                focusedElement === 'PASSWORD_INPUT' &&
                globalFocus === 'LOGINFORM' && {
                  borderColor: 'white',
                  borderWidth: 1,
                  borderRadius: 7,
                },
              ]}>
              <TouchInput
                type={showPassword ? 'text' : 'password'}
                value={formState?.password}
                isFocused={
                  currentFocus === 2 && globalFocus === 'KEYBOARD'
                }
                placeholder="Enter your password"
              />
            </TouchableOpacity>
            {passwordError ? (
              <Text style={styles.error}>{passwordError}</Text>
            ) : null}

            <TouchableOpacity
              hasTVPreferredFocus={
                globalFocus === 'LOGINFORM' &&
                focusedElement === 'PASSWORDTOGGLE'
              }
              focusable={true}
              ref={showPasswordRef}
              onFocus={() => setFocusedElement('PASSWORDTOGGLE')}
              accessibilityRole="button"
              activeOpacity={0.5}
              style={[
                { marginVertical: 10 },
                globalFocus === 'LOGINFORM' &&
                focusedElement === 'PASSWORDTOGGLE' &&
                styles.checkboxFocused,
              ]}
              onPress={() => {
                setShowPassword(!showPassword);
              }}>
              {showPassword ? (
                <View style={styles.checkbox}>
                  <Ionicons
                    name={'checkbox'}
                    size={24}
                    color={Helper.Colors.primary}
                  />
                  <Text style={{ fontSize: 14, color: 'white' }}>
                    Show password
                  </Text>
                </View>
              ) : (
                <View style={styles.checkbox}>
                  <Ionicons
                    name={'square-outline'}
                    size={24}
                    color={Helper.Colors.primary}
                  />
                  <Text style={{ fontSize: 14, color: 'white' }}>
                    Show password
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      <View>
        <TouchableOpacity
          hasTVPreferredFocus={
            globalFocus === 'LOGINFORM' && focusedElement === 'SUBMIT'
          }
          focusable={true}
          onFocus={() => setFocusedElement('SUBMIT')}
          ref={submitRef}
          accessibilityRole="button"
          disabled={loading}
          activeOpacity={0.8}
          nextFocusUp={passwordInputRef.current}
          style={[
            styles.submit_button,
            globalFocus === 'LOGINFORM' &&
            focusedElement === 'SUBMIT' &&
            styles.submit_focused,
            loading && { opacity: 0.5 },
          ]}
          onPress={handleSignIn}>
          {loading && <ActivityIndicator color="white" />}
          <Text style={styles.submit_button_text}>Sign In</Text>
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={styles.divider_container}>
        <View style={styles.divider} />
        <Text style={styles.divider_text}>Or</Text>
        <View style={styles.divider} />
      </View>

      {/* Login with code or email button */}
      <View>
        <TouchableOpacity
          hasTVPreferredFocus={
            globalFocus === 'LOGINFORM' && focusedElement === 'LOGINTOGGLE'
          }
          focusable={true}
          onFocus={() => setFocusedElement('LOGINTOGGLE')}
          accessibilityRole="button"
          disabled={loading}
          activeOpacity={0.8}
          style={[
            styles.other_button,
            globalFocus === 'LOGINFORM' &&
            focusedElement === 'LOGINTOGGLE' &&
            styles.other_button_focused,
            loading && { opacity: 0.5 },
          ]}
          onPress={() => setIsLoginWithCode(!isLoginWithCode)}>
          <Text
            style={[
              styles.other_button_text,
              globalFocus === 'LOGINFORM' &&
              focusedElement === 'LOGINTOGGLE' &&
              styles.other_button_focused_text,
            ]}>
            {isLoginWithCode ? 'Sign in with Email' : 'Sign in with Code'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flex: 1,
    gap: 20,
  },
  label: {
    fontSize: 14,
    color: 'white',
    marginBottom: 4,
  },
  input: {
    height: 40,
    marginBottom: 20,
    paddingHorizontal: 10,
    fontSize: 14,
    color: Helper.Colors.foreground,
    backgroundColor: Helper.Colors.secondary,
    width: '100%',
    borderRadius: 7,
  },
  submit_button: {
    backgroundColor: Helper.Colors.primary,
    padding: 10,
    borderRadius: 7,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
  },
  submit_button_text: {
    color: Helper.Colors.primary_foreground,
    fontSize: 14,
  },
  submit_focused: {
    borderColor: 'white',
    borderWidth: 1,
  },
  forget_button: {
    backgroundColor: Helper.Colors.secondary,
    padding: 6,
    borderRadius: 7,
    alignItems: 'center',
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 15,
  },
  forget_button_text: {
    color: Helper.Colors.primary_foreground,
    fontSize: 12,
  },
  forget_focused: {
    borderColor: 'white',
    borderWidth: 1,
  },
  other_button: {
    borderColor: Helper.Colors.primary_foreground,
    borderWidth: 1,
    padding: 10,
    borderRadius: 7,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
  },
  other_button_text: {
    color: Helper.Colors.primary_foreground,
    fontSize: 14,
  },
  other_button_focused: {
    borderColor: Helper.Colors.primary,
    borderWidth: 1,
  },
  other_button_focused_text: {
    color: Helper.Colors.primary,
  },
  error: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 5,
  },
  checkboxFocused: {
    borderColor: 'white',
    borderWidth: 1,
    width: '35%',
  },
  divider_container: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 140,
  },
  divider: {
    width: '100%',
    borderWidth: 1,
    borderColor: Helper.Colors.secondary,
  },
  divider_text: {
    color: Helper.Colors.foreground,
    fontSize: 18,
    fontWeight: '300',
  },
});

export default LoginForm;
