import { parse } from "csv-parse/browser/esm/sync"
import planetGenData from "$lib/game/planetGenData/planet_gen_data.csv?raw"
import { groupBy } from "$lib/utils.js"

const BARREN_NAMES = ["barren", "barren2", "barren3", "barren_castiron", "barren_venuslike"]

const DESERT_NAMES = ["desert", "desert1"]

const FROZEN_NAMES = ["frozen", "frozen1", "frozen2", "frozen3"]

const TOXIC_NAMES = ["toxic", "toxic_cold"]

const VOLCANIC_NAMES = ["lava", "lava_minor"]

/**
 * @typedef {object} PlanetTemplate
 * @property {string} id
 * @property {string} displayName
 * @property {boolean} checked
 */

class PlanetTemplates {
	constructor(planets) {
		/**
		 * @type {PlanetTemplate[]}
		 */
		this.planets = planets

		this._initialize()
	}

	_initialize() {
		this.planets.map((it) => {
			it.checked = false

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
				it.displayName = it.id
					.split("-")
					.flatMap((it) => it.split("_"))
					.map((it) => it.charAt(0).toUpperCase() + it.slice(1))
					.join(" ")
			}
		})
	}

	/**
	 * @returns {Record<string, PlanetTemplate[]>}
	 */
	groupedByDisplayName() {
		return groupBy(this.planets, (planet) => planet.displayName)
	}
}

export default function () {
	const parsed = parse(planetGenData, { columns: true }).filter((row) => row.type === "PLANET")
	return new PlanetTemplates(parsed)
}
