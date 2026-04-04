"use client";

import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "./api";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;

  socket = io(API_BASE_URL, {
    withCredentials: true,
    transports: ["websocket"],
  });

  return socket;
}

