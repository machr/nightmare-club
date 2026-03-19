<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import type { RotationWithStages } from '$lib/types';

	let { rotation }: { rotation: RotationWithStages | null } = $props();
</script>

{#if !rotation}
	<p class="py-8 text-center text-muted-foreground">No rotation data yet for this week.</p>
{:else}
	<div class="rounded-xl border border-border bg-card p-3 space-y-1 sm:p-4">
		{#each rotation.stages as stage, i}
			{#if i > 0}
				<hr class="border-border" />
			{/if}
			<div class="py-2 space-y-2 sm:py-3 sm:space-y-3">
				<div class="flex items-center gap-2">
					<h3 class="text-base font-bold uppercase text-primary sm:text-lg">
						Stage {stage.stage_number}
					</h3>
					{#if stage.modifier}
						<Badge variant="secondary" class="text-xs">{stage.modifier.name}</Badge>
					{/if}
				</div>

				<div class="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
					{#each stage.rounds as round}
						<div class="flex gap-3 sm:block sm:space-y-1.5">
							<p class="shrink-0 w-8 text-sm font-semibold text-muted-foreground sm:w-auto">
								{stage.stage_number}-{round.round_number}
							</p>
							<div class="flex flex-wrap gap-x-4 gap-y-0.5 sm:block sm:space-y-1.5">
								{#each round.spawns as spawn}
									<p class="text-sm uppercase">
										{spawn.location}
										<span class="text-muted-foreground">({spawn.element})</span>
									</p>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
{/if}
