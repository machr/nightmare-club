import type { RequestHandler } from './$types';
import { buildRotationApiResponse } from '$lib/server/rotation-api';

export const GET: RequestHandler = async ({ locals }) => {
	return buildRotationApiResponse({ supabase: locals.supabase });
};
