const User = require('../schemas/user')
const { validationResult } = require('express-validator')
const bcrypt = require('bcryptjs')

const getUser = () => {

}

const signupUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(401).json({ errors: errors.array() })
    }

    try {
        const existingUser = await User.findOne({Email : req.body.email})
        if(existingUser){
            res.send(401).json({error : 'Please Enter Unique Email Address'})
        }

        const salt = await bcrypt.genSalt()
        const password = await bcrypt.hash(req.body.password,salt)
        const 
        const newUser = await User.create({
            Username : 
        })
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