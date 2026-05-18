import { z } from "zod";

export const visionAnalysisResponseSchema = z.object({
  label: z.string().min(1),
  confidence: z.number(),
  engine: z.string().min(1),
  requiresManualReview: z.boolean(),
  summary: z.string().min(1),
  brightness: z.number(),
  contrast: z.number(),
  analyzedAtUtc: z.string().min(1),
});

export type VisionAnalysisResponse = z.infer<
  typeof visionAnalysisResponseSchema
>;
