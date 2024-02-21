const { getFriendsandChats } = require("../controllers/chat")
const authUser = require("../middlewares/authUser")

const router = require("express").Router()

router.post('/getFriends', authUser, getFriendsandChats)

module.exports = router