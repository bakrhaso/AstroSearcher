<script>
	import Colonies from "./colonies.svelte"
	import { colonyFilterStore } from "$lib/colony-filter-store.js"
	import { readSaveFile, character } from "$lib/save-reader.js"
	import { search } from "$lib/search.js"
	import { Button, Fileupload, Helper, Label } from "flowbite-svelte"

	/**
	 * @type FileList
	 */
	let saveFile
	let saveFilePromise

	const globalSettings = {
		coloniesDistanceApart: 0,
	}

	function submit() {
		search(globalSettings, $colonyFilterStore)
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

	<ul class="list-disc list-outside mb-2">
		TODO:
		<li class="list-item">Do you want planets and other stuff you haven't discovered yet to affect the result?</li>
		<li class="list-item">Industries (industries have requirements, but not 1-to-1 to resources, e.g. mining industry needs ore, rare ore, volatiles, or organics)</li>
		<li class="list-item">Items to enhance industries, e.g. fullerene spool and AI cores</li>
		<li class="list-item">Structures that have to be near the colony</li>
		<li class="list-item">Toggles for gates and domain relays</li>
		<li class="list-item">All colonies in the same system</li>
		<li class="list-item">Actually showing the systems</li>
		<li class="list-item">Distance from the core (maybe distance to gate as well, since a gate can take you to the core?)</li>
		<li class="list-item">Colony economy</li>
		<li class="list-item">Map?</li>
		<li class="list-item">Mods?</li>
		<li class="list-item">Verify the colony follows game rules? Should probably still allow searching, but mark somehow so people playing modded can still use it</li>
		<li class="list-item">Saving setups and sharing them</li>
	</ul>

	<form autocomplete="off" on:submit|preventDefault={submit}>

		<Label for="save-upload" class="text-base">Upload savefile:</Label>
		<Fileupload id="save-upload" class="mb-1" bind:files={saveFile} />
		<Helper class="text-sm">Found in: starsector/saves/save_CHARACTER_NAME_123456789/campaign.xml</Helper>

		{#await saveFilePromise}
			<h2 class="text-center text-2xl pt-3">Parsing save file...</h2>
		{:then _res}
			{#if character}
				<h2 class="text-center text-2xl pt-3">Hello, {character.honorific} {character.name}!</h2>
			{:else}
				<h2 class="text-center text-2xl pt-3 invisible">If this is visible, something probably went wrong.</h2>
			{/if}
		{/await}
		<Colonies />
		<Button type="submit">Search</Button>
	</form>
</section>

<section>
	<p>
		Inspired by the original
		<a class="text-blue-300 visited:text-purple-300 underline" href="https://gomtuu.org/starsearcher/">Starsearcher/Persean Commercial Realty Group</a>
		by gomtuu and the
		<a class="text-blue-300 visited:text-purple-300 underline" href="https://github.com/sycspysycspy/Starsearcher-Modded-By-SYCSPY">modded
			version</a>
		by SYCSPY.
	</p>
	<p>
		The name AstroSearcher is an homage to Starsearcher.
	</p>
	<p>
		Some parts of the code have been copied while prototyping.
	</p>
</section>
