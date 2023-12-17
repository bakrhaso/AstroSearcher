<script>
	import { colonyFilterStore } from "$lib/colonyFilterStore.js"
	import { groupBy, humanReadable, stringComparator } from "$lib/utils.js"
	import { getConditionOptions, getPlanetOptions } from "$lib/criteriaOptions.js"
	import { Accordion, AccordionItem, Radio, RadioButton } from "flowbite-svelte"

	/**
	 * @type number
	 */
	export let index

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

	function updateConditions(e, group, id) {
		// console.log(e)
		if (gteGroups.has(group)) {
			colony.conditions.gte.set(group, id)
		} else {
			colony.conditions.exact.set(group, id)
		}
	}

	const planetOptions = getPlanetOptions()
	const conditionOptions = getConditionOptions()

	const planetOptionsGroupedByDisplayName = Object.entries(groupBy(planetOptions, it => it.displayName))
		.sort((a, b) => stringComparator(a[0], b[0])) // sort alphabetically

	const conditionOptionsGrouped = Object.entries(groupBy(conditionOptions, it => it.group))
		.map(it => {
			const none = { id: `${it[0]}_none`, group: it[0], displayName: `None` }
			const any = { id: `${it[0]}_any`, group: it[0], displayName: `Any`}

			return { group: it[0], selected: `${it[0]}_any`, any, none, options: it[1] }
		})
		.sort((a, b) => a.options.length - b.options.length) // sort ascending
</script>

<div>
	<Accordion multiple>
		<!--		copy pasted the default classes from https://flowbite-svelte.com/docs/components/accordion#AccordionItem_styling-->
		<!--		but removed rounded corners-->
		<AccordionItem
			defaultClass="flex items-center justify-between w-full font-medium text-left border-gray-200 dark:border-gray-700">
			<span slot="header">Planet types</span>
			<fieldset class="grid grid-cols-4">
				<legend>Matches all selected</legend>
				{#each planetOptionsGroupedByDisplayName as [displayName, planetOptions]}
					<div>
						<input type="checkbox" bind:checked={planetOptions.checked} id={`${index}-${displayName}`}
							   on:change={e => updatePlanetType(e.target.checked, planetOptions.map(it => it.id))}>
						<label for={`${index}-${displayName}`}>{displayName}</label>
					</div>
				{/each}
			</fieldset>
		</AccordionItem>
		<AccordionItem open>
			<div slot="header">Conditions & Resources</div>
			<div class="grid grid-cols-4 gap-2">
				{#each conditionOptionsGrouped as conditionOptionsGroup}
					<fieldset class="border text-neutral-50 border-neutral-500">
						<legend>{humanReadable(conditionOptionsGroup.group)}</legend>
						<div class="ps-1 last:pb-1 flex gap-3">
							<Radio bind:group={conditionOptionsGroup.selected}
										 name={conditionOptionsGroup.group} value={conditionOptionsGroup.any.id}
										 on:change={e => updateConditions(e, conditionOptionsGroup.group, conditionOptionsGroup.any.id)}>
								{conditionOptionsGroup.any.displayName}
							</Radio>
							<Radio bind:group={conditionOptionsGroup.selected}
										 name={conditionOptionsGroup.group} value={conditionOptionsGroup.none.id}
										 on:change={e => updateConditions(e, conditionOptionsGroup.group, conditionOptionsGroup.none.id)}>
								{conditionOptionsGroup.none.displayName}
							</Radio>
						</div>
						{#each conditionOptionsGroup.options as conditionOption}
							<div class="ps-1 last:pb-1">
								<Radio bind:group={conditionOptionsGroup.selected}
											 name={conditionOptionsGroup.group} value={conditionOption.id}
											 on:change={e => updateConditions(e, conditionOptionsGroup.group, conditionOption.id)}>
									{conditionOption.displayName}
								</Radio>
							</div>
						{/each}
					</fieldset>
				{/each}
			</div>
		</AccordionItem>
	</Accordion>
</div>
