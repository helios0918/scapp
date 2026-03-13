import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiClient, parseApiError } from "@/services/api-client";

function mapProfile(data = {}) {
  const rawTfaEnabled =
    data.isTfaEnabled !== undefined ? data.isTfaEnabled : data.tfaEnabled;

  return {
    username: data.username || "",
    email: data.email || "",
    uniqueId: data.uniqueId || "",
    role: data.role || "USER",
    passwordSet: Boolean(data.passwordSet),
    isTfaEnabled: Boolean(rawTfaEnabled),
  };
}

export const fetchProfile = createAsyncThunk(
  "profile/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get("/api/users/me");
      return mapProfile(data);
    } catch (error) {
      return rejectWithValue(parseApiError(error));
    }
  },
);

export const updateProfile = createAsyncThunk(
  "profile/update",
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const { data } = await apiClient.put("/api/users/update", payload);
      dispatch(fetchProfile());
      return data;
    } catch (error) {
      return rejectWithValue(parseApiError(error));
    }
  },
);

const profileSlice = createSlice({
  name: "profile",
  initialState: {
    profile: null,
    status: "idle",
    updateStatus: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Could not load profile";
      })
      .addCase(updateProfile.pending, (state) => {
        state.updateStatus = "loading";
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state) => {
        state.updateStatus = "succeeded";
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.error = action.payload || "Could not update profile";
      });
  },
});

export default profileSlice.reducer;
