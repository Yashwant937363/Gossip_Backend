import bcrypt from "bcryptjs";

export const getHash = async (data: string, rounds: number = 10) => {
  const salt = await bcrypt.genSalt(rounds);
  const hash = await bcrypt.hash(data, salt);
  return hash;
};

export const compareHash = async (data: string, hash: string) => {
  return await bcrypt.compare(data, hash);
};
