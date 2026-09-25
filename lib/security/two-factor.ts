import "server-only";
import { generateSecret, generateURI, verify } from "otplib";
import { decryptCredential, encryptCredential } from "@/lib/crypto";

export function createTwoFactorSetup(email: string) {
  const secret = generateSecret({ length: 20 });
  return {
    secret,
    encryptedSecret: encryptCredential(secret),
    uri: generateURI({ issuer: "StockFlow", label: email, secret, digits: 6, period: 30 }),
  };
}

export async function verifyTwoFactorCode(encryptedSecret: string, code: string) {
  if (!/^\d{6}$/.test(code)) return false;
  try {
    const result = await verify({
      secret: decryptCredential(encryptedSecret),
      token: code,
      digits: 6,
      period: 30,
      epochTolerance: 30,
    });
    return result.valid;
  } catch {
    return false;
  }
}
