<script>
	import Colonies from "./Colonies.svelte"
	import { colonyFilterStore } from "$lib/colonyFilterStore.js"
	import { readSaveFile, character } from "$lib/saveReader.js"
	import { search } from "$lib/Search.js"
	import { Button, Fileupload, Helper, Label } from "flowbite-svelte"

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
	<h1 class="mb-1.5 text-3xl font-medium text-white text-center">AstroSearcher</h1>

	<form autocomplete="off" on:submit|preventDefault={submit}>

		<Label for="save-upload" class="text-base">Upload savefile:</Label>
		<Fileupload id="save-upload" class="mb-1" bind:files={saveFile} />
		<Helper class="text-sm">Found in: starsector/saves/save_CHARACTER_NAME_123456789/campaign.xml</Helper>

		{#await saveFilePromise}
			<p>Parsing save file...</p>
		{:then _res}
			{#if character}
				<h2 class="text-center text-2xl pt-3">Hello, {character.honorific} {character.name}!</h2>
			{/if}
		{/await}
		<Colonies />
		<Button type="submit">Search</Button>
	</form>
</section>
