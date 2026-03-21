<script lang="ts">
    import {
        Tabs,
        TabsList,
        TabsTrigger,
        TabsContent,
    } from "$lib/components/ui/tabs";
    import MapTable from "$lib/components/MapTable.svelte";
    import ResetCountdown from "$lib/components/ResetCountdown.svelte";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    function formatWeekRange(weekStart: string): string {
        const start = new Date(weekStart + "T00:00:00");
        const end = new Date(start);
        end.setDate(end.getDate() + 6);

        const fmt = new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
        });
        return `${fmt.format(start)} – ${fmt.format(end)}`;
    }

    let currentWeek = $derived(() => {
        const firstRotation = data.maps.find((m) => m.rotation)?.rotation;
        if (!firstRotation) return "";
        return formatWeekRange(firstRotation.week_start);
    });

    let defaultTab = $derived(data.maps[0]?.slug ?? "");

    function shortName(name: string): string {
        const match = name.match(/\(([^)]+)\)/);
        return match ? match[1] : name;
    }
</script>

<div class="mx-auto max-w-5xl px-2 py-4 sm:px-4 sm:py-8">
    <div class="mb-6 text-center">
        <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">
            Nightmare Club — Spawn Rotations
        </h1>
        <!-- TODO fix week start
        {#if currentWeek()}
			<p class="mt-1 text-sm text-muted-foreground">Week of {currentWeek()}</p>
		{/if} -->
        <div class="mt-2">
            <ResetCountdown />
        </div>
    </div>

    {#if data.maps.length > 0}
        <Tabs value={defaultTab}>
            <TabsList class="mb-3 grid w-full grid-cols-4">
                {#each data.maps as map}
                    <TabsTrigger value={map.slug} class="text-xs sm:text-sm"
                        >{shortName(map.name)}</TabsTrigger
                    >
                {/each}
            </TabsList>
            {#each data.maps as map}
                <TabsContent value={map.slug}>
                    <MapTable rotation={map.rotation} mapSlug={map.slug} />
                </TabsContent>
            {/each}
        </Tabs>
    {:else}
        <p class="text-center text-muted-foreground">No maps available.</p>
    {/if}
</div>
