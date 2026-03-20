/** Returns the most recent Saturday as YYYY-MM-DD */
export function getCurrentWeekStart(): string {
	const now = new Date();
	const day = now.getDay(); // 0=Sun
	const diff = (day + 1) % 7; // days since last Saturday
	const weekStart = new Date(now);
	weekStart.setDate(now.getDate() - diff);
	return weekStart.toISOString().split('T')[0];
}
