<script>
	import planetTemplates from "$lib/planetTemplate.js"
	import { colonyFilterStore } from "$lib/colonyFilterStore.js"
	import { stringComparator } from "$lib/utils.js"

	/**
	 * @type number
	 */
	export let index

	/**
	 * @type {ColonyFilter} colony
	 */
	const colony = {
		planetTypeDisplayNames: new Set(),
		conditions: new Set(),
	}
	$colonyFilterStore[index] = colony

	function updatePlanetType(checked, type) {
		if (checked === true) {
			colony.planetTypeDisplayNames.add(type)
		} else {
			colony.planetTypeDisplayNames.delete(type)
		}
	}

	// sorted alphabetically
	let planetTemplatesGrouped = Object.entries(planetTemplates().groupedByDisplayName())
		.sort((a, b) => stringComparator(a[0], b[0]))
</script>

<div class="colony">
	<fieldset class="planet-type-fieldset">
		<legend>Planet types (matches all selected)</legend>
		{#each planetTemplatesGrouped as [displayName, template]}
			<div class="planet-type-checkbox">
				<input type="checkbox" name="planetType"
					   bind:checked={template.checked}
					   on:change={e => updatePlanetType(e.target.checked, template.map(it => it.id))}
					   value={displayName}
					   id={`${index}-${displayName}`}>
				<label for={`${index}-${displayName}`}>{displayName}</label>
			</div>
		{/each}
	</fieldset>
</div>

<style>
    .planet-type-fieldset {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr;
    }
</style>
