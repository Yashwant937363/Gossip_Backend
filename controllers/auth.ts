import type { Request, Response } from "express";
import User from "../models/user.js";
import { nanoid } from "nanoid";
import sharp from "sharp";
import {
  GetUserResponse,
  JWTPayload,
  SigninReq,
  SignupReq,
} from "../schema/auth-schema.js";
import { uploadImage } from "../services/cloudinary-service.js";
import { compareHash, getHash } from "../services/bcrypt-service.js";
import { generateToken } from "../services/jwt-service.js";
import { generateEmailOtp, sendEmailOtp } from "../services/email-service.js";

export const getUser = async (
  req: Request,
  res: Response<GetUserResponse | { error: string }, JWTPayload>,
) => {
  const user = await User.findById(res.locals.id);
  if (user) {
    return res.status(200).json({
      msg: "Sussessfully Login",
      user: {
        profile: user.ProfilePicture,
        username: user.Username,
        firstname: user.FirstName,
        lastname: user.LastName,
        email: user.Email,
        uid: user.uid,
        settings: user.settings,
      },
    });
  }
  return res.status(404).json({ error: "Automatic Login Failed" });
};

export const signupUser = async (
  req: Request<{}, {}, SignupReq>,
  res: Response,
) => {
  let url;
  try {
    const existingUser = await User.findOne({ Email: req.body.email });
    if (existingUser) {
      return res
        .status(401)
        .json({ error: "Please Enter Unique Email Address" });
    }
    if (req.file) {
      const inputimagepath = `./assets/profile/${req.file.filename}`;
      const outputimagepath = `./assets/profile/${req.body.email}.png`;
      try {
        const imageProccesing = () => {
          return new Promise((resolve, reject) => {
            sharp(inputimagepath)
              .resize({
                width: 400,
                height: 400,
                fit: "cover",
                withoutEnlargement: true,
              })
              .toFormat("png", {
                quality: 100,
                progressive: true,
                chromaSubsampling: "4:2:0",
              })
              .toFile(outputimagepath, async (err, info) => {
                if (err) {
                  console.log("Error while proccessing an image", err);
                  return res.json({ msg: "Something went wrong" });
                }
                resolve(await uploadImage(outputimagepath));
              });
          });
        };
        url = await imageProccesing();
      } catch (sharperror) {
        console.log("Error while processing image Sharp Error :", sharperror);
        return res.status(500).json({ error: "Image Processing Error" });
      }
    }

    const password = await getHash(req.body.password);

    const newUser = await User.create({
      ProfilePicture: req.file ? url : "",
      Username: req.body.username,
      FirstName: req.body.fullname.firstname,
      LastName: req.body.fullname.lastname,
      Email: req.body.email,
      Password: password,
      uid: nanoid(5),
    });
    const authtoken = generateToken<JWTPayload>(newUser.id);
    res.status(201).json({ authtoken: authtoken, uid: newUser.uid });
  } catch (error) {
    console.log("Server Error : " + error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const signinUser = async (
  req: Request<{}, {}, SigninReq>,
  res: Response,
) => {
  try {
    const user = await User.findOne({ Email: req.body.email });

    if (!user) {
      return res.status(401).json({ error: "Login with correct Credentials" });
    }

    const passwordCompare = await compareHash(req.body.password, user.Password);
    if (!passwordCompare) {
      return res.status(401).json({ error: "Login with correct Credentials" });
    }

    const authtoken = generateToken<JWTPayload>(user.id);
    // Check and send the file if it exists
    res.status(200).json({
      authtoken,
      msg: "Login Successful",
      profile: user.ProfilePicture,
      username: user.Username,
      fullname: { firstname: user.FirstName, lastname: user.LastName },
      uid: user.uid,
      settings: user.settings,
    });
  } catch (err) {
    console.log("Error while Login User : ", err);
    res.status(500).json({ error: "Server Crashed" });
  }
};

export const sendEmailOtpController = async (req: Request, res: Response) => {
  try {
    const otp = generateEmailOtp();

    await sendEmailOtp(req.body.email, otp);

    return res.status(200).json({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Failed to send email:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send email",
    });
  }
};
