import { XMLParser } from "fast-xml-parser"

/**
 * @type {CharData}
 */
export let character
export let markets
export let systems
export let bodies

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

	markets = findMarkets(save.CampaignEngine.hyperspace.o.saved.LocationToken)
	console.log({ markets: Object.entries(markets) })
	systems = findSystems(save.CampaignEngine.hyperspace)
	console.log({ systems: Object.entries(systems) })
	bodies = findBodies(save.CampaignEngine.hyperspace)
	console.log({ bodies: Object.entries(bodies) })

	console.log(save)
	character = save.CampaignEngine.characterData
}

function findBodies(rootObject) {
	const bodyMatcher = (key, object) => {
		const isPlanet = key === "Plnt" || object.__attr?.cl === "Plnt"
		const isNebulaWithStar = object.__attr?.ty === "NEBULA" && object.star != null

		const systemId = object.cL?.__attr?.z ?? object.cL?.__attr?.ref
		const system = systems[systemId]

		if (system == null) return false

		object.system = system

		return (isNebulaWithStar || isPlanet)
	}

	return findNodes(rootObject, bodyMatcher)
}

function findSystems(rootObject) {
	const systemMatcher = (key, object) => {
		const isSystem = key === "Sstm" || object.__attr?.cl === "Sstm"

		return isSystem
	}

	return findNodes(rootObject, systemMatcher)
}

function findMarkets(rootObject) {
	const marketMatcher = (key, object) => {
		const isMarket = key === "market" || key === "Market" || object.__attr?.cl === "Market" || object.__attr?.cl === "PCMarket"
		const isNotPcmo = object.isPlanetConditionMarketOnly === false
		const hasNoEconGroup = object.econGroup == null
		const notPlayerFaction = object.factionId !== "player"
		const sizeGreaterThanZero = object.size > 0

		return isMarket && isNotPcmo && hasNoEconGroup && notPlayerFaction && sizeGreaterThanZero
	}

	return findNodes(rootObject, marketMatcher)
}

/**
 * @callback findNodesMatchFun
 * @param {string} key
 * @param {object} object
 * @return boolean
 */

/**
 * Recursively finds objects inside the root object that matches the matcher function.
 *
 * The matching objects are put in an object where the key is the value of the z-attribute
 *
 * @param object
 * @param {findNodesMatchFun} matchFun
 * @param collector You probably don't want to pass your own value in here
 * @param arrayNodeName If the root object is an array, then the keys sent to matchFun would normally be
 * numbers (the indexes in the array), this property lets us pass in the name of the node instead which
 * would be property name the array is under.
 * @return {any}
 */
function findNodes(object, matchFun, collector = {}, arrayNodeName = null) {
	const keys = Object.keys(object)

	for (const key of keys) {
		const z = object[key].__attr?.z

		if (z != null && matchFun(arrayNodeName ?? key, object[key])) {
			collector[z] = object[key]
		}

		const keyToPass = Array.isArray(object[key]) ? key : null

		if (typeof object[key] === "object") {
			findNodes(object[key], matchFun, collector, keyToPass)
		}
	}

	return collector
}
