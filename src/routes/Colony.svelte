<script>
	import { colonyFilterStore } from "$lib/colonyFilterStore.js"
	import { groupBy, stringComparator, humanReadable } from "$lib/utils.js"
	import { getConditionOptions, getPlanetOptions } from "$lib/criteriaOptions.js"

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
		resources: new Set(),
		buildings: new Set(),
		hasGate: false,
		hasRelay: false,
	}
	$colonyFilterStore[index] = colony

	/**
	 *
	 * @param checked
	 * @param {string[]} typeIds
	 */
	function updatePlanetType(checked, typeIds) {
		if (checked === true) {
			typeIds.forEach(it => colony.planetTypeDisplayNames.add(it))
		} else {
			typeIds.forEach(it => colony.planetTypeDisplayNames.delete(it))
		}
	}

	const planetOptions = getPlanetOptions()
	const conditionOptions = getConditionOptions()

	const planetOptionsGroupedByDisplayName = Object.entries(groupBy(planetOptions, it => it.displayName))
		.sort((a, b) => stringComparator(a[0], b[0])) // sort alphabetically

	const conditionOptionsGroupedByCategory = Object.entries(groupBy(conditionOptions, it => it.group))
		.map(it => {
			it[1].unshift({ id: `${it[0]}_any`, group: it[0], displayName: `Any ${humanReadable(it[0])} Condition` })
			it[1].push({ id: `${it[0]}_none`, group: it[0], displayName: `No ${humanReadable(it[0])} Condition` })
			return it
		})
		.sort((a, b) => a[1].length - b[1].length) // sort ascending

	console.log(conditionOptionsGroupedByCategory)
</script>

<div>
	<fieldset class="planet-type-fieldset">
		<legend>Planet types (matches all selected)</legend>
		{#each planetOptionsGroupedByDisplayName as [displayName, planetOptions]}
			<div>
				<input type="checkbox" id={`${index}-${displayName}`}
					   on:change={e => updatePlanetType(e.target.checked, planetOptions.map(it => it.id))}>
				<label for={`${index}-${displayName}`}>{displayName}</label>
			</div>
		{/each}
	</fieldset>
	<p>
		The "Any ... Condition" will match any condition. This is the same as not making a selection at all.
	</p>
	<p>
		The "No ... Condition" will match planets that do not have any of the conditions in that group.
	</p>
	<div class="condition-options-wrapper">
		{#each conditionOptionsGroupedByCategory as [group, conditionOptions]}
			<fieldset>
				<legend>{humanReadable(group)}</legend>
				{#each conditionOptions as conditionOption}
					<div>
						<input type="radio" id="{`${index}-${conditionOption.id}`}">
						<label for="{`${index}-${conditionOption.id}`}">{conditionOption.displayName}</label>
					</div>
				{/each}
			</fieldset>
		{/each}
	</div>
</div>

<style>
	.planet-type-fieldset {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr 1fr;
	}

	.condition-options-wrapper {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
	}
</style>
