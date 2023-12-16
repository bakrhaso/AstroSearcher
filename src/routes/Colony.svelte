<script>
	import { colonyFilterStore } from "$lib/colonyFilterStore.js"
	import { groupBy, stringComparator, humanReadable } from "$lib/utils.js"
	import { getConditionOptions, getPlanetOptions } from "$lib/criteriaOptions.js"

	/**
	 * @type number
	 */
	export let index

	/**
	 * @type Colony
	 */
	const colony = {
		planetTypeDisplayNames: new Set(),
		conditions: { exact: new Map(), gte: new Map() },
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

	// I can't find a more dynamic way of doing this.
	const gteGroups = new Set(["ore", "rare_ore", "volatiles", "organics", "farmland", "ruins"])

	function updateConditions(group, id) {
		if (`${group}_any` === id) {
			if (gteGroups.has(group)) {
				colony.conditions.gte.delete(group)
			} else {
				colony.conditions.exact.delete(group)
			}
		} else {
			if (gteGroups.has(group)) {
				colony.conditions.gte.set(group, id)
			} else {
				colony.conditions.exact.set(group, id)
			}
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
	<div class="condition-options-wrapper">
		{#each conditionOptionsGroupedByCategory as [group, conditionOptions] (group)}
			<fieldset>
				<legend>{humanReadable(group)}</legend>
				{#each conditionOptions as conditionOption}
					<div>
						<input type="radio" name={group} id="{`${index}-${conditionOption.id}`}"
							   on:change={_e => updateConditions(group, conditionOption.id)}>
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
