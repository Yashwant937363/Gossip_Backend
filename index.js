const express = require('express')
const connectDatabase = require('./database')
const cors = require('cors')
require('dotenv').config()

const PORT = 5000 || process.ene.PORT
const conStr = process.env.DATABASE;
connectDatabase(conStr)
const app = express()

const server = require('http').createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('userconnection', (profile, uid, username) => {
        socket.profile = profile
        socket.username = username
        socket.uid = uid
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