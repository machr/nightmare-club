<script lang="ts">
	import { onMount } from 'svelte';
	import { applyTheme, persistTheme, readStoredTheme, THEMES, THEME_LABELS, type Theme } from '$lib/theme';

	let { theme = $bindable<Theme>('poster') }: { theme?: Theme } = $props();

	function setTheme(nextTheme: Theme) {
		theme = nextTheme;
		applyTheme(nextTheme);
		persistTheme(nextTheme);
	}

	onMount(() => {
		theme = readStoredTheme();
		applyTheme(theme);
	});
</script>

<div class="segmented-control w-auto">
	{#each THEMES as t}
		<button
			type="button"
			class="segmented-control__option {theme === t ? 'segmented-control__option--active' : 'segmented-control__option--inactive'}"
			onclick={() => setTheme(t)}
			aria-label="Switch to {THEME_LABELS[t]} theme"
		>
			{THEME_LABELS[t]}
		</button>
	{/each}
</div>
