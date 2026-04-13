<script lang="ts">
    type Option = string | { value: string; label: string };

    function optValue(o: Option): string {
        return typeof o === "string" ? o : o.value;
    }

    function optLabel(o: Option): string {
        return typeof o === "string" ? o : o.label;
    }

    let {
        options,
        name,
        value = $bindable(""),
        required = false,
        allowDeselect = false,
    }: {
        options: readonly Option[];
        name: string;
        value: string;
        required?: boolean;
        /** If true, clicking the active segment clears the value. Use `required={false}` when you need empty submit until server validation. */
        allowDeselect?: boolean;
    } = $props();

    function onSegmentClick(option: Option) {
        const v = optValue(option);
        if (allowDeselect && value === v) {
            value = "";
        } else {
            value = v;
        }
    }
</script>

<input type="hidden" {name} {value} {required} />
<div class="segmented-control">
    {#each options as option}
        <button
            type="button"
            class="segmented-control__option {value === optValue(option)
                ? 'segmented-control__option--active'
                : 'segmented-control__option--inactive'}"
            onclick={() => onSegmentClick(option)}
        >
            {optLabel(option)}
        </button>
    {/each}
</div>
