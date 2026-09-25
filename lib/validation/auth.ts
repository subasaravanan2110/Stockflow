import { z } from "zod";
import { emailAddressSchema, noControlCharacters } from "@/lib/validation/common";

const passwordSchema = z.string({ error: "Password is required." })
  .min(6, "Password must contain at least 6 characters.")
  .max(128, "Password must contain 128 characters or fewer.")
  .regex(/^\S+$/, "Password cannot contain spaces.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[0-9]/, "Password must include a number.")
  .regex(/[^A-Za-z0-9\s]/, "Password must include a special character.");

export const loginSchema = z.object({
  email: emailAddressSchema,
  password: z.string({ error: "Password is required." }).min(6, "Password must contain at least 6 characters.").max(128, "Password is too long."),
});

export const invitedRegisterSchema = z
  .object({
    name: z.string({ error: "Name is required." }).trim().min(2, "Name must contain at least 2 characters.").max(80, "Name must contain 80 characters or fewer.").refine(noControlCharacters, "Name contains invalid characters."),
    token: z.string().min(32, "The staff invitation is invalid."),
    password: passwordSchema,
    confirmPassword: z.string({ error: "Confirm your password." }).min(1, "Confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const emailSchema = z.object({
  email: emailAddressSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(20, "The password reset link is invalid."),
    password: passwordSchema,
    confirmPassword: z.string({ error: "Confirm your password." }).min(1, "Confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });
