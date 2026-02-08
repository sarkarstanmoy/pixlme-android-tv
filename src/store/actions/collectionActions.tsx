import {createAsyncThunk} from '@reduxjs/toolkit';
import {APP_BASE_URL} from '../types';
import {getAsyncData} from '../../utils/helper';
import axiosInstance from '../../utils/axios_instance';

export const getCollections = createAsyncThunk(
  'getCollections',
  async (_, {dispatch, rejectWithValue}) => {
    const url = `${APP_BASE_URL}api/collection/byUser`;
    const tokenObj = await getAsyncData('auth_data');

    const AuthStr = `Bearer ${
      tokenObj?.tokenValue?.accessToken || tokenObj?.tokenValue?.access_token
    }`;
    try {
      const {data} = await axiosInstance.get(url);

      let array: any[] = [];
      await Promise.all(
        data?.value?.map(async (item: any) => {
          const collectionId = item?.collectionId;
          const apiObj = {
            collectionId,
            AuthStr,
            isFirstItem: true,
            page: 1,
            limit: 20,
          };
          const collectionRes = await dispatch(getCollectionById(apiObj));
          const obj = {
            ...item,
            imageId: collectionRes?.payload[0]?.imageId
              ? collectionRes?.payload[0]?.imageId
              : '',
            image: collectionRes?.payload[0]?.image?.thumblink
              ? collectionRes?.payload[0]?.image?.thumblink
              : '',
            count: collectionRes?.payload?.length
              ? collectionRes?.payload?.length
              : 0,
            collectionsChild: collectionRes?.payload,
          };
          array.push(obj);
        }),
      );
      return array;
    } catch (err: any) {
      console.log('res-err', AuthStr, err);
      // The axios interceptor already handles 401 and logs out
      // Just propagate the error to Redux
      return rejectWithValue(err?.response?.data || err?.message || 'Failed to fetch collections');
    }
  },
);

export const getCollectionById = createAsyncThunk(
  'getCollectionById',
  async (apiObj: any, {rejectWithValue}) => {
    const url = `${APP_BASE_URL}api/collection/${apiObj?.collectionId}?page=${apiObj?.page}&limit=${apiObj?.limit}`;

    try {
      // const {data} = await axios.get(url, headers);
      const {data} = await axiosInstance.get(url);

      return data.value;
    } catch (err: any) {
      console.log('res-err', apiObj?.collectionId, err);
      // The axios interceptor already handles 401 and logs out
      // Just propagate the error to Redux
      return rejectWithValue(err?.response?.data || err?.message || 'Failed to fetch collection');
    }
  },
);
