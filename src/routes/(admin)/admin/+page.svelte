<script lang="ts">
    import { enhance } from "$app/forms";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Alert, AlertDescription } from "$lib/components/ui/alert";
    import { SegmentedControl } from "$lib/components/ui/segmented-control";
    import {
        ATTUNEMENT_NAMES,
        ROUND_STRUCTURE,
        ATTUNEMENT_MAP_SLUGS,
    } from "$lib/constants";
    import { YOTEI_SPAWN_UI_OPTIONS, spawnPointToUiValue } from "$lib/yotei-spawn";
    import { mapsForCycleWeek } from "$lib/yotei-schedule";
    import { roundChallengeSlugsForCycleWeek } from "$lib/yotei-challenge-schedule";
    import type { PageData, ActionData } from "./$types";

    let { data, form }: { data: PageData; form: ActionData } = $props();

    /** '' until user picks a survival cycle week (1–12). */
    let cycleWeek = $state("");
    let stageChallenges: Record<number, string> = $state({});

    let cycleWeekNum = $derived.by(() => {
        const n = Number(cycleWeek);
        if (!Number.isInteger(n) || n < 1 || n > 12) return null;
        return n;
    });

    let weekChosen = $derived(cycleWeekNum != null);

    let selectedMapId = $derived.by(() => {
        if (cycleWeekNum == null) return "";
        const slug = mapsForCycleWeek(cycleWeekNum)[0];
        const m = data.maps?.find((x: { slug: string }) => x.slug === slug);
        return m?.id ?? "";
    });

    let selectedMap = $derived(
        data.maps?.find((m: any) => m.id === selectedMapId) ?? null,
    );

    function weekMapLabel(week: number): string {
        const slug = mapsForCycleWeek(week)[0];
        const map = data.maps?.find((m: { slug: string; name: string }) => m.slug === slug);
        const name = map?.name ?? slug ?? "?";
        return `${week} — ${name}`;
    }
    let locations = $derived(selectedMap?.locations ?? []);
    let hasAttunements = $derived(
        ATTUNEMENT_MAP_SLUGS.has(selectedMap?.slug ?? ""),
    );

    let lockedRoundSlugs = $derived(
        cycleWeekNum != null ? roundChallengeSlugsForCycleWeek(cycleWeekNum) : null,
    );
    let challengesLocked = $derived(lockedRoundSlugs != null);

    let existingRotation = $derived(
        data.existingRotations?.find((r: any) => r.map_id === selectedMapId) ??
            null,
    );

    // Track second attunement visibility per spawn
    let showSecondAttunement: Record<string, boolean> = $state({});

    function getExistingSpawn(
        roundNum: number,
        waveNum: number,
        spawnIdx: number,
    ) {
        if (!existingRotation) return null;
        const round = existingRotation.rounds?.find(
            (r: any) => r.round_number === roundNum,
        );
        if (!round) return null;
        const wave = round.waves?.find((w: any) => w.wave_number === waveNum);
        if (!wave) return null;
        return (
            wave.spawns?.find((sp: any) => sp.spawn_order === spawnIdx) ?? null
        );
    }

    function getExistingAttunement(
        roundNum: number,
        waveNum: number,
        spawnIdx: number,
        idx: number,
    ): string {
        const spawn = getExistingSpawn(roundNum, waveNum, spawnIdx);
        if (!spawn) return "";
        const arr = spawn.element ?? [];
        return arr[idx] ?? "";
    }

    function spawnKey(r: number, w: number, s: number): string {
        return `${r}_${w}_${s}`;
    }

    function hasSecondAttunement(
        roundNum: number,
        waveNum: number,
        spawnIdx: number,
    ): boolean {
        const key = spawnKey(roundNum, waveNum, spawnIdx);
        if (showSecondAttunement[key] !== undefined)
            return showSecondAttunement[key];
        return getExistingAttunement(roundNum, waveNum, spawnIdx, 1) !== "";
    }

    // After save, keep the saved week (and thus map) in sync with server
    $effect(() => {
        if (form?.success && form.savedCycleWeek != null) {
            cycleWeek = String(form.savedCycleWeek);
        }
    });

    // Per-stage challenges: fixed by published schedule when locked; else from saved rotation
    $effect(() => {
        const wn = cycleWeekNum;
        if (wn == null) return;
        const locked = roundChallengeSlugsForCycleWeek(wn);
        if (locked) {
            const next: Record<number, string> = {};
            for (let r = 1; r <= 4; r++) {
                const slug = locked[r - 1];
                const ch = data.challenges?.find(
                    (c: { name: string }) => c.name === slug,
                );
                next[r] = ch?.id ?? "";
            }
            stageChallenges = next;
            return;
        }
        if (existingRotation?.rotation_challenges) {
            const init: Record<number, string> = {};
            for (const rc of existingRotation.rotation_challenges) {
                init[rc.round_number] = rc.challenge.id;
            }
            stageChallenges = init;
        } else {
            stageChallenges = {};
        }
    });

    const selectClass =
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
</script>

