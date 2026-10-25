import type { Server, Socket } from "socket.io";
import type { UserSearchResult } from "../store/sessionStore.js";

export interface SocketData {
  id: string; // Mongo user ObjectId string
  uid: string; // User 5-char unique ID
  user: any; // User document or session
}

export interface SendMessagePayload {
  fromuid?: string;
  touid: string;
  message: string;
  type: "text" | "image";
}

export interface SeenMessagesPayload {
  fromuid: string;
  touid: string;
}

export interface ServerToClientEvents {
  // Chat events
  "chat:receivemessage": (chat: any) => void;
  seenmessages: (data: { uid: string }) => void;

  // Presence events
  friendonline: (data: { uid: string }) => void;
  friendoffline: (data: { uid: string }) => void;

  // Friend request events
  requestfromuser: (data: {
    uid: string;
    profile: string;
    username: string;
  }) => void;
  successmessage: (data: { msg: string; user?: any }) => void;
  errormessage: (msg: string) => void;

  // WebRTC Call events
  "call:videocallincoming": (data: { fromuid: string; offer: any }) => void;
  "call:videocallanswer": (data: { answer: any }) => void;
  "call:videocallcanceled": () => void;
  "call:audiocallincoming": (data: { fromuid: string; offer: any }) => void;
  "call:audiocallanswer": (data: { answer: any }) => void;
  "call:audiocallcanceled": () => void;
  "call:peer-nego-needed": (data: { offer: any }) => void;
  "call:peer-nego-final": (data: { ans: any; from: string }) => void;
  "call:requesttracks": () => void;
}

export interface ClientToServerEvents {
  // Chat events
  "chat:sendmessage": (
    payload: SendMessagePayload,
    ack: (result: any) => void,
  ) => void;
  "chat:seenmessages": (payload: SeenMessagesPayload) => void;

  // Friend & User events
  "user:finduser": (
    uid: string,
    callback: (users: UserSearchResult[]) => void,
  ) => void;
  "user:sendchatrequest": (
    fromuid: string,
    touid: string,
    feedback: (msg: string) => void,
  ) => void;
  "user:requestanswer": (
    payload: {
      tousername: string;
      fromuid: string;
      touid: string;
      answer: boolean;
    },
    feedback: (msg: string) => void,
  ) => void;

  // WebRTC Call events
  "call:videocalloutgoing": (data: {
    fromuid: string;
    touid: string;
    offer: any;
  }) => void;
  "call:videocallanswer": (data: { touid: string; answer: any }) => void;
  "call:videocallcanceled": (data: { touid: string }) => void;
  "call:audiocalloutgoing": (data: {
    fromuid: string;
    touid: string;
    offer: any;
  }) => void;
  "call:audiocallanswer": (data: { touid: string; answer: any }) => void;
  "call:audiocallcanceled": (data: { touid: string }) => void;
  "call:peer-nego-needed": (data: { to: string; offer: any }) => void;
  "call:peer-nego-done": (data: { to: string; ans: any }) => void;
  "call:sendtracks": (data: { to: string }) => void;

  // Settings events
  "settings:translate:languageChange": (data: {
    language: string;
    authtoken?: string;
  }) => void;
  "settings:translate:alwaysTranslateChange": (data: {
    alwaysTranslate: boolean;
    authtoken?: string;
  }) => void;
  "settings:summarization:formatChange": (data: {
    format: "paragraph" | "bullet_points";
    authtoken?: string;
  }) => void;
}

export interface InterServerEvents {}

export type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
