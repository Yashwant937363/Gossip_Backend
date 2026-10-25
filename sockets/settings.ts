import User from "../models/user.js";
import type { UserStore } from "../store/sessionStore.js";
import type { TypedServer, TypedSocket } from "../types/socket-types.js";

export default function registerSettingsHandlers(
  _io: TypedServer,
  socket: TypedSocket,
  usersStore: UserStore,
): void {
  const changeLanguage = async ({
    language,
  }: {
    language: string;
    authtoken?: string;
  }) => {
    try {
      const id = socket.data.id;
      const uid = socket.data.uid;

      const updatedUser = await User.findByIdAndUpdate(
        id,
        { $set: { "settings.translation.language": language } },
        { new: true },
      );

      if (updatedUser) {
        usersStore.updateTranslationSettings(
          uid,
          updatedUser.settings.translation,
        );
      }
    } catch (error) {
      console.error("Error in settings:translate:languageChange:", error);
    }
  };

  const changeAlwaysTranslate = async ({
    alwaysTranslate,
  }: {
    alwaysTranslate: boolean;
    authtoken?: string;
  }) => {
    try {
      const id = socket.data.id;
      const uid = socket.data.uid;

      const updatedUser = await User.findByIdAndUpdate(
        id,
        { $set: { "settings.translation.alwaysTranslate": alwaysTranslate } },
        { new: true },
      );

      if (updatedUser) {
        usersStore.updateTranslationSettings(
          uid,
          updatedUser.settings.translation,
        );
      }
    } catch (error) {
      console.error("Error in settings:translate:alwaysTranslateChange:", error);
    }
  };

  const changeSummarizationFormat = async ({
    format,
  }: {
    format: "paragraph" | "bullet_points";
    authtoken?: string;
  }) => {
    try {
      const id = socket.data.id;
      const uid = socket.data.uid;

      const updatedUser = await User.findByIdAndUpdate(
        id,
        { $set: { "settings.summarization.format": format } },
        { new: true },
      );

      if (updatedUser) {
        usersStore.updateSummarizationSettings(
          uid,
          updatedUser.settings.summarization as any,
        );
      }
    } catch (error) {
      console.error("Error in settings:summarization:formatChange:", error);
    }
  };

  socket.on("settings:translate:languageChange", changeLanguage);
  socket.on("settings:translate:alwaysTranslateChange", changeAlwaysTranslate);
  socket.on("settings:summarization:formatChange", changeSummarizationFormat);
}
