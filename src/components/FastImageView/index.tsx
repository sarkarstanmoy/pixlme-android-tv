import {StyleSheet, ActivityIndicator, View, Image, Alert} from 'react-native';
import React, {useCallback, useRef, useState} from 'react';
import FastImage from 'react-native-fast-image';
import * as Helper from '../../utils/helper';

type props = {
  url: string;
  style: any;
  defaultSrc?: any;
};
const FastImageView = (props: props) => {
  const {url, style} = props;
  const [isLoading, setLoading] = useState(true);
  const [alertShown, setAlertShown] = useState(false);

  const showAlert = (errorMessage: string) => {
    if (!alertShown) {
      Alert.alert(
        `Image Loading Failed - ${new Date().toUTCString()}`,
        `There was an error loading the image: ${errorMessage}. Please check your device date & time and try again.`,
        [{text: 'OK'}],
        {cancelable: false},
      );
    }
    setAlertShown(true);
  };

  function onLoadStart() {
    setLoading(true);
  }

  function onLoadEnd() {
    setLoading(false);
  }

  function onError(error: any) {
    setLoading(false);
    const errorMessage = error?.nativeEvent?.error || 'Unknown error';
    if (errorMessage === 'Chain validation failed') {
      showAlert(errorMessage);
    }
  }

  return (
    <View>
      {url !== '' ? (
        <FastImage
          fallback={true}
          onError={(e: any) => {
            onError(e);
          }}
          onLoadEnd={onLoadEnd}
          onLoadStart={onLoadStart}
          style={style}
          source={{
            uri: url,
            priority: FastImage.priority.high,
          }}
          resizeMode={FastImage.resizeMode.cover}
        />
      ) : (
        <Image
          source={
            props?.defaultSrc
              ? props.defaultSrc
              : require('../../assets/user_sample.jpg')
          }
          style={style}
        />
      )}
      {isLoading && url !== '' && (
        <ActivityIndicator
          style={[style, styles.loaderStyle]}
          size={17}
          color={Helper.Colors.item_blank_bg}
        />
      )}
    </View>
  );
};

export default FastImageView;

const styles = StyleSheet.create({
  loaderStyle: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Helper.Colors.btn_bg,
  },
});
