import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import LoginScreen from '../screens/login';
import HomeScreen from '../screens/home';
// import CollectionScreen from '../screens/collections';
// import PreviewScreen from '../screens/preview';
// import DisplayPage from '../screens/displayPage';
import StreamPage from '../screens/streampage';
import OnBoardingScreen from '../screens/onboardingScreen';
import ForgetPassword from '../screens/forget-password';
import {screenHeight, screenWidth} from '../utils/helper';
import {ActivityIndicator, View} from 'react-native';
import * as Helper from '../utils/helper';
import {useAuth} from '../utils/authProvider';
import StreamImagePage from '../screens/streamImages';
import StreamOneImage from '../screens/streamImages/streamOneImage';

const AuthStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();

const AuthNavigator = () => (
  <AuthStack.Navigator
    initialRouteName="OnBoardingScreen"
    screenOptions={{
      headerShown: false,
    }}>
    <AuthStack.Screen name="OnBoardingScreen" component={OnBoardingScreen} />
    <AuthStack.Screen name="ForgetPassword" component={ForgetPassword} />
    <AuthStack.Screen name="LoginScreen" component={LoginScreen} />
  </AuthStack.Navigator>
);

const HomeNavigator = () => (
  <HomeStack.Navigator
    initialRouteName="HomeScreen"
    screenOptions={{
      headerShown: false,
    }}>
    <HomeStack.Screen name="HomeScreen" component={HomeScreen} />
    {/* <HomeStack.Screen name="CollectionScreen" component={CollectionScreen} />
    <HomeStack.Screen name="PreviewScreen" component={PreviewScreen} />
    <HomeStack.Screen name="DisplayPage" component={DisplayPage} /> */}
    <HomeStack.Screen name="StreamPage" component={StreamPage} />
    <HomeStack.Screen name="StreamImagePage" component={StreamImagePage} />
    <HomeStack.Screen name="StreamOneImage" component={StreamOneImage} />
  </HomeStack.Navigator>
);

const AppNavigator = () => {
  const {isAuthenticated, loading} = useAuth();

  if (loading) {
    return (
      <View
        style={{
          width: screenWidth,
          height: screenHeight,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <ActivityIndicator size="small" color={Helper.Colors.item_blank_bg} />
      </View>
    );
  }

  return isAuthenticated ? <HomeNavigator /> : <AuthNavigator />;
};

export default AppNavigator;
