import { createHash, randomBytes } from "crypto";

const TOKEN_TTL_MS = 1000 * 60 * 60 * 48;

export function createVerificationToken() {
  const token = randomBytes(32).toString("hex");
  return {
    token,
    hash: hashVerificationToken(token),
    expires: new Date(Date.now() + TOKEN_TTL_MS),
  };
}

export function hashVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
