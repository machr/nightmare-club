<script lang="ts">
	let {
		options,
		name,
		value = $bindable(''),
		required = false
	}: {
		options: readonly string[];
		name: string;
		value: string;
		required?: boolean;
	} = $props();
</script>

<input type="hidden" {name} {value} {required} />
<div class="inline-flex h-7 items-center rounded-lg bg-muted p-0.5 text-muted-foreground">
	{#each options as option}
		<button
			type="button"
			class="rounded-md px-2 py-0.5 text-xs transition-colors {value === option
				? 'bg-background text-foreground shadow'
				: 'hover:text-foreground/80'}"
			onclick={() => (value = option)}
		>
			{option}
		</button>
	{/each}
</div>
