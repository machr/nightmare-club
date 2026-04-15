<script lang="ts">
    import { ROUND_STRUCTURE } from "$lib/constants";
    import { formatYoteiSpawnPointForDisplay } from "$lib/yotei-spawn";
    import type { RotationWithRounds } from "$lib/types";

    let {
        rotation,
    }: { rotation: RotationWithRounds | null } = $props();

    /** Calculate the cumulative wave number across all rounds */
    function cumulativeWaveNumber(roundNumber: number, waveNumber: number): number {
        let total = 0;
        for (let r = 1; r < roundNumber; r++) {
            total += ROUND_STRUCTURE[r as keyof typeof ROUND_STRUCTURE]?.waves ?? 0;
        }
        return total + waveNumber;
    }

    function formatLocation(location: string): string {
        return location
            .replace(/-/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
    }

    function formatSpawnPoint(point: string): string {
        const d = formatYoteiSpawnPointForDisplay(point);
        if (d) return d;
        return point.toUpperCase();
    }
</script>

{#if !rotation}
    <p class="py-8 text-center text-[#999]">
        No rotation data yet for this week.
    </p>
{:else}
    <div class="space-y-10">
        {#each rotation.rounds as round}
            {@const spawnCount = ROUND_STRUCTURE[round.round_number as keyof typeof ROUND_STRUCTURE]?.spawns ?? 3}
            <div>
                <!-- Stage header -->
                <div class="mb-4 px-1">
                    <h3 class="text-xl font-bold uppercase tracking-wide" style="color: #FFBD39;">
                        Stage {round.round_number}
                    </h3>
                    {#if round.challenge}
                        <p class="mt-0.5 text-[11px] font-semibold uppercase tracking-widest" style="color: #FFBD39;">
                            {round.challenge.description}
                        </p>
                    {/if}
                </div>

                <!-- Wave cards -->
                <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {#each round.waves as wave}
                        {@const globalWave = cumulativeWaveNumber(round.round_number, wave.wave_number)}
                        <div class="rounded-lg border border-white/25 px-4 pb-4 pt-3.5">
                            <!-- Wave header with diamond step -->
                            <div class="mb-4 flex items-center gap-2.5">
                                <span class="text-2xl font-bold tracking-tight text-white">
                                    {round.round_number} - {wave.wave_number}
                                </span>
                                <div class="relative inline-flex items-center">
                                    <svg width="87" height="33" viewBox="0 0 87 33" fill="none" xmlns="http://www.w3.org/2000/svg" class="block">
                                        <path d="M79.7641 10.2002V7.07977H76.6609L70.782 1.21815L64.9204 7.07977H61.8V10.2002L57.0934 14.0103H47.4218L38.8707 5.4592L30.3024 14.0103H20.3722L11.8211 5.4592L1.21851 16.0618L11.8211 26.6817L20.3722 18.1134H30.3024L38.8707 26.6817L47.4218 18.1134H57.0934L61.8 21.9407V25.0611H64.9204L70.782 30.9227L76.6609 25.0611H79.7641V21.9407L85.6429 16.0618L79.7641 10.2002Z" stroke="white" stroke-width="1.724" stroke-miterlimit="10"/>
                                    </svg>
                                    <!-- Wave number overlaid on the rightmost diamond -->
                                    <span
                                        class="absolute flex items-center justify-center text-[11px] font-bold text-white"
                                        style="left: 60px; top: 0; bottom: 0; width: 24px;"
                                    >
                                        {globalWave}
                                    </span>
                                </div>
                            </div>

                            <!-- Spawn locations -->
                            <div
                                class="grid {spawnCount === 4
                                    ? 'gap-x-1.5 md:gap-x-3'
                                    : 'gap-x-3'}"
                                style="grid-template-columns: repeat({spawnCount}, 1fr);"
                            >
                                {#each wave.spawns as spawn}
                                    <div class="min-w-0 text-center">
                                        <div
                                            class="{spawnCount === 4
                                                ? 'line-clamp-2 break-words text-[10px] md:text-[13px]'
                                                : 'text-[13px]'} font-bold uppercase leading-tight text-white"
                                        >
                                            {formatLocation(spawn.location)}
                                        </div>
                                        {#if spawn.spawn_point}
                                            <div
                                                class="{spawnCount === 4
                                                    ? 'mt-1 text-[10px] tracking-wide md:mt-2 md:text-[11px] md:tracking-wider'
                                                    : 'mt-2 text-[11px] tracking-wider'} font-medium uppercase text-white/40"
                                            >
                                                {formatSpawnPoint(spawn.spawn_point)}
                                            </div>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        {/each}
    </div>
{/if}
