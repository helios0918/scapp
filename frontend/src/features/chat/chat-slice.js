import { createSlice } from "@reduxjs/toolkit";

function findMessageIndex(list, message) {
  if (!message?.id) {
    return -1;
  }
  return list.findIndex((item) => item.id === message.id);
}

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    messagesByRoom: {},
    notepadByRoom: {},
    connectionByRoom: {},
  },
  reducers: {
    setRoomMessages(state, action) {
      const { roomCode, messages } = action.payload;
      state.messagesByRoom[roomCode] = messages || [];
    },
    appendRoomMessage(state, action) {
      const { roomCode, message } = action.payload;
      const current = state.messagesByRoom[roomCode] || [];
      const existingIndex = findMessageIndex(current, message);

      if (existingIndex >= 0) {
        current[existingIndex] = message;
      } else {
        current.push(message);
      }

      state.messagesByRoom[roomCode] = current;
    },
    setRoomNotepad(state, action) {
      const { roomCode, content } = action.payload;
      state.notepadByRoom[roomCode] = content || "";
    },
    setRoomConnection(state, action) {
      const { roomCode, status } = action.payload;
      state.connectionByRoom[roomCode] = status;
    },
    markBatchSeen(state, action) {
      const { roomCode, messageIds, seenBy } = action.payload;
      const messages = state.messagesByRoom[roomCode] || [];
      const targetIds = new Set(messageIds || []);

      state.messagesByRoom[roomCode] = messages.map((message) => {
        if (!targetIds.has(message.id)) {
          return message;
        }

        const seenByList = Array.isArray(message.seenBy) ? [...message.seenBy] : [];
        if (seenBy && !seenByList.includes(seenBy)) {
          seenByList.push(seenBy);
        }

        return {
          ...message,
          seenBy: seenByList,
          seenCount: seenByList.length,
        };
      });
    },
    removeExpiredMessages(state, action) {
      const { roomCode, messageIds } = action.payload;
      const targetIds = new Set(messageIds || []);
      if (!targetIds.size) {
        return;
      }

      state.messagesByRoom[roomCode] = (state.messagesByRoom[roomCode] || []).filter(
        (message) => !targetIds.has(message.id),
      );
    },
  },
});

export const {
  setRoomMessages,
  appendRoomMessage,
  setRoomNotepad,
  setRoomConnection,
  markBatchSeen,
  removeExpiredMessages,
} = chatSlice.actions;

export default chatSlice.reducer;
