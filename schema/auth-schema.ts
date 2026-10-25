import * as z from "zod";
import { userSettingsSchema } from "./settings-schema.js";
import type { UserSettings } from "./settings-schema.js";

export const signupReqSchema = z.object({
  username: z.string().trim().min(1).max(50),
  email: z.email(),
  password: z.string().min(8),
  dob: z.coerce.date().optional(),
  fullname: z.object({
    firstname: z.string().trim().min(1).max(50),
    lastname: z.string().trim().min(1).max(50),
  }),
});

export type SignupReq = z.infer<typeof signupReqSchema>;

export const signinReqSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export type SigninReq = z.infer<typeof signinReqSchema>;

export const sendEmailOtpReqSchema = z.object({
  email: z.email(),
});

export type SendEmailOtpReq = z.infer<typeof sendEmailOtpReqSchema>;

export interface UserProfile {
  profile: string;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  uid: string;
  dob?: string;
  settings: UserSettings;
}

export interface SigninResponse {
  authtoken: string;
  msg: string;
  profile: string;
  username: string;
  fullname: {
    firstname: string;
    lastname: string;
  };
  uid: string;
  dob?: string;
  settings: UserSettings;
}

export interface GetUserResponse {
  msg: string;
  user: UserProfile;
}

export interface SignupResponse {
  authtoken: string;
  uid: string;
}

export interface JWTPayload {
  id: number;
}
