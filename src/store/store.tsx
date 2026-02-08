import {configureStore} from '@reduxjs/toolkit';
import counterReducer from './reducers/counterReducer';
import collectionsSlice from './reducers/collectionReducer';
import userAuthSlide from './reducers/usersReducer';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    collections: collectionsSlice,
    userAuth: userAuthSlide,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      // thunk: {
      //   extraArgument: myCustomApiService,
      // },
      serializableCheck: false,
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
