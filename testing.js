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
require("dotenv").config();

const firebaseConfig = {
  apiKey: process.env.apiKey,
  authDomain: process.env.authDomain,
  projectId: process.env.projectId,
  storageBucket: process.env.storageBucket,
  messagingSenderId: process.env.messagingSenderId,
  appId: process.env.appId,
  measurementId: process.env.measurementId,
};

console.log(firebaseConfig);

initializeApp(firebaseConfig);

const storage = getStorage();
const metadata = {
  contentType: "image/jpeg",
};

const storageRef = ref(storage, `profilePicture/chieftain@gmail.com.jpeg`);
const file = fs.readFileSync("./assets/profile/chieftain@gmail.com.jpeg");

const savefunction = async () => {
  const session = await uploadBytes(storageRef, file, metadata);
  const downloadlink = await getDownloadURL(session.ref);
  console.log(downloadlink);
};

savefunction();
