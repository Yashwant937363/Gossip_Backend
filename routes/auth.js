//api/auth/
const express = require('express')
const { body } = require('express-validator')
const router = express.Router()
const authUser = require('../middlewares/authUser')
const { getUser, signinUser, signupUser, updateUser, deleteUser } = require('../controllers/auth')
const multer = require('multer')
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'assets/profile/')
    },
    filename: (req, file, cb) => {
        cb(null,"tmp"+ file.originalname)
    }
})
const upload = multer({ storage: storage })
router.get('/',(req,res) => {
    res.send("hello from auth")

})

router.post('/getuser', authUser, getUser)

router.post('/signup',upload.single('profile') , [
    body('username', 'username cannot be empty').exists(),
    body('email', 'Enter valid email').isEmail(),
    body('password', 'Password should be 8 characters long').isLength({ min: 8 })
], signupUser)

router.post('/signin', signinUser)

router.put('/', updateUser)

router.delete('/', deleteUser)

module.exports = router;