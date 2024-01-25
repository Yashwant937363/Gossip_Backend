const User = require('../schemas/user')
const { validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const multer = require('multer')
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const JWT_SECRET = process.env.JWT_SECRET

const getUser = () => {

}

const signupUser = async (req, res) => {
    const { nanoid } = await import('nanoid');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(401).json({ errors: errors.array() })
    }

    try {
        const existingUser = await User.findOne({ Email: req.body.email })
        if (existingUser) {
            return res.status(401).json({ error: 'Please Enter Unique Email Address' })

        }
        if (req.file) {
            const inputimagepath = `./assets/profile/${req.file.filename}`
            const outputimagepath = `./assets/profile/${req.body.email}.jpg`
            try {
                await sharp(inputimagepath)
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
                    })
            } catch (sharperror) {
                console.log("Error while processing image : ", sharperror)
                return res.status(500).json({ error: 'Image Processing Error' })
            }
        }

        const salt = await bcrypt.genSalt()
        const password = await bcrypt.hash(req.body.password, salt)
        const dob = new Date(req.body.dob);
        const fullname = JSON.parse(req.body.fullname)
        const newUser = await User.create({
            ProfilePicture: req.file ? `/assets/profile/${req.body.email}.jpg` : '',
            Username: req.body.username,
            FirstName: fullname.firstname,
            LastName: fullname.lastname,
            Email: req.body.email,
            DOB: dob,
            Password: password,
            uid: nanoid(5),
        });


        const data = {
            user: {
                id: newUser.id
            }
        }
        const authtoken = jwt.sign(data, JWT_SECRET)
        res.status(201).json({ authtoken })
    }
    catch (error) {
        console.log("Server Error : " + error)
        res.status(500).json({ error: 'Internal Server Error' })
    }
}

const signinUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('entered');
        return res.status(401).json({ errors: errors.array() });
    }

    try {
        const user = await User.findOne({ Email: req.body.email });

        if (!user) {
            return res.status(401).json({ error: "Login with correct Credentials" });
        }

        const passwordCompare = await bcrypt.compare(req.body.password, user.Password);

        if (!passwordCompare) {
            return res.status(401).json({ error: "Login with correct Credentials" });
        }

        const data = {
            user: {
                id: user.id
            }
        };

        const authtoken = jwt.sign(data, JWT_SECRET);

        // Check and send the file if it exists
        const filePath = `/api/auth/profile/${user.Email}.jpg`;
        res.status(200).json({
            authtoken,
            'msg': "Login Successful",
            profile : user.ProfilePicture !== ''? filePath : '',
            username: user.Username,
            fullname: { firstname: user.FirstName, lastname: user.LastName },
            uid: user.uid,
            dob: user.DOB,
        });

    } catch (err) {
        console.log("Error while Login User : ", err);
        res.status(500).json({ error: 'Server Crashed' });
    }
};


const updateUser = () => {

}

const deleteUser = () => {

}

module.exports = { getUser, signinUser, signupUser, updateUser, deleteUser }