//api/auth/
const express = require('express')
const router = express.Router()
const authUser = require('../middlewares/authUser')
const { getUser, signinUser, signupUser, updateUser, deleteUser } = require('../controllers/auth')

router.post('/getuser', authUser, getUser)

router.post('/signup',signupUser)

router.post('/signin',signinUser)

router.put('/',updateUser)

router.delete('/',deleteUser)