<div class="space-y-6">
    <h2 class="text-2xl font-bold">Edit Spawn Rotation</h2>

    {#if form?.success}
        <Alert
            class="border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200"
        >
            <AlertDescription>Rotation saved successfully!</AlertDescription>
        </Alert>
    {/if}

    {#if form?.error}
        <Alert variant="destructive">
            <AlertDescription>{form.error}</AlertDescription>
        </Alert>
    {/if}

    <form method="POST" action="?/save" use:enhance class="space-y-8">
        <input type="hidden" name="map_id" value={selectedMapId} />
        <input type="hidden" name="map_slug" value={selectedMap?.slug ?? ""} />
        <input type="hidden" name="existing_rotation_id" value={existingRotation?.id ?? ""} />

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="space-y-2">
                <label
                    for="cycle_week_map"
                    class="text-sm font-semibold text-foreground"
                    >Survival cycle week & map (1–12)</label
                >
                <select
                    id="cycle_week_map"
                    name="cycle_week"
                    class={selectClass}
                    bind:value={cycleWeek}
                    required={weekChosen}
                >
                    <option value="" disabled>Select a week</option>
                    {#each Array.from({ length: 12 }, (_, i) => i + 1) as w (w)}
                        <option value={w}>{weekMapLabel(w)}</option>
                    {/each}
                </select>
            </div>

            <div class="space-y-2">
                <span class="text-sm font-semibold text-foreground"
                    >Site week start (Melbourne)</span
                >
                <div
                    class="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm"
                >
                    {data.weekStart}
                </div>
            </div>
        </div>

        {#if weekChosen}
        <div class="space-y-2">
            <label
                for="credit_text"
                class="text-sm font-semibold text-foreground"
                >Give thanks and credit</label
            >
            <Input
                id="credit_text"
                name="credit_text"
                value={existingRotation?.credit_text ?? ""}
                placeholder="Thanks to Player 1 and Player 2 for gathering this week's data"
                class="h-10"
            />
        </div>

        {#key selectedMapId}
        {#each Object.keys(ROUND_STRUCTURE).map(Number) as roundNum}
            {@const { waves: waveCount, spawns: spawnCount } =
                ROUND_STRUCTURE[roundNum as keyof typeof ROUND_STRUCTURE]}
            {@const currentChallenge = stageChallenges[roundNum] ?? ""}
            <div class="rounded-lg border-2 border-border p-4 space-y-4">
                <div class="flex items-center justify-between gap-4">
                    <h3 class="text-lg font-bold text-foreground">
                        Stage {roundNum}
                    </h3>
                    <div class="min-w-0 flex-1 max-w-md">
                        {#if challengesLocked && lockedRoundSlugs}
                            <p class="mb-1 text-xs text-muted-foreground">
                                Challenge cards are fixed for this cycle week (published schedule).
                            </p>
                            <div
                                class="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm text-foreground"
                            >
                                {data.challenges?.find(
                                    (c: { id: string }) => c.id === currentChallenge,
                                )?.description ??
                                    lockedRoundSlugs[roundNum - 1] ??
                                    "—"}
                            </div>
                            <input
                                type="hidden"
                                name={`challenge_round_${roundNum}`}
                                value={currentChallenge}
                            />
                        {:else}
                            <select
                                class={selectClass}
                                value={currentChallenge}
                                onchange={(e) =>
                                    (stageChallenges[roundNum] = (e.target as HTMLSelectElement).value)}
                            >
                                <option value="">No Challenge</option>
                                {#each data.challenges as challenge}
                                    <option value={challenge.id}>
                                        {challenge.description}
                                    </option>
                                {/each}
                            </select>
                            <input
                                type="hidden"
                                name={`challenge_round_${roundNum}`}
                                value={currentChallenge}
                            />
                        {/if}
                    </div>
                </div>

                {#each Array.from({ length: waveCount }, (_, i) => i + 1) as waveNum}
                    <div class="space-y-2">
                        <h4 class="text-sm font-semibold text-foreground/70">
                            Wave {waveNum}
                        </h4>
                        <div
                            class="grid gap-3 {spawnCount === 3
                                ? 'grid-cols-3'
                                : 'grid-cols-2'}"
                        >
                            {#each Array.from({ length: spawnCount }, (_, i) => i + 1) as spawnIdx}
                                {@const existing = getExistingSpawn(
                                    roundNum,
                                    waveNum,
                                    spawnIdx,
                                )}
                                {@const key = spawnKey(
                                    roundNum,
                                    waveNum,
                                    spawnIdx,
                                )}
                                <div
                                    class="rounded-md border-2 border-border/60 bg-card p-2 space-y-1.5"
                                >
                                    <div class="flex items-center gap-1">
                                        <span
                                            class="text-xs font-bold text-foreground/60 w-4 shrink-0"
                                        >
                                            {spawnIdx}
                                        </span>
                                        <SegmentedControl
                                            options={locations}
                                            name={`round_${roundNum}_wave_${waveNum}_spawn_${spawnIdx}_location`}
                                            value={existing?.location ?? ""}
                                            required
                                        />
                                    </div>
                                    <div class="flex items-center gap-1 pl-5 min-w-0">
                                        <SegmentedControl
                                            options={YOTEI_SPAWN_UI_OPTIONS}
                                            name={`round_${roundNum}_wave_${waveNum}_spawn_${spawnIdx}_spawn_point`}
                                            value={spawnPointToUiValue(
                                                existing?.spawn_point,
                                            )}
                                            required={false}
                                            allowDeselect={true}
                                        />
                                    </div>
                                    {#if hasAttunements}
                                        <div
                                            class="flex items-center gap-2 pl-7"
                                        >
                                            <SegmentedControl
                                                options={ATTUNEMENT_NAMES}
                                                name={`round_${roundNum}_wave_${waveNum}_spawn_${spawnIdx}_attunement_1`}
                                                value={getExistingAttunement(
                                                    roundNum,
                                                    waveNum,
                                                    spawnIdx,
                                                    0,
                                                )}
                                                required={false}
                                                allowDeselect={true}
                                            />
                                            {#if hasSecondAttunement(roundNum, waveNum, spawnIdx)}
                                                <SegmentedControl
                                                    options={ATTUNEMENT_NAMES}
                                                    name={`round_${roundNum}_wave_${waveNum}_spawn_${spawnIdx}_attunement_2`}
                                                    value={getExistingAttunement(
                                                        roundNum,
                                                        waveNum,
                                                        spawnIdx,
                                                        1,
                                                    )}
                                                    required={false}
                                                    allowDeselect={true}
                                                />
                                                <button
                                                    type="button"
                                                    class="text-xs text-destructive hover:text-destructive/80"
                                                    onclick={() =>
                                                        (showSecondAttunement[
                                                            key
                                                        ] = false)}
                                                >
                                                    &times;
                                                </button>
                                            {:else}
                                                <button
                                                    type="button"
                                                    class="text-xs text-muted-foreground hover:text-foreground"
                                                    onclick={() =>
                                                        (showSecondAttunement[
                                                            key
                                                        ] = true)}
                                                >
                                                    +
                                                </button>
                                            {/if}
                                        </div>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    </div>
                {/each}
            </div>
        {/each}
        {/key}

        <Button type="submit" class="w-full sm:w-auto">Save Rotation</Button>
        {/if}
    </form>
</div>
