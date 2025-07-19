import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "@/utils/apiClient";
import { 
  setAccessToken, 
  removeAccessToken, 
  setRefreshToken,
  removeRefreshToken,
  getAccessToken,
  getRefreshToken
} from "@/utils/apiClient";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  isInitialized: false
};

// Load user data from token on app initialization
export const loadUserFromToken = createAsyncThunk(
  "auth/loadUserFromToken",
  async () => {
    try {
      // Check if we have tokens stored
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();
      
      if (!accessToken || !refreshToken) {
        console.log("No tokens found in localStorage");
        return null;
      }
      
      console.log("Tokens found, fetching user data");
      // Get current user data
      const res = await apiClient.get("/auth/me");
      
      if (!res.data.user) {
        console.log("No user data returned from /auth/me");
        return null;
      }
      
      const userData: User = {
        _id: res.data.user._id,
        name: res.data.user.name,
        email: res.data.user.email,
        role: res.data.user.role
      };
      
      console.log("User data loaded from token:", userData);
      return userData;
    } catch (error: any) {
      console.error("Failed to load user from token:", error);
      // Don't reject with error - just return null to indicate no valid user
      return null;
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }: {email:string; password:string}, thunkAPI) => {
    try {
      console.log("Making login request to backend");
      const res = await apiClient.post("/auth/login", { email, password });
      console.log("Backend response:", res.data);
      
      // Save the access token
      if (res.data.accessToken) {
        setAccessToken(res.data.accessToken);
      }
      
      // Save the refresh token
      if (res.data.refreshToken) {
        setRefreshToken(res.data.refreshToken);
      }
      
      // The backend returns user data directly in the response
      const userData: User = {
        _id: res.data._id,
        name: res.data.name,
        email: res.data.email,
        role: res.data.role
      };
      
      console.log("Extracted user data:", userData);
      return userData;
    } catch (error: any) {
      console.error("Login error:", error.response?.data || error);
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Login failed");
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/register",
  async (
    {
      name,
      email,
      password,
    }: { name: string; email: string; password: string },
    thunkAPI
  ) => {
    try {
      const res = await apiClient.post("/auth/register", { name, email, password });
      
      // Save the access token if it's returned from registration
      if (res.data.accessToken) {
        setAccessToken(res.data.accessToken);
      }
      
      // Save the refresh token if it's returned from registration
      if (res.data.refreshToken) {
        setRefreshToken(res.data.refreshToken);
      }
      
      return res.data.message;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Registration failed"
      );
    }
  }
);

export const refreshToken = createAsyncThunk(
  "auth/refreshToken",
  async (_, thunkAPI) => {
    try {
      const res = await apiClient.post("/auth/refresh");
      console.log("Refresh token response:", res.data);
      
      // Save the new access token
      if (res.data.accessToken) {
        setAccessToken(res.data.accessToken);
      }
      
      // Extract user data from the response if it exists
      if (res.data.user) {
        const userData: User = {
          _id: res.data.user._id,
          name: res.data.user.name,
          email: res.data.user.email,
          role: res.data.user.role
        };
        return userData;
      }
      
      // If no user data in response, return the current user
      const state = thunkAPI.getState() as { auth: AuthState };
      return state.auth.user;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Token refresh failed");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: { 
    logout(state) { 
      // Clear the access token when logging out
      removeAccessToken();
      // Clear the refresh token when logging out
      removeRefreshToken();
      state.user = null; 
    } 
  },
  extraReducers: builder => {
    builder
      // Login
      .addCase(loginUser.pending, state => { 
        state.loading = true; 
        state.error = null; 
      })
      .addCase(loginUser.fulfilled, (state, action) => { 
        state.loading = false; 
        state.user = action.payload; 
        console.log("Updated auth state after login:", state.user);
      })
      .addCase(loginUser.rejected, (state, action) => { 
        state.loading = false; 
        state.error = action.payload as string; 
        console.error("Login rejected:", action.payload);
      })
      // Refresh token
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      // Load user from token
      .addCase(loadUserFromToken.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadUserFromToken.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isInitialized = true;
      })
      .addCase(loadUserFromToken.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.isInitialized = true;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;