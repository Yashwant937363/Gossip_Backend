module.exports = (io, socket, UsersStore) => {
    const createConnection = function ({ profile, uid, username }, acknowledgmentCallback) {
        try {
            UsersStore.saveUser(uid, {
                uid: uid,
                profile: profile,
                username: username,
                connected: true
            })
            socket.uid = uid
            socket.join(uid)
            acknowledgmentCallback({ success: true, msg: 'user connected succesfully' })
        }
        catch (err) {
            acknowledgmentCallback({ success: false, msg: 'something went wrong you are not online' })
        }
    }

    const findUser = function (uid, sendusers) {
        const Users = UsersStore.findUser(uid, socket.uid)
        sendusers(Users);
    }

    const sendRequestUser = async function (fromuid,touid, userfeedback) {
        if (fromuid.length === 5 && touid.length === 5) {
            const fromuser = UsersStore.getUser(fromuid)
            const touser = UsersStore.getUser(touid)
            
            if (fromuser.uid && touser.uid ) {
                socket.to(touser.uid).emit("requestformuser", { uid: fromuser.uid, profile: fromuser.profile, username: fromuser.username })
                userfeedback("Request Send")
            } else {
                userfeedback("user not found")
            }
            //write code for user might be offline
        } else {
            userfeedback('Please Give Complete Uid')
        }
    }

    const handleDisconnect = function () {
        if(socket.uid){
            UsersStore.userDisconnected(socket.uid)
        }
        console.log("Username Disconnected : ", socket.id)
    }

    socket.on('user:connection', createConnection)
    socket.on('user:finduser', findUser);
    socket.on("user:sendchatrequest", sendRequestUser)
    socket.on('disconnect', handleDisconnect)
}