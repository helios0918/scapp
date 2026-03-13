import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiClient, parseApiError } from "@/services/api-client";

/**
 * Normalizes room data to ensure the UI never crashes.
 * Ensures roomCode, description, and createdBy are always strings.
 */
function normalizeRoom(room, fallbackCreatedBy = "") {
  if (typeof room === "string") {
    return {
      roomCode: room,
      description: "Private collaboration arc",
      createdBy: fallbackCreatedBy,
    };
  }

  return {
    roomCode: room.roomCode || "N/A",
    description: room.description || "Private collaboration arc",
    createdAt: room.createdAt || "",
    createdBy: room.createdBy || fallbackCreatedBy,
  };
}

export const fetchRooms = createAsyncThunk(
    "rooms/fetchRooms",
    async (_, { rejectWithValue }) => {
      try {
        const { data } = await apiClient.get("/api/rooms/all-categorized");
        return data;
      } catch (error) {
        return rejectWithValue(parseApiError(error));
      }
    }
);

export const createRoom = createAsyncThunk(
    "rooms/createRoom",
    async (payload, { dispatch, rejectWithValue }) => {
      try {
        const { data } = await apiClient.post("/api/rooms/create", payload);
        dispatch(fetchRooms());
        return data;
      } catch (error) {
        return rejectWithValue(parseApiError(error));
      }
    }
);

export const joinRoom = createAsyncThunk(
    "rooms/joinRoom",
    async (payload, { dispatch, rejectWithValue }) => {
      try {
        const normalized = {
          roomCode: payload.roomCode?.trim()?.toUpperCase(),
          password: payload.password,
        };
        const { data } = await apiClient.post("/api/rooms/join", normalized);
        dispatch(fetchRooms());
        return data;
      } catch (error) {
        return rejectWithValue(parseApiError(error));
      }
    }
);

const roomsSlice = createSlice({
  name: "rooms",
  initialState: {
    owned: [],
    joined: [],
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
        .addCase(fetchRooms.pending, (state) => {
          state.status = "loading";
          state.error = null;
        })
        .addCase(fetchRooms.fulfilled, (state, action) => {
          const owned = action.payload?.owned || [];
          const joined = action.payload?.joined || [];

          state.status = "succeeded";
          // Apply normalization to both lists
          state.owned = owned.map((room) => normalizeRoom(room, "You"));
          state.joined = joined.map((room) => normalizeRoom(room, "Admin"));
        })
        .addCase(fetchRooms.rejected, (state, action) => {
          state.status = "failed";
          state.error = action.payload || "Could not load rooms";
        })
        .addCase(createRoom.pending, (state) => {
          state.error = null;
        })
        .addCase(createRoom.rejected, (state, action) => {
          state.error = action.payload || "Could not create room";
        })
        .addCase(joinRoom.pending, (state) => {
          state.error = null;
        })
        .addCase(joinRoom.rejected, (state, action) => {
          state.error = action.payload || "Could not join room";
        });
  },
});

export default roomsSlice.reducer;