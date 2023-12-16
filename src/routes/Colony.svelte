<script>
	import { colonyFilterStore } from "$lib/colonyFilterStore.js"
	import { groupBy, stringComparator, humanReadable } from "$lib/utils.js"
	import { getConditionOptions, getPlanetOptions } from "$lib/criteriaOptions.js"
	import { Accordion, AccordionItem } from "flowbite-svelte"

	/**
	 * @type number
	 */
	export let index

	const accordionItems = [];

	/**
	 * @type Colony
	 */
	const colony = {
		planetTypes: new Set(),
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
			typeIds.forEach(it => colony.planetTypes.add(it))
		} else {
			typeIds.forEach(it => colony.planetTypes.delete(it))
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
	<Accordion multiple>
		<AccordionItem bind:open={accordionItems[0]}>
			<span slot="header">Planet types</span>
			<fieldset class="planet-type-fieldset">
				<legend>Matches all selected</legend>
				{#each planetOptionsGroupedByDisplayName as [displayName, planetOptions]}
					<div>
						<input type="checkbox" id={`${index}-${displayName}`}
							   on:change={e => updatePlanetType(e.target.checked, planetOptions.map(it => it.id))}>
						<label for={`${index}-${displayName}`}>{displayName}</label>
					</div>
				{/each}
			</fieldset>
		</AccordionItem>
		<AccordionItem bind:open={accordionItems[1]}>
			<div slot="header">Conditions & Resources</div>
			<p>The "Any ... Condition" will match any condition. This is the same as not making a selection at all.</p>
			<p>The "No ... Condition" will match planets that do not have any of the conditions in that group.</p>
			<p>Resources (ore, farmland, etc.) will match the selected option or better.</p>
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
		</AccordionItem>
	</Accordion>
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
