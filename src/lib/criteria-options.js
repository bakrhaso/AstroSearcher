import { parse } from "csv-parse/browser/esm/sync"
/** @type string */
import planetGenData from "$lib/game-data/vanilla/planet_gen_data.csv?raw"
/** @type string */
import conditionGenData from "$lib/game-data/vanilla/condition_gen_data.csv?raw"
import { groupBy, humanReadable } from "$lib/utils.js"

const BARREN_NAMES = ["barren", "barren2", "barren3", "barren_castiron", "barren_venuslike"]

const DESERT_NAMES = ["desert", "desert1"]

const FROZEN_NAMES = ["frozen", "frozen1", "frozen2", "frozen3"]

const TOXIC_NAMES = ["toxic", "toxic_cold"]

const VOLCANIC_NAMES = ["lava", "lava_minor"]

/**
 *
 * @return {{
 *     id: string,
 *     category: string,
 *     displayName: string,
 * }[]}
 */
export function getPlanetOptions() {
	return parse(planetGenData, { columns: true })
		.filter(row => row.type === "PLANET")
		.map(it => {
			if (BARREN_NAMES.includes(it.id)) {
				it.displayName = "Barren"
			} else if (DESERT_NAMES.includes(it.id)) {
				it.displayName = "Desert"
			} else if (FROZEN_NAMES.includes(it.id)) {
				it.displayName = "Frozen"
			} else if (TOXIC_NAMES.includes(it.id)) {
				it.displayName = "Toxic"
			} else if (VOLCANIC_NAMES.includes(it.id)) {
				it.displayName = "Volcanic"
			} else {
				// barren-bombarded => Barren Bombarded, gas_giant => Gas Giant
				it.displayName = humanReadable(it.id)
			}

			return it
		})
}

/**
 * The return variant with only id and group is here just for easier types in colony.svelte
 *
 * @return {{
 *     id: string,
 *     group: string,
 *     hazard: number,
 *     order: number,
 *     rank: number,
 *     reqSurvey: boolean,
 *     displayName: string,
 *     requiresAll: string[],
 *     requiresAny: string[],
 *     requiresNotAny: string[],
 * }|{id: string, group: string, displayName: string}[]}
 */
export function getConditionOptions() {
	return parse(conditionGenData, { columns: true })
		.filter(row => row.group !== "" && !row.id.endsWith("_no_pick"))
		.map(it => {
			it.hazard = Number(it.hazard)
			it.order = Number(it.order)
			it.rank = Number(it.rank)
			it.reqSurvey = it.reqSurvey === "TRUE"
			it.displayName = humanReadable(it.id)
			// if your editor says these comparisons arent valid, ignore it. these properties are strings before we map them here
			it.requiresAll = it.requiresAll !== "" ? it.requiresAll.split(", ") : []
			it.requiresAny = it.requiresAny !== "" ? it.requiresAny.split(", ") : []
			it.requiresNotAny = it.requiresNotAny !== "" ? it.requiresNotAny.split(", ") : []
			return it
		})
}

let cachedConditions = null

/**
 * @return {{
 *     id: string,
 *     group: string,
 *     hazard: number,
 *     order: number,
 *     rank: number,
 *     reqSurvey: boolean,
 *     displayName: string,
 *     requiresAll: string[],
 *     requiresAny: string[],
 *     requiresNotAny: string[],
 * }[]}
 */
export function cachedConds() {
	if (cachedConditions == null) {
		const collector = {}
		const conds = getConditionOptions()
		for (const cond of conds) {
			collector[cond.id] = cond
		}
		cachedConditions = collector
	}
	return cachedConditions
}
