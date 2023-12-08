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
		attributeNamePrefix: "",
	}
	const parser = new XMLParser(parserOptions)

	/**
	 * @type {{ CampaignEngine: CampaignEngine }}
	 */
	const save = parser.parse(await saveFile.text())

	// used to recursively find where a object might be within the save file, only used in developing/debugging
	// findVal(save.CampaignEngine, 'market')

	const markets = getMarkets(save.CampaignEngine.hyperspace.o.saved.LocationToken)
	console.log([... new Set(markets.flatMap(it => it.cond.st).sort())])


	console.log(save)
	character = save.CampaignEngine.characterData
}

/**
 * @param {LocationToken[]} locationTokens
 * @return Market[]
 */
function getMarkets(locationTokens) {
	return locationTokens.flatMap((lt) => {
		/**
		 * @type {Market[]}
		 */
		const markets = []

		if (lt.orbit?.s?.o?.saved?.Plnt != null) {
			if (Array.isArray(lt.orbit.s.o.saved.Plnt)) {
				for (const p of lt.orbit.s.o.saved.Plnt) {
					if (p.market != null) {
						markets.push(p.market)
					}
				}
			} else if (lt.orbit.s.o.saved.Plnt.market != null) {
				markets.push(lt.orbit.s.o.saved.Plnt.market)
			}
		}

		if (lt.orbit?.s?.con?.systems?.Sstm != null && Array.isArray(lt.orbit.s.con.systems.Sstm)) {
			for (const sstm of lt.orbit.s.con.systems.Sstm) {
				if (sstm.o?.saved?.Plnt != null) {
					if (Array.isArray(sstm.o.saved.Plnt)) {
						for (const p of sstm.o.saved.Plnt) {
							if (p.market != null) {
								markets.push(p.market)
							}
						}
					} else if (sstm.o.saved.Plnt.market != null) {
						markets.push(sstm.o.saved.Plnt.market)
					}
				}
			}
		}

		return markets
	})
}

let matches = []

function findVal(object, key, path) {
	let value
	Object.keys(object).forEach((k) => {
		if (k === key) {
			value = object[k]
			matches.push([value, path])
			return true
		}

		if (object[k] && typeof object[k] === "object") {
			const pathToUse = k // !isNaN(Number(k)) ? "[index]" : k
			const locPath = path != null ? `${path}.${pathToUse}` : pathToUse
			value = findVal(object[k], key, locPath)
			return value != null
		}
	})
	return value
}
