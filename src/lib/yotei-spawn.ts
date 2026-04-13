/** DB column `spawn_point` max length (see schema). */
const SPAWN_POINT_MAX_LEN = 15;

/** Allowed spawn_point values for Yōtei (bot + site). */
export const YOTEI_SPAWN_SLUGS = ['left', 'middle', 'right'] as const;

export type YoteiSpawnSlug = (typeof YOTEI_SPAWN_SLUGS)[number];

/** UI labels for SegmentedControl (stored value is the slug). Omit spawn in admin by leaving none selected. */
export const YOTEI_SPAWN_UI_OPTIONS: { value: YoteiSpawnSlug; label: string }[] = [
	{ value: 'left', label: 'Left' },
	{ value: 'middle', label: 'Middle' },
	{ value: 'right', label: 'Right' }
];

const slugSet = new Set<string>(YOTEI_SPAWN_SLUGS);

/**
 * Normalize admin/API input to a DB spawn_point: slug, null (unset), or null if invalid.
 */
export function normalizeYoteiSpawnSlug(value: unknown): string | null {
	if (value === undefined || value === null) return null;
	if (typeof value !== 'string') return null;
	const t = value.trim().toLowerCase();
	if (!t) return null;
	if (!slugSet.has(t)) return null;
	return t.slice(0, SPAWN_POINT_MAX_LEN);
}

/**
 * Map existing DB value to UI slug: accepts legacy casing; unknown → '' (user must re-pick).
 */
export function spawnPointToUiValue(raw: string | null | undefined): '' | YoteiSpawnSlug {
	if (raw == null || !String(raw).trim()) return '';
	const t = String(raw).trim().toLowerCase();
	if (slugSet.has(t)) return t as YoteiSpawnSlug;
	return '';
}

/** Title-case for public display. */
export function formatYoteiSpawnPointForDisplay(raw: string | null | undefined): string {
	if (raw == null || !String(raw).trim()) return '';
	const t = String(raw).trim().toLowerCase();
	if (t === 'left') return 'Left';
	if (t === 'middle') return 'Middle';
	if (t === 'right') return 'Right';
	return String(raw).trim();
}
