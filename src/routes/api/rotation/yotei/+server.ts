import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCurrentWeekStart } from '$lib/dates';
import { ATTUNEMENT_MAP_SLUGS } from '$lib/constants';
import { requireBearerToken } from '$lib/server/bot-api';
import { buildCanonicalResponseForMap } from '$lib/server/yotei-canonical';
import { env } from '$env/dynamic/private';

/** Read-only Yōtei rotation for the current Melbourne week (same anchor as the home page). Bearer only. */
export const GET: RequestHandler = async ({ request, locals }) => {
	const authError = requireBearerToken(request, env.BOT_API_TOKEN_YOTEI);
	if (authError) return authError;

	const supabase = locals.supabase;
	const weekStart = getCurrentWeekStart();
	const weekStartUnix = Math.floor(Date.parse(`${weekStart}T00:00:00Z`) / 1000);

	const { data: maps, error: mapsError } = await supabase.from('maps').select('*').order('name');

	if (mapsError || !maps) {
		console.error('[api/rotation/yotei] maps', mapsError);
		return json({ error: 'Failed to fetch maps' }, { status: 500 });
	}

	const canonicalMaps: ReturnType<typeof buildCanonicalResponseForMap>[] = [];

	for (const map of maps) {
		const { data: rotations, error: rotError } = await supabase
			.from('rotations')
			.select(
				`
				*,
				rotation_challenges(round_number, challenge:challenges(*)),
				rounds(
					*,
					waves(
						*,
						spawns(*)
					)
				)
			`
			)
			.eq('map_id', map.id)
			.eq('week_start', weekStart)
			.order('created_at', { ascending: false })
			.limit(1);

		if (rotError) {
			console.error(`[api/rotation/yotei] rotation for ${map.name}:`, rotError);
			continue;
		}

		const rotation = rotations?.[0] ?? null;
		if (!rotation) continue;

		const hasAttunements = ATTUNEMENT_MAP_SLUGS.has(map.slug);

		const challengeSlugByRound = new Map<number, string>();
		for (const rc of rotation.rotation_challenges ?? []) {
			const ch = rc.challenge as { name?: string; description?: string | null } | undefined;
			if (ch?.name) {
				challengeSlugByRound.set(rc.round_number, ch.name);
			}
		}
		const rot = rotation as { cycle_week?: number | null; credit_text?: string | null };
		canonicalMaps.push(
			buildCanonicalResponseForMap({
				mapSlug: map.slug,
				creditText: rot.credit_text ?? null,
				cycleWeek: rot.cycle_week ?? null,
				rounds: rotation.rounds ?? [],
				challengeSlugByRound,
				hasAttunements
			})
		);
	}

	const body = { week_start_unix: weekStartUnix, maps: canonicalMaps };

	return json(body, {
		headers: {
			'Cache-Control': 'private, no-store'
		}
	});
};
