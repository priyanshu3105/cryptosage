import { z } from "zod";

export const RegisterBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters long")
    .max(80, "Name cannot exceed 80 characters"),
  email: z.email().transform((value) => value.toLowerCase().trim()),
  password: z.string().min(8).max(128),
});

export const LoginBodySchema = z.object({
  email: z.email().transform((value) => value.toLowerCase().trim()),
  password: z.string().min(1).max(128),
});

export const ChangePasswordBodySchema = z.object({
  currentPassword: z
    .string()
    .min(1, "Current password is required")
    .max(128, "Current password cannot exceed 128 characters"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters long")
    .max(128, "New password cannot exceed 128 characters"),
});
