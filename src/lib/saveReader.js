import { XMLParser } from "fast-xml-parser"

/**
 * @type {CharData}
 */
export let character

/**
 * @param {File} saveFile
 */
export async function readSaveFile(saveFile) {
	/**
	 * @type {{ CampaignEngine: CampaignEngine }}
	 */
	const save = new XMLParser().parse(await saveFile.text())
	console.log(save)
	character = save.CampaignEngine.characterData
}