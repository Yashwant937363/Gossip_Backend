const User = require("../schemas/user");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { initializeApp } = require("firebase/app");
const nodemailer = require("nodemailer");
const {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} = require("firebase/storage");

const firebaseConfig = {
  apiKey: process.env.apiKey,
  authDomain: process.env.authDomain,
  projectId: process.env.projectId,
  storageBucket: process.env.storageBucket,
  messagingSenderId: process.env.messagingSenderId,
  appId: process.env.appId,
  measurementId: process.env.measurementId,
};

initializeApp(firebaseConfig);
const storage = getStorage();
const metadata = {
  contentType: "image/png",
};

const JWT_SECRET = process.env.JWT_SECRET;

const getUser = async (req, res) => {
  const user = await User.findById(req.user.id);
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
        dob: user.DOB,
        settings: user.settings,
      },
    });
  }
  res.status(404).json({ error: "Automatic Login Failed" });
};

const signupUser = async (req, res) => {
  const { nanoid } = await import("nanoid");
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(401).json({ errors: errors.array() });
  }
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
        let downloadurl;
        const storageRef = ref(storage, `profilePicture/${req.body.email}.png`);
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
                const data = fs.readFileSync(outputimagepath);
                const snapshot = await uploadBytes(storageRef, data, metadata);
                downloadurl = await getDownloadURL(snapshot.ref);
                resolve(downloadurl);
              });
          });
        };
        url = await imageProccesing();
      } catch (sharperror) {
        console.log("Error while processing image Sharp Error :", sharperror);
        return res.status(500).json({ error: "Image Processing Error" });
      }
    }

    const salt = await bcrypt.genSalt();
    const password = await bcrypt.hash(req.body.password, salt);
    const dob = new Date(req.body.dob);
    const fullname = JSON.parse(req.body.fullname);

    const newUser = await User.create({
      ProfilePicture: req.file ? url : "",
      Username: req.body.username,
      FirstName: fullname.firstname,
      LastName: fullname.lastname,
      Email: req.body.email,
      DOB: dob,
      Password: password,
      uid: nanoid(5),
      settings: {
        translation: {
          language: "original",
          alwaysTranslate: false,
        },
        summarization: {
          format: "paragraph",
        },
      },
    });

    const data = {
      user: {
        id: newUser.id,
      },
    };
    const authtoken = jwt.sign(data, JWT_SECRET);
    res.status(201).json({ authtoken: authtoken, uid: newUser.uid });
  } catch (error) {
    console.log("Server Error : " + error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const signinUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("entered");
    return res.status(401).json({ errors: errors.array() });
  }

  try {
    const user = await User.findOne({ Email: req.body.email });

    if (!user) {
      return res.status(401).json({ error: "Login with correct Credentials" });
    }

    const passwordCompare = await bcrypt.compare(
      req.body.password,
      user.Password
    );

    if (!passwordCompare) {
      return res.status(401).json({ error: "Login with correct Credentials" });
    }

    const data = {
      user: {
        id: user.id,
      },
    };

    const authtoken = jwt.sign(data, JWT_SECRET);
    // Check and send the file if it exists
    res.status(200).json({
      authtoken,
      msg: "Login Successful",
      profile: user.ProfilePicture,
      username: user.Username,
      fullname: { firstname: user.FirstName, lastname: user.LastName },
      uid: user.uid,
      dob: user.DOB,
      settings: user.settings,
    });
  } catch (err) {
    console.log("Error while Login User : ", err);
    res.status(500).json({ error: "Server Crashed" });
  }
};

const email = process.env.Email;
const password = process.env.AppPassword;

const sendEmailOtp = (req, res) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  let transporter = nodemailer.createTransport({
    service: "gmail", // e.g., 'gmail', 'yahoo', 'outlook'
    auth: {
      user: email, // Your email
      pass: password,
    },
  });

  // Step 2: Define the email options
  let mailOptions = {
    from: email, // Sender address
    to: req.body.email, // Recipient's email
    subject: "Your One-Time Password (OTP) for Verification", // Subject line
    text: `Dear User,\n\nYour One-Time Password (OTP) for verification is: ${otp}\n\nPlease use this OTP to complete your verification. Do not share it with anyone.\n\nBest regards,\nGossip AI`, // Plain text body
    html: `
        <p>Dear User,</p>
        <p>Your One-Time Password (OTP) for verification is: <strong>${otp}</strong></p>
        <p>Please use this OTP to complete your verification. Do not share it with anyone.</p>
        <p>
            <button onclick="navigator.clipboard.writeText('${otp}')" style="background:#4CAF50;color:white;padding:10px 15px;border:none;border-radius:5px;cursor:pointer;">
                Copy OTP
            </button>
        </p>
        <p>Best regards,<br>Gossip AI</p>
    `, // HTML body with Copy OTP button
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error occurred:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to send email",
        error: error.message,
      });
    }
    console.log("Email sent:", info);
    res
      .status(200)
      .json({ success: true, message: "Email sent successfully", otp });
  });
};

const updateUser = () => {};

const deleteUser = () => {};

module.exports = {
  getUser,
  signinUser,
  signupUser,
  updateUser,
  deleteUser,
  sendEmailOtp,
};
