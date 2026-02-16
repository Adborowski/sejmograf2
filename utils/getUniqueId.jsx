import * as Crypto from "expo-crypto";

export const getUniqueId = () => {
  return Crypto.randomUUID();
};
