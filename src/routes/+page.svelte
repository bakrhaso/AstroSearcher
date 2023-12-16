<script>
	import Colonies from "./Colonies.svelte"
	import { colonyFilterStore } from "$lib/colonyFilterStore.js"
	import { readSaveFile, character } from "$lib/saveReader.js"
	import { search } from "$lib/Search.js"
	import { Button } from "flowbite-svelte"

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
		<Button type="submit">Search</Button>
	</form>
</section>
