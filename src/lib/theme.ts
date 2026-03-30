export const THEME_STORAGE_KEY = 'nightmare-club-theme';

export const THEMES = ['poster', 'dark', 'light'] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_LABELS: Record<Theme, string> = {
	poster: 'Poster',
	dark: 'Table Dark',
	light: 'Table Light'
};

export function clampSpawnPoint(value: string): string {
	return value.slice(0, 15);
}

export function applyTheme(theme: Theme): void {
	const root = document.documentElement;
	root.classList.remove(...THEMES);
	root.classList.add(theme);
	root.dataset.theme = theme;
}

export function readStoredTheme(): Theme {
	if (typeof localStorage === 'undefined') {
		return 'poster';
	}

	const stored = localStorage.getItem(THEME_STORAGE_KEY);
	if (stored && THEMES.includes(stored as Theme)) return stored as Theme;
	return 'poster';
}

export function persistTheme(theme: Theme): void {
	localStorage.setItem(THEME_STORAGE_KEY, theme);
}
