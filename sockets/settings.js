const JWT_SECRET = process.env.JWT_SECRET;
const jwt = require("jsonwebtoken");
const User = require("./../schemas/user");

module.exports = (io, socket, UsersStore) => {
  const changeLanguage = async ({ authtoken, language }) => {
    try {
      const data = jwt.verify(authtoken, JWT_SECRET);
      const id = data.user.id;
      const updatedUser = await User.findByIdAndUpdate(
        id,
        { $set: { "settings.translation.language": language } },
        { new: true }
      );

      UsersStore.updateTranslationSettings(
        updatedUser.uid,
        updatedUser.settings.translation
      );
    } catch (error) {
      console.log("Error", error);
    }
  };
  const changeAlWaysTranslate = async ({ authtoken, alwaysTranslate }) => {
    try {
      const data = jwt.verify(authtoken, JWT_SECRET);
      const id = data.user.id;
      const updatedUser = await User.findByIdAndUpdate(
        id,
        { $set: { "settings.translation.alwaysTranslate": alwaysTranslate } },
        { new: true }
      );

      UsersStore.updateTranslationSettings(
        updatedUser.uid,
        updatedUser.settings.translation
      );
    } catch (error) {
      console.log("Error", error);
    }
  };
  socket.on("settings:translate:languageChange", changeLanguage);
  socket.on("settings:translate:alwaysTranslateChange", changeAlWaysTranslate);
};
