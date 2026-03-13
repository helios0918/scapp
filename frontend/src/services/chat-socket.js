import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { API_BASE_URL } from "@/lib/config";

export function createRoomSocket({
  token,
  roomCode,
  onConnect,
  onDisconnect,
  onMessage,
  onBatchSeen,
  onNotepad,
  onExpired,
  onError,
}) {
  const wsUrl = new URL("/ws", API_BASE_URL).toString();
  const client = new Client({
    webSocketFactory: () => new SockJS(wsUrl),
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    reconnectDelay: 2500,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    debug: () => {},
  });

  client.onConnect = () => {
    client.subscribe(`/topic/room/${roomCode}`, (frame) => {
      if (!frame?.body) {
        return;
      }
      onMessage?.(JSON.parse(frame.body));
    });

    client.subscribe(`/topic/room/${roomCode}/batch-seen`, (frame) => {
      if (!frame?.body) {
        return;
      }
      onBatchSeen?.(JSON.parse(frame.body));
    });

    client.subscribe(`/topic/room/${roomCode}/notepad`, (frame) => {
      onNotepad?.(frame?.body ?? "");
    });

    client.subscribe(`/topic/room/${roomCode}/expired`, (frame) => {
      if (!frame?.body) {
        return;
      }
      onExpired?.(JSON.parse(frame.body));
    });

    onConnect?.();
  };

  client.onWebSocketClose = () => {
    onDisconnect?.();
  };

  client.onStompError = (frame) => {
    onError?.(frame?.headers?.message || "Socket error");
  };

  client.activate();
  return client;
}

export function disconnectSocket(client) {
  if (!client) {
    return;
  }
  client.deactivate();
}

export function sendRoomMessage(client, roomCode, payload) {
  if (!client?.connected) {
    return;
  }

  client.publish({
    destination: `/app/chat/${roomCode}`,
    body: JSON.stringify(payload),
  });
}

export function sendSeenBatch(client, roomCode, messageIds) {
  if (!client?.connected || !messageIds?.length) {
    return;
  }

  client.publish({
    destination: `/app/chat/${roomCode}/seen`,
    body: JSON.stringify(messageIds),
  });
}

export function sendNotepadUpdate(client, roomCode, content) {
  if (!client?.connected) {
    return;
  }

  client.publish({
    destination: `/app/chat/${roomCode}/notepad`,
    body: content,
  });
}
