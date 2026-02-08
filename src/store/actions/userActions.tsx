import {APP_BASE_URL} from '../types';
import {createAsyncThunk} from '@reduxjs/toolkit';
import {storeAsyncData} from '../../utils/helper';
import axiosInstance from '../../utils/axios_instance';
import {registerDeviceId} from '../../store/actions/deviceActions';

interface authState {
  navigation: any;
  loginInfo: credentials;
}

interface credentials {
  email: string;
  password: string;
}

interface validateState {
  navigation: any;
  loginInfo: validationCredentials;
}

interface validationCredentials {
  deviceType: string;
  osType: string;
  deviceMake: string;
  deviceIdentifier: string;
  deviceName: string;
  deviceMetadata: string[];
  codeVerifier: string;
}

// export const postAuth = createAsyncThunk(
//   'postAuth',
//   async (bodyObj: authState, {dispatch}) => {
//     try {
//       const url = `${APP_BASE_URL}api/auth/signin`;
//       let data;
//       await axiosInstance
//         .post(url, bodyObj.loginInfo)
//         .then(async response => {
//           data = response.data;
//           const authData = {
//             tokenValue: data?.value,
//             message: data?.message,
//           };

//           await storeAsyncData('auth_data', authData);

//           const subscriptionInfo = await axiosInstance.get(
//             `${APP_BASE_URL}api/subscription`,
//           );
//           const subscriptionInfoData = subscriptionInfo.data;
//           if (subscriptionInfoData.value.length > 0) {
//             subscriptionInfoData.value.forEach((subscription: any) => {
//               if (
//                 subscription.subscriptionState &&
//                 subscription.subscriptionState ===
//                   'SUBSCRIPTION_STATE_EXPIRED' &&
//                 subscription.subscriptionEndDate &&
//                 new Date(subscription.subscriptionEndDate) < new Date()
//               ) {
//                 Toast.show({
//                   type: 'error',
//                   text1: 'Subscription expired.',
//                 });
//                 throw Error('Subscription expired.');
//               }
//             });
//           }

//           dispatch(registerDeviceId());
//         })
//         .catch(error => {
//           console.log('Email-login-result-Error sending data: ', error, url);
//           throw Error(error);
//         });
//       return data;
//     } catch (err: any) {
//       throw Error(err);
//       console.log(err);
//     }
//   },
// );

export const postAuth = createAsyncThunk(
  'postAuth',
  async (bodyObj: authState, {dispatch}) => {
    const url = `${APP_BASE_URL}api/auth/signin`;

    try {
      // Validate login with email & password
      const response = await axiosInstance.post(url, bodyObj.loginInfo);
      const data = response.data;
      if (!data?.value?.accessToken && !data?.value?.access_token) {
        throw new Error('Authentication Error: No access token received');
      }
      // Store auth data locally
      const authData = {
        tokenValue: data?.value,
        message: data?.message,
      };
      await storeAsyncData('auth_data', authData);

      // Fetch Subscription Info
      // const subscriptionResponse = await axiosInstance.get(
      //   `${APP_BASE_URL}api/subscription`,
      // );
      // const subscriptionInfoData = subscriptionResponse.data;

      // if (
      //   !subscriptionInfoData?.value ||
      //   subscriptionInfoData.value.length === 0
      // ) {
      //   throw new Error('No subscription found');
      // }

      // Validate Subscriptions
      // const hasValidSubscription = subscriptionInfoData.value.some(
      //   (subscription: any) => {
      //     return (
      //       subscription.subscriptionState === 'SUBSCRIPTION_STATE_ACTIVE' &&
      //       subscription.subscriptionEndDate &&
      //       new Date(subscription.subscriptionEndDate) >= new Date() &&
      //       subscription.expiryDate &&
      //       new Date(subscription.expiryDate) >= new Date()
      //     );
      //   },
      // );

      // if (!hasValidSubscription) {
      //   throw new Error('Subscription expired.');
      // }

      // Dispatch Register Device Action
      dispatch(registerDeviceId());
      return data;
    } catch (error: any) {
      console.error('Login error:', error);
      throw Error(error);
    }
  },
);

export const validateTvCode = createAsyncThunk(
  'validateCode',
  async (bodyObj: validateState, {dispatch}) => {
    const url = `${APP_BASE_URL}api/auth/validatetvcode`;

    try {
      // Validate TV Code
      const response = await axiosInstance.post(url, bodyObj.loginInfo);
      const data = response.data;

      // Store auth data locally
      const authData = {
        tokenValue: data?.value,
        message: data?.message,
      };
      await storeAsyncData('auth_data', authData);

      // Fetch Subscription Info
      // const subscriptionResponse = await axiosInstance.get(
      //   `${APP_BASE_URL}api/subscription`,
      // );
      // const subscriptionInfoData = subscriptionResponse.data;

      // if (
      //   !subscriptionInfoData?.value ||
      //   subscriptionInfoData.value.length === 0
      // ) {
      //   throw new Error('No subscription found');
      // }

      // Validate Subscriptions
      // const hasValidSubscription = subscriptionInfoData.value.some(
      //   (subscription: any) => {
      //     return (
      //       subscription.subscriptionState === 'SUBSCRIPTION_STATE_ACTIVE' &&
      //       subscription.subscriptionEndDate &&
      //       new Date(subscription.subscriptionEndDate) >= new Date() &&
      //       subscription.expiryDate &&
      //       new Date(subscription.expiryDate) >= new Date()
      //     );
      //   },
      // );

      // if (!hasValidSubscription) {
      //   throw new Error('Subscription expired.');
      // }

      // Dispatch Register Device Action
      dispatch(registerDeviceId());
      return data;
    } catch (error: any) {
      console.error('Error in validating code:', error);
      throw Error(error);
    }
  },
);

export const getUserInfo = createAsyncThunk(
  'getUserInfo',
  async (bodyObj: any) => {
    const url = `${APP_BASE_URL}api/user`;
    try {
      const {data} = await axiosInstance.get(url);
      return data.value;
    } catch (err) {
      console.log('res-err', 'get user', err);
    }
  },
);

export const getUserProfilePic = createAsyncThunk(
  'getUserProfilePic',
  async (bodyObj: any) => {
    const url = `${APP_BASE_URL}api/user/displayPic/get`;
    try {
      const {data} = await axiosInstance.get(url);
      return data.value;
    } catch (err) {
      console.log('res-err', bodyObj?.collectionId, err);
    }
  },
);
