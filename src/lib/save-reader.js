import { Body } from "$lib/body.js"

export let character

export let coords

/**
 * @type {Record<string, System>}
 */
export let systems

/**
 * @type {Record<string, Body>}
 */
export let bodies

export let bodyCoords

export let markets

export let mcons

export let relations

export let factionWeights

export let comkts

export let fleetSizeDoctrine

export let fleetQualityDoctrine

let xml

let start

/**
 * @param {File} saveFile
 */
export async function readSaveFile(saveFile) {
	start = performance.now()

	const SaveReaderWorker = await import("$lib/save-reader.worker.js?worker")
	const readerWorker = new SaveReaderWorker.default()
	readerWorker.postMessage(saveFile)

	readerWorker.onmessage = function(event) {
		if (event.error != null) {
			console.error(event.error)
		} else {
			_readSaveFile(event.data.save)
		}
	}
}

/**
 * @param {string} saveFileText
 */
function _readSaveFile(saveFileText) {
	const parser = new DOMParser()
	// parsing takes 800ms
	xml = parser.parseFromString(saveFileText, "text/xml")

	coords = {}
	systems = {}
	bodies = {}
	bodyCoords = {}
	markets = {}
	mcons = {}
	relations = {}
	factionWeights = {}
	comkts = {}
	fleetSizeDoctrine = null
	fleetQualityDoctrine = null

	getCoords()
	getRelations()
	getMarkets()
	getMCons()
	getCOMkts() // TODO getCOMkts is about 500ms, seems like the only spot to save meaningful amount of time
	getSystems()
	getBodyCoords()
	getBodies()
	getCommRelays()
	getGates()
	getFleetDoctrines()
	getCharacter()

	console.log(`Loaded save in ${performance.now() - start} ms`)
}

function getCoords() {
	const nodes = xml.querySelectorAll(":is(l, lIH)[z]")

	for (const coord of nodes) {
		coords[z(coord)] = coord
	}
}

function getRelations() {
	const nodes = xml.querySelectorAll("factionIdOne")

	for (const factionA of nodes) {
		const relation = factionA.parentNode

		const factionAId = factionA.textContent

		if (relations[factionAId] == null) {
			relations[factionAId] = {}
		}

		const value = Number(relation.getElementsByTagName("value")[0].textContent)
		const factionBId = relation.getElementsByTagName("factionIdTwo")[0].textContent

		relations[factionAId][factionBId] = value

		if (relations[factionBId] == null) {
			relations[factionBId] = {}
		}

		relations[factionBId][factionAId] = value
	}
}

function getMarkets() {
	const nodes = xml.querySelectorAll(":is(market, Market, [cl=\"Market\"], [cl=\"PCMarket\"])[z]")
	// :has is too new to use yet, but on my test save it cuts the amount of nodes down to 1/3rd
	// xml.querySelectorAll(':is(market, Market, [cl="Market"], [cl="PCMarket"])[z]:has(isPlanetConditionMarketOnly)')

	for (const marketNode of nodes) {
		const pcmoTag = getNamedChild(marketNode, "isPlanetConditionMarketOnly")
		const econGroup = getNamedChild(marketNode, "econGroup")
		const realMarket = pcmoTag?.textContent === "false" && !econGroup

		if (!realMarket) {
			continue
		}

		const size = Number(getNamedChild(marketNode, "size").textContent)
		const faction = getNamedChild(marketNode, "factionId")?.textContent

		if (size <= 0 || faction === "player") {
			continue
		}

		const hidden = getNamedChild(marketNode, "hidden")

		// TODO: Remove && !hidden from this line?
		if (!hidden) {
			// Source for -2 is https://fractalsoftworks.com/forum/index.php?topic=13672.msg230236#msg230236
			factionWeights[faction] = (factionWeights[faction] ?? 0) + Math.max(1, size - 2)
		}

		const loc = getNamedChild(marketNode, "location").textContent.split("|")
		const marketId = z(marketNode)

		markets[marketId] = {
			location: { x: Number(loc[0]), y: Number(loc[1]) },
			size,
			faction,
		}
	}
}

function getMCons() {
	const nodes = xml.querySelectorAll(":is(MCon, [cl=\"MCon\"])[z]")

	for (const mcon of nodes) {
		mcons[z(mcon)] = mcon
	}
}

