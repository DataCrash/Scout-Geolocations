import { z } from "zod";

const recentMemberSchema = z.object({
  userId: z.uuid(),
  name: z.string().min(1),
  role: z.string().min(1),
  joinedAt: z.string().min(1),
});

export const patrolSocialProfileSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  monitorId: z.uuid(),
  monitorName: z.string().min(1),
  submonitorId: z.uuid().nullable(),
  submonitorName: z.string().min(1).nullable(),
  createdAt: z.string().min(1),
  membersCount: z.number().int().nonnegative(),
  recentMembers: z.array(recentMemberSchema),
});

export type PatrolSocialProfile = z.infer<typeof patrolSocialProfileSchema>;