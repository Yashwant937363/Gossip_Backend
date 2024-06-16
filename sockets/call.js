module.exports = (io, socket, UsersStore) => {
  const videoCallOutgoing = ({ fromuid, touid, offer }) => {
    socket.to(touid).emit("call:videocallincoming", { fromuid, offer });
  };
  const videoCallAnswer = ({ touid, answer }) => {
    socket.to(touid).emit("call:videocallanswer", { answer });
  };
  const videoCallCanceled = ({ touid }) => {
    socket.to(touid).emit("call:videocallcanceled");
  };

  const audioCallOutgoing = ({ fromuid, touid, offer }) => {
    socket.to(touid).emit("call:audiocallincoming", { fromuid, offer });
  };
  const audioCallAnswer = ({ touid, answer }) => {
    socket.to(touid).emit("call:audiocallanswer", { answer });
  };
  const audioCallCanceled = ({ touid }) => {
    socket.to(touid).emit("call:audiocallcanceled");
  };

  const negotiationNeeded = ({ to, offer }) => {
    socket.to(to).emit("call:peer-nego-needed", { offer });
  };
  const negotiationDone = ({ to, ans }) => {
    socket.to(to).emit("call:peer-nego-final", { ans, from: socket.id });
  };
  const sendTracks = ({ to }) => {
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
};
