<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { ATTUNEMENTS, ATTUNEMENT_MAP_SLUGS } from '$lib/constants';
	import type { RotationWithRounds } from '$lib/types';

	let { rotation, mapSlug = '' }: { rotation: RotationWithRounds | null; mapSlug?: string } = $props();

	const hasAttunements = $derived(ATTUNEMENT_MAP_SLUGS.has(mapSlug));

	function attunementColor(name: string): string {
		return ATTUNEMENTS[name as keyof typeof ATTUNEMENTS] ?? '#888';
	}
</script>

{#if !rotation}
	<p class="py-8 text-center text-muted-foreground">No rotation data yet for this week.</p>
{:else}
	<div class="space-y-3">
		{#if rotation.challenge}
			<div class="flex items-center gap-2 rounded-md bg-gray-800 px-3 py-2">
				<Badge variant="destructive" class="text-xs uppercase">Challenge</Badge>
				<span class="text-sm font-medium text-gray-100">{rotation.challenge.name}</span>
				{#if rotation.challenge.description}
					<span class="text-xs text-gray-400">— {rotation.challenge.description}</span>
				{/if}
			</div>
		{/if}

		{#each rotation.rounds as round}
			<div class="overflow-hidden rounded-lg border border-gray-700 bg-gray-800">
				<div class="border-b border-gray-700 bg-gray-900 px-3 py-1.5">
					<h3 class="text-sm font-bold uppercase tracking-wide text-gray-200">
						Stage {round.round_number}
					</h3>
				</div>

				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-gray-700 text-xs text-gray-400">
							<th class="w-12 px-2 py-1 text-left font-medium">Wave</th>
							{#each round.waves[0]?.spawns ?? [] as _, i}
								<th class="px-2 py-1 text-left font-medium">Spawn {i + 1}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each round.waves as wave, wi}
							<tr class="{wi % 2 === 0 ? 'bg-gray-800' : 'bg-gray-700/50'} border-b border-gray-700/50 last:border-0">
								<td class="px-2 py-1.5 font-mono text-xs font-semibold text-gray-400">
									{wave.wave_number}
								</td>
								{#each wave.spawns as spawn}
									{@const atts = spawn.element ?? []}
									<td class="px-2 py-1.5">
										<span class="font-medium text-gray-100">{spawn.location}</span>
										{#if hasAttunements && atts.length > 0}
											<span class="ml-1 inline-flex gap-0.5">
												{#each atts as att}
													<span
														class="inline-block h-2 w-2 rounded-full"
														style="background-color: {attunementColor(att)}"
														title={att}
													></span>
												{/each}
											</span>
										{/if}
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/each}
	</div>
{/if}
