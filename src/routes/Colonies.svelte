<script>
	import Colony from "./Colony.svelte"
	import add from "$lib/images/add.svg"

	let colonies = 1

	function addColony() {
		colonies = colonies + 1
	}
</script>

<div id="colonies">
	<p>The "Any ... Condition" will match any condition. This is the same as not making a selection at all.</p>
	<p>The "No ... Condition" will match planets that do not have any of the conditions in that group.</p>
	<p>Resources (ore, farmland, etc.) will match the selected option or better.</p>
	{#each {length: colonies} as _, index}
		<div class="colony-wrapper">
			Colony {index + 1}
			<Colony index={index}/>
		</div>
	{/each}

	<button type="button" on:click={addColony} aria-label="Add a colony">
		<img src={add} alt="Add" width="30" height="30"/>
	</button>
</div>

<style>
	.colony-wrapper {
		margin: 15px;
	}
</style>