const User = require("../schemas/user");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { initializeApp } = require("firebase/app");
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
          format: "Paragraph",
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

const updateUser = () => {};

const deleteUser = () => {};

module.exports = { getUser, signinUser, signupUser, updateUser, deleteUser };
