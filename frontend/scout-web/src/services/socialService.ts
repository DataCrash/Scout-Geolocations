export type PatrolScoreSnapshot = {
  id: string;
  name: string;
  points: number;
  validatedChallenges: number;
};

export type PatrolProfileSnapshot = {
  displayName: string;
} | null;

export type PatrolSocialSummaryInput = {
  patrolId: string;
  scores: PatrolScoreSnapshot[];
  profile: PatrolProfileSnapshot;
  unlockedBadgesCount: number;
  sharedRoutesCount: number;
  latestEventSnapshotId: string | null;
};

export type PatrolSocialSummary = {
  displayName: string;
  rankingPosition: number | null;
  points: number;
  validatedChallenges: number;
  unlockedBadgesCount: number;
  sharedRoutesCount: number;
  latestEventSnapshotId: string | null;
};

export function buildPatrolSocialSummary(
  input: PatrolSocialSummaryInput,
): PatrolSocialSummary {
  const activeScore = input.scores.find((score) => score.id === input.patrolId);

  return {
    displayName:
      input.profile?.displayName ??
      activeScore?.name ??
      "Patrulha sem identificação",
    rankingPosition: activeScore
      ? input.scores.findIndex((score) => score.id === input.patrolId) + 1
      : null,
    points: activeScore?.points ?? 0,
    validatedChallenges: activeScore?.validatedChallenges ?? 0,
    unlockedBadgesCount: input.unlockedBadgesCount,
    sharedRoutesCount: input.sharedRoutesCount,
    latestEventSnapshotId: input.latestEventSnapshotId,
  };
}
