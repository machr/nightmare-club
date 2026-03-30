<script lang="ts">
	import { RESET_SCHEDULE } from '$lib/constants';

	/** Countdown to next reset */

	let now = $state(Date.now());

	$effect(() => {
		const id = setInterval(() => (now = Date.now()), 1000);
		return () => clearInterval(id);
	});

	let resetMs = $derived(getNextReset(now));
	let remaining = $derived(resetMs - now);

	function melbourneDay(date: Date): { weekday: number; hour: number; dateStr: string } {
		const parts = new Intl.DateTimeFormat('en-US', {
			timeZone: RESET_SCHEDULE.timezone,
			weekday: 'short',
			hour: 'numeric',
			hour12: false,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		}).formatToParts(date);

		const weekdayStr = parts.find((p) => p.type === 'weekday')?.value ?? '';
		const dayMap: Record<string, number> = {
			Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6
		};

		return {
			weekday: dayMap[weekdayStr] ?? 0,
			hour: parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0'),
			dateStr: `${parts.find((p) => p.type === 'year')?.value}-${parts.find((p) => p.type === 'month')?.value}-${parts.find((p) => p.type === 'day')?.value}`
		};
	}

	function getNextReset(currentMs: number): number {
		const date = new Date(currentMs);
		const mel = melbourneDay(date);

		// Days until next reset weekday
		let daysAhead = (RESET_SCHEDULE.weekday - mel.weekday + 7) % 7;
		// If it's already reset day past reset hour, next week
		if (daysAhead === 0 && mel.hour >= RESET_SCHEDULE.hour) daysAhead = 7;

		// Build the target date string in Melbourne time
		const target = new Date(currentMs + daysAhead * 86400000);
		const targetMel = melbourneDay(target);

		// Convert the Melbourne reset time to a UTC timestamp.
		const targetStr = targetMel.dateStr;
		const resetHourStr = String(RESET_SCHEDULE.hour).padStart(2, '0');
		// Melbourne is UTC+10 or UTC+11 depending on DST.
		for (const offsetHours of [11, 10]) {
			const utcMs = new Date(`${targetStr}T${resetHourStr}:00:00Z`).getTime() - offsetHours * 3600000;
			const check = new Intl.DateTimeFormat('en-US', {
				timeZone: RESET_SCHEDULE.timezone,
				hour: 'numeric',
				hour12: false
			}).format(new Date(utcMs));
			if (parseInt(check) === RESET_SCHEDULE.hour) {
				return utcMs;
			}
		}

		// Fallback with UTC+11
		return new Date(`${targetMel.dateStr}T${resetHourStr}:00:00Z`).getTime() - 11 * 3600000;
	}

	function formatCountdown(ms: number): string {
		if (ms <= 0) return 'Resetting now!';
		const totalSec = Math.floor(ms / 1000);
		const d = Math.floor(totalSec / 86400);
		const h = Math.floor((totalSec % 86400) / 3600);
		const m = Math.floor((totalSec % 3600) / 60);
		const s = totalSec % 60;
		const parts: string[] = [];
		if (d > 0) parts.push(`${d}d`);
		parts.push(`${h}h`);
		parts.push(`${String(m).padStart(2, '0')}m`);
		parts.push(`${String(s).padStart(2, '0')}s`);
		return parts.join(' ');
	}

	function formatLocalTime(ms: number): string {
		return new Date(ms).toLocaleString(undefined, {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}
</script>

<div class="text-center text-sm text-muted-foreground">
	<span>Next reset: <strong class="text-foreground">{formatCountdown(remaining)}</strong></span>
	<span class="mx-1">&middot;</span>
	<span>{formatLocalTime(resetMs)}</span>
</div>
