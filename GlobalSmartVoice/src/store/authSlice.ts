import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { apiRequest, ApiError } from '../api/client';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  accountNumber: string;
  isCardBlocked?: boolean;
}

export type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  authView: 'login' | 'register';
  loginPending: boolean;
  registerPending: boolean;
  error: string | null;
  registerSuccess: boolean;
}

const initialState: AuthState = {
  status: 'checking',
  user: null,
  authView: 'login',
  loginPending: false,
  registerPending: false,
  error: null,
  registerSuccess: false,
};

export const bootstrapSession = createAsyncThunk<AuthUser | null>(
  'auth/bootstrapSession',
  async () => {
    try {
      const details = await apiRequest<AuthUser>(
        '/account/details',
      );
      return details;
    } catch {
      return null;
    }
  },
);

export const loginUser = createAsyncThunk<AuthUser, { email: string; password: string }, { rejectValue: string }>(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await apiRequest<{ message: string; user: AuthUser }>('/auth/login', {
        method: 'POST',
        body: credentials,
      });
      return res.user;
    } catch (err) {
      return rejectWithValue(err instanceof ApiError ? err.message : 'Login failed. Please try again.');
    }
  },
);

export const registerUser = createAsyncThunk<
  void,
  { name: string; email: string; password: string },
  { rejectValue: string }
>('auth/registerUser', async (payload, { rejectWithValue }) => {
  try {
    await apiRequest('/auth/register', { method: 'POST', body: payload });
  } catch (err) {
    return rejectWithValue(err instanceof ApiError ? err.message : 'Registration failed. Please try again.');
  }
});

export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } catch {
    // Cookie may already be gone/expired — still proceed to clear local state.
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthView(state, action: PayloadAction<'login' | 'register'>) {
      state.authView = action.payload;
      state.error = null;
      state.registerSuccess = false;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapSession.fulfilled, (state, action) => {
        if (action.payload) {
          state.status = 'authenticated';
          state.user = action.payload;
        } else {
          state.status = 'unauthenticated';
        }
      })
      .addCase(loginUser.pending, (state) => {
        state.loginPending = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loginPending = false;
        state.status = 'authenticated';
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loginPending = false;
        state.error = action.payload ?? 'Login failed. Please try again.';
      })
      .addCase(registerUser.pending, (state) => {
        state.registerPending = true;
        state.error = null;
        state.registerSuccess = false;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.registerPending = false;
        state.registerSuccess = true;
        state.authView = 'login';
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.registerPending = false;
        state.error = action.payload ?? 'Registration failed. Please try again.';
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.status = 'unauthenticated';
        state.user = null;
        state.authView = 'login';
      });
  },
});

export const { setAuthView, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
