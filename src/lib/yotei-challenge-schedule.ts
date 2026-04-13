/**
 * Fixed Challenge cards per survival cycle week 1–12, in stage order (rounds 1–4).
 * Keep in sync with waves-bot `json/rotation_yotei_en.json`: for each map, the
 * `scheduled_weeks` entry whose `week` equals this cycle week uses `round_challenges`.
 * `null` = not announced yet — site admin may choose any row from `challenges`.
 *
 * Map per week follows `yotei-schedule.ts` (week 1 frozen-valley, 2 hidden-temple, …).
 */

const BY_CYCLE_WEEK: readonly (readonly string[] | null)[] = [
	// 1 — frozen-valley
	['lose-location', 'lose-location', 'lose-location', 'lose-location'],
	// 2 — hidden-temple
	['ranged-last-hit', 'much-more-damage', 'increased-cooldowns', 'unique-enemy-ambush'],
	// 3 — river-village
	[
		'spirit-healing-drunk',
		'extremely-fast-attacks',
		'ghost-health-drain',
		'spirit-healing-drunk'
	],
	// 4 — broken-castle
	['lose-location', 'lose-location', 'lose-location', 'lose-location'],
	// 5 — frozen-valley
	[
		'max-health-significantly-reduced',
		'reviving-ghosts-much-longer',
		'ghost-weapon-cooldowns-increased',
		'unique-enemy-ambush'
	],
	// 6 — hidden-temple
	[
		'attunement-suspendable',
		'attunement-suspendable',
		'attunement-suspendable',
		'attunement-suspendable'
	],
	// 7–12: not in JSON yet
	null,
	null,
	null,
	null,
	null,
	null,
	null
];

export function roundChallengeSlugsForCycleWeek(cycleWeek: number): readonly string[] | null {
	if (!Number.isInteger(cycleWeek) || cycleWeek < 1 || cycleWeek > 12) return null;
	return BY_CYCLE_WEEK[cycleWeek - 1] ?? null;
}

/**
 * Resolved `challenges.id` for each stage, or `null` if week is not locked or a slug is missing in DB.
 */
export function expectedChallengeIdsForCycleWeek(
	cycleWeek: number,
	challenges: readonly { id: string; name: string }[]
): string[] | null {
	const slugs = roundChallengeSlugsForCycleWeek(cycleWeek);
	if (!slugs || slugs.length !== 4) return null;
	const ids: string[] = [];
	for (const slug of slugs) {
		const row = challenges.find((c) => c.name === slug);
		if (!row) return null;
		ids.push(row.id);
	}
	return ids;
}
