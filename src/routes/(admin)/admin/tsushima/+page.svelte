<script lang="ts">
  import { enhance } from "$app/forms";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Alert, AlertDescription } from "$lib/components/ui/alert";
  import { SegmentedControl } from "$lib/components/ui/segmented-control";
  import type { PageData, ActionData } from "./$types";
  import type {
    TsushimaMapRow,
    TsushimaPayloadJson,
    TsushimaRotationRow,
  } from "$lib/types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let selectedMapId = $state("");

  let selectedMap = $derived(
    data.maps?.find((m: TsushimaMapRow) => m.id === selectedMapId) ?? null,
  );

  let existingRotation = $derived(
    data.existingRotations?.find(
      (r: TsushimaRotationRow) => r.map_id === selectedMapId,
    ) ?? null,
  );

  function cellKey(w: number, s: number): string {
    return `${w}_${s}`;
  }

  function makeEmptyCellState(): Record<string, string> {
    const o: Record<string, string> = {};
    for (let w = 1; w <= 15; w++) {
      for (let s = 1; s <= 3; s++) {
        o[cellKey(w, s)] = "";
      }
    }
    return o;
  }

  /** Keys `wave_spawn` e.g. `3_2` → zone / spawn (all keys preset for bind:value) */
  let zoneByCell = $state(makeEmptyCellState());
  let spawnByCell = $state(makeEmptyCellState());

  let zoneNames = $derived(
    (selectedMap?.zones ?? []).map((z: { zone: string }) => z.zone),
  );

  function spawnOptionsForZone(zone: string): { value: string; label: string }[] {
    const z = selectedMap?.zones.find((x: { zone: string }) => x.zone === zone);
    return (z?.spawns ?? []).map((sp: string) => ({
      value: sp,
      label: sp,
    }));
  }

  $effect(() => {
    const rot = existingRotation;
    const waves = (rot?.payload as TsushimaPayloadJson | undefined)?.waves;
    for (let w = 1; w <= 15; w++) {
      for (let s = 1; s <= 3; s++) {
        const key = cellKey(w, s);
        const wave = waves?.find((x) => x.wave === w);
        const slot = wave?.spawns?.find((x) => x.order === s);
        zoneByCell[key] = slot?.zone?.trim() ?? "";
        spawnByCell[key] = slot?.spawn?.trim() ?? "";
      }
    }
  });

  /** Keep spawn synced with selected zone (including single-spawn zones). */
  $effect(() => {
    if (!selectedMap) return;
    for (let w = 1; w <= 15; w++) {
      for (let s = 1; s <= 3; s++) {
        const key = cellKey(w, s);
        const zName = zoneByCell[key] ?? "";
        if (!zName) {
          if (spawnByCell[key]) {
            spawnByCell[key] = "";
          }
          continue;
        }
        const zDef = selectedMap.zones.find(
          (x: { zone: string }) => x.zone === zName,
        );
        const allowed = zDef?.spawns ?? [];
        const cur = spawnByCell[key] ?? "";
        if (allowed.length === 1) {
          if (cur !== allowed[0]) {
            spawnByCell[key] = allowed[0];
          }
          continue;
        }
        if (cur && !allowed.includes(cur)) {
          spawnByCell[key] = "";
        }
      }
    }
  });

  $effect(() => {
    if (form?.savedMapId) {
      selectedMapId = form.savedMapId;
    }
  });

  const selectClass =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
</script>

