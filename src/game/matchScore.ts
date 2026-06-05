function sampleGoalsFromXg(xg: number): number {
  if (xg <= 0.05) return 0
  let goals = 0
  let remaining = xg
  while (remaining > 0.08 && goals < 5) {
    const p = Math.min(0.92, remaining)
    if (Math.random() < p) goals += 1
    remaining -= 1
  }
  return goals
}

/** Expected-goals style scoring — avoids always gifting the player at least one goal. */
export function resolveGoalsFromPowerRatio(ratio: number): {
  goalsFor: number
  goalsAgainst: number
} {
  const r = Math.max(0.5, Math.min(2, ratio))
  const xgFor = Math.max(0.12, 0.72 + (r - 1) * 1.05)
  const xgAgainst = Math.max(0.12, 0.72 - (r - 1) * 0.95)
  return {
    goalsFor: sampleGoalsFromXg(xgFor),
    goalsAgainst: sampleGoalsFromXg(xgAgainst),
  }
}
