import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Image,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { screenWidth, screenHeight } from '../../utils/helper';
import * as Helper from '../../utils/helper';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store/store';
import { postAuth, validateTvCode } from '../../store/actions/userActions';
import { registerDeviceId } from '../../store/actions/deviceActions';
import KeyboardAvoidingView from '../../components/KeyboardAvoidingView';
import Keyboard from '../../components/keyboard';
import LoginForm from './LoginForm';
import { useAuth } from '../../utils/authProvider';
import Toast from 'react-native-toast-message';
import DeviceInfo from 'react-native-device-info';

const AuthScreen = ({ navigation }: any) => {
  const [globalFocus, setGlobalFocus] = useState('KEYBOARD');
  const [isLoginWithCode, setIsLoginWithCode] = useState(true); // To handle login with code or email
  const [currentFocus, setCurrentFocus] = useState<number>(1);
  const [code, setCode] = useState('');
  const [formState, setFormState] = useState({
    username: '',
    password: '',
  });

  const dispatch = useDispatch<AppDispatch>();
  const { setAuth } = useAuth();

  const handleCodeChange = (value: string) => {
    setCode(value);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormState({
      ...formState,
      [field]: value,
    });
  };

  const handleCodeSubmit = async (code: string) => {
    const id = await DeviceInfo.getUniqueId();
    const name = await DeviceInfo.getDeviceName();
    const userData = {
      navigation,
      loginInfo: {
        deviceType: 'TV',
        osType: Platform.OS === 'android' ? 'android' : 'ios',
        deviceMake: Platform.OS === 'ios' ? 'APPLE' : 'android device',
        deviceIdentifier: id,
        deviceName: name,
        deviceMetadata: ['model', 'partnumber', id],
        codeVerifier: code,
      },
    };

    dispatch(validateTvCode(userData))
      .unwrap()
      .then((data: any) => {
        if (data?.isSuccess) {
          Toast.show({
            type: 'success',
            text1: 'Login Successful',
          });
          setAuth();
          dispatch(registerDeviceId());
        } else {
          Toast.show({
            type: 'error',
            text1: 'Invalid Code',
          });
        }
      })
      .catch(error => {
        let errorMessage = 'An unexpected error occurred';
        if (error && error.message) {
          try {
            if (error.message.includes('Subscription expired')) {
              errorMessage = 'Subscription expired';
            } else {
              errorMessage = error.message;
            }
            Toast.show({
              type: 'error',
              text1: errorMessage,
            });
          } catch (err) {
            Toast.show({
              type: 'error',
              text1: 'Invalid Code',
            });
          }
        }
      });
  };

  const handleSubmit = (username: string, password: string) => {
    const userData = {
      navigation,
      loginInfo: {
        email: username,
        password: password,
      },
    };

    dispatch(postAuth(userData))
      .unwrap()
      .then((data: any) => {
        if (data?.isSuccess) {
          Toast.show({
            type: 'success',
            text1: 'Login Successful',
          });
          setAuth();
          dispatch(registerDeviceId());
        } else {
          Toast.show({
            type: 'error',
            text1: 'Invalid Credentials',
          });
        }
      })
      .catch((error: any) => {
        let errorMessage = 'An unexpected error occurred';
        if (error && error.message) {
          try {
            if (error.message.includes('Subscription expired')) {
              errorMessage = 'Subscription expired';
            } else {
              errorMessage = error.message;
            }
            Toast.show({
              type: 'error',
              text1: errorMessage,
            });
          } catch (err) {
            Toast.show({
              type: 'error',
              text1: 'Invalid Credentials',
            });
          }
        }
      });
  };

  const handleKeyChange = (key: string) => {
    if (isLoginWithCode) {
      if (key === 'Next') {
        setCurrentFocus(1);
      } else if (key === 'Previous') {
        setCurrentFocus(1);
      } else if (currentFocus === 1) {
        if (key == 'BACKSPACE') {
          handleCodeChange(code.slice(0, -1));
        } else {
          handleCodeChange(code + key);
        }
      }
    } else {
      if (key === 'Next') {
        setCurrentFocus(2);
      } else if (key === 'Previous') {
        setCurrentFocus(1);
      } else if (currentFocus === 1) {
        if (key == 'BACKSPACE') {
          handleInputChange('username', formState.username.slice(0, -1));
        } else {
          handleInputChange('username', formState.username + key);
        }
      } else if (currentFocus === 2) {
        if (key == 'BACKSPACE') {
          handleInputChange('password', formState.password.slice(0, -1));
        } else {
          handleInputChange('password', formState.password + key);
        }
      }
    }
  };

  useEffect(() => {
    async function requestPermission() {
      try {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
      } catch (err) {
        console.warn(err);
      }
    }
    requestPermission();
  }, []);

  useEffect(() => {
    setCurrentFocus(1);
  }, [isLoginWithCode]);

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      extraScrollHeight={0}>
      <View style={styles.container}>
        <View style={styles.title}>
          <Image
            source={require('../../assets/pixleMelogo.png')}
            style={{ width: 120, height: 40 }}
          />
        </View>

        <View style={styles.formContainer}>
          <View style={{ flex: 0.5 }}>
            <View style={styles.keyboard}>
              <Keyboard
                currentFocus={currentFocus}
                onKeyPress={e => {
                  handleKeyChange(e);
                }}
                globalFocus={globalFocus}
                setGlobalFocus={setGlobalFocus}
              />
            </View>
          </View>
          <View style={{ flex: 0.5 }}>
            <LoginForm
              currentFocus={currentFocus}
              formState={formState}
              code={code}
              onSubmit={handleSubmit}
              onSubmitCode={handleCodeSubmit}
              isLoginWithCode={isLoginWithCode}
              setIsLoginWithCode={setIsLoginWithCode}
              globalFocus={globalFocus}
              setGlobalFocus={setGlobalFocus}
              setCurrentFocus={setCurrentFocus}
            />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default AuthScreen;

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: Helper.Colors.background,
  },
  container: {
    width: screenWidth,
    height: screenHeight,

    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    flex: 0.8,
    flexDirection: 'row',
    width: '100%',
    gap: 60,
    paddingHorizontal: 40,
    marginTop: 40,
  },
  keyboard: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    height: '80%',
    borderRadius: 10,
    backgroundColor: Helper.Colors.secondary,
  },
  loginContainer: {
    width: screenWidth / 3,
    height: screenHeight / 1.7,
    backgroundColor: Helper.Colors.logo_bg,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  imageContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Helper.Colors.btn_bg,
    borderRadius: 10,
    marginBottom: 10,
  },
  loginBtn: {
    width: screenWidth / 4,
    borderRadius: 10,
    backgroundColor: Helper.Colors.btn_bg,
    marginVertical: '3%',
  },
  description: {
    fontSize: 13,
    marginBottom: '5%',
  },
  title: {
    fontSize: 20,
    marginBottom: 10,
    fontWeight: '700',
    color: Helper.Colors.foreground,
  },
  tabContainer: {
    backgroundColor: Helper.Colors.secondary,
    flexDirection: 'row',
    gap: 20,
    padding: 5,
    borderRadius: 30,
    paddingHorizontal: 4,
  },
  tab_base: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  active_tab: {
    backgroundColor: Helper.Colors.primary,
    fontWeight: '700',
  },
  tab_text: {
    fontWeight: '600',
    fontSize: 12,
  },
});
