import {createSlice} from '@reduxjs/toolkit';
import {getCollections, getCollectionById} from '../actions/collectionActions';

export interface collectionState {
  loading: boolean;
  collections: any;
  status: string;
  collectionByIdLoading: boolean;
  collectionsById: any;
  collectionByIdStatus: string;
}

const initState: collectionState = {
  loading: true,
  collections: [],
  status: 'loading',
  collectionByIdLoading: true,
  collectionsById: [],
  collectionByIdStatus: 'loading',
};

export const collectionsSlice = createSlice({
  name: 'collections',
  initialState: initState,
  reducers: {},
  extraReducers: builder => {
    builder
  .addCase(getCollections.pending, state => {
        // Keep existing collections to avoid UI flicker while refreshing
        state.loading = true;
        state.status = 'loading';
      })
      .addCase(getCollections.fulfilled, (state, action) => {
        state.loading = false;
        state.collections = action.payload;
        state.status = 'success';
      })
  .addCase(getCollections.rejected, state => {
        state.loading = false;
        // Preserve previous collections on failure
        state.status = 'failed';
      })
      .addCase(getCollectionById.pending, (state, action) => {
        state.collectionByIdLoading = true;
        state.collectionsById = action.payload;
        state.collectionByIdStatus = 'loading';
      })
      .addCase(getCollectionById.fulfilled, (state, action) => {
        state.collectionByIdLoading = false;
        state.collectionsById = action.payload;
        state.collectionByIdStatus = 'success';
      })
      .addCase(getCollectionById.rejected, (state, action) => {
        state.collectionByIdLoading = false;
        state.collectionsById = action.payload;
        state.collectionByIdStatus = 'failed';
      });
  },
});

export default collectionsSlice.reducer;
