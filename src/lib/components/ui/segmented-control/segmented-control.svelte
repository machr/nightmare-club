<script lang="ts">
    let {
        options,
        name,
        value = $bindable(""),
        required = false,
    }: {
        options: readonly string[];
        name: string;
        value: string;
        required?: boolean;
    } = $props();
</script>

<input type="hidden" {name} {value} {required} />
<div class="flex h-9 w-full items-center rounded-md bg-gray-700 p-0.5">
    {#each options as option}
        <button
            type="button"
            class="flex-1 px-1 py-2 text-center text-xs transition-colors hover:cursor-pointer {value ===
            option
                ? 'bg-gray-900 text-gray-100 rounded-md font-semibold'
                : 'text-gray-400 hover:text-gray-200'}"
            onclick={() => (value = option)}
        >
            {option}
        </button>
    {/each}
</div>
