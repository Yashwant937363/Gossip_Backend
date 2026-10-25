export interface TranslationSettings {
  language: string;
  alwaysTranslate: boolean;
}

export interface SummarizationSettings {
  format: "paragraph" | "bullet_points";
}

export interface UserSettings {
  translation: TranslationSettings;
  summarization: SummarizationSettings;
}

export interface UserSession {
  uid: string;
  profile: string;
  username: string;
  settings: UserSettings;
  [key: string]: unknown;
}

export interface UserSearchResult {
  uid: string;
  profile: string;
  username: string;
}

// Abstract class
export abstract class UserStore {
  abstract getUser(uid: string): UserSession | undefined;

  abstract findUser(uid: string, socketuid: string): UserSearchResult[];

  abstract saveUser(uid: string, session: UserSession): void;

  abstract findAllUsers(): UserSession[];

  abstract userDisconnected(uid: string): void;

  abstract updateTranslationSettings(
    uid: string,
    translationObject: TranslationSettings,
  ): void;

  abstract updateSummarizationSettings(
    uid: string,
    summarizationObject: SummarizationSettings,
  ): void;
}

class ServerUserStore extends UserStore {
  private users = new Map<string, UserSession>();

  findUser(uid: string, socketuid: string): UserSearchResult[] {
    const regex = new RegExp(uid.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    return Array.from(this.users.values())
      .filter((item) => item.uid !== socketuid && regex.test(item.uid))
      .map(({ uid, profile, username }) => ({
        uid,
        profile,
        username,
      }));
  }

  getUser(uid: string): UserSession | undefined {
    return this.users.get(uid);
  }

  saveUser(uid: string, session: UserSession): void {
    this.users.set(uid, session);
  }

  userDisconnected(uid: string): void {
    this.users.delete(uid);
  }

  findAllUsers(): UserSession[] {
    return [...this.users.values()];
  }

  updateTranslationSettings(
    uid: string,
    translationObject: TranslationSettings,
  ): void {
    const user = this.users.get(uid);

    if (user) {
      user.settings.translation = translationObject;
    }
  }

  updateSummarizationSettings(
    uid: string,
    summarizationObject: SummarizationSettings,
  ): void {
    const user = this.users.get(uid);

    if (user) {
      user.settings.summarization = summarizationObject;
    }
  }
}

export const userStore = new ServerUserStore();
export const UsersStore = userStore;
