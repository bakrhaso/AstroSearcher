<script>
	import Colony from "./colony.svelte"
	import { Button } from "flowbite-svelte"
	import { PlusSolid } from "flowbite-svelte-icons"

	let colonies = 1

	function addColony() {
		colonies = colonies + 1
	}
</script>

<div id="colonies">
	{#each { length: colonies } as _, index}
		<div class="colony-wrapper">
			<h2 class="mb-1 text-xl font-medium text-white">Colony {index + 1}</h2>
			<Colony index={index} />
		</div>
	{/each}

	<Button type="button" on:click={addColony} aria-label="Add a colony" class="text-3xl">
		<PlusSolid />
	</Button>
</div>
