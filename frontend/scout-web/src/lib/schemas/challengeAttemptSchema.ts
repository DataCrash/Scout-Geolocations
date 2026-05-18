import { z } from "zod";

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