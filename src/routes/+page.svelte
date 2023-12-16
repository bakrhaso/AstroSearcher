<script>
	import Colonies from "./Colonies.svelte"
	import { colonyFilterStore } from "$lib/colonyFilterStore.js"
	import { readSaveFile, character } from "$lib/saveReader.js"
	import { search } from "$lib/Search.js"

	/**
	 * @type FileList
	 */
	let saveFile
	let saveFilePromise

	function submit() {
		search($colonyFilterStore)
	}

	$: if (saveFile) {
		saveFilePromise = readSaveFile(saveFile.item(0))
	}
</script>

<svelte:head>
	<title>AstroSearcher</title>
	<meta name="description" content="Find the perfect Starsector colony" />
</svelte:head>

<section>
	<h1>
		AstroSearcher
	</h1>

	<form autocomplete="off" on:submit|preventDefault={submit}>

		<label for="save">Select your save:</label>
		<input bind:files={saveFile} id="save" type="file" />
		{#await saveFilePromise}
			<p>Parsing save file...</p>
		{:then _res}
			{#if character}
				<p>Hello, {character.honorific} {character.name}!</p>
			{/if}
		{/await}
		<Colonies />
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
