import { z } from "zod";

export const authRoleSchema = z.enum([
  "ChefesEscoteiro",
  "Integrante",
  "Convidado",
]);

export const authLoginResponseSchema = z.object({
  token: z.string().min(1),
  userId: z.string().min(1),
  name: z.string().min(1),
  role: authRoleSchema,
});

export const oauthAuthorizeResponseSchema = z.object({
  authorizationUrl: z.string().min(1),
  state: z.string().min(1),
});

export const authMeResponseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email().nullable().optional(),
  role: authRoleSchema,
});

export type GoogleLoginResponse = z.infer<typeof authLoginResponseSchema>;
export type OAuthAuthorizeResponse = z.infer<typeof oauthAuthorizeResponseSchema>;
export type AuthMeResponse = z.infer<typeof authMeResponseSchema>;