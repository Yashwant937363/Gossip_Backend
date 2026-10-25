//api/auth/
import { Router } from "express";
import type { Request, Response } from "express";
import authUser from "../middlewares/authUser.js";
import upload from "../middlewares/upload.js";
import { validateBody } from "../middlewares/validateBody.js";
import { signinReqSchema, signupReqSchema } from "../schema/auth-schema.js";

import {
  getUser,
  signinUser,
  signupUser,
  sendEmailOtpController,
} from "../controllers/auth.js";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.send("hello from auth");
});

router.post("/getuser", authUser, getUser);

router.post(
  "/signup",
  upload.single("profile"),
  validateBody(signupReqSchema),
  signupUser,
);

router.post(
  "/signin",
  upload.none(),
  validateBody(signinReqSchema),
  signinUser,
);

router.post("/send-email-otp", sendEmailOtpController);

// router.get("/profile/:name", async (req, res) => {
//   const fileName = req.params.name;
//   const filePath = path.join(__dirname, `../assets/profile/${fileName}`);
//   console.log(filePath);
//   try {
//     let stats;
//     try {
//       stats = await fs.stat(filePath);
//     } catch (error) {
//       stats = null;
//     }

//     if (stats && stats.isFile()) {
//       const mimeType = path.extname(fileName).toLowerCase();
//       if (![".jpg", ".jpeg", ".png", ".gif"].includes(mimeType)) {
//         return res.status(400).json({ error: "Invalid image format" });
//       }

//       res.contentType(mimeType);
//       res.sendFile(filePath, (err) => {
//         if (err) {
//           console.error("Error sending local image:", err);
//           return res.status(500).json({ error: "Error serving image" });
//         }
//         console.log("Local image sent successfully");
//       });
//       return;
//     }
//     const email = fileName.slice(0, -4);
//     const user = await User.findOne({ Email: email });
//     if (!user || user.ProfilePicture == "") {
//       return res.status(404).json({ error: "Image not found" });
//     }
//     const remoteImageUrl = user.ProfilePicture;

//     const response = await https.get(remoteImageUrl, (remoteRes) => {
//       if (remoteRes.statusCode !== 200) {
//         return res.status(404).json({ error: "Remote image not found" });
//       }

//       const mimeType = remoteRes.headers["content-type"];
//       res.contentType(mimeType);
//       remoteRes.pipe(res);
//     });

//     response.on("error", (error) => {
//       console.error("Error fetching remote image:", error);
//       return res.status(500).json({ error: "Error serving image" });
//     });
//   } catch (error) {
//     console.error("Error processing image request:", error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// });

export default router;
