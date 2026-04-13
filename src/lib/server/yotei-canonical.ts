import { ROUND_STRUCTURE } from '$lib/constants';
import { resolveYoteiLocationKey, toYoteiLocationApiSlug } from '$lib/yotei-location-slug';
import { normalizeYoteiSpawnSlug } from '$lib/yotei-spawn';
import { ATTUNEMENT_MAP_SLUGS, ATTUNEMENT_NAMES } from '$lib/constants';
import type { UpsertRotationPayload } from '$lib/types';
import {
	collectUnexpectedKeys,
	isPlainObject,
	normalizeOptionalString,
	type ApiErrorDetail
} from '$lib/server/bot-api';

export type YoteiCanonicalWave = {
	wave: number;
	spawns: { order: number; location: string; spawn: string; attunements?: string[] }[];
};

export type YoteiCanonicalBody = {
	week: number;
	credits: string;
	map_slug: string;
	waves: YoteiCanonicalWave[];
	challenge_cards_slugs: (string | null)[] | null;
};

/** Global wave index 1–12 → round, in-round wave, spawn slot count. */
export function globalWaveToPlacement(globalWave: number): {
	round: number;
	waveInRound: number;
	spawnCount: number;
} | null {
	if (!Number.isInteger(globalWave) || globalWave < 1 || globalWave > 12) return null;
	if (globalWave <= 9) {
		const round = Math.ceil(globalWave / 3);
		const waveInRound = ((globalWave - 1) % 3) + 1;
		return { round, waveInRound, spawnCount: ROUND_STRUCTURE[round as keyof typeof ROUND_STRUCTURE].spawns };
	}
	const waveInRound = globalWave - 9;
	return { round: 4, waveInRound, spawnCount: ROUND_STRUCTURE[4].spawns };
}

export function isYoteiCanonicalPutBody(body: Record<string, unknown>): boolean {
	const week = Number(body.week);
	if (!Number.isInteger(week) || week < 1 || week > 12) return false;
	if (!Array.isArray(body.waves)) return false;
	if (typeof body.map_slug !== 'string') return false;
	const waves = body.waves as unknown[];
	if (waves.length !== 12) return false;
	for (const w of waves) {
		if (!isPlainObject(w)) return false;
		const wo = w as Record<string, unknown>;
		const wn = Number(wo.wave);
		if (!Number.isInteger(wn) || wn < 1 || wn > 12 || !Array.isArray(wo.spawns)) return false;
	}
	return true;
}

/**
 * Turn bot canonical PUT body into `UpsertRotationPayload` for `upsert_rotation`.
 */
