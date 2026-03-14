import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email("auth:validation.invalidEmail"),
  password: z.string().min(6, "auth:validation.passwordMinLength"),
});

export const signupSchema = z.object({
  name: z.string().min(2, "auth:validation.nameMinLength"),
  email: z.string().email("auth:validation.invalidEmail"),
  password: z.string().min(6, "auth:validation.passwordMinLength"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "auth:validation.confirmPasswordMatch",
  path: ["confirmPassword"],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
