import * as crypto from "crypto";

const DEFAULT_ONE_TIME_PWD_LEN = 8;

export const generateOneTimePwd = async (length = DEFAULT_ONE_TIME_PWD_LEN) => {
  const tokenBtye = await crypto.randomBytes((length + 1) >> 1);
  const tokenStr = tokenBtye.toString("hex").slice(0, length);
  return tokenStr;
};