function getCOMkts() {
	const nodes = xml.querySelectorAll("COMkt[z]")

	for (const comkt of nodes) {
		const market = comkt.parentElement.parentElement
		const participates = getNamedChild(market, "econGroup") == null

		if (!participates) {
			continue
		}

		let accessMods = 0

		const fBs = market.querySelectorAll(":scope > accessibilityMod > fBs:not([s=\"core_base\"],[s=\"core_hostile\"])")
		for (const fB of fBs) {
			accessMods += Number(fB.getAttribute("v"))
		}

		const marketId = z(market)
		comkts[marketId] = {
			marketId,
			faction: getNamedChild(market, "factionId").textContent,
			commodity: comkt.getAttribute("c"),
			supply: Number(comkt.getAttribute("mS")),
			demand: Number(comkt.getAttribute("mD")),
			accessMods: Math.round(100 * accessMods) / 100,
		}
	}
}

function getSystems() {
	const nodes = xml.querySelectorAll(":is(Sstm, [cl=\"Sstm\"])[z]")

	for (const systemNode of nodes) {
		if (getCoord(systemNode) == null) {
			continue
		}

		const tagsElement = getNamedChild(systemNode, "tags")
		const tags = []
		let hasCoronalTap = false
		let hasCryosleeper = false

		// TODO in the original this code didn't work, the if checked if `children` was null instead of `tagsElement.children`
		if (tagsElement?.children != null) {
			for (const st of tagsElement.children) {
				const tag = st.textContent

				// idk if this is actually faster than doing e.g. `tags.includes("has_coronal_tap")`
				hasCoronalTap = tag === "has_coronal_tap" || hasCoronalTap
				hasCryosleeper = tag === "theme_derelict_cryosleeper" || hasCryosleeper

				tags.push(tag)
			}
		}

		const name = systemNode.getAttribute("bN")
		const coord = getCoord(systemNode).textContent.split("|")
		const systemId = z(systemNode)

		const system = {
			id: systemId,
			name,
			x: Number(coord[0]),
			y: Number(coord[1]),
			tags,
			bodies: [],
			stars: [],
		}

		if (hasCoronalTap) {
			const ccent = derefNode(systemNode.getElementsByTagName("tap")[0])
			const discovered = Boolean(ccent.getAttribute("di"))
			system.coronalTap = true
			system.coronalTapDiscovered = discovered
		}

		if (hasCryosleeper) {
			const ccent = systemNode.querySelector("[cl=\"CryosleeperEntityPlugin\"]").parentElement
			const discovered = Boolean(ccent.getAttribute("di"))
			system.cryosleeper = true
			system.cryosleeperDiscovered = discovered
		}

		// TODO the todo below was here in the original, not sure what it means
		// TODO: if (system_node.querySelector('CampaignTerrain[type="pulsar_beam"])) {}
		systems[system.id] = system
	}
}

function getBodyCoords() {
	const nodes = xml.querySelectorAll("d[cl=\"Plnt\"]")

	for (const dNodes of nodes) {
		const bodyId = ref(dNodes)
		const locNode = getNamedChild(dNodes.parentElement.parentElement.parentElement, "loc")
		const coords = locNode.textContent.split("|")
		bodyCoords[bodyId] = { x: Number(coords[0]), y: Number(coords[1]) }
	}
}

function getBodies() {
	const nodes = xml.querySelectorAll(":is(Plnt, [cl=\"Plnt\"], [ty=\"NEBULA\"] > star)[z]")

	for (const body of nodes) {
		const system = getSystem(body)
		if (system == null) {
			continue
		}

		const market = derefNode(getNamedChild(body, "market"))
		const memory = getNamedChild(market, "memory")

		let ruinExplored = "none"
		let coreTechMiningMult = -1

		if (memory != null) {
			for (const mem of memory.children) {
				for (const mem1 of mem.children) {
					if (mem1?.children[0] == null) {
						continue
					}

					if (mem1.children[0].textContent === "$ruinsExplored") {
						ruinExplored = mem1.children[1].textContent
					} else if (mem1.children[0].textContent === "$core_techMiningMult") {
						coreTechMiningMult = Number(mem1.children[1].textContent)
					}
				}
			}
		}

		const tagsElement = getNamedChild(body, "tags")
		const tags = []

		let hasStar = false
		let isCore = false

		for (const st of tagsElement.children) {
			const tag = st.textContent

			hasStar = tag === "star" || hasStar
			isCore = tag === "theme_core_populated" || isCore

			tags.push(tag)
		}

		const name = JSON.parse(getNamedChild(body, "j0").textContent)["f0"]
		const type = getNamedChild(body, "type").textContent
		const surveyLevel = getNamedChild(market, "surveyLevel")?.textContent
		const conditions = getConditions(market)
		const faction = getNamedChild(market, "factionId")?.textContent

		if (faction != null && faction !== "player") {
			continue
		}

		const bodyId = z(body)
		const bodyObj = new Body(
			bodyId,
			system,
			name,
			type,
			surveyLevel,
			conditions,
			tags,
			ruinExplored,
			coreTechMiningMult,
		)

		const radius = Number(getNamedChild(body, "radius").textContent)

		if (!hasStar && !isCore) {
			bodies[bodyId] = bodyObj
			system.bodies.push(bodyObj)
		} else if (hasStar) {
			bodyObj.radius = radius

			if (!type.startsWith("nebula_") && bodyCoords[bodyId] != null) {
				bodyObj.x = bodyCoords[bodyId].x
				bodyObj.y = bodyCoords[bodyId].y
			} else {
				bodyObj.x = system.x
				bodyObj.y = system.y
			}

			system.stars.push(bodyObj)
		}
	}
}

