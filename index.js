const express = require('express')
const connectDatabase = require('./database')
const cors = require('cors')
require('dotenv').config()

const PORT = process.env.PORT || 5000;

const conStr = process.env.DATABASE;
connectDatabase(conStr)
const app = express()

const server = require('http').createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
    },
});

io.on('connection', (socket) => {
    console.log('a user connected', socket.id);
    socket.on('userconnection', ({ profile, uid, username }, acknowledgmentCallback) => {
        try {
            socket.profile = profile
            socket.username = username
            socket.uid = uid
            acknowledgmentCallback({ success: true, msg: 'user connected succesfully' })
        }
        catch (err) {
            acknowledgmentCallback({ success: false, msg: 'something went wrong you are not online' })
        }
    })

    socket.on('finduser', (uid, sendusers) => {
        const sockets = io.sockets.sockets;
        const regex = new RegExp(`^${uid}`, 'i');
        const results = Array.from(sockets.values()).filter((soc) => {
            return regex.test(soc.uid);
        });

        const Users = results.map((socket) => ({
            uid: socket.uid,
            profile: socket.profile,
            username: socket.username,
        }));
        sendusers(Users);
    });

    socket.on("sendchatrequest", async (uid, userfeedback) => {
        if(uid.length === 5){
            const sockets = io.sockets.sockets;
            const regex = new RegExp(`^${uid}`, 'i');
            const results = Array.from(sockets.values()).filter((soc) => {
                return regex.test(soc.uid);
            });

            const to = results[0].id
            socket.to(to).emit("requestformuser",socket.uid,socket.profile,socket.username)
            userfeedback("Request Send")
            //write code for user might be offline
        }else{
            userfeedback('Please Give Complete Uid')
        }
    })




    socket.on('disconnect', (socket) => {
        socket.uid = ''
        console.log("Username Disconnected : ", socket.id)
    })
});

app.use(express.json())
app.use(cors({
    origin: 'http://localhost:5173',
}))

app.get('/', (req, res) => {
    res.send('hello world')
})

app.use('/api/auth/', require('./routes/auth'))

server.listen(PORT, () => console.log("Server running on PORT : " + PORT))