<script>
	import { colonyFilterStore } from "$lib/colony-filter-store.js"
	import { groupBy, humanReadable, stringComparator } from "$lib/utils.js"
	import { getConditionOptions, getPlanetOptions } from "$lib/criteria-options.js"
	import { Accordion, AccordionItem, Checkbox, Radio } from "flowbite-svelte"

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
	 * @param planetOptionsGroup
	 */
	function updatePlanetType(checked, planetOptionsGroup) {
		planetOptionsGroup.checked = checked
		if (checked === true) {
			planetOptionsGroup.planetOptions.forEach(it => colony.planetTypes.add(it.id))
		} else {
			planetOptionsGroup.planetOptions.forEach(it => colony.planetTypes.delete(it.id))
		}
	}

	// I can't find a more dynamic way of doing this. TODO Should probably be a property on the groups instead?
	const gteGroups = new Set(["ore", "rare_ore", "volatiles", "organics", "farmland", "ruins"])

	function updateConditions(group, id) {
		if (gteGroups.has(group)) {
			colony.conditions.gte.set(group, id)
		} else {
			colony.conditions.exact.set(group, id)
		}
	}

	const planetOptions = getPlanetOptions()
	const conditionOptions = getConditionOptions()

	const planetOptionsGrouped = Object.entries(groupBy(planetOptions, it => it.displayName))
		.map(it => {
			return { displayName: it[0], planetOptions: it[1], checked: false }
		})
		.sort((a, b) => stringComparator(a[0], b[0])) // sort alphabetically

	const conditionOptionsGrouped = Object.entries(groupBy(conditionOptions, it => it.group))
		.map(it => {
			const none = { id: `${it[0]}_none`, group: it[0], displayName: `None` }
			// Taking suggestions for a good display name for the any-matcher
			const any = { id: `${it[0]}_any`, group: it[0], displayName: `Any/None` }

			updateConditions(any.group, any.id)

			return { group: it[0], selected: `${it[0]}_any`, any, none, options: it[1] }
		})
		.sort((a, b) => a.options.length - b.options.length) // sort ascending, just looks a bit nicer IMO
</script>

<div>
	<Accordion multiple>
		<!-- defaultClass was copy-pasted from https://flowbite-svelte.com/docs/components/accordion#AccordionItem_styling -->
		<!-- but I removed rounded corners -->
		<AccordionItem open class="p-2 ps-5 pe-5"
					   defaultClass="flex items-center justify-between w-full font-medium text-left border-gray-200 dark:border-gray-700 p-2">
			<span slot="header">Planet types</span>
			<fieldset class="grid grid-cols-4">
				{#each planetOptionsGrouped as planetOptionsGroup}
					<Checkbox id={`${index}-${planetOptionsGroup.displayName}`}
							  bind:checked={planetOptionsGroup.checked}
							  on:change={e => updatePlanetType(e.target.checked, planetOptionsGroup)}>
						{planetOptionsGroup.displayName}
					</Checkbox>
				{/each}
			</fieldset>
		</AccordionItem>
		<AccordionItem open class="p-2 ps-5 pe-5">
			<div slot="header">Conditions & Resources</div>
			<div class="grid grid-cols-4 gap-2">
				{#each conditionOptionsGrouped as conditionOptionsGroup}
					<fieldset class="border text-neutral-50 border-neutral-500">
						<legend>{humanReadable(conditionOptionsGroup.group)}</legend>
						<div class="ps-1 last:pb-1 flex gap-3">
							<Radio bind:group={conditionOptionsGroup.selected}
								   name={`${index}-${conditionOptionsGroup.group}`}
								   value={conditionOptionsGroup.any.id}
								   on:change={_ => updateConditions(conditionOptionsGroup.group, conditionOptionsGroup.any.id)}
								   id={`${index}-${conditionOptionsGroup.any.id}`}>
								{conditionOptionsGroup.any.displayName}
							</Radio>
							<Radio bind:group={conditionOptionsGroup.selected}
								   name={`${index}-${conditionOptionsGroup.group}`}
								   value={conditionOptionsGroup.none.id}
								   on:change={_ => updateConditions(conditionOptionsGroup.group, conditionOptionsGroup.none.id)}
								   id={`${index}-${conditionOptionsGroup.none.id}`}>
								{conditionOptionsGroup.none.displayName}
							</Radio>
						</div>
						{#each conditionOptionsGroup.options as conditionOption}
							<Radio bind:group={conditionOptionsGroup.selected}
								   name={`${index}-${conditionOptionsGroup.group}`}
								   value={conditionOption.id}
								   on:change={_ => updateConditions(conditionOptionsGroup.group, conditionOption.id)}
								   id={`${index}-${conditionOption.id}`}
								   class="ps-1 last:pb-1">
								{conditionOption.displayName}
							</Radio>
						{/each}
					</fieldset>
				{/each}
			</div>
		</AccordionItem>
	</Accordion>
</div>
