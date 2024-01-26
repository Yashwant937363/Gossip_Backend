const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const authUser = (req, res , next) => {
    const token = req.header('authtoken')
    if(!token) {
        res.status(401).send({msg:"give correct auth token"})
    }
    try{
        const data = jwt.verify(token,JWT_SECRET)
        req.user = data.user;
        next();
    }catch (error){
        res.status(401).send({msg:"give correct Auth token"})
    }
}

module.exports = authUser;