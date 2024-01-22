//api/auth/
const express = require('express')
const { body } = require('express-validator')
const router = express.Router()
const authUser = require('../middlewares/authUser')
const { getUser, signinUser, signupUser, updateUser, deleteUser } = require('../controllers/auth')
const multer = require('multer')
const fs = require('fs')
const path = require('path')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'assets/profile/')
    },
    filename: (req, file, cb) => {
        cb(null, "tmp" + file.originalname)
    }
})
const upload = multer({ storage: storage })
router.get('/', (req, res) => {
    res.send("hello from auth")

})

router.post('/getuser', authUser, getUser)

router.post('/signup', upload.single('profile'), [
    body('username', 'username cannot be empty').exists(),
    body('email', 'Enter valid email').isEmail(),
    body('password', 'Password should be 8 characters long').isLength({ min: 8 })
], signupUser)

router.post('/signin', upload.none(), [
    body('email', 'Enter valid email').isEmail(),
    body('password', 'Password should be 8 characters long').isLength({ min: 8 })
], signinUser)

router.get('/profile/:name', (req, res) => {
    const fileName = req.params.name; // Assuming the name parameter is used in the file name
    const filePath = path.join(__dirname, `../assets/profile/${fileName}`);

    res.status(200).sendFile(filePath, (error) => {
        if (error) {
            console.error(`Error sending file: ${error.message}`);
            res.status(404).send("File not found");
        }
    });
});

router.put('/', updateUser)

router.delete('/', deleteUser)

module.exports = router;