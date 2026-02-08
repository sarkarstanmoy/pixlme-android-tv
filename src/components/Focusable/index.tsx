import React, {useState, ReactNode} from 'react';
import {TouchableOpacity} from 'react-native';

// Simple Focusable wrapper for TV/D-pad support
// Usage: wrap interactive elements and provide onFocus/onBlur or use render children with focused state

type Props = {
  children: (focused: boolean) => ReactNode;
  style?: any;
  onPress?: () => void;
};

const Focusable = ({children, onPress}: Props) => {
  const [focused, setFocused] = useState(false);

  return (
    <TouchableOpacity
      focusable={true}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={onPress}
      activeOpacity={1}
    >
      {children(focused)}
    </TouchableOpacity>
  );
};

export default Focusable;
