import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession }, url }) => {
	// Skip auth calls on public pages to avoid 2 unnecessary Supabase round trips
	if (url.pathname.startsWith('/admin') || url.pathname === '/login') {
		const { session } = await safeGetSession();
		return { session };
	}
	return { session: null };
};
