import {createSlice} from '@reduxjs/toolkit';
import {postAuth, getUserInfo, getUserProfilePic} from '../actions/userActions';

export interface authState {
  loading: boolean;
  authUser: any;
  status: string;
  userLoading: boolean;
  userInfo: any;
  userStatus: string;
  userProfileLoading: boolean;
  userProfilePic: any;
  userProfileStatus: string;
}

const initState: authState = {
  loading: false,
  authUser: [],
  status: 'loading',
  userLoading: false,
  userInfo: {},
  userStatus: 'loading',
  userProfileLoading: false,
  userProfilePic: {},
  userProfileStatus: 'loading',
};

export const authUserSlice = createSlice({
  name: 'authUser',
  initialState: initState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(postAuth.pending, (state, action) => {
        state.loading = true;
        state.authUser = action.payload;
        state.status = 'loading';
      })
      .addCase(postAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.authUser = action.payload;
        state.status = 'success';
      })
      .addCase(postAuth.rejected, (state, action) => {
        state.loading = false;
        state.authUser = action.payload;
        state.status = 'failed';
      })
      .addCase(getUserInfo.pending, (state, action) => {
        state.userLoading = true;
        state.userInfo = action.payload;
        state.userStatus = 'loading';
      })
      .addCase(getUserInfo.fulfilled, (state, action) => {
        state.userLoading = false;
        state.userInfo = action.payload;
        state.userStatus = 'success';
      })
      .addCase(getUserInfo.rejected, (state, action) => {
        state.userLoading = false;
        state.userInfo = action.payload;
        state.userStatus = 'failed';
      })
      .addCase(getUserProfilePic.pending, (state, action) => {
        state.userProfileLoading = true;
        state.userProfilePic = action.payload;
        state.userProfileStatus = 'loading';
      })
      .addCase(getUserProfilePic.fulfilled, (state, action) => {
        state.userProfileLoading = false;
        state.userProfilePic = action.payload;
        state.userProfileStatus = 'success';
      })
      .addCase(getUserProfilePic.rejected, (state, action) => {
        state.userProfileLoading = false;
        state.userProfilePic = action.payload;
        state.userProfileStatus = 'failed';
      });
  },
});

export default authUserSlice.reducer;
