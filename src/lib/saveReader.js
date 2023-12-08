import { XMLParser } from "fast-xml-parser"

/**
 * @type {CharData}
 */
export let character

/**
 * @param {File} saveFile
 */
export async function readSaveFile(saveFile) {
	const parserOptions = {
		ignoreAttributes: false,
		attributesGroupName: "attr__",
	}
	const parser = new XMLParser(parserOptions)

	/**
	 * @type {{ CampaignEngine: CampaignEngine }}
	 */
	const save = parser.parse(await saveFile.text())
	findVal(save.CampaignEngine.hyperspace.o.saved.LocationToken, 'market')
	console.log([...paths].sort())
	console.log(save)
	character = save.CampaignEngine.characterData
}

let paths = new Set()

function findVal(object, key, path) {
	let value
	Object.keys(object).forEach(k => {
		if (k === key) {
			value = object[k]
			paths.add(path)
			return true
		}

		if (object[k] && typeof object[k] === "object") {
			const pathToUse = !isNaN(Number(k)) ? "[index]" : k
			const locPath = path != null ? `${path}.${pathToUse}` : pathToUse
			value = findVal(object[k], key, locPath)
			return value != null
		}
	})
	return value
}
