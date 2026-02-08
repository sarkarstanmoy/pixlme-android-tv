import {createAsyncThunk} from '@reduxjs/toolkit';
import axios from 'axios';
import {APP_BASE_URL} from '../types';
import {getAsyncData} from '../../utils/helper';
import DeviceInfo from 'react-native-device-info';
import {Platform} from 'react-native';

export const registerDeviceId = createAsyncThunk(
  'registerDeviceId',
  async () => {
    const url = `${APP_BASE_URL}api/device/register`;
    try {
      const id = await DeviceInfo.getUniqueId();
      const name = await DeviceInfo.getDeviceName();
      const body = {
        deviceType: 'TV',
        osType: Platform.OS === 'android' ? 'android' : 'ios',
        deviceMake: Platform.OS === 'ios' ? 'APPLE' : 'android device',
        deviceIdentifier: id,
        serialNumber: id,
        deviceName: name,
        deviceMetadata: ['model'],
      };

      const tokenObj = await getAsyncData('auth_data');
      const AuthStr = `Bearer ${
        tokenObj?.tokenValue?.accessToken || tokenObj?.tokenValue?.access_token
      }`;
      const {data} = await axios({
        method: 'post',
        url: url,
        headers: {Authorization: AuthStr},
        data: body,
      });
      return data.value;
    } catch (err: any) {
      console.log('res-err', err);
      throw Error(err);
    }
  },
);
