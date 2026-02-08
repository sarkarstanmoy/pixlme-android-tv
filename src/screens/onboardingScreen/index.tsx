import React, {useState, useEffect} from 'react';
import {
  View,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  Platform,
} from 'react-native';
import {screenHeight, screenWidth} from '../../utils/helper';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import KeyEvent, {KeyEventProps} from 'react-native-keyevent';

const SignInButton = ({focused, onFocus, onPress}: any) => {
  return (
    <View
      style={[
        styles.signInContainer,
        focused && styles.signInContainerFocused,
      ]}>
      <TouchableOpacity
        hasTVPreferredFocus={focused}
        focusable={true}
        onFocus={onFocus}
        onPress={onPress}
        activeOpacity={0.8}>
        <View>
          <Text style={[styles.text, focused && styles.textFocused]}>
            Sign In
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const OnBoardingScreen = () => {
  const [focusedElement, setFocusedElement] = useState('signIn');
  const navigation: any = useNavigation();

  useEffect(() => {
    if (Platform.OS === 'android') {
      const keyHandler = (keyEvent: KeyEventProps) => {
        switch (keyEvent.keyCode) {
          case 23: // KEYCODE_DPAD_CENTER (OK/Select button)
            if (focusedElement === 'signIn') {
              navigation.navigate('LoginScreen');
            }
            break;
          case 19: // KEYCODE_DPAD_UP
            setFocusedElement('signIn');
            break;
          case 20: // KEYCODE_DPAD_DOWN
            setFocusedElement('signIn');
            break;
          case 21: // KEYCODE_DPAD_LEFT
            setFocusedElement('signIn');
            break;
          case 22: // KEYCODE_DPAD_RIGHT
            setFocusedElement('signIn');
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
  }, [focusedElement, navigation]);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../../assets/Background.png')}
        style={styles.background}>
        <LinearGradient
          colors={['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 1)']}
          locations={[0, 1]}
          style={styles.gradientBackground}>
          <View style={styles.onboardContainer}>
            {/* <Privacy Button /> */}
            <View style={styles.privacySection}>
              <Image
                source={require('../../assets/qr-code.png')}
                style={styles.qrCode}
              />
              <View>
                <Text style={styles.privacyText}>
                  For Pixlme's Privacy Policy,{'\n'}scan the QR code or visit
                  {'\n'}
                  <Text style={styles.linkText}>
                    https://pixlme.com/privacy-policy.html
                  </Text>
                </Text>
                <Text style={{fontSize: 14, color: '#CCCCCC', paddingTop: 4}}>
                  ⓘ Disable screensaver to{'\n'}avoid slideshow interruptions
                </Text>
              </View>
            </View>

            {/* Logo Section */}
            <View>
              <Image
                source={require('../../assets/pixleMelogo.png')}
                style={styles.logoText}
              />
            </View>

            {/* Sign In Button */}
            <SignInButton
              focused={focusedElement === 'signIn'}
              onFocus={() => setFocusedElement('signIn')}
              onPress={() => navigation.navigate('LoginScreen')}
            />
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    width: screenWidth,
    height: screenHeight,
    resizeMode: 'cover',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  gradientBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  onboardContainer: {
    paddingHorizontal: screenWidth * 0.025,
    width: screenWidth,
    height: screenHeight * 0.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  privacySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qrCode: {
    width: 60,
    height: 60,
  },
  privacyText: {
    color: 'white',
    fontSize: 14,
  },
  linkText: {
    color: 'red',
  },
  logoText: {
    width: 120,
    height: 40,
  },
  signInContainer: {
    width: 150,
    height: 45,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  signInContainerFocused: {
    borderColor: 'white',
    borderWidth: 1,
    transform: [{scale: 1.1}],
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  textFocused: {
    color: 'white',
  },
});

export default OnBoardingScreen;
