import React from 'react';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
const KeyboardAvoidingView = (props: any) => {
  const defaultProps = {
    contentContainerStyle: {flexGrow: 1},
    bounces: false,
    bouncesZoom: false,
    alwaysBounceVertical: false,
    alwaysBounceHorizontal: false,
  };

  return React.createElement(KeyboardAwareScrollView, {
    keyboardShouldPersistTaps: 'handled',
    style: props.style ? props.style : {flex: 1},
    enableOnAndroid: props.enableOnAndroid ? props.enableOnAndroid : true,
    ...defaultProps,
    ...props,
  });
};

export default KeyboardAvoidingView;
