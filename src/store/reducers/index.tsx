import {combineReducers} from 'redux';
import userReducer from './usersReducer';
import storage from '@react-native-async-storage/async-storage';
import {persistReducer} from 'redux-persist';

const persistConfig = {
  key: 'root',
  storage,
};

export default combineReducers({
  users: persistReducer(persistConfig, userReducer),
});
