import { Router } from "express";
import { getFriendsandChats, uploadChatImage } from "../controllers/chat.js";
import authUser from "../middlewares/authUser.js";
import upload from "../middlewares/upload.js";

const router = Router();

router.post("/getFriends", authUser, getFriendsandChats);
router.post("/upload", authUser, upload.single("image"), uploadChatImage);

export default router;
