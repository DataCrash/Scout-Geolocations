import { z } from "zod";

export const validateChallengeRequestSchema = z.object({
  PatrulhaId: z.string().min(1),
  UserId: z.string().min(1),
  ScannedQrCode: z.string().min(1).optional(),
  Latitude: z.number().optional(),
  Longitude: z.number().optional(),
  PhotoBase64: z.string().min(1).optional(),
});

export type ValidateChallengeRequest = z.infer<
  typeof validateChallengeRequestSchema
>;

export const challengeAttemptSchema = z.object({
  id: z.string().min(1),
  challengeId: z.string().min(1),
  patrulhaId: z.string().min(1),
  userId: z.string().min(1),
  status: z.number().int(),
  pointsAwarded: z.number(),
  failReason: z.string().optional(),
  distanceMeters: z.number().optional(),
  attemptedAt: z.string().min(1),
  validatedAt: z.string().optional(),
});

export type AttemptResponse = z.infer<typeof challengeAttemptSchema>;
