import type { TypedServer, TypedSocket } from "../types/socket-types.js";

export default function registerCallHandlers(
  _io: TypedServer,
  socket: TypedSocket,
): void {
  const videoCallOutgoing = ({
    touid,
    offer,
  }: {
    fromuid?: string;
    touid: string;
    offer: any;
  }) => {
    socket
      .to(touid)
      .emit("call:videocallincoming", { fromuid: socket.data.uid, offer });
  };

  const videoCallAnswer = ({
    touid,
    answer,
  }: {
    touid: string;
    answer: any;
  }) => {
    socket.to(touid).emit("call:videocallanswer", { answer });
  };

  const videoCallCanceled = ({ touid }: { touid: string }) => {
    socket.to(touid).emit("call:videocallcanceled");
  };

  const audioCallOutgoing = ({
    touid,
    offer,
  }: {
    fromuid?: string;
    touid: string;
    offer: any;
  }) => {
    socket
      .to(touid)
      .emit("call:audiocallincoming", { fromuid: socket.data.uid, offer });
  };

  const audioCallAnswer = ({
    touid,
    answer,
  }: {
    touid: string;
    answer: any;
  }) => {
    socket.to(touid).emit("call:audiocallanswer", { answer });
  };

  const audioCallCanceled = ({ touid }: { touid: string }) => {
    socket.to(touid).emit("call:audiocallcanceled");
  };

  const negotiationNeeded = ({ to, offer }: { to: string; offer: any }) => {
    socket.to(to).emit("call:peer-nego-needed", { offer });
  };

  const negotiationDone = ({ to, ans }: { to: string; ans: any }) => {
    socket.to(to).emit("call:peer-nego-final", { ans, from: socket.id });
  };

  const sendTracks = ({ to }: { to: string }) => {
    socket.to(to).emit("call:requesttracks");
  };

  socket.on("call:videocalloutgoing", videoCallOutgoing);
  socket.on("call:videocallanswer", videoCallAnswer);
  socket.on("call:videocallcanceled", videoCallCanceled);

  socket.on("call:audiocalloutgoing", audioCallOutgoing);
  socket.on("call:audiocallanswer", audioCallAnswer);
  socket.on("call:audiocallcanceled", audioCallCanceled);

  socket.on("call:peer-nego-needed", negotiationNeeded);
  socket.on("call:peer-nego-done", negotiationDone);
  socket.on("call:sendtracks", sendTracks);
}
