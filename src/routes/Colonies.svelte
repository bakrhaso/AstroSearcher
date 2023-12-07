<script>
	import Colony from "./Colony.svelte"
	import add from "$lib/images/add.svg"

	let colonies = 1

	function addColony() {
		colonies = colonies + 1
	}
</script>

<div id="colonies">
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