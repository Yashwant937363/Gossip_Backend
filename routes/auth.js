//api/auth/
const express = require('express')
const { body } = require('express-validator')
const router = express.Router()
const authUser = require('../middlewares/authUser')
const { getUser, signinUser, signupUser, updateUser, deleteUser } = require('../controllers/auth')

router.post('/getuser', authUser, getUser)

router.post('/signup', [
    body('username', 'username cannot be empty').exists(),
    body('email', 'Enter valid email').isEmail(),
    body('password', 'Password should be 8 characters long').isLength({ min: 8 })
], signupUser)

router.post('/signin', signinUser)

router.put('/', updateUser)

router.delete('/', deleteUser)