const User = require('../schemas/user')
const { validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const multer = require('multer')
const fs = require('fs')
// const { nanoid } = require('nanoid');
// import { nanoid } from 'nanoid'
const sharp = require('sharp')

const JWT_SECRET = process.env.JWT_SECRET

const getUser = () => {

}

const signupUser = async (req, res) => {
    const { nanoid } = await import('nanoid');
    console.log(req.file)
    console.log(req.body.email)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(401).json({ errors: errors.array() })
    }

    try {
        const existingUser = await User.findOne({ Email: req.body.email })
        if (existingUser) {
            res.send(401).json({ error: 'Please Enter Unique Email Address' })
        }

        const inputimagepath = `./assets/profile/${req.file.filename}`
        const outputimagepath = `./assets/profile/${req.body.email}.jpg`
        sharp(inputimagepath)
            .resize({
                width: 400,
                height: 400,
                fit: 'cover',
                withoutEnlargement: true
            })
            .toFormat('jpeg', {
                quality: 100,
                progressive: true,
                chromaSubsampling: '4:2:0'
            })
            .toFile(outputimagepath, (err, info) => {
                if (err) {
                    console.log('Error while proccessing an image', err)
                }
                fs.unlink(inputimagepath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error('Error deleting input image:', unlinkErr);
                    }
                });
            })

        const salt = await bcrypt.genSalt()
        const password = await bcrypt.hash(req.body.password, salt)
        const dob = new Date(req.body.dob);

        const newUser = await User.create({
            ProfilePicture: `/assets/profile/${req.body.email}.jpg`,
            Username: req.body.username,
            FirstName: req.body.fullname.firstname,
            LastName: req.body.fullname.lastname,
            Email: req.body.email,
            DOB: dob,
            Password: password,
            uid: nanoid(5),
        })

        const data = {
            user: {
                id: newUser.id
            }
        }
        const authtoken = jwt.sign(data, JWT_SECRET)
        res.status(201).json({ authtoken })
        // res.setHeader('Content-Disposition', 'attachment; filename=' + `${req.body.email}`+'.jpg');
        // res.setHeader('Content-Type', 'application/octet-stream');
        // res.json({ authtoken });
        // const fileStream = fs.createReadStream(filePath);
        // fileStream.pipe(res);

        // fileStream.on('error', (err) => {
        //     console.error('Error streaming file:', err);
        //     res.status(500).send('Internal Server Error');
        // });
    }
    catch (error) {
        console.log("Server Error : " + error)
        res.status(500).json({ error: 'Internal Server Error' })
    }
}

const signinUser = () => {

}

const updateUser = () => {

}

const deleteUser = () => {

}

module.exports = { getUser, signinUser, signupUser, updateUser, deleteUser }