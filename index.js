const express = require('express')
const connectDatabase = require('./database')
const cors = require('cors')
require('dotenv').config()

const PORT = 5000 || process.ene.PORT
const conStr = process.env.DATABASE;
connectDatabase(conStr)
const app = express()
app.use(express.json())
app.use(cors({
    origin: 'http://localhost:5173',
}))

app.get('/', (req, res) => {
    res.send('hello world')
})

app.use('/api/auth/', require('./routes/auth'))

app.listen(PORT, () => console.log("Server running on PORT : " + PORT))