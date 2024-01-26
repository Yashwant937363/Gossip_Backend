const express = require('express')
const connectDatabase = require('./database')
const cors = require('cors')
require('dotenv').config()

const PORT = process.env.PORT || 5000;

const conStr = process.env.DATABASE;
connectDatabase(conStr)
const app = express()
const registerUserHandlers = require('./sockets/user')
const server = require('http').createServer(app);
const { Server } = require("socket.io");
const { ServerUserStore } = require('./store/sessionStore');
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
    },
});

const UsersStore = new ServerUserStore()

const onConnection = (socket) => {
    console.log('a user connected', socket.id);
    registerUserHandlers(io, socket, UsersStore)
}

io.on('connection', onConnection);

app.use(express.json())
app.use(cors({
    origin: 'http://localhost:5173',
}))

app.get('/', (req, res) => {
    res.send('hello world')
})

app.use('/api/auth/', require('./routes/auth'))

server.listen(PORT, () => console.log("Server running on PORT : " + PORT))