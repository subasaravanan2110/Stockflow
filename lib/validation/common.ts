import { z } from "zod";

const EMAIL_PATTERN = /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;

export const emailAddressSchema = z.string({ error: "Email is required." })
  .trim()
  .min(1, "Email is required.")
  .max(254, "Email must be 254 characters or fewer.")
  .refine((value) => EMAIL_PATTERN.test(value), "Enter a valid email address like name@example.com.")
  .transform((value) => value.toLowerCase());

export function requiredNumberSchema(label: string) {
  return z.preprocess(
    (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
    z.coerce.number({ error: `${label} must be a valid number.` }),
  );
}

export function noControlCharacters(value: string) {
  return !/[\u0000-\u001F\u007F]/.test(value);
}

export function positiveIntegerParam(value: string | null | undefined, fallback: number, maximum = Number.MAX_SAFE_INTEGER) {
  if (!value || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 ? Math.min(parsed, maximum) : fallback;
}

export const entityIdSchema = z.string().cuid("Invalid record identifier.");
