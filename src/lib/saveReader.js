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
		attributesGroupName: "__attr",
		attributeNamePrefix: "",
	}
	const parser = new XMLParser(parserOptions)

	/**
	 * @type {{ CampaignEngine: CampaignEngine }}
	 */
	const save = parser.parse(await saveFile.text())

	const markets = findMarkets(save.CampaignEngine.hyperspace.o.saved.LocationToken)
	console.log(markets)

	console.log(save)
	character = save.CampaignEngine.characterData
}

function findMarkets(saveObj) {
	const marketMatcher = (key, object) => {
		const isMarket = key === "market" || key === "Market" || object.__attr?.cl === "Market" || object.__attr?.cl === "PCMarket"
		const hasZ = object.__attr?.z != null
		const isNotPcmo = object.isPlanetConditionMarketOnly === false
		const hasNoEconGroup = object.econGroup == null
		const notPlayerFaction = object.factionId !== "player"
		const sizeGreaterThanZero = object.size > 0

		return isMarket && hasZ && isNotPcmo && hasNoEconGroup && notPlayerFaction && sizeGreaterThanZero
	}

	return findNodes(saveObj, marketMatcher)
}

/**
 * @callback findNodesMatchFun
 * @param {string} key
 * @param {object} object
 * @return boolean
 */

/**
 * Recursively inside the root object that match the matcher function
 * @param object
 * @param {findNodesMatchFun} matchFun
 * @param collector
 * @return {*[]}
 */
function findNodes(object, matchFun, collector = []) {
	const keys = Object.keys(object)
	for (const key of keys) {
		if (matchFun(key, object[key])) {
			collector.push(object[key])
		}

		if (typeof object[key] === "object") {
			findNodes(object[key], matchFun, collector)
		}
	}
	return collector
}
