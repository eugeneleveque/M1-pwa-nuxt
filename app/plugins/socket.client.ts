// app/plugins/socket.client.ts
import { io, type Socket } from "socket.io-client";

export default defineNuxtPlugin(() => {
  const socket: Socket = io({
    path: "/socket.io",
    transports: ["polling"],
    // transports: ["polling", "websocket"],
    autoConnect: false,
    timeout: 20000,
  });

  socket.on("connect", () => console.log("[socket] connected id=", socket.id));
  socket.on("connect_error", (err: any) => console.warn("[socket] connect_error:", err?.message, err));

  return { provide: { socket } };
});
