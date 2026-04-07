import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getTsushimaWeekStart } from '$lib/dates';
import { requireBearerToken } from '$lib/server/bot-api';
import { env } from '$env/dynamic/private';
import type { TsushimaPayloadJson, TsushimaWaveRow } from '$lib/types';

function wavesFromPayload(raw: unknown): TsushimaWaveRow[] {
	if (!raw || typeof raw !== 'object' || !('waves' in raw)) return [];
	const w = (raw as TsushimaPayloadJson).waves;
	if (!Array.isArray(w)) return [];
	return w as TsushimaWaveRow[];
}

export const GET: RequestHandler = async ({ request, locals }) => {
	const authError = requireBearerToken(request, env.BOT_API_TOKEN_TSUSHIMA);
	if (authError) return authError;

	const weekStartStr = getTsushimaWeekStart();
	const { data: rows, error } = await locals.supabase
		.from('tsushima_rotations')
		.select('week_code, payload')
		.eq('week_start', weekStartStr);

	if (error) {
		console.error('[api/rotation/tsushima]', error);
		return json({ error: 'Failed to fetch rotations' }, { status: 500 });
	}

	const maps = (rows ?? []).map((row) => ({
		week_code: row.week_code,
		waves: wavesFromPayload(row.payload as unknown)
	}));

	return json(
		{ maps },
		{
			headers: {
				'Cache-Control': 'private, no-store'
			}
		}
	);
};
