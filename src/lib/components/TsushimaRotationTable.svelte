<script lang="ts">
  import type { TsushimaPayloadJson } from "$lib/types";

  let {
    payload,
    poster = false,
  }: {
    payload: TsushimaPayloadJson | null;
    poster?: boolean;
  } = $props();

  type WaveMod = { wave: number; name: string; icon?: string };

  let waves = $derived(
    payload?.waves ? [...payload.waves].sort((a, b) => a.wave - b.wave) : [],
  );

  function chunkByThree<T>(arr: T[]): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += 3) {
      out.push(arr.slice(i, i + 3));
    }
    return out;
  }

  let waveBlocks = $derived(chunkByThree(waves));

  function modifierForWave(waveNum: number): string | null {
    const raw = payload?.wave_modifiers;
    if (!Array.isArray(raw)) return null;
    for (const x of raw) {
      if (
        x &&
        typeof x === "object" &&
        "wave" in x &&
        (x as WaveMod).wave === waveNum
      ) {
        return (x as WaveMod).name ?? null;
      }
    }
    return null;
  }

  /** Poster only: power-wave modifier backdrop from CDN. */
  function posterModifierBgUrlForWave(waveNum: number): string | null {
    const raw = payload?.wave_modifiers;
    if (!Array.isArray(raw)) return null;
    for (const x of raw) {
      if (
        x &&
        typeof x === "object" &&
        "wave" in x &&
        (x as WaveMod).wave === waveNum
      ) {
        const icon = (x as WaveMod).icon?.trim();
        if (!icon) return null;
        return `https://cdn.tsushimaru.com/mods_tsushima/mods/mods_${encodeURIComponent(icon)}`;
      }
    }
    return null;
  }

  const BONUS_WAVES = [2, 4, 7, 10, 13] as const;

  type BonusObjectiveEntry = {
    wave?: number;
    icon?: string;
    name?: string;
    target?: number;
  };

  /**
   * Same matching rules as the bonus backdrop image: explicit `wave` on entries, else
   * row `i` -> BONUS_WAVES[i].
   */
  function bonusObjectiveEntryForWave(
    waveNum: number,
  ): BonusObjectiveEntry | null {
    const raw = payload?.bonus_objectives;
    if (!Array.isArray(raw) || raw.length === 0) return null;

    const hasExplicitWave = raw.some(
      (e) =>
        e &&
        typeof e === "object" &&
        typeof (e as { wave?: number }).wave === "number",
    );

    if (hasExplicitWave) {
      for (const entry of raw) {
        if (!entry || typeof entry !== "object") continue;
        const o = entry as BonusObjectiveEntry;
        if (o.wave !== waveNum) continue;
        return o;
      }
      return null;
    }

    const idx = BONUS_WAVES.indexOf(waveNum as (typeof BONUS_WAVES)[number]);
    if (idx < 0) return null;
    const entry = raw[idx];
    if (!entry || typeof entry !== "object") return null;
    return entry as BonusObjectiveEntry;
  }

  /** Poster: e.g. "Shoot enemies with headshots. - 25" */
  function posterBonusObjectiveLineForWave(waveNum: number): string | null {
    const o = bonusObjectiveEntryForWave(waveNum);
    if (!o) return null;
    const name = String(o.name ?? "").trim();
    if (!name) return null;
    const t = o.target;
    if (typeof t !== "number" || !Number.isFinite(t)) return null;
    return `${name} - ${t}`;
  }

  /** Poster only: bonus objective icon from `bonus_objectives` (per-wave or by row order). */
  function posterObjectiveBgUrlForWave(waveNum: number): string | null {
    const o = bonusObjectiveEntryForWave(waveNum);
    if (!o) return null;
    const icon = String(o.icon ?? "").trim();
    if (!icon) return null;
    return `https://cdn.tsushimaru.com/objectives_tsushima/objectives_${encodeURIComponent(icon)}`;
  }

  let borderClass = $derived(poster ? "border-white/25" : "border-border");

  function formatLabel(value: string): string {
    return value
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  type WeeklyMod = { slot?: number; name?: string; icon?: string };

  function weeklyModsForPoster(): [WeeklyMod | null, WeeklyMod | null] {
    const raw = payload?.weekly_modifiers;
    if (!Array.isArray(raw)) return [null, null];
    const mods = raw.filter((x): x is WeeklyMod => !!x && typeof x === "object");
    const slot1 = mods.find((m) => m.slot === 1) ?? mods[0] ?? null;
    const slot2 = mods.find((m) => m.slot === 2) ?? mods[1] ?? null;
    return [slot1, slot2];
  }

  function posterWeeklyIconUrl(mod: WeeklyMod | null): string | null {
    const icon = mod?.icon?.trim();
    if (!icon) return null;
    const slot = mod?.slot === 2 ? 2 : 1;
    return `https://cdn.tsushimaru.com/mods_tsushima/mod${slot}/mod${slot}_${encodeURIComponent(icon)}`;
  }

  let posterWeeklyMods = $derived(weeklyModsForPoster());
  let posterSlot1 = $derived(posterWeeklyMods[0]);
  let posterSlot2 = $derived(posterWeeklyMods[1]);
</script>

{#if !payload || waves.length === 0}
  <p
    class="py-8 text-center text-sm {poster
      ? 'text-white/70'
      : 'text-muted-foreground'}"
  >
    No Tsushima wave data in this rotation.
  </p>
{:else if poster}
  <div class="space-y-5">
    <div class="rounded-lg border border-white/25 px-4 py-3">
      <div class="grid gap-1">
        {#if posterSlot1}
          <div class="flex items-center justify-between gap-3">
            <p class="poster-accent-text text-[13px] font-semibold uppercase tracking-wide">
              {posterSlot1.name ?? "Weekly Modifier 1"}
            </p>
            {#if posterWeeklyIconUrl(posterSlot1)}
              <img
                src={posterWeeklyIconUrl(posterSlot1) ?? ""}
                alt={posterSlot1.name ?? "Weekly modifier 1"}
                class="h-8 w-8 shrink-0 object-contain"
                loading="lazy"
                decoding="async"
              />
            {/if}
          </div>
        {/if}
        {#if posterSlot2}
          <div class="flex items-center justify-between gap-3">
            <p class="poster-accent-text text-[13px] font-semibold uppercase tracking-wide">
              {posterSlot2.name ?? "Weekly Modifier 2"}
            </p>
            {#if posterWeeklyIconUrl(posterSlot2)}
              <img
                src={posterWeeklyIconUrl(posterSlot2) ?? ""}
                alt={posterSlot2.name ?? "Weekly modifier 2"}
                class="h-8 w-8 shrink-0 object-contain"
                loading="lazy"
                decoding="async"
              />
            {/if}
          </div>
        {/if}
      </div>
    </div>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
      {#each waves as wave}
        {@const bonusLine = posterBonusObjectiveLineForWave(wave.wave)}
        <div
          class="relative overflow-hidden rounded-lg border border-white/25 px-4 pb-4 pt-3.5"
        >
          {#if posterModifierBgUrlForWave(wave.wave)}
            <img
              src={posterModifierBgUrlForWave(wave.wave) ?? ""}
              alt=""
              class="pointer-events-none absolute inset-0 h-full w-full object-contain object-center opacity-20"
              aria-hidden="true"
              loading="lazy"
              decoding="async"
            />
          {/if}
          {#if posterObjectiveBgUrlForWave(wave.wave)}
            <img
              src={posterObjectiveBgUrlForWave(wave.wave) ?? ""}
              alt=""
              class="pointer-events-none absolute inset-0 h-full w-full object-contain object-center opacity-20"
              aria-hidden="true"
              loading="lazy"
              decoding="async"
            />
          {/if}
          <div
            class="relative z-10 mb-4 flex items-center justify-between gap-2.5"
          >
            <span
              class="shrink-0 text-xl font-semibold tracking-tight text-white/65"
            >
              {wave.wave}
            </span>
            {#if modifierForWave(wave.wave)}
              <span
                class="poster-accent-text min-w-0 text-right text-[11px] font-semibold uppercase leading-tight tracking-widest break-words"
              >
                {modifierForWave(wave.wave)}
              </span>
            {:else if bonusLine}
              <span
                class="poster-accent-text min-w-0 text-right text-[9px] font-semibold uppercase leading-tight tracking-widest break-words"
              >
                {bonusLine}
              </span>
            {/if}
          </div>

          <div class="relative z-10 grid gap-x-3" style="grid-template-columns: repeat(3, 1fr);">
            {#each [...wave.spawns].sort((a, b) => a.order - b.order) as spawn}
              <div class="min-w-0 text-center">
                <div
                  class="break-words text-[13px] font-bold leading-tight text-white uppercase"
                >
                  {formatLabel(spawn.zone || "—")}
                </div>
                {#if spawn.spawn && spawn.spawn !== spawn.zone}
                  <div
                    class="poster-subtle-text mt-2 break-words text-[11px] font-medium tracking-wider uppercase"
                  >
                    {formatLabel(spawn.spawn)}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>
{:else}
  <!-- Weekly summary strip (once) -->
  <div
    class="map-table-stage mb-5 overflow-hidden rounded-lg border {borderClass}"
  >
    <div class="map-table-stage-header border-b px-3 py-3 {borderClass}">
      <div
        class="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between"
      >
        <h3
          class="text-sm font-bold uppercase tracking-[0.12em] sm:text-base {poster
            ? 'text-[#FFBD39]'
            : 'map-table-stage-title'}"
        >
          Week {payload.week_code}
        </h3>
        {#if payload.weekly_modifiers?.length}
          <span
            class="text-xs font-medium leading-snug tracking-wide sm:text-sm {poster
              ? 'text-white/85'
              : 'map-table-note'}"
          >
            {payload.weekly_modifiers.map((m) => m.name).join(" · ")}
          </span>
        {/if}
      </div>
    </div>
  </div>

  <div class="space-y-5">
    {#each waveBlocks as block}
      <div class="map-table-stage overflow-hidden rounded-lg border {borderClass}">
        <div class="overflow-x-auto">
          <table class="w-full table-fixed text-xs sm:text-sm">
            <colgroup>
              <col style="width: 10%" />
              <col style="width: 30%" />
              <col style="width: 30%" />
              <col style="width: 30%" />
            </colgroup>
            <tbody>
              {#each block as wave}
                <tr class="map-table-row border-b last:border-0 {poster ? 'border-white/12' : ''}">
                  <td
                    class="map-table-wave min-w-0 px-0.5 py-2 text-center font-mono text-[10px] font-semibold leading-none tabular-nums tracking-tight sm:px-1 sm:py-3 sm:text-[11px]"
                  >
                    {wave.wave}
                  </td>
                  {#each [...wave.spawns].sort((a, b) => a.order - b.order) as spawn, si}
                    <td
                      class="px-1 py-2 sm:px-2 sm:py-3 {(si + 1) % 2 === 0
                        ? 'map-table-column-alt'
                        : ''}"
                    >
                      {#if spawn.zone === spawn.spawn}
                        <div class="space-y-1 text-center">
                          <span
                            class="map-table-location break-words text-center text-[11px] leading-tight font-medium sm:text-sm"
                          >
                            {spawn.zone}
                          </span>
                        </div>
                      {:else}
                        <div class="space-y-1 text-center">
                          <span
                            class="map-table-location break-words text-center text-[11px] leading-tight font-medium sm:text-sm"
                          >
                            {spawn.zone}
                          </span>
                          <div
                            class="map-table-point text-center text-[11px] font-medium uppercase tracking-wide"
                          >
                            {spawn.spawn}
                          </div>
                        </div>
                      {/if}
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/each}
  </div>
{/if}
