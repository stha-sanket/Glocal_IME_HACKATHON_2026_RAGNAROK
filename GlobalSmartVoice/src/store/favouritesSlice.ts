import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiRequest, ApiError } from '../api/client';

export interface FavouriteAccount {
  id: string;
  nickname: string;
  accountNumber: string;
}

interface FavouritesState {
  items: FavouriteAccount[];
  loading: boolean;
  addPending: boolean;
  error: string | null;
}

const initialState: FavouritesState = {
  items: [],
  loading: false,
  addPending: false,
  error: null,
};

export const fetchFavourites = createAsyncThunk<FavouriteAccount[], string, { rejectValue: string }>(
  'favourites/fetch',
  async (clientId, { rejectWithValue }) => {
    try {
      const res = await apiRequest<{ favourites: FavouriteAccount[] }>(
        `/favourites/list?clientId=${encodeURIComponent(clientId)}`,
      );
      return res.favourites;
    } catch (err) {
      return rejectWithValue(err instanceof ApiError ? err.message : 'Could not load favourite accounts.');
    }
  },
);

export const addFavourite = createAsyncThunk<
  FavouriteAccount,
  { clientId: string; nickname: string; accountNumber: string },
  { rejectValue: string }
>('favourites/add', async (payload, { rejectWithValue }) => {
  try {
    const res = await apiRequest<{ favourite: FavouriteAccount }>('/favourites/create', {
      method: 'POST',
      body: payload,
    });
    return res.favourite;
  } catch (err) {
    return rejectWithValue(err instanceof ApiError ? err.message : 'Could not add favourite account.');
  }
});

const favouritesSlice = createSlice({
  name: 'favourites',
  initialState,
  reducers: {
    clearFavouritesError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFavourites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFavourites.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchFavourites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Could not load favourite accounts.';
      })
      .addCase(addFavourite.pending, (state) => {
        state.addPending = true;
        state.error = null;
      })
      .addCase(addFavourite.fulfilled, (state, action) => {
        state.addPending = false;
        state.items.push(action.payload);
      })
      .addCase(addFavourite.rejected, (state, action) => {
        state.addPending = false;
        state.error = action.payload ?? 'Could not add favourite account.';
      });
  },
});

export const { clearFavouritesError } = favouritesSlice.actions;
export default favouritesSlice.reducer;
