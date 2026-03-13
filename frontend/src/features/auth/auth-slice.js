import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiClient, parseApiError } from "@/services/api-client";

const AUTH_STORAGE_KEY = "chatapp_auth";

export const verifyLoginTfa = createAsyncThunk(
    "auth/verifyLoginTfa",
    async (payload, { rejectWithValue }) => {
      try {
        // payload: { email, code }
        const { data } = await apiClient.post("/api/auth/login/verify-tfa", payload);
        return data;
      } catch (error) {
        return rejectWithValue(parseApiError(error));
      }
    }
);

function mapAuthUser(raw = {}) {
  const rawTfaEnabled =
    raw.isTfaEnabled !== undefined ? raw.isTfaEnabled : raw.tfaEnabled;

  return {
    username: raw.username || "",
    email: raw.email || "",
    role: raw.role || "USER",
    uniqueId: raw.uniqueId || "",
    passwordSet: Boolean(raw.passwordSet),
    isTfaEnabled: Boolean(rawTfaEnabled),
  };
}

function loadPersistedAuth() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return {
      token: null,
      user: null,
    };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      token: parsed?.token || null,
      user: parsed?.user ? mapAuthUser(parsed.user) : null,
    };
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return {
      token: null,
      user: null,
    };
  }
}

function persistAuth(token, user) {
  if (!token || !user) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      token,
      user,
    }),
  );
}



const persisted = loadPersistedAuth();

export const login = createAsyncThunk(
  "auth/login",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post("/api/auth/login", payload);
      return data;
    } catch (error) {
      return rejectWithValue(parseApiError(error));
    }
  },
);

export const register = createAsyncThunk(
  "auth/register",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post("/api/auth/register", payload);
      return data;
    } catch (error) {
      return rejectWithValue(parseApiError(error));
    }
  },
);

export const setPassword = createAsyncThunk(
  "auth/setPassword",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post("/api/auth/set-password", payload);
      return data;
    } catch (error) {
      return rejectWithValue(parseApiError(error));
    }
  },
);

export const fetchMe = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get("/api/users/me");
      return data;
    } catch (error) {
      return rejectWithValue(parseApiError(error));
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: persisted.token,
    user: persisted.user,
    status: "idle",
    error: null,
  },
  reducers: {
    setCredentials(state, action) {
      const token = action.payload?.token || null;
      const user = action.payload?.user ? mapAuthUser(action.payload.user) : null;

      state.token = token;
      state.user = user;
      state.error = null;
      persistAuth(token, user);
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.status = "idle";
      state.error = null;
      persistAuth(null, null);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        if (action.payload.tfaRequired) {
          state.status = "idle";
          return;
        }
        const token = action.payload?.token || null;
        const user = mapAuthUser(action.payload);
        state.status = "succeeded";
        state.token = token;
        state.user = user;
        persistAuth(token, user);
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Login failed";
      })
        .addCase(verifyLoginTfa.pending, (state) => {
          state.status = "loading";
          state.error = null;
        })
        .addCase(verifyLoginTfa.fulfilled, (state, action) => {
          const token = action.payload?.token || null;
          const user = mapAuthUser(action.payload);
          state.status = "succeeded";
          state.token = token;
          state.user = user;
          persistAuth(token, user);
        })
        .addCase(verifyLoginTfa.rejected, (state, action) => {
          state.status = "failed";
          state.error = action.payload || "Invalid 2FA code";
        })
      .addCase(register.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        const token = action.payload?.token || null;
        const user = mapAuthUser(action.payload);
        state.status = "succeeded";
        state.token = token;
        state.user = user;
        persistAuth(token, user);
      })
      .addCase(register.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Registration failed";
      })
      .addCase(setPassword.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(setPassword.fulfilled, (state) => {
        state.status = "succeeded";
        if (state.user) {
          state.user.passwordSet = true;
          persistAuth(state.token, state.user);
        }
      })
      .addCase(setPassword.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Password update failed";
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        const mapped = mapAuthUser(action.payload);
        state.user = mapped;
        state.error = null;
        persistAuth(state.token, mapped);
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.error = action.payload || state.error;
      });
  },
});

export const { logout, setCredentials } = authSlice.actions;

export default authSlice.reducer;

