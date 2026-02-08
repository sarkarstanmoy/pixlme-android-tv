import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import KeyEvent, { KeyEventProps } from 'react-native-keyevent';

interface KeyboardProps {
  onKeyPress: (key: string) => void;
  currentFocus: number;
  globalFocus: string;
  setGlobalFocus: (key: string) => void;
}

const keyboardLayout = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', '.'],
  ['SHIFT', 'z', 'x', 'c', 'v', 'b', 'n', 'm'],
  ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'],
  ['SPACE', 'BACKSPACE'],
  ['Previous', 'Next'],
];

const Keyboard: React.FC<KeyboardProps> = ({
  onKeyPress,
  currentFocus,
  globalFocus,
  setGlobalFocus,
}) => {
  const [shift, setShift] = useState(false);
  const [focusedKeyPosition, setFocusedKeyPosition] = useState({
    row: 0,
    col: 0,
  });

  const handleKeyPress = (key: string) => {
    if (key === 'SHIFT') {
      setShift(!shift);
    } else if (key === 'SPACE') {
      onKeyPress(' ');
    } else if (key === 'BACKSPACE') {
      onKeyPress('BACKSPACE');
    } else {
      onKeyPress(shift ? key.toUpperCase() : key);
    }
  };

  // Get the key at a specific position
  const getKeyAtPosition = (row: number, col: number) => {
    if (
      row >= 0 &&
      row < keyboardLayout.length &&
      col >= 0 &&
      col < keyboardLayout[row].length
    ) {
      return keyboardLayout[row][col];
    }
    return null;
  };

  // Check if a key is disabled
  const isKeyDisabled = (key: string) => {
    return (
      (key === 'Previous' && currentFocus === 1) ||
      (key === 'Next' && currentFocus === 2)
    );
  };

  // Handle keyboard navigation when this component is focused
  useEffect(() => {
    if (globalFocus === 'KEYBOARD' && Platform.OS === 'android') {
      const keyHandler = (keyEvent: KeyEventProps) => {
        if (globalFocus !== 'KEYBOARD') {
          return;
        }

        const { row, col } = focusedKeyPosition;
        let newRow = row;
        let newCol = col;

        const currentKey = getKeyAtPosition(row, col);

        switch (keyEvent.keyCode) {
          case 23: // KEYCODE_DPAD_CENTER (OK/Select button)
            const selectedKey = getKeyAtPosition(row, col);
            if (selectedKey && !isKeyDisabled(selectedKey)) {
              handleKeyPress(selectedKey);
            }
            break;
          case 19: // KEYCODE_DPAD_UP
            newRow = Math.max(0, row - 1);
            if (newRow >= 0 && col >= keyboardLayout[newRow].length) {
              newCol = keyboardLayout[newRow].length - 1;
            }
            break;
          case 20: // KEYCODE_DPAD_DOWN
            newRow = Math.min(keyboardLayout.length - 1, row + 1);
            if (
              newRow < keyboardLayout.length &&
              col >= keyboardLayout[newRow].length
            ) {
              newCol = keyboardLayout[newRow].length - 1;
            }
            break;
          case 21: // KEYCODE_DPAD_LEFT
            newCol = Math.max(0, col - 1);
            break;
          case 22: // KEYCODE_DPAD_RIGHT
            if (col === keyboardLayout[row].length - 1) {
              setGlobalFocus('LOGINFORM');
              return;
            } else {
              newCol = col + 1;
            }
            break;
        }

        // Update position if it changed
        if (newRow !== row || newCol !== col) {
          setFocusedKeyPosition({ row: newRow, col: newCol });
        }
      };

      KeyEvent.onKeyDownListener(keyHandler);

      return () => {
        KeyEvent.removeKeyDownListener();
      };
    }

    // Clean up listeners when not focused
    return () => {
      if (Platform.OS === 'android') {
        KeyEvent.removeKeyDownListener();
      }
    };
  }, [focusedKeyPosition, globalFocus, setGlobalFocus]);

  return (
    <View style={styles.container}>
      {keyboardLayout.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((key, colIndex) => {
            const isCurrentKeyFocused =
              globalFocus === 'KEYBOARD' &&
              focusedKeyPosition.row === rowIndex &&
              focusedKeyPosition.col === colIndex;

            const isDisabled = isKeyDisabled(key);
            return (
              <TouchableOpacity
                key={key}
                disabled={isDisabled}
                focusable={true}
                hasTVPreferredFocus={isCurrentKeyFocused}
                style={[
                  styles.key,
                  key === 'SHIFT' && styles.shiftKey,
                  key === 'SPACE' && styles.spaceKey,
                  key === 'BACKSPACE' && styles.backspaceKey,
                  key === 'Previous' && styles.previous,
                  key === 'Next' && styles.next,
                  isCurrentKeyFocused && styles.keyFocused,
                  isDisabled && styles.keyDisabled,
                ]}
                onPress={() => handleKeyPress(key)}>
                <Text
                  style={[
                    styles.keyText,
                    isCurrentKeyFocused && styles.keyTextFocused,
                    isDisabled && styles.keyTextDisabled,
                  ]}>
                  {shift &&
                    key !== 'SHIFT' &&
                    key !== 'Previous' &&
                    key !== 'Next'
                    ? key.toUpperCase()
                    : key}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    overflow: 'hidden',
    height: '100%',
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 2,
    flex: 10,
    width: '100%',
  },
  key: {
    margin: 2.5,
    backgroundColor: '#555',
    borderRadius: 5,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shiftKey: {
    flex: 2,
  },
  spaceKey: {
    flex: 4,
  },
  backspaceKey: {
    flex: 2,
  },
  previous: {
    flex: 2,
    height: 33,
  },
  next: {
    flex: 2,
    height: 33,
  },
  keyText: {
    fontSize: 14,
    color: 'white',
  },
  keyFocused: {
    backgroundColor: '#777',
    borderColor: 'white',
    borderWidth: 1,
  },
  keyDisabled: {
    opacity: 0.7,
  },
  keyTextFocused: {
    color: 'white',
  },
  keyTextDisabled: {
    opacity: 0.6,
  },
});

export default Keyboard;
