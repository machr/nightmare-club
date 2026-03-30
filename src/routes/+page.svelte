<script lang="ts">
  import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
  } from "$lib/components/ui/tabs";
  import { Button } from "$lib/components/ui/button";
  import { Download } from "lucide-svelte";
  import MapTable from "$lib/components/MapTable.svelte";
  import WaveCards from "$lib/components/WaveCards.svelte";
  import ResetCountdown from "$lib/components/ResetCountdown.svelte";
  import ThemeToggle from "$lib/components/ThemeToggle.svelte";
  import { onMount } from "svelte";
  import { readStoredTheme, type Theme } from "$lib/theme";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let captureTarget = $state<HTMLDivElement | undefined>(undefined);
  let downloading = $state(false);
  let theme = $state<Theme>("poster");
  let selectedMap = $state(0);

  onMount(() => {
    theme = readStoredTheme();
  });

  let isPoster = $derived(theme === "poster");
  let currentMap = $derived(data.maps[selectedMap]);

  async function downloadAsJpeg() {
    if (!captureTarget || downloading) return;
    downloading = true;
    try {
      const { domToJpeg } = await import("modern-screenshot");
      const exportWidth = Math.max(captureTarget.clientWidth, 820);
      const backgroundColor = getComputedStyle(document.body).backgroundColor;
      const dataUrl = await domToJpeg(captureTarget, {
        quality: 0.92,
        scale: 2,
        backgroundColor,
        style: {
          padding: "24px",
          width: `${exportWidth}px`,
          maxWidth: `${exportWidth}px`,
          overflow: "hidden",
        },
        filter: (node: Node) => {
          if (
            node instanceof HTMLElement &&
            node.hasAttribute("data-html2img-ignore")
          )
            return false;
          return true;
        },
      });
      const link = document.createElement("a");
      link.download = `nightmare-club-rotations-${new Date().toISOString().slice(0, 10)}.jpg`;
      link.href = dataUrl;
      link.click();
    } finally {
      downloading = false;
    }
  }

  let defaultTab = $derived(data.maps[0]?.slug ?? "");

  function shortName(name: string): string {
    const match = name.match(/\(([^)]+)\)/);
    return match ? match[1] : name;
  }
</script>

<div class="mx-auto min-h-screen max-w-5xl px-2 py-4 sm:px-4 sm:py-8">
  <!-- View switcher -->
  <div class="mb-6 flex justify-end" data-html2img-ignore>
    <ThemeToggle bind:theme />
  </div>

  {#if data.maps.length === 0}
    <p class="text-center text-muted-foreground">
      No rotation data available yet for this week.
    </p>
  {:else if isPoster}
    <!-- ==================== POSTER VIEW ==================== -->

    <!-- Map selector (multiple maps) -->
    {#if data.maps.length > 1}
      <div class="mb-6 flex gap-2 overflow-x-auto" data-html2img-ignore>
        {#each data.maps as map, i}
          <button
            class="whitespace-nowrap rounded-md border border-white/25 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors {selectedMap === i ? 'bg-white text-[#131313]' : 'bg-transparent text-white'}"
            onclick={() => selectedMap = i}
          >
            {shortName(map.name)}
          </button>
        {/each}
      </div>
    {/if}

    <div bind:this={captureTarget}>
      <!-- Poster header -->
      <div class="mb-8">
        <!-- Top row: logo+title (left) / countdown (right) -->
        <div class="flex flex-col items-center text-center md:flex-row md:items-center md:text-left">
          <div class="flex flex-col items-center md:flex-row md:items-center md:gap-4">
            <img src="/nightmare-logo.svg" alt="Nightmare Club" class="mb-3 h-16 w-auto md:mb-0 md:h-20" />
            <div>
              <h1 class="text-2xl font-bold uppercase tracking-widest text-white md:text-4xl">
                Nightmare Club
              </h1>
              <p class="mt-1 text-sm font-medium uppercase tracking-[0.25em] text-white/70">
                Spawn Rotations
              </p>
            </div>
          </div>

          <div class="mt-4 md:mt-0 md:ml-auto">
            <ResetCountdown />
          </div>
        </div>

        <!-- Divider -->
        <div class="my-5 h-px w-full bg-white"></div>

        <!-- Map name (left) + Download button (right) -->
        <div class="flex flex-col items-center text-center md:flex-row md:items-start md:text-left">
          {#if currentMap}
            <div>
              <h2 class="text-sm font-bold uppercase tracking-wider text-white md:text-lg">
                {currentMap.name.replace("(", "- ").replace(")", "").toUpperCase()}
              </h2>
              {#if currentMap.rotation?.credit_text}
                <p class="mt-1 text-xs text-muted-foreground">
                  {currentMap.rotation.credit_text}
                </p>
              {/if}
            </div>
          {/if}

          <div class="mt-4 md:mt-0 md:ml-auto" data-html2img-ignore>
            <button
              class="inline-flex items-center gap-2 rounded-md border border-transparent bg-white/10 px-5 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors md:border-white md:bg-transparent"
              onclick={downloadAsJpeg}
              disabled={downloading}
            >
              <Download class="h-3.5 w-3.5" />
              {downloading ? "Saving..." : "Download as Image"}
            </button>
          </div>
        </div>
      </div>

      <!-- Wave cards -->
      <WaveCards rotation={currentMap?.rotation ?? null} />
    </div>

  {:else}
    <!-- ==================== TABLE VIEW ==================== -->

    <div bind:this={captureTarget}>
      <div class="mb-6 text-center">
        <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">
          Nightmare Club — Spawn Rotations
        </h1>
        <div class="mt-2">
          <ResetCountdown />
        </div>
        <div class="mt-3" data-html2img-ignore>
          <Button
            variant="secondary"
            size="sm"
            onclick={downloadAsJpeg}
            disabled={downloading}
          >
            <Download class="mr-1.5 h-3.5 w-3.5" />
            {downloading ? "Saving..." : "Download as Image"}
          </Button>
        </div>
      </div>

      {#if data.maps.length === 1}
        <h2 class="mb-3 text-center text-lg font-semibold">{data.maps[0].name}</h2>
        {#if data.maps[0].rotation?.credit_text}
          <p class="mb-3 text-center text-sm text-muted-foreground">
            {data.maps[0].rotation.credit_text}
          </p>
        {/if}
        <MapTable rotation={data.maps[0].rotation} mapSlug={data.maps[0].slug} />
      {:else}
        <Tabs value={defaultTab}>
          <TabsList
            class="mb-3 grid w-full"
            style="grid-template-columns: repeat({data.maps.length}, 1fr);"
          >
            {#each data.maps as map}
              <TabsTrigger value={map.slug} class="text-xs sm:text-sm"
                >{shortName(map.name)}</TabsTrigger
              >
            {/each}
          </TabsList>
          {#each data.maps as map}
            <TabsContent value={map.slug}>
              {#if map.rotation?.credit_text}
                <p class="mb-3 text-center text-sm text-muted-foreground">
                  {map.rotation.credit_text}
                </p>
              {/if}
              <MapTable rotation={map.rotation} mapSlug={map.slug} />
            </TabsContent>
          {/each}
        </Tabs>
      {/if}
    </div>
  {/if}
</div>
