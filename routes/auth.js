//api/auth/
const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const authUser = require("../middlewares/authUser");
const {
  getUser,
  signinUser,
  signupUser,
  updateUser,
  deleteUser,
} = require("../controllers/auth");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const User = require("../schemas/user");
const https = require("https");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "assets/profile/");
  },
  filename: (req, file, cb) => {
    cb(null, "tmp" + file.originalname);
    console.log("Request Body : ");
  },
});
const upload = multer({ storage: storage });
router.get("/", (req, res) => {
  res.send("hello from auth");
});

router.post("/getuser", authUser, getUser);

router.post(
  "/signup",
  upload.single("profile"),
  [
    body("username", "username cannot be empty").exists(),
    body("email", "Enter valid email").isEmail(),
    body("password", "Password should be 8 characters long").isLength({
      min: 8,
    }),
  ],
  signupUser
);

router.post(
  "/signin",
  upload.none(),
  [
    body("email", "Enter valid email").isEmail(),
    body("password", "Password should be 8 characters long").isLength({
      min: 8,
    }),
  ],
  signinUser
);

router.get("/profile/:name", async (req, res) => {
  const fileName = req.params.name;
  const filePath = path.join(__dirname, `../assets/profile/${fileName}`);
  console.log(filePath);
  try {
    let stats;
    try {
      stats = await fs.stat(filePath);
    } catch (error) {
      stats = null;
    }

    if (stats && stats.isFile()) {
      const mimeType = path.extname(fileName).toLowerCase();
      if (![".jpg", ".jpeg", ".png", ".gif"].includes(mimeType)) {
        return res.status(400).json({ error: "Invalid image format" });
      }

      res.contentType(mimeType);
      res.sendFile(filePath, (err) => {
        if (err) {
          console.error("Error sending local image:", err);
          return res.status(500).json({ error: "Error serving image" });
        }
        console.log("Local image sent successfully");
      });
      return;
    }
    const email = fileName.slice(0, -4);
    const user = await User.findOne({ Email: email });
    if (!user || user.ProfilePicture == "") {
      return res.status(404).json({ error: "Image not found" });
    }
    const remoteImageUrl = user.ProfilePicture;

    const response = await https.get(remoteImageUrl, (remoteRes) => {
      if (remoteRes.statusCode !== 200) {
        return res.status(404).json({ error: "Remote image not found" });
      }

      const mimeType = remoteRes.headers["content-type"];
      res.contentType(mimeType);
      remoteRes.pipe(res);
    });

    response.on("error", (error) => {
      console.error("Error fetching remote image:", error);
      return res.status(500).json({ error: "Error serving image" });
    });
  } catch (error) {
    console.error("Error processing image request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/", updateUser);

router.delete("/", deleteUser);

module.exports = router;
