const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const companySponsorCode = "HQ001";

export function normalizeReferralCode(code?: string) {
  return code?.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12) || "";
}

export function isShortReferralCode(code?: string) {
  return /^[A-Z0-9]{6}$/.test(normalizeReferralCode(code));
}

export function generateShortReferralCode(seed: string, salt = "") {
  const input = `${seed}:${salt}`;
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  let value = hash >>> 0;
  let code = "";

  for (let index = 0; index < 6; index += 1) {
    code += alphabet[value % alphabet.length];
    value = Math.floor(value / alphabet.length);

    if (value === 0) {
      value = Math.imul(hash + index + 1, 2654435761) >>> 0;
    }
  }

  return code;
}
