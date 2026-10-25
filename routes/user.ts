import { Router } from "express";
import type { Request, Response } from "express";
import authUser from "../middlewares/authUser.js";
import User from "../models/user.js";
import type { JWTPayload } from "../schema/auth-schema.js";

const router = Router();

router.get(
  "/search",
  authUser,
  async (req: Request, res: Response<any, JWTPayload>) => {
    try {
      const query = req.query.q as string;

      if (!query?.trim()) {
        return res.status(400).json({ error: "Search query is required" });
      }

      const users = await User.find({
        $or: [
          { uid: { $regex: query.trim(), $options: "i" } },
          { username: { $regex: query.trim(), $options: "i" } },
          { fullName: { $regex: query.trim(), $options: "i" } },
        ],
      }).select("-_id -__v");

      return res.status(200).json({ msg: "ok", users });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ error: "Something went wrong while fetching user data" });
    }
  },
);

export default router;