export function canonicalPutToUpsertPayload(
	body: Record<string, unknown>,
	map: { id: string; slug: string; locations: string[] },
	challengeIdBySlug: Map<string, string>,
	weekStart: string,
	details: ApiErrorDetail[]
): UpsertRotationPayload | null {
	collectUnexpectedKeys(body, ['week', 'credits', 'map_slug', 'waves', 'challenge_cards_slugs'], '', details);

	const week = Number(body.week);
	if (!Number.isInteger(week) || week < 1 || week > 12) {
		details.push({ path: 'week', message: 'Expected an integer between 1 and 12.' });
	}

	const map_slug = typeof body.map_slug === 'string' ? body.map_slug.trim() : '';
	if (!map_slug || map_slug !== map.slug) {
		details.push({ path: 'map_slug', message: 'map_slug must match the resolved map.' });
	}

	const credits = normalizeOptionalString(body.credits) ?? '';

	const ccsRaw = body.challenge_cards_slugs;
	const challengeSlugs: (string | null)[] = [];
	if (ccsRaw === null || ccsRaw === undefined) {
		// ok, no stage cards
	} else if (Array.isArray(ccsRaw)) {
		if (ccsRaw.length > 4) {
			details.push({ path: 'challenge_cards_slugs', message: 'Expected at most 4 entries.' });
		}
		for (let i = 0; i < 4; i++) {
			const v = ccsRaw[i];
			if (v === null || v === undefined) challengeSlugs.push(null);
			else if (typeof v === 'string') {
				const t = v.trim();
				challengeSlugs.push(t || null);
			} else {
				details.push({ path: `challenge_cards_slugs[${i}]`, message: 'Expected string or null.' });
			}
		}
	} else {
		details.push({ path: 'challenge_cards_slugs', message: 'Expected an array or null.' });
	}

	const challenges: UpsertRotationPayload['challenges'] = [];
	for (let round = 1; round <= 4; round++) {
		const slug = challengeSlugs[round - 1];
		if (!slug) continue;
		const id = challengeIdBySlug.get(slug);
		if (!id) {
			details.push({
				path: `challenge_cards_slugs[${round - 1}]`,
				message: `Unknown challenge slug "${slug}".`
			});
			continue;
		}
		challenges.push({ challenge_id: id, round_number: round });
	}

	const wavesArr = body.waves as unknown[];
	const byWave = new Map<number, Record<string, unknown>>();
	for (const item of wavesArr) {
		if (!isPlainObject(item)) continue;
		const wo = item as Record<string, unknown>;
		const wn = Number(wo.wave);
		if (Number.isInteger(wn) && wn >= 1 && wn <= 12) byWave.set(wn, wo);
	}
	if (byWave.size !== 12) {
		details.push({ path: 'waves', message: 'Expected exactly 12 waves with wave numbers 1–12.' });
	}

	const rounds: UpsertRotationPayload['rounds'] = [];

	for (let r = 1; r <= 4; r++) {
		const struct = ROUND_STRUCTURE[r as keyof typeof ROUND_STRUCTURE];
		const waves: UpsertRotationPayload['rounds'][number]['waves'] = [];
		for (let wInR = 1; wInR <= struct.waves; wInR++) {
			const globalWave = r < 4 ? (r - 1) * 3 + wInR : 9 + wInR;
			const waveObj = byWave.get(globalWave);
			const spawnsOut: UpsertRotationPayload['rounds'][number]['waves'][number]['spawns'] = [];

			if (!waveObj) {
				details.push({ path: `waves[wave=${globalWave}]`, message: 'Missing wave.' });
				continue;
			}

			const spawnsRaw = waveObj.spawns;
			if (!Array.isArray(spawnsRaw)) {
				details.push({ path: `waves[${globalWave - 1}].spawns`, message: 'Expected an array.' });
				continue;
			}

			const byOrder = new Map<number, Record<string, unknown>>();
			for (const s of spawnsRaw) {
				if (!isPlainObject(s)) continue;
				const so = s as Record<string, unknown>;
				const ord = Number(so.order);
				if (Number.isInteger(ord)) byOrder.set(ord, so);
			}

			for (let ord = 1; ord <= struct.spawns; ord++) {
				const sp = byOrder.get(ord);
				const pathBase = `waves[wave=${globalWave}].spawns[order=${ord}]`;
				if (!sp) {
					details.push({ path: pathBase, message: 'Missing spawn slot.' });
					continue;
				}

				const locRaw = typeof sp.location === 'string' ? sp.location.trim() : '';
				const locKey = resolveYoteiLocationKey(map.locations, locRaw);
				if (!locKey) {
					details.push({
						path: `${pathBase}.location`,
						message: `Unknown location "${locRaw}" for this map.`
					});
					continue;
				}

				const spawnRaw = sp.spawn ?? sp.spawn_point;
				const spawnNorm = normalizeYoteiSpawnSlug(spawnRaw);
				if (spawnRaw != null && String(spawnRaw).trim() && !spawnNorm) {
					details.push({
						path: `${pathBase}.spawn`,
						message: 'Expected spawn left, middle, right, or empty.'
					});
				}

				let element: string[] = [];
				const att = sp.attunements;
				const needsAtt = ATTUNEMENT_MAP_SLUGS.has(map.slug);
				const allowedAtt = new Set(ATTUNEMENT_NAMES as readonly string[]);
				if (needsAtt) {
					if (Array.isArray(att)) {
						for (let ai = 0; ai < att.length; ai++) {
							const a = att[ai];
							if (typeof a === 'string' && a.trim()) {
								const t = a.trim();
								if (!allowedAtt.has(t)) {
									details.push({
										path: `${pathBase}.attunements[${ai}]`,
										message: `Expected one of: ${ATTUNEMENT_NAMES.join(', ')}.`
									});
								} else {
									element.push(t);
								}
							}
						}
					}
					if (element.length > 2) {
						details.push({
							path: `${pathBase}.attunements`,
							message: 'Expected at most 2 attunements for this map.'
						});
					}
				} else if (Array.isArray(att) && att.length > 0) {
					details.push({ path: `${pathBase}.attunements`, message: 'Attunements are not allowed for this map.' });
				}

				spawnsOut.push({
					spawn_order: ord,
					location: locKey,
					spawn_point: spawnNorm,
					element
				});
			}

			waves.push({ wave_number: wInR, spawns: spawnsOut });
		}

		rounds.push({ round_number: r, waves });
	}

	if (details.length > 0) return null;

	return {
		map_id: map.id,
		week_start: weekStart,
		cycle_week: week,
		credit_text: credits || null,
		challenges,
		rounds
	};
}