function getCommRelays() {
	const nodes = xml.querySelectorAll(":is(CommRelayEP, [cl=\"CommRelayEP\"])")

	outerloop: for (const commRelay of nodes) {
		const ccent = commRelay.parentElement
		const systemNode = getNamedChild(ccent, "cL")
		const systemId = ref(systemNode) || z(systemNode)
		const system = systems[systemId]

		if (system?.bodies == null) {
			continue
		}

		const tagsElement = getNamedChild(ccent, "tags")
		for (const st of tagsElement.children) {
			if (st.textContent === "makeshift") {
				continue outerloop
			}
		}

		const discovered = Boolean(ccent.getAttribute("di"))
		for (const body of system.bodies) {
			body.domainRelay = true
			body.domainRelayDiscovered = discovered
		}
	}
}

function getGates() {
	const nodes = xml.querySelectorAll(":is(GateEntityPlugin, [cl=\"GateEntityPlugin\"])")
	for (const gateNode of nodes) {
		const ccent = gateNode.parentElement
		const systemNode = getNamedChild(ccent, "cL")

		const systemId = systemNode.getAttribute("ref") || systemNode.getAttribute("z")
		const system = systems[systemId]

		const discovered = Boolean(gateNode.getAttribute("aI"))

		if (system?.bodies != null) {
			for (const body of system.bodies) {
				body.gate = true
				body.gateDiscovered = discovered
			}
		}
	}
}

function getFleetDoctrines() {
	const playerFactionTag = derefNode(xml.getElementsByTagName("playerFaction")[0])
	const doctrineTag = getNamedChild(playerFactionTag, "doctrine")

	fleetSizeDoctrine = Number(getNamedChild(doctrineTag, "numShips").textContent)
	fleetQualityDoctrine = Number(getNamedChild(doctrineTag, "shipQuality").textContent)
}

function getCharacter() {
	const characterData = getNamedChild(xml.children[0], "characterData")
	const name = getNamedChild(characterData, "name").textContent
	const honorific = getNamedChild(characterData, "honorific").textContent
	character = { name, honorific }
}

/**
 *
 * @param market
 * @return {string[]}
 */
function getConditions(market) {
	if (market == null) {
		return []
	}

	const conditions = []
	const condTag = getNamedChild(market, "cond")
	const conditionsTag = getNamedChild(market, "conditions")

	if (condTag) {
		for (const stTag of condTag.children) {
			conditions.push(stTag.textContent)
		}
	} else if (conditionsTag) {
		for (const mcon of conditionsTag.children) {
			if (mcon.hasAttribute("ref")) {
				conditions.push(mcons[ref(mcon)].getAttribute("i"))
			} else {
				conditions.push(mcon.getAttribute("i"))
			}
		}
	}

	return conditions
}

function getSystem(body) {
	const system = getNamedChild(body, "cL")
	if (system != null) {
		const id = z(system) || ref(system)
		return systems[id]
	}
}

function getCoord(system) {
	const coord = getNamedChild(system, "l")
	if (coord && coord.hasAttribute("ref")) {
		return coords[ref(coord)]
	}
	return coord
}

function getNamedChild(node, tagName) {
	if (!(node instanceof Element)) {
		return
	}

	for (const child of node.children) {
		if (child.tagName === tagName) {
			return child
		}
	}
}

function derefNode(node) {
	if (!node || node.hasAttribute("z")) {
		return node
	} else if (node.hasAttribute("ref")) {
		return xml.querySelector(`[z="${ref(node)}"]`)
	}
}

function z(node) {
	return node.getAttribute("z")
}

function ref(node) {
	return node.getAttribute("ref")
}
