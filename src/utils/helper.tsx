import {Dimensions} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Colors = {
  black_bg: '#151515',
  item_blank_bg: '#D9D9D9',
  btn_bg: '#444444',
  logo_bg: '#ec5f61',
  logo_bg_light: '#f9d6d4',
  white_bg: '#ffffff',

  // New colors
  background: '#000000',
  foreground: '#ffffff',
  secondary: '#3A3A3A',
  secondary_foreground: '#737371',
  primary: '#E33614',
  primary_foreground: '#ffffff',
};

const Strings = {
  welcomeUser: 'Hi User!',
  welcomeNote: 'Welcome to PixlMe',
  artWorkName: 'Artwork Name',
  artistName: 'Artist Name',
  yourCollections: 'Your Collections',
  playAll: 'Play All',
  shuffle: 'Shuffle',
  login: 'Log In',
  userName: 'UserName',
  password: 'Password',
  loginDescription: 'Enter your username and password to login',
  listEmptyMes: 'No Collections Found',
  listEmptyMesDes: `Oops! we can't find any collections.please try again...`,
  back: 'Back',
  logout: 'Log Out',
  devProgressMes: 'Development in progress.soon it will be available...',
};

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;
const ItemWidth = screenWidth / 3.3;

const HomeListData = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
];

const storeAsyncData = async (key: string, value: any) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);

    // Update authentication state if auth data changes
  } catch (e) {
    // saving error
    console.log('res-async-save-err', e);
  }
};

const getAsyncData = async (key: string) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    // error reading value
    console.log('res-async-get-err', e);
  }
};

const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export {
  Colors,
  Strings,
  screenWidth,
  screenHeight,
  ItemWidth,
  HomeListData,
  storeAsyncData,
  getAsyncData,
  capitalizeFirstLetter,
};
