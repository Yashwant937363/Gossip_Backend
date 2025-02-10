const JWT_SECRET = process.env.JWT_SECRET;
const jwt = require("jsonwebtoken");
const User = require("./../schemas/user");

module.exports = (io, socket, UsersStore) => {
  const changeLanguage = ({ authtoken, language }) => {
    console.log("get request");
    try {
      const data = jwt.verify(authtoken, JWT_SECRET);
      const id = data.user.id;
      User.findByIdAndUpdate(id, {
        $set: {
          "settings.translation.language": language,
        },
      });
      console.log("language changed");
    } catch (error) {
      console.log("Error");
    }
  };
  socket.on("settings:translate:languageChange", changeLanguage);
};
