import type { Socket } from "socket.io";
import User from "../models/user.js";
import type { JWTPayload } from "../schema/auth-schema.js";
import { verifyToken } from "../services/jwt-service.js";
import type { SocketData } from "../types/socket-types.js";

export async function authSocket(
  socket: Socket<any, any, any, SocketData>,
  next: (err?: Error) => void,
) {
  try {
    console.log("Authenticating");
    console.log("Socket Data:", socket.data);
    console.log("Handshake :", socket.handshake);
    const authHeader =
      socket.handshake.auth?.token ||
      (socket.handshake.headers?.authorization as string | undefined);

    if (!authHeader) {
      return next(new Error("Authentication error: Missing token"));
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : authHeader.trim();
    console.log(token);
    if (!token) {
      return next(new Error("Authentication error: Missing token"));
    }

    const payload = verifyToken<JWTPayload>(token);
    console.log("Payload: ", payload);
    if (!payload) {
      return next(new Error("Authentication error: Invalid token payload"));
    }
    const user = await User.findById(payload);
    console.log("user: ", user);
    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }
    console.log(user);

    // Attach verified user information to socket.data
    socket.data.id = user._id.toString();
    socket.data.uid = user.uid;
    socket.data.user = user;

    next();
  } catch (error) {
    return next(new Error("Authentication error: Invalid or expired token"));
  }
}
