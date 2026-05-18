import { z } from "zod";

export const challengeItemSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.number().int(),
  status: z.number().int(),
  qrCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  radiusMeters: z.number(),
  basePoints: z.number(),
  bonusPoints: z.number(),
  bonusTimeSeconds: z.number(),
  geocacheId: z.string().optional(),
  createdAt: z.string().min(1),
});

export const challengeItemsSchema = z.array(challengeItemSchema);

export type ChallengeItem = z.infer<typeof challengeItemSchema>;
