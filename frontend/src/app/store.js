import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/auth-slice";
import roomsReducer from "@/features/rooms/rooms-slice";
import profileReducer from "@/features/profile/profile-slice";
import chatReducer from "@/features/chat/chat-slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    rooms: roomsReducer,
    profile: profileReducer,
    chat: chatReducer,
  },
});
