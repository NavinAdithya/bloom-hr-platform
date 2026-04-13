"use client";

import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "./api";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (typeof window === "undefined") {
    throw new Error("getSocket() must be called in a browser context only.");
  }
  if (socket) return socket;

  socket = io(API_BASE_URL, {
    withCredentials: true,
    transports: ["websocket", "polling"], // fallback to polling if websocket blocked
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  return socket;
}

