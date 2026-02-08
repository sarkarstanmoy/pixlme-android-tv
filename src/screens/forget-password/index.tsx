import {StyleSheet, View, Image, Text, TouchableOpacity} from 'react-native';
import React, {useState, useEffect} from 'react';
import * as Helper from '../../utils/helper';
import TxtInput from '../../components/TxtInput';
import Entypo from 'react-native-vector-icons/Entypo';

const ForgetPassword = ({navigation}: any) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [focus, setFocus] = useState({
    submit: false,
    back: false,
  });

  function onSubmit(username: string): void {
    if (!username.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(username)) {
      setError('Please enter a valid email address');
      return;
    }

    // Here you can perform the submission logic
    // Clear the error message
    setError('');
  }

  // Email validation function
  const validateEmail = (email: string) => {
    const regex = /\S+@\S+\.\S+/;
    return regex.test(email);
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/pixleMelogo.png')}
        style={{width: 120, height: 40}}
      />

      <Image
        source={require('../../assets/MailBox.png')}
        style={styles.imageContainer}
      />

      <Text style={styles.description}>
        We should send a password reset email to:
      </Text>

      <View style={{width: '40%', gap: 10}}>
        <TxtInput
          inputVal={username}
          onChangeTxt={text => {
            setUsername(text);
            setError('');
          }}
          placeHolderTxt="Enter your Email ID"
          autoFocusVal={true}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          activeOpacity={0.8}
          onPressIn={() => setFocus({...focus, submit: true})}
          onPressOut={() => setFocus({...focus, submit: false})}
          onFocus={() => setFocus({...focus, submit: true})}
          onBlur={() => setFocus({...focus, submit: false})}
          style={[styles.submit_button, focus.submit && styles.submit_focused]}
          onPress={() => onSubmit(username)}>
          <Text style={styles.submit_button_text}>
            Send Reset Password Link
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPressIn={() => setFocus({...focus, back: true})}
          onPressOut={() => setFocus({...focus, back: false})}
          onFocus={() => setFocus({...focus, back: true})}
          onBlur={() => setFocus({...focus, back: false})}
          style={[styles.back_button, focus.back && styles.back_focused]}
          onPress={() => {
            navigation.navigate('LoginScreen');
          }}>
          <Entypo
            name="chevron-small-left"
            size={20}
            color={Helper.Colors.primary_foreground}
          />
          <Text style={styles.back_button_text}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ForgetPassword;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Helper.Colors.background,
  },
  imageContainer: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginVertical: 25,
  },
  description: {
    fontSize: 13,
    color: Helper.Colors.foreground,
    marginBottom: 20,
  },
  submit_button: {
    backgroundColor: Helper.Colors.primary,
    padding: 10,
    borderRadius: 7,
    alignItems: 'center',
    marginTop: 15,
  },
  submit_button_text: {
    color: Helper.Colors.primary_foreground,
    fontSize: 14,
  },
  back_button: {
    backgroundColor: Helper.Colors.secondary,
    padding: 10,
    borderRadius: 7,
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  back_button_text: {
    color: Helper.Colors.primary_foreground,
    fontSize: 14,
  },
  error: {
    color: 'red',
    fontSize: 12,
  },

  submit_focused: {
    borderColor: 'white', // Border color on focus
    borderWidth: 1, // Add border to visually see the color change
  },

  back_focused: {
    borderColor: 'white', // Border color on focus
    borderWidth: 1, // Add border to visually see the color change
  },
});
