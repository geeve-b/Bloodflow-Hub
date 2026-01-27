import { WebSocketServer, WebSocket } from "ws";
import type { RawData } from "ws";
import type { Server } from "http";
import type { BloodRequest } from "@shared/schema";

interface ClientMetadata {
  socket: WebSocket;
  userId?: string;
  role?: string;
  lastPong: number;
}

export type BloodRequestEvent =
  | { type: "blood-request:created"; payload: BloodRequest }
  | { type: "blood-request:updated"; payload: BloodRequest }
  | { type: "blood-request:deleted"; payload: { id: string } };

export type ConnectionEvent =
  | { type: "connection:ack" }
  | { type: "connection:heartbeat" };

type OutgoingEvent = BloodRequestEvent | ConnectionEvent;

type IncomingClientMessage =
  | { type: "hello"; userId?: string; role?: string }
  | { type: "ping" };

const HEARTBEAT_INTERVAL_MS = 30_000;
const CLIENT_TIMEOUT_MS = 90_000;

class RealtimeHub {
  private readonly wss: WebSocketServer;
  private readonly clients = new Map<WebSocket, ClientMetadata>();
  private readonly heartbeatTimer: NodeJS.Timeout;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: "/ws" });
    this.wss.on("connection", (socket) => this.handleConnection(socket));

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
    this.broadcast(event, (meta) => {
      if (!meta.role) {
        return true;
      }
      if (meta.role === "admin" || meta.role === "hospital") {
        return true;
      }
      if (meta.role === "donor") {
        return true;
      }
      if (meta.role === "receiver") {
        return true;
      }
      return true;
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

  private handleConnection(socket: WebSocket) {
    const metadata: ClientMetadata = {
      socket,
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
        metadata.userId = parsed.userId;
        metadata.role = parsed.role;
        console.log(`(ws) client identified as ${parsed.role ?? "unknown"}`);
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
