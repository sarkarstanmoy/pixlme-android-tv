import {
  StyleSheet,
  Text,
  ActivityIndicator,
  View,
} from 'react-native';
import React from 'react';
import * as Helper from '../../utils/helper';
import Focusable from '../Focusable';

const CurveBtn = ({btnName, btnOnPress, style, isLoading}: any) => {
  return (
    <Focusable onPress={isLoading ? undefined : btnOnPress}>
      {(isFocused: boolean) => (
        <View
          style={[
            styles.container,
            style,
            isFocused && {borderWidth: 2, borderColor: 'white'},
          ]}>
          {isLoading ? (
            <ActivityIndicator size={17} color={Helper.Colors.item_blank_bg} />
          ) : (
            <Text style={styles.btn}>{btnName}</Text>
          )}
        </View>
      )}
    </Focusable>
  );
};

export default CurveBtn;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 7,
    marginEnd: 10,
    borderRadius: 50,
    backgroundColor: Helper.Colors.btn_bg,
    marginTop: '2%',
    alignItems: 'center',
  },
  btn: {
    fontSize: 12,
    color: Helper.Colors.item_blank_bg,
  },
});
