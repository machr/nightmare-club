import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getCurrentWeekStart } from '$lib/dates';
import { ROUND_COUNT, ROUND_STRUCTURE, ATTUNEMENT_MAP_SLUGS } from '$lib/constants';
import type { UpsertRotationPayload } from '$lib/types';
import { normalizeYoteiSpawnSlug } from '$lib/yotei-spawn';
import { isMapAllowedOnCycleWeek } from '$lib/yotei-schedule';
import {
	expectedChallengeIdsForCycleWeek,
	roundChallengeSlugsForCycleWeek
} from '$lib/yotei-challenge-schedule';

function normalizeSpawnPointFromForm(value: FormDataEntryValue | null): string | null {
	return normalizeYoteiSpawnSlug(typeof value === 'string' ? value : '');
}

function normalizeCreditText(value: FormDataEntryValue | null): string | null {
	const raw = typeof value === 'string' ? value.trim() : '';
	return raw || null;
}

export const load: PageServerLoad = async ({ locals }) => {
	const supabase = locals.supabase;

	const [mapsRes, challengesRes] = await Promise.all([
		supabase.from('maps').select('*').order('name'),
		supabase.from('challenges').select('*').order('name')
	]);

	const maps = mapsRes.data ?? [];
	const challenges = challengesRes.data ?? [];

	const weekStartStr = getCurrentWeekStart();

	// Fetch existing rotations for this week
	const { data: existingRotations } = await supabase
		.from('rotations')
		.select(
			`
			*,
			rotation_challenges(round_number, challenge:challenges(*)),
			rounds:rounds(
				*,
				waves:waves(
					*,
					spawns:spawns(*)
				)
			)
		`
		)
		.eq('week_start', weekStartStr)
		.order('round_number', { referencedTable: 'rounds' })
		.order('wave_number', { referencedTable: 'rounds.waves' })
		.order('spawn_order', { referencedTable: 'rounds.waves.spawns' });

	return {
		maps,
		challenges,
		weekStart: weekStartStr,
		existingRotations: existingRotations ?? []
	};
};

