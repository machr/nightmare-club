/**
 * Kebab-case location slug for Yōtei bot API (matches waves-bot `toYoteiLocationApiSlug`).
 * Example: "Burned Garden" → "burned-garden".
 */
export function toYoteiLocationApiSlug(location: string): string {
	const s = String(location)
		.normalize('NFC')
		.trim()
		.replace(/\s+/g, ' ')
		.toLowerCase();
	return s.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

/**
 * Resolve API slug (or exact DB location string) to a canonical `maps.locations` entry.
 */
export function resolveYoteiLocationKey(allowedLocations: readonly string[], raw: string): string | null {
	const trimmed = String(raw ?? '').trim();
	if (!trimmed) return null;
	for (const loc of allowedLocations) {
		if (loc === trimmed) return loc;
		if (toYoteiLocationApiSlug(loc) === trimmed.toLowerCase()) return loc;
	}
	return null;
}
