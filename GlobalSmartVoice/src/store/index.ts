import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import favouritesReducer from './favouritesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    favourites: favouritesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