export function buildCanonicalResponseForMap(params: {
	mapSlug: string;
	creditText: string | null;
	cycleWeek: number | null;
	rounds: Array<{
		round_number: number;
		waves: Array<{
			wave_number: number;
			spawns: Array<{
				spawn_order: number;
				location: string;
				spawn_point: string | null;
				element?: string[];
			}>;
		}>;
	}>;
	challengeSlugByRound: Map<number, string>;
	hasAttunements: boolean;
}): YoteiCanonicalBody {
	const { mapSlug, creditText, cycleWeek, rounds, challengeSlugByRound, hasAttunements } = params;

	const sortedRounds = [...rounds].sort((a, b) => a.round_number - b.round_number);
	const wavesOut: YoteiCanonicalWave[] = [];

	for (let gw = 1; gw <= 12; gw++) {
		const place = globalWaveToPlacement(gw);
		if (!place) continue;
		const rd = sortedRounds.find((x) => x.round_number === place.round);
		const waveRow = rd?.waves?.find((w) => w.wave_number === place.waveInRound);
		const sortedSpawns = [...(waveRow?.spawns ?? [])].sort((a, b) => a.spawn_order - b.spawn_order);
		const spawns: YoteiCanonicalWave['spawns'] = [];
		for (let ord = 1; ord <= place.spawnCount; ord++) {
			const sp = sortedSpawns.find((s) => s.spawn_order === ord);
			const loc = sp?.location ?? '';
			const slug = normalizeYoteiSpawnSlug(sp?.spawn_point ?? '') ?? '';
			const cell: YoteiCanonicalWave['spawns'][number] = {
				order: ord,
				location: toYoteiLocationApiSlug(loc),
				spawn: slug
			};
			if (hasAttunements) {
				cell.attunements = Array.isArray(sp?.element) ? [...sp.element] : [];
			}
			spawns.push(cell);
		}
		wavesOut.push({ wave: gw, spawns });
	}

	const challenge_cards_slugs: (string | null)[] = [];
	for (let r = 1; r <= 4; r++) {
		challenge_cards_slugs.push(challengeSlugByRound.get(r) ?? null);
	}
	const anyCard = challenge_cards_slugs.some((x) => x != null && x !== '');
	return {
		week: cycleWeek ?? 0,
		credits: creditText ?? '',
		map_slug: mapSlug,
		waves: wavesOut,
		challenge_cards_slugs: anyCard ? challenge_cards_slugs : null
	};
}
