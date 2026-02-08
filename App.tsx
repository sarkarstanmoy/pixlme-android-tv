/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {LogBox, StyleSheet} from 'react-native';
import {store} from './src/store/store';
import {Provider} from 'react-redux';
import AppNavigator from './src/navigation';
import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import 'react-native-devsettings/withAsyncStorage';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {AuthProvider} from './src/utils/authProvider';
import Toast from 'react-native-toast-message';

LogBox.ignoreAllLogs(); //Ignore all log notifications

const navigationRef = createNavigationContainerRef();

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={styles.root}>
      <Provider store={store}>
        <NavigationContainer ref={navigationRef}>
          <AuthProvider>
            <AppNavigator />
            <Toast />
          </AuthProvider>
        </NavigationContainer>
      </Provider>
    </GestureHandlerRootView>
  );
}

export default App;

const styles = StyleSheet.create({
  root: {flex: 1},
});
