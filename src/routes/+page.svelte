<script>
	import Colonies from "./Colonies.svelte";
	import { colonyFilterStore } from "$lib/colonyFilterStore.js"
	import { readSaveFile, character } from "$lib/saveReader.js"

	/**
	 * @type FileList
	 */
	let saveFile
	let saveFilePromise

	function search() {
		console.log($colonyFilterStore)
	}

	$: if (saveFile) {
		saveFilePromise = readSaveFile(saveFile.item(0))
	}
</script>

<svelte:head>
	<title>ColonyFinder</title>
	<meta name="description" content="Find the perfect Starsector colony"/>
</svelte:head>

<section>
	<h1>
		ColonyFinder
	</h1>

	<label for="save">Select your save:</label>
	<input bind:files={saveFile} id="save" type=file />
	{#await saveFilePromise}
		<p>Parsing save file...</p>
	{:then _res}
		{#if character}
			<p>Hello, {character.honorific} {character.name}!</p>
		{/if}
	{/await}

	<form on:submit|preventDefault={search}>
		<Colonies/>
		<button type="submit">Search</button>
	</form>
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}

	h1 {
		width: 100%;
	}
</style>
