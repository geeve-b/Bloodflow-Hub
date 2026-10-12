import { WebSocketServer, WebSocket } from "ws";
import type { RawData } from "ws";
import type { IncomingMessage, Server } from "http";
import type { BloodRequest, BloodDonationTracking } from "@shared/schema";
import { getSessionUser, type SessionUser } from "./auth";

interface ClientMetadata {
  socket: WebSocket;
  user: SessionUser;
  lastPong: number;
}

export type BloodRequestEvent =
  | { type: "blood-request:created"; payload: BloodRequest }
  | { type: "blood-request:updated"; payload: BloodRequest }
  | { type: "blood-request:deleted"; payload: { id: string } }
  | { type: "blood-donation-tracking:created"; payload: BloodDonationTracking }
  | { type: "blood-donation-tracking:updated"; payload: BloodDonationTracking }
  | { type: "blood-donation-tracking:status-updated"; payload: BloodDonationTracking };

export type ConnectionEvent =
  | { type: "connection:ack" }
  | { type: "connection:heartbeat" };

type OutgoingEvent = BloodRequestEvent | ConnectionEvent;

type IncomingClientMessage = { type: "hello" } | { type: "ping" };

const HEARTBEAT_INTERVAL_MS = 30_000;
const CLIENT_TIMEOUT_MS = 90_000;

class RealtimeHub {
  private readonly wss: WebSocketServer;
  private readonly clients = new Map<WebSocket, ClientMetadata>();
  private readonly heartbeatTimer: NodeJS.Timeout;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: "/ws" });
    this.wss.on("connection", (socket, req) => {
      this.handleConnection(socket, req).catch(() => socket.terminate());
    });

    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      this.clients.forEach((meta, socket) => {
        if (now - meta.lastPong > CLIENT_TIMEOUT_MS) {
          socket.terminate();
          this.clients.delete(socket);
          return;
        }

        try {
          socket.ping();
          this.safeSend(socket, { type: "connection:heartbeat" });
        } catch (error) {
          socket.terminate();
          this.clients.delete(socket);
        }
      });
    }, HEARTBEAT_INTERVAL_MS).unref();

    console.log("[WS] Realtime hub ready");
  }

  stop(): void {
    clearInterval(this.heartbeatTimer);
    this.clients.forEach((_meta, socket) => {
      try {
        socket.close();
      } catch {
        socket.terminate();
      }
    });
    this.clients.clear();
    this.wss.close();
  }

  publishBloodRequest(event: BloodRequestEvent): void {
    this.broadcast(event, ({ user }) => {
      if (user.role === "admin" || user.role === "hospital") {
        return true;
      }
      // Donors and receivers only hear about records that involve them
      switch (event.type) {
        case "blood-request:created":
        case "blood-request:updated":
          return event.payload.requesterId === user.id;
        case "blood-request:deleted":
          return true;
        default:
          return event.payload.donorId === user.id || event.payload.receiverId === user.id;
      }
    });
  }

  private broadcast(event: OutgoingEvent, predicate?: (meta: ClientMetadata) => boolean) {
    this.clients.forEach((meta, socket) => {
      if (predicate && !predicate(meta)) {
        return;
      }
      this.safeSend(socket, event);
    });
  }

  private async handleConnection(socket: WebSocket, req: IncomingMessage) {
    const user = await getSessionUser(req.headers.cookie);
    if (!user) {
      socket.close(4401, "Unauthorized");
      return;
    }

    const metadata: ClientMetadata = {
      socket,
      user,
      lastPong: Date.now(),
    };

    this.clients.set(socket, metadata);

    this.safeSend(socket, { type: "connection:ack" });

    socket.on("message", (data) => this.handleMessage(socket, metadata, data));
    socket.on("pong", () => {
      metadata.lastPong = Date.now();
    });
    socket.on("close", () => {
      this.clients.delete(socket);
    });
    socket.on("error", () => {
      this.clients.delete(socket);
      socket.terminate();
    });
  }

  private handleMessage(socket: WebSocket, metadata: ClientMetadata, raw: RawData) {
    try {
      const parsed = JSON.parse(raw.toString()) as IncomingClientMessage;
      if (parsed.type === "hello") {
        // Identity comes from the session cookie checked at connect time, not the client
        return;
      }
      if (parsed.type === "ping") {
        metadata.lastPong = Date.now();
        this.safeSend(socket, { type: "connection:heartbeat" });
        return;
      }
    } catch (error) {
      console.warn(`(ws) failed to handle client message: ${(error as Error).message}`);
    }
  }

  private safeSend(socket: WebSocket, event: OutgoingEvent) {
    if (socket.readyState !== WebSocket.OPEN) {
      return;
    }
    try {
      socket.send(JSON.stringify(event));
    } catch (error) {
      console.warn(`(ws) failed to send realtime event: ${(error as Error).message}`);
    }
  }
}

let hub: RealtimeHub | null = null;

export function initializeRealtime(server: Server): RealtimeHub {
  if (!hub) {
    hub = new RealtimeHub(server);
  }
  return hub;
}

export function getRealtimeHub(): RealtimeHub {
  if (!hub) {
    throw new Error("Realtime hub has not been initialized");
  }
  return hub;
}