export const actions: Actions = {
	save: async ({ request, locals }) => {
		const supabase = locals.supabase;
		const formData = await request.formData();
		const startedAt = performance.now();

		const map_id = formData.get('map_id') as string;
		const map_slug = formData.get('map_slug') as string;
		const existing_rotation_id = (formData.get('existing_rotation_id') as string) || null;
		const credit_text = normalizeCreditText(formData.get('credit_text'));
		const mapHasAttunements = ATTUNEMENT_MAP_SLUGS.has(map_slug);
		const currentWeekStart = getCurrentWeekStart();

		const cycleWeekRaw = formData.get('cycle_week');
		const cycleWeek = Number(typeof cycleWeekRaw === 'string' ? cycleWeekRaw : '');
		if (!Number.isInteger(cycleWeek) || cycleWeek < 1 || cycleWeek > 12) {
			return fail(400, { error: 'Cycle week must be an integer from 1 to 12.' });
		}
		if (!isMapAllowedOnCycleWeek(map_slug, cycleWeek)) {
			return fail(400, {
				error: `Map "${map_slug}" is not scheduled for survival cycle week ${cycleWeek}. Pick another week or map (see lib/yotei-schedule.ts).`
			});
		}

		if (!map_id) {
			return fail(400, { error: 'Map is required.' });
		}

		try {
			let resolvedWeekStart = currentWeekStart;

			if (existing_rotation_id) {
				const { data: existingRotation, error: existingRotationError } = await supabase
					.from('rotations')
					.select('id, map_id, week_start')
					.eq('id', existing_rotation_id)
					.maybeSingle();

				if (existingRotationError) {
					return fail(500, {
						error: `Failed to verify existing rotation: ${existingRotationError.message}`
					});
				}

				if (!existingRotation) {
					return fail(400, { error: 'Existing rotation no longer exists. Reload and try again.' });
				}

				if (existingRotation.map_id !== map_id) {
					return fail(400, {
						error: 'Selected map does not match the existing rotation. Reload and try again.'
					});
				}

				resolvedWeekStart = existingRotation.week_start;
			}

			const scheduleSlugs = roundChallengeSlugsForCycleWeek(cycleWeek);
			if (scheduleSlugs) {
				const { data: allChallenges, error: chLoadErr } = await supabase
					.from('challenges')
					.select('id, name');
				if (chLoadErr || !allChallenges) {
					return fail(500, { error: 'Failed to load challenges for schedule validation.' });
				}
				const expectedIds = expectedChallengeIdsForCycleWeek(cycleWeek, allChallenges);
				if (!expectedIds) {
					return fail(500, {
						error:
							'Published Challenge cards schedule references a slug missing from the database. Sync `challenges.name` with `lib/yotei-challenge-schedule.ts`.'
					});
				}
				for (let r = 1; r <= ROUND_COUNT; r++) {
					const submitted = (formData.get(`challenge_round_${r}`) as string) || '';
					if (submitted !== expectedIds[r - 1]) {
						return fail(400, {
							error: `Stage ${r}: Challenge cards must match the published schedule for cycle week ${cycleWeek}. Reload the page.`
						});
					}
				}
			}

			// Build nested payload for the RPC call
			const challenges: UpsertRotationPayload['challenges'] = [];
			const rounds: UpsertRotationPayload['rounds'] = [];

			for (let r = 1; r <= ROUND_COUNT; r++) {
				const challengeId = (formData.get(`challenge_round_${r}`) as string) || null;
				if (challengeId) {
					challenges.push({ challenge_id: challengeId, round_number: r });
				}

				const { waves: waveCount, spawns: spawnCount } =
					ROUND_STRUCTURE[r as keyof typeof ROUND_STRUCTURE];

				const waves: UpsertRotationPayload['rounds'][number]['waves'] = [];
				for (let w = 1; w <= waveCount; w++) {
					const spawns: UpsertRotationPayload['rounds'][number]['waves'][number]['spawns'] = [];
					for (let i = 1; i <= spawnCount; i++) {
						const location = formData.get(`round_${r}_wave_${w}_spawn_${i}_location`) as string;

						if (!location) {
							return fail(400, {
								error: `Missing spawn data for stage ${r}, wave ${w}, spawn ${i}.`
							});
						}

						let element: string[] = [];
						if (mapHasAttunements) {
							const attunement1 = formData.get(
								`round_${r}_wave_${w}_spawn_${i}_attunement_1`
							) as string;
							const attunement2 = formData.get(
								`round_${r}_wave_${w}_spawn_${i}_attunement_2`
							) as string;

							if (!attunement1) {
								return fail(400, {
									error: `Missing attunement for stage ${r}, wave ${w}, spawn ${i}.`
								});
							}

							element = attunement2 ? [attunement1, attunement2] : [attunement1];
						}

						const spNorm = normalizeSpawnPointFromForm(
							formData.get(`round_${r}_wave_${w}_spawn_${i}_spawn_point`)
						);
						spawns.push({
							spawn_order: i,
							location,
							spawn_point: spNorm,
							element
						});
					}
					waves.push({ wave_number: w, spawns });
				}
				rounds.push({ round_number: r, waves });
			}

			const payload: UpsertRotationPayload = {
				rotation_id: existing_rotation_id,
				map_id,
				week_start: resolvedWeekStart,
				cycle_week: cycleWeek,
				credit_text,
				challenges,
				rounds
			};

			// Single RPC call replaces 5-7 sequential Supabase REST calls
			const { data: rotation_id, error: rpcError } = await supabase.rpc('upsert_rotation', {
				payload
			});

			if (rpcError) {
				return fail(500, { error: `Failed to save rotation: ${rpcError.message}` });
			}

			const totalElapsedMs = Math.round(performance.now() - startedAt);
			console.info('[admin save] rotation persisted', {
				rotation_id,
				map_id,
				week_start: resolvedWeekStart,
				existing_rotation_id,
				currentWeekStart,
				has_credit_text: Boolean(credit_text),
				challenges: challenges.length,
				rounds: rounds.length,
				waves: rounds.reduce((sum, r) => sum + r.waves.length, 0),
				spawns: rounds.reduce(
					(sum, r) => sum + r.waves.reduce((ws, w) => ws + w.spawns.length, 0),
					0
				),
				totalElapsedMs
			});

			return { success: true, savedMapId: map_id, savedCycleWeek: cycleWeek };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
			return fail(500, { error: message });
		}
	}
};
