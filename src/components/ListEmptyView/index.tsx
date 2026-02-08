import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import * as Helper from '../../utils/helper';
import {screenWidth} from '../../utils/helper';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

const ListEmptyView = () => {
  return (
    <View style={styles.container}>
      <FontAwesome6
        name="folder-plus"
        size={30}
        color={Helper.Colors.foreground}
      />
      <Text style={styles.description}>
        You have no collections! Create collections from Pixlme app to start
        streaming them on TV
      </Text>
    </View>
  );
};

export default ListEmptyView;

const styles = StyleSheet.create({
  container: {
    color: Helper.Colors.foreground,
    justifyContent: 'center',
    alignItems: 'center',
    width: screenWidth,
    paddingTop: '3%',
  },
  description: {
    color: Helper.Colors.foreground,
    fontSize: 14,
    maxWidth: '40%',
    textAlign: 'center',
    marginTop: 20,
  },
});