<div class="space-y-6">
  <h2 class="text-2xl font-bold">Edit Tsushima Spawn Rotation</h2>

  {#if form?.success}
    <Alert
      class="border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200"
    >
      <AlertDescription>Tsushima rotation saved successfully!</AlertDescription>
    </Alert>
  {/if}

  {#if form?.error}
    <Alert variant="destructive">
      <AlertDescription>{form.error}</AlertDescription>
    </Alert>
  {/if}

  {#if data.maps.length === 0}
    <p class="text-muted-foreground">
      No Tsushima maps in database. Run Supabase migrations.
    </p>
  {:else}
    <form method="POST" action="?/save" use:enhance class="space-y-8">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="space-y-2">
          <label for="ts_map_id" class="text-sm font-semibold text-foreground"
            >Map</label
          >
          <select
            id="ts_map_id"
            name="map_id"
            class={selectClass}
            bind:value={selectedMapId}
            required
          >
            <option value="" disabled>Choose a map</option>
            {#each data.maps as map}
              <option value={map.id}>{map.name}</option>
            {/each}
          </select>
        </div>

        <div class="space-y-2">
          <span class="text-sm font-semibold text-foreground"
            >Week Start (Friday)</span
          >
          <div
            class="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm"
          >
            {data.weekStart}
          </div>
        </div>
      </div>

      {#if selectedMap}
        {#key selectedMapId}
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <label for="week_code" class="text-sm font-semibold text-foreground"
                >Week code</label
              >
              <select
                id="week_code"
                name="week_code"
                class={selectClass}
                required
              >
                {#each selectedMap.week_options as opt}
                  <option
                    value={opt.code}
                    selected={opt.code ===
                      (existingRotation?.week_code ??
                        selectedMap.week_options[0]?.code)}
                    >{opt.code}</option
                  >
                {/each}
              </select>
            </div>
          </div>

          <div class="space-y-2">
            <label for="credit_text" class="text-sm font-semibold text-foreground"
              >Credit / thanks</label
            >
            <Input
              id="credit_text"
              name="credit_text"
              value={existingRotation?.credit_text ?? ""}
              placeholder="Thanks to…"
              class="h-10"
            />
          </div>

          <div class="space-y-4">
            <h3 class="text-lg font-bold text-foreground">Waves (15 × 3 spawns)</h3>
            <p class="text-xs text-muted-foreground">
              Zone first, then spawn for that zone (spawn list updates when zone
              changes).
            </p>

            {#each Array.from({ length: 15 }, (_, i) => i + 1) as waveNum}
              <div class="rounded-lg border-2 border-border p-4 space-y-2">
                <h4 class="text-sm font-semibold text-foreground/80">
                  Wave {waveNum}
                </h4>
                <div class="grid gap-3 sm:grid-cols-3">
                  {#each Array.from({ length: 3 }, (_, i) => i + 1) as spawnIdx}
                    {@const k = cellKey(waveNum, spawnIdx)}
                    {@const zName = zoneByCell[k] ?? ""}
                    {@const spawnOpts = spawnOptionsForZone(zName)}
                    {@const hasSingleSpawn = spawnOpts.length === 1}
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
                          options={zoneNames}
                          name={`wave_${waveNum}_spawn_${spawnIdx}_zone`}
                          bind:value={zoneByCell[k]}
                          required={false}
                        />
                      </div>
                      <div class="flex items-center gap-1 pl-5 min-w-0">
                        {#key zName}
                          {#if zName && hasSingleSpawn}
                            <input
                              type="hidden"
                              name={`wave_${waveNum}_spawn_${spawnIdx}_spawn`}
                              value={spawnOpts[0].value}
                            />
                          {:else if zName && spawnOpts.length > 0}
                            <SegmentedControl
                              options={spawnOpts}
                              name={`wave_${waveNum}_spawn_${spawnIdx}_spawn`}
                              bind:value={spawnByCell[k]}
                              required={false}
                              allowDeselect={true}
                            />
                          {:else}
                            <input
                              type="hidden"
                              name={`wave_${waveNum}_spawn_${spawnIdx}_spawn`}
                              value=""
                            />
                          {/if}
                        {/key}
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/each}
          </div>

          <Button type="submit" class="w-full sm:w-auto">Save rotation</Button>
        {/key}
      {/if}
    </form>
  {/if}
</div>
