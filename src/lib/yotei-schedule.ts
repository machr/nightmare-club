/**
 * When a new survival cycle week is announced, update this file to match
 * `json/rotation_yotei_en.json` in waves-bot (`scheduled_weeks[].week` per map).
 */

export type YoteiScheduleEntry = {
	readonly mapSlug: string;
	readonly cycleWeeks: readonly number[];
};

/** Maps and which cycle weeks (1–12) they appear on (from rotation JSON). */
export const YOTEI_CYCLE_SCHEDULE: readonly YoteiScheduleEntry[] = [
	{ mapSlug: 'frozen-valley', cycleWeeks: [1, 5, 9] },
	{ mapSlug: 'hidden-temple', cycleWeeks: [2, 6, 10] },
	{ mapSlug: 'river-village', cycleWeeks: [3, 7, 11] },
	{ mapSlug: 'broken-castle', cycleWeeks: [4, 8, 12] }
] as const;

export function cycleWeeksForMap(mapSlug: string): number[] {
	const row = YOTEI_CYCLE_SCHEDULE.find((e) => e.mapSlug === mapSlug);
	return row ? [...row.cycleWeeks] : [];
}

export function mapsForCycleWeek(cycleWeek: number): string[] {
	if (!Number.isInteger(cycleWeek) || cycleWeek < 1 || cycleWeek > 12) return [];
	return YOTEI_CYCLE_SCHEDULE.filter((e) => e.cycleWeeks.includes(cycleWeek)).map((e) => e.mapSlug);
}

export function isMapAllowedOnCycleWeek(mapSlug: string, cycleWeek: number): boolean {
	return cycleWeeksForMap(mapSlug).includes(cycleWeek);
}
