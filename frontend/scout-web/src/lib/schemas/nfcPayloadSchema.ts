import { z } from "zod";

export const nfcPayloadResultSchema = z.object({
  raw: z.string(),
  patrulhaId: z.string().uuid().optional(),
  checkinCode: z.string().min(1).optional(),
});

export type NfcPayloadResult = z.infer<typeof nfcPayloadResultSchema>;