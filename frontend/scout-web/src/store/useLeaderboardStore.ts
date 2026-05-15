import { create } from 'zustand'

type PatrolScore = {
  id: string
  name: string
  points: number
  validatedChallenges: number
}

type LeaderboardState = {
  eventId: string
  scores: PatrolScore[]
  bumpPatrol: (id: string, amount: number) => void
}

const initialScores: PatrolScore[] = [
  { id: 'lobo', name: 'Patrulha Lobo', points: 120, validatedChallenges: 8 },
  { id: 'aguia', name: 'Patrulha Águia', points: 110, validatedChallenges: 7 },
  { id: 'raposa', name: 'Patrulha Raposa', points: 95, validatedChallenges: 6 },
]

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
  eventId: 'evento-demo',
  scores: initialScores,
  bumpPatrol: (id, amount) => {
    set((state) => {
      const next = state.scores
        .map((score) => {
          if (score.id !== id) {
            return score
          }

          return {
            ...score,
            points: score.points + amount,
            validatedChallenges: score.validatedChallenges + 1,
          }
        })
        .sort((a, b) => b.points - a.points)

      return { scores: next }
    })
  },
}))
