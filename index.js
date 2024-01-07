const express = require('express')
const connectDatabase = require('./database')
require('dotenv').config()

const conStr = process.env.DATABASE;
connectDatabase(conStr)