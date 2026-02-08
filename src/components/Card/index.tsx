import React, {useState} from 'react';
import {StyleSheet, TouchableOpacity, Text} from 'react-native';

const Card = ({btnName}: any) => {
  const [focused, setFocused] = useState(false);

  const pressIn = () => {
    setFocused(true);
  };

  const pressOut = () => {
    setFocused(false);
  };

  const handlePress = () => {};

  const handleFocus = () => setFocused(true);
  const handleBlur = () => setFocused(false);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          opacity: focused ? 1 : 0.2,
          transform: [{scale: focused ? 1 : 0.5}],
          borderWidth: 2,
          borderColor: focused ? 'white' : 'black',
          backgroundColor: focused ? 'black' : 'red',
        },
      ]}
      onPress={handlePress}
      activeOpacity={1}
      onPressIn={pressIn}
      onPressOut={pressOut}
      focusable={true}
      onFocus={handleFocus}
      onBlur={handleBlur}>
      <Text>{btnName}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 100,
    height: 100,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Card;
