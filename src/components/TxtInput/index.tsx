import {
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  TextInputProps,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import * as Helper from '../../utils/helper';
import {KeyboardAvoidingView} from 'react-native';

interface InputState extends TextInputProps {
  placeHolderTxt: string;
  inputVal: string;
  onChangeTxt: (txt: any) => void;
  autoFocusVal?: boolean;
  inputRef?: any;
}

const TxtInput = ({
  placeHolderTxt,
  inputVal,
  onChangeTxt,
  autoFocusVal,
  inputRef,
  onKeyPress,
  onSubmitEditing,
  returnKeyType,
  blurOnSubmit,
  focusable,
  ...rest
}: InputState) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <TouchableWithoutFeedback>
      <TextInput
        ref={inputRef && inputRef}
        style={[styles.input, isFocused && styles.focused]}
        onChangeText={txt => onChangeTxt(txt)}
        value={inputVal}
        onFocus={() => {
          setIsFocused(true);
        }}
        onBlur={() => {
          setIsFocused(false);
        }}
        onTouchEndCapture={() => {
          setIsFocused(true);
        }}
        blurOnSubmit={blurOnSubmit}
        onSubmitEditing={onSubmitEditing}
        onKeyPress={onKeyPress}
        placeholder={placeHolderTxt}
        autoFocus={autoFocusVal}
        returnKeyType={returnKeyType}
        focusable={focusable}
        {...rest}
        placeholderTextColor={Helper.Colors.white_bg}
      />
    </TouchableWithoutFeedback>
  );
};

export default TxtInput;

const styles = StyleSheet.create({
  input: {
    height: 40,
    paddingHorizontal: 10,
    fontSize: 14,
    color: Helper.Colors.foreground,
    backgroundColor: Helper.Colors.secondary,
    width: '100%',
    borderRadius: 7,
  },
  focused: {
    borderColor: 'red',
    borderWidth: 1,
  },
});

function TouchInput(props: {
  placeholder?: string;
  value?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  isFocused?: boolean;
  type?: string;
}) {
  const [showCursor, setShowCursor] = useState(false);

  useEffect(() => {
    const cursorInterval: any = props.isFocused
      ? setInterval(() => setShowCursor(prev => !prev), 500)
      : null;

    return () => {
      clearInterval(cursorInterval);
    };
  }, [props.isFocused]);

  return (
    <TouchableOpacity
      disabled={true}
      style={[
        {
          height: 40,
          paddingHorizontal: 10,
          backgroundColor: Helper.Colors.secondary,
          borderRadius: 7,
          flexDirection: 'row',
          alignItems: 'center',
        },
        props?.isFocused && {borderColor: 'red', borderWidth: 1},
      ]}
      hasTVPreferredFocus={false}
      activeOpacity={1}
      onFocus={props?.onFocus}
      onBlur={props?.onBlur}>
      {props?.value || props?.isFocused ? (
        <Text
          ellipsizeMode="head"
          numberOfLines={1}
          style={{
            color: Helper.Colors.foreground,
            flexWrap: 'nowrap',
          }}>
          {props?.type === 'password'
            ? '•'.repeat(props?.value?.length || 0)
            : props?.value}
        </Text>
      ) : (
        props?.placeholder && (
          <Text
            style={{
              color: Helper.Colors.foreground,
            }}>
            {props?.placeholder}
          </Text>
        )
      )}
      {props.isFocused && showCursor && (
        <View
          style={{
            width: 1,
            height: 16,
            backgroundColor: 'white',
            borderRadius: 1,
            marginStart: 2,
          }}
        />
      )}
    </TouchableOpacity>
  );
}

export {TouchInput};
