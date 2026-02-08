import React, {useState, useEffect} from 'react';
import {TouchableOpacity, Text, View, StyleSheet} from 'react-native';
import * as Helper from '../../utils/helper';

interface OtpInputProps {
  value: string;
  isFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  onChange: (text: string) => void;
}

const OtpInput: React.FC<OtpInputProps> = ({
  value,
  isFocused,
  onFocus,
  onBlur,
  onChange,
}) => {
  const [showCursor, setShowCursor] = useState(false);

  useEffect(() => {
    let cursorInterval: NodeJS.Timeout | null = null;
    if (isFocused) {
      cursorInterval = setInterval(() => {
        setShowCursor(prev => !prev);
      }, 500);
    }
    return () => {
      if (cursorInterval) clearInterval(cursorInterval);
    };
  }, [isFocused]);

  return (
    <TouchableOpacity
      activeOpacity={1}
      style={[styles.inputContainer, isFocused && styles.focusedContainer]}
      onFocus={onFocus}
      onBlur={onBlur}>
      <Text style={styles.inputText}>{value || (showCursor ? '|' : '')}</Text>
    </TouchableOpacity>
  );
};

const OtpGroup: React.FC<{
  length: number;
  onOtpComplete: (otp: string) => void;
  isFocused: boolean;
}> = ({length, onOtpComplete, isFocused}) => {
  const [otpValues, setOtpValues] = useState<string[]>(Array(length).fill(''));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isFocused) {
      setFocusedIndex(0);
    }
  });

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  const handleBlur = () => {
    setFocusedIndex(null);
  };

  const handleChange = (text: string, index: number) => {
    const newOtpValues = [...otpValues];
    newOtpValues[index] = text;
    setOtpValues(newOtpValues);

    if (text && index < length - 1) {
      setFocusedIndex(index + 1);
    }

    if (newOtpValues.every(value => value !== '')) {
      onOtpComplete(newOtpValues.join(''));
    }
  };

  return (
    <View style={styles.container}>
      {otpValues.map((value, index) => (
        <OtpInput
          key={index}
          value={value}
          isFocused={focusedIndex === index}
          onFocus={() => handleFocus(index)}
          onBlur={handleBlur}
          onChange={text => handleChange(text, index)}
        />
      ))}
    </View>
  );
};

export default OtpGroup;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    height: 45,
    width: 45,
    backgroundColor: Helper.Colors.secondary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#dcdcdc',
  },
  focusedContainer: {
    borderColor: 'red',
    borderWidth: 1.5,
  },
  inputText: {
    color: Helper.Colors.foreground,
    fontSize: 18,
    textAlign: 'center',
  },
});
