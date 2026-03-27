<script lang="ts">
    import WaveCards from "$lib/components/WaveCards.svelte";
    import ResetCountdown from "$lib/components/ResetCountdown.svelte";
    import { Download } from "lucide-svelte";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    let selectedMap = $state(0);
    let downloading = $state(false);
    let captureTarget: HTMLDivElement;

    let currentMap = $derived(data.maps[selectedMap]);

    async function downloadAsJpeg() {
        if (!captureTarget || downloading) return;
        downloading = true;
        try {
            const { domToJpeg } = await import("modern-screenshot");
            const exportWidth = Math.max(captureTarget.clientWidth, 820);
            const dataUrl = await domToJpeg(captureTarget, {
                quality: 0.92,
                scale: 2,
                backgroundColor: "#131313",
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
</script>

<div class="min-h-screen px-4 py-6" style="background: #131313;">
    {#if data.maps.length === 0}
        <p class="text-center text-[#999]">No rotation data available.</p>
    {:else}
        <!-- Map selector -->
        {#if data.maps.length > 1}
            <div class="mb-6 flex gap-2 overflow-x-auto" data-html2img-ignore>
                {#each data.maps as map, i}
                    <button
                        class="whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors"
                        style="background: {selectedMap === i ? '#FFBD39' : 'transparent'}; color: {selectedMap === i ? '#131313' : '#FFBD39'}; border: 1px solid #FFBD39;"
                        onclick={() => selectedMap = i}
                    >
                        {map.name.match(/\(([^)]+)\)/)?.[1] ?? map.name}
                    </button>
                {/each}
            </div>
        {/if}

        <div bind:this={captureTarget}>
            <!-- Header -->
            <div class="mb-8 text-center">
                <!-- Logo -->
                <div class="mb-3 flex justify-center">
                    <img src="/nightmare-logo.svg" alt="Nightmare Club" class="h-16 w-auto" />
                </div>

                <!-- Title -->
                <h1 class="text-2xl font-bold uppercase tracking-widest text-white">
                    Nightmare Club
                </h1>
                <p class="mt-1 text-sm font-medium uppercase tracking-[0.25em] text-white/70">
                    Spawn Rotations
                </p>

                <!-- Divider -->
                <div class="mx-auto my-5 h-px w-full max-w-xs" style="background: white;"></div>

                <!-- Countdown -->
                <div class="mb-5">
                    <ResetCountdown />
                </div>

                <!-- Download button -->
                <div data-html2img-ignore>
                    <button
                        class="inline-flex items-center gap-2 rounded-md px-5 py-2 text-xs font-bold uppercase tracking-wider transition-colors"
                        style="background: #FFBD39; color: #131313;"
                        onclick={downloadAsJpeg}
                        disabled={downloading}
                    >
                        <Download class="h-3.5 w-3.5" />
                        {downloading ? "Saving..." : "Download as Image"}
                    </button>
                </div>

                <!-- Map name & credits -->
                {#if currentMap}
                    <div class="mt-6">
                        <h2 class="text-sm font-bold uppercase tracking-wider text-white">
                            {currentMap.name.replace("(", "- ").replace(")", "").toUpperCase()}
                        </h2>
                        {#if currentMap.rotation?.credit_text}
                            <p class="mt-1 text-xs" style="color: #FFBD39;">
                                {currentMap.rotation.credit_text}
                            </p>
                        {/if}
                    </div>
                {/if}
            </div>

            <!-- Wave cards -->
            <WaveCards rotation={currentMap?.rotation ?? null} />
        </div>
    {/if}
</div>
