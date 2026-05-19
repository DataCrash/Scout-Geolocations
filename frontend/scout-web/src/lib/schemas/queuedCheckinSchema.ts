import { validateChallengeRequestSchema } from "@/lib/schemas/challengeAttemptSchema";
import { z } from "zod";

export const queuedCheckinSubmissionSchema = z.object({
  id: z.string().min(1),
  challengeId: z.string().min(1),
  payload: validateChallengeRequestSchema,
  queuedAt: z.string().min(1),
  retries: z.number().int().nonnegative(),
  lastError: z.string().optional(),
});

export type QueuedCheckinSubmission = z.infer<
  typeof queuedCheckinSubmissionSchema
>;
