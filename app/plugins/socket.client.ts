// app/plugins/socket.client.ts
import { io, type Socket } from "socket.io-client";

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  const url = config.public.chatServerUrl;               // ex: https://api.tools.gavago.fr
  const path = config.public.chatSocketPath || "/socket.io";

  if (!url) {
    console.warn("[socket] NUXT_PUBLIC_CHAT_SERVER is empty. Socket will fail to connect.");
  }

  const socket: Socket = io(url, {
    path,
    transports: ["websocket", "polling"], // websocket d'abord, fallback polling
    autoConnect: false,
    timeout: 20000,
    // withCredentials: true, // décommente si ton backend utilise cookies
  });

  socket.on("connect", () => console.log("[socket] connected id=", socket.id));
  socket.on("connect_error", (err: any) =>
    console.warn("[socket] connect_error:", err?.message, err)
  );

  return { provide: { socket } };
});
