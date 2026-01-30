type RoleSlug = "donor" | "hospital" | "admin" | "receiver" | undefined;

type AuthSnapshot = {
  userId?: string;
  role?: RoleSlug;
};

export type ConnectionState =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "fallback-tick";

export type BloodRequestRealtimeEvent =
  | {
      type: "blood-request:created";
      payload: Record<string, unknown>;
    }
  | {
      type: "blood-request:updated";
      payload: Record<string, unknown>;
    }
  | {
      type: "blood-request:deleted";
      payload: { id: string };
    };

interface SubscribeOptions {
  auth?: AuthSnapshot;
  onEvent: (event: BloodRequestRealtimeEvent) => void;
  onStateChange?: (state: ConnectionState) => void;
}

type Listener = (event: BloodRequestRealtimeEvent) => void;
type StateListener = (state: ConnectionState) => void;

let socket: WebSocket | null = null;
let authSnapshot: AuthSnapshot = {};
const listeners = new Set<Listener>();
const stateListeners = new Set<StateListener>();
let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
let fallbackTimer: ReturnType<typeof setInterval> | undefined;
let reconnectAttempts = 0;

const MAX_RECONNECT_DELAY_MS = 30_000;
const FALLBACK_POLL_INTERVAL_MS = 20_000;

function resolveUrl(rawUrl: string, base: string): URL {
  try {
    return new URL(rawUrl);
  } catch {
    return new URL(rawUrl, base);
  }
}

function computeWebSocketUrl(): string {
  const explicit = import.meta.env.VITE_WS_URL as string | undefined;
  const fallbackOrigin = typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1:3000";

  if (explicit) {
    return resolveUrl(explicit, fallbackOrigin).toString();
  }

  const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? `${fallbackOrigin}/api`;
  const base = resolveUrl(apiUrl, fallbackOrigin);
  base.protocol = base.protocol === "https:" ? "wss:" : "ws:";
  base.pathname = "/ws";
  base.search = "";
  base.hash = "";
  return base.toString();
}

function notifyState(state: ConnectionState) {
  stateListeners.forEach((listener) => {
    try {
      listener(state);
    } catch (error) {
      console.error("[Realtime] Failed to notify connection state listener", error);
    }
  });
}

function notifyEvent(event: BloodRequestRealtimeEvent) {
  listeners.forEach((listener) => {
    try {
      listener(event);
    } catch (error) {
      console.error("[Realtime] Failed to notify event listener", error);
    }
  });
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = undefined;
  }
}

function stopFallbackMode() {
  if (fallbackTimer) {
    clearInterval(fallbackTimer);
    fallbackTimer = undefined;
  }
}

function startFallbackMode() {
  if (fallbackTimer) {
    return;
  }
  fallbackTimer = setInterval(() => {
    notifyState("fallback-tick");
  }, FALLBACK_POLL_INTERVAL_MS);
}

function cleanupSocket() {
  if (socket) {
    try {
      socket.close();
    } catch (error) {
      console.warn("[Realtime] Failed to close socket", error);
    }
  }
  socket = null;
}

function scheduleReconnect() {
  if (!listeners.size) {
    return;
  }

  clearReconnectTimer();
  startFallbackMode();

  const delay = Math.min(MAX_RECONNECT_DELAY_MS, 1000 * Math.pow(2, reconnectAttempts));
  reconnectAttempts = Math.min(reconnectAttempts + 1, 10);

  reconnectTimer = setTimeout(() => {
    connect();
  }, delay);

  notifyState("reconnecting");
}

function connect() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  if (!listeners.size) {
    return;
  }

  const url = computeWebSocketUrl();
  socket = new WebSocket(url);

  notifyState("connecting");

  socket.onopen = () => {
    stopFallbackMode();
    clearReconnectTimer();
    reconnectAttempts = 0;
    notifyState("connected");
    if (authSnapshot.userId || authSnapshot.role) {
      socket?.send(
        JSON.stringify({
          type: "hello",
          userId: authSnapshot.userId,
          role: authSnapshot.role,
        })
      );
    }
  };

  socket.onmessage = (event) => {
    let parsed: any;
    try {
      if (typeof event.data === "string") {
        parsed = JSON.parse(event.data);
      } else if (event.data instanceof Blob) {
        const text = event.data.text ? event.data.text() : Promise.resolve(String(event.data));
        Promise.resolve(text)
          .then((value) => {
            try {
              notifyIfRealtime(JSON.parse(value));
            } catch (error) {
              console.warn("[Realtime] Failed to parse blob message", error);
            }
          })
          .catch((error) => console.warn("[Realtime] Failed to read blob payload", error));
        return;
      } else {
        parsed = JSON.parse(String(event.data));
      }
    } catch (error) {
      console.warn("[Realtime] Failed to parse websocket payload", error);
      return;
    }

    notifyIfRealtime(parsed);
  };

  socket.onerror = () => {
    notifyState("disconnected");
    try {
      socket?.close();
    } catch (error) {
      console.warn("[Realtime] Failed to close socket after error", error);
    }
  };

  socket.onclose = () => {
    notifyState("disconnected");
    socket = null;
    scheduleReconnect();
  };
}

function notifyIfRealtime(message: any) {
  if (!message || typeof message !== "object") {
    return;
  }

  const { type } = message;
  if (type === "connection:heartbeat" || type === "connection:ack") {
    return;
  }

  if (type === "blood-request:created" || type === "blood-request:updated") {
    if (message.payload && typeof message.payload === "object") {
      notifyEvent({ type, payload: message.payload });
    }
    return;
  }

  if (type === "blood-request:deleted" && message.payload && typeof message.payload.id === "string") {
    notifyEvent({ type, payload: { id: message.payload.id } });
  }
}

export function subscribeToBloodRequestStream(options: SubscribeOptions) {
  if (options.auth) {
    authSnapshot = options.auth;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "hello",
          userId: authSnapshot.userId,
          role: authSnapshot.role,
        })
      );
    }
  }

  listeners.add(options.onEvent);
  if (options.onStateChange) {
    stateListeners.add(options.onStateChange);
  }

  connect();

  return () => {
    listeners.delete(options.onEvent);
    if (options.onStateChange) {
      stateListeners.delete(options.onStateChange);
    }

    if (!listeners.size) {
      stopFallbackMode();
      clearReconnectTimer();
      cleanupSocket();
    }
  };
}
