import { COMMODITIES } from "$lib/Commodities.js"
import { nonneg } from "$lib/utils.js"

export const INDUSTRIES = {
	population: {
		name: "Population & Infrastructure",
		is_industry: false,
		improvement_desc: "+1 stability",
		alpha_desc: "+1 production",
		upkeep: planet => (planet.size - 2) * 3 * 500,
		demands: (planet, stats, config) => {
			const ret = {
				food: planet.size,
				domestic_goods: planet.size - 1,
				luxury_goods: planet.size - 3,
				drugs: planet.size - 2,
				organs: planet.size - 3,
				supplies: 3,
			}
			if (!planet.keywords.includes("habitable")) {
				ret["organics"] = planet.size - 1
			}
			if (config.coronal_portal) {
				ret["rare_metals"] = 10
			}
			if (config.orbital_fusion_lamp) {
				ret["volatiles"] = 10
			}
			return ret
		},
		products: (planet, stats, config, industrial_planning) => {
			const modifiers = (config.aicore >= 3 ? 1 : 0) + industrial_planning * 1
			const ret = {}
			if (planet.size > 3) ret.crew = planet.size - 3 + modifiers
			if (planet.size > 4) ret.drugs = planet.size - 4 + modifiers
			if (planet.size > 5) ret.organs = planet.size - 5 + modifiers
			return ret
		},
		effects: (planet, stats, config) => {
			if (config.improvements) stats.stability.add(1, `Improvements (${this.name})`)
			const shortages = getShortages(this, planet, stats, config)
			const limiter = largestShortage(shortages, ["food", "organics"])
			if (limiter) stats.stability.add(-limiter.amount, limiter.name + " shortage")
			if (!shortages.domestic_goods) stats.stability.add(1, "Domestic goods demand met")
			// TODO: No luxury goods bonus if demand is 0 because market size is 3.
			if (!shortages.luxury_goods) stats.stability.add(1, "Luxury goods demand met")
			if (config.coronal_portal && !shortages.rare_metals) {
				stats.tap_industry = 1
			}
			if (config.orbital_fusion_lamp && shortages.volatiles) {
				let hazard_factor = 0.05
				if (config.aicore >= 2) {
					hazard_factor = 0.055
				}
				const hazard = Math.min(0.5, shortages.volatiles.amount * hazard_factor)
				stats.hazard_rating.add(hazard, "Orbital fusion lamp volatiles shortage")
			}
			// Supplies shortage doesn't seem to do anything.
			// Drugs shortage doesn't seem to do anything.
			// Organs shortage doesn't seem to do anything.
		},
		artifacts: ["orbital_fusion_lamp", "orbital_fusion_lamp_optional", "coronal_portal"],
		// Improvement: increases Stability by 1
		// Gamma: reduces demand by 1
		// Beta: also reduces upkeep by 25%
		// Alpha: also increases production by 1
		// Hypershunt Tap: increases number of allowed industries by 1 if no shortage
		// Orbital Fusion Lamp: increases temperature by 1, sets minimum temperature to 2, sets light to 2.
	},
	spaceport: {
		name: "Spaceport",
		is_industry: false,
		improvement_desc: "+20% accessibility",
		alpha_desc: "+20% accessibility",
		upkeep: (planet, stats, config) => {
			const shortages = getShortages(this, planet, stats, config)
			const penalizer = largestShortage(shortages)
			const shortage_penalty = 1 + 0.1 * (penalizer?.amount ?? 0)
			return (planet.size - 2) * 3 * 500 * shortage_penalty
		},
		demands: planet => ({
			fuel: planet.size - 2,
			supplies: planet.size - 2,
			ships: planet.size - 2,
		}),
		products: (planet, stats, config, industrial_planning) => {
			const modifiers = industrial_planning * 1
			return {
				crew: nonneg(planet.size - 1 + modifiers),
			}
		},
		early_effects: (planet, stats, config) => {
			if (config.improvements) stats.accessibility.add(0.2, `Improvements (${this.name})`)
			if (config.aicore >= 3) stats.accessibility.add(0.2, `Alpha core (${this.name})`)
			if (config.fullerene_spool) stats.accessibility.add(0.3, `Fullerene spool (${this.name})`)
			stats.accessibility.add(0.5, this.name)
		},
		effects: (planet, stats, config) => {
			stats.growth += 2
		},
		artifacts: ["fullerene_spool"],
		// Improvement: increases Accessibility by 20%p
		// Gamma: reduces demand by 1
		// Beta: also reduces upkeep by 25%
		// Alpha: also increases Accessibility by 20%p
	},
	megaport: {
		name: "Megaport",
		is_industry: false,
		improvement_desc: "+20% accessibility",
		alpha_desc: "+20% accessibility",
		upkeep: (planet, stats, config) => {
			const shortages = getShortages(this, planet, stats, config)
			const penalizer = largestShortage(shortages)
			const shortage_penalty = 1 + 0.1 * (penalizer?.amount ?? 0)
			return (planet.size - 2) * 4 * 500 * shortage_penalty
		},
		demands: planet => ({
			fuel: planet.size,
			supplies: planet.size,
			ships: planet.size,
		}),
		products: (planet, stats, config, industrial_planning) => {
			const modifiers = industrial_planning * 1
			return {
				crew: nonneg(planet.size + 1 + modifiers),
			}
		},
		early_effects: (planet, stats, config) => {
			if (config.improvements) stats.accessibility.add(0.2, `Improvements (${this.name})`)
			if (config.aicore >= 3) stats.accessibility.add(0.2, `Alpha core (${this.name})`)
			if (config.fullerene_spool) stats.accessibility.add(0.3, `Fullerene spool (${this.name})`)
			stats.accessibility.add(0.8, this.name)
		},
		effects: (planet, stats, config) => {
			stats.growth += planet.size
		},
		// Improvement: increases Accessibility by 20%p
		// Gamma: reduces demand by 1
		// Beta: also reduces upkeep by 25%
		// Alpha: also increases Accessibility by 20%p
		artifacts: ["fullerene_spool"],
	},
	waystation: {
		name: "Waystation",
		is_industry: false,
		improvement_desc: "+20% accessibility",
		alpha_desc: "greatly increases stockpiles",
		upkeep: planet => (planet.size - 2) * 2 * 500,
		demands: planet => ({
			fuel: planet.size,
			supplies: planet.size,
			crew: planet.size,
		}),
		early_effects: (planet, stats, config) => {
			if (config.improvements) stats.accessibility.add(0.2, `Improvements (${this.name})`)
			stats.accessibility.add(0.1, this.name)
		},
		// Adds stockpiled goods as long as demand is met
		// Improvement: increases Accessibility by 20%p
		// Gamma: reduces demand by 1
		// Beta: also reduces upkeep by 25%
		// Alpha: also increases stockpiling rate and limits
	},
	farming: {
		name: "Farming",
		is_industry: true,
		improvement_desc: "+1 production",
		alpha_desc: "+1 production",
		upkeep: planet => (planet.size - 2) * 1 * 500,
		demands: planet => ({
			heavy_machinery: planet.size - 3,
		}),
		products: (planet, stats, config, industrial_planning) => {
			const shortages = getShortages(this, planet, stats, config)
			const modifiers =
				planet.conditions.food +
				(planet.conditions.solar_food ?? 0) +
				(config.soil_nanites ? 2 : 0) +
				config.improvements * 1 +
				(config.aicore >= 3 ? 1 : 0) +
				industrial_planning * 1 -
				(shortages.heavy_machinery?.amount ?? 0)
			return {
				food: planet.size + modifiers,
			}
		},
		artifacts: ["soil_nanites"],
		// Improvement: increases production by 1
		// Gamma: reduces demand by 1
		// Beta: also reduces upkeep by 25%
		// Alpha: also increases production by 1
	},
	aquaculture: {
		name: "Aquaculture",
		is_industry: true,
		improvement_desc: "+1 production",
		alpha_desc: "+1 production",
		upkeep: planet => (planet.size - 2) * 3 * 500,
		demands: planet => ({
			heavy_machinery: planet.size,
		}),
		products: (planet, stats, config, industrial_planning) => {
			const shortages = getShortages(this, planet, stats, config)
			const modifiers =
				planet.conditions.food +
				config.improvements * 1 +
				(config.aicore >= 3 ? 1 : 0) +
				industrial_planning * 1 -
				(shortages.heavy_machinery?.amount ?? 0)
			return {
				food: planet.size + modifiers,
				// Also lobster
			}
		},
		// Improvement: increases production by 1
		// Gamma: reduces demand by 1
		// Beta: also reduces upkeep by 25%
		// Alpha: also increases production by 1
	},
	mining: {
		name: "Mining",
		is_industry: true,
		improvement_desc: "+1 production",
		alpha_desc: "+1 production",
		upkeep: planet => (planet.size - 2) * 2 * 500,
		demands: planet => ({
			heavy_machinery: planet.size - 3,
			drugs: planet.size,
		}),
		products: (planet, stats, config, industrial_planning) => {
			const shortages = getShortages(this, planet, stats, config)
			const modifiers =
				config.improvements * 1 +
				(config.aicore >= 3 ? 1 : 0) +
				industrial_planning * 1 -
				(shortages.heavy_machinery?.amount ?? 0)
			const ret = {}
			if ("rare_ore" in planet.conditions) {
				ret.rare_ore = nonneg(
					planet.conditions.rare_ore + (planet.size - 2) + (config.mantle_bore ? 3 : 0) + modifiers,
				)
			}
			if ("ore" in planet.conditions) {
				ret.ore = nonneg(planet.conditions.ore + planet.size + (config.mantle_bore ? 3 : 0) + modifiers)
			}
			if ("volatiles" in planet.conditions) {
				ret.volatiles = nonneg(
					planet.conditions.volatiles + (planet.size - 2) + (config.plasma_dynamo ? 3 : 0) + modifiers,
				)
			}
			if ("organics" in planet.conditions) {
				ret.organics = nonneg(
					planet.conditions.organics + planet.size + (config.mantle_bore ? 3 : 0) + modifiers,
				)
			}
			return ret
		},
		effects: (planet, stats, config) => {
			const ret = {}
			const shortages = getShortages(this, planet, stats, config)
			// TODO: Check this.
			if (shortages.drugs) ret.growth = -(shortages.drugs?.amount ?? 0)
			return ret
		},
		artifacts: ["mantle_bore", "plasma_dynamo"],
		// Improvement: increases production by 1
		// Gamma: reduces demand by 1
		// Beta: also reduces upkeep by 25%
		// Alpha: also increases production by 1
		// Autonomous Mantle Bore: Increases rare ore, ore, and organics production by 3
		// Plasma Dynamo: Increases volatiles production by 3
	},
	techmining: {
		name: "Tech-Mining",
		is_industry: true,
		improvement_desc: "+25% finds",
		alpha_desc: "+25% finds",
		upkeep: planet => {
			const base_upkeep = (planet.size - 2) * 2 * 500
			const upkeep_cap = planet.conditions.tech * 1000
			return Math.min(base_upkeep, upkeep_cap)
		},
		// Finds cool stuff.
		// Improvement: increases finds by 25%
	},
	refining: {
		name: "Refining",
		is_industry: true,
		improvement_desc: "+1 production",
		alpha_desc: "+1 production",
		upkeep: planet => (planet.size - 2) * 3 * 500,
		demands: planet => ({
			heavy_machinery: planet.size - 2,
			ore: planet.size + 2,
			rare_ore: planet.size,
		}),
		products: (planet, stats, config, industrial_planning) => {
			const shortages = getShortages(this, planet, stats, config)
			const metals_limiter = largestShortage(shortages, ["ore", "heavy_machinery"])
			const rare_metals_limiter = largestShortage(shortages, ["rare_ore", "heavy_machinery"])
			const modifiers =
				(config.catalytic_core ? 3 : 0) +
				config.improvements * 1 +
				(config.aicore >= 3 ? 1 : 0) +
				industrial_planning * 1
			return {
				metals: nonneg(planet.size + modifiers - (metals_limiter?.amount ?? 0)),
				rare_metals: nonneg(planet.size - 2 + modifiers - (rare_metals_limiter?.amount ?? 0)),
			}
		},
		artifacts: ["catalytic_core"],
		// Improvement: increases production by 1
		// Gamma: reduces demand by 1
		// Beta: also reduces upkeep by 25%
		// Alpha: also increases production by 1
		// Catalytic Core: increases production by 3
	},
	lightindustry: {
		name: "Light Industry",
		is_industry: true,
		improvement_desc: "+1 production",
		alpha_desc: "+1 production",
		upkeep: planet => (planet.size - 2) * 8 * 500,
		demands: planet => ({
			organics: planet.size,
		}),
		products: (planet, stats, config, industrial_planning) => {
			const shortages = getShortages(this, planet, stats, config)
			const modifiers =
				(config.biofactory_embryo ? 2 : 0) +
				config.improvements * 1 +
				(config.aicore >= 3 ? 1 : 0) +
				industrial_planning * 1 -
				(shortages.organics?.amount ?? 0)
			const ret = {
				domestic_goods: nonneg(planet.size + modifiers),
				luxury_goods: nonneg(planet.size - 2 + modifiers),
			}
			if (config.makes_drugs) {
				ret["drugs"] = nonneg(planet.size - 2 + modifiers)
			}
			return ret
		},
		artifacts: ["biofactory_embryo"],
		// Improvement: increases production by 1
		// Gamma: reduces demand by 1
		// Beta: also reduces upkeep by 25%
		// Alpha: also increases production by 1
		// Biofactory Embryo: increases production by 2
	},
	heavyindustry: {
		name: "Heavy Industry",
		is_industry: true,
		improvement_desc: "+1 production",
		alpha_desc: "+1 production",
		upkeep: planet => (planet.size - 2) * 12 * 500,
		demands: planet => ({
			metals: planet.size,
			rare_metals: planet.size - 2,
		}),
		products: (planet, stats, config, industrial_planning) => {
			const shortages = getShortages(this, planet, stats, config)
			const limiter = largestShortage(shortages)
			const rare_production = Math.max(1, planet.size - 2 - (limiter?.amount ?? 0))
			const modifiers =
				(config.pristine_nanoforge ? 3 : 0) +
				(config.corrupted_nanoforge ? 1 : 0) +
				config.improvements * 1 +
				(config.aicore >= 3 ? 1 : 0) +
				industrial_planning * 1
			return {
				heavy_machinery: rare_production + modifiers,
				supplies: rare_production + modifiers,
				hand_weapons: rare_production + modifiers,
				ships: rare_production + modifiers,
			}
		},
		artifacts: ["corrupted_nanoforge", "pristine_nanoforge"],
		// Improvement: increases production by 1
		// Gamma: reduces demand by 1
		// Beta: also reduces upkeep by 25%
		// Alpha: also increases production by 1
		// Corrupted Nanoforge: increases production by 1, increases ship quality by 20%p
		// Pristine Nanoforge: increases production by 3, increases ship quality by 50%p
	},
	orbitalworks: {
		name: "Orbital Works",
		is_industry: true,
		improvement_desc: "+1 production",
		alpha_desc: "+1 production",
		upkeep: planet => (planet.size - 2) * 12 * 500,
		demands: planet => ({
			metals: planet.size,
			rare_metals: planet.size - 2,
		}),
		products: (planet, stats, config, industrial_planning) => {
			const shortages = getShortages(this, planet, stats, config)
			const limiter = largestShortage(shortages)
			const rare_production = Math.max(1, planet.size - 2 - (limiter?.amount ?? 0))
			const modifiers =
				(config.pristine_nanoforge ? 3 : 0) +
				(config.corrupted_nanoforge ? 1 : 0) +
				config.improvements * 1 +
				(config.aicore >= 3 ? 1 : 0) +
				industrial_planning * 1
			return {
				heavy_machinery: rare_production + modifiers,
				supplies: rare_production + modifiers,
				hand_weapons: rare_production + modifiers,
				ships: rare_production + modifiers,
			}
		},
		artifacts: ["corrupted_nanoforge", "pristine_nanoforge"],
		// Improvement: increases production by 1
		// Gamma: reduces demand by 1
		// Beta: also reduces upkeep by 25%
		// Alpha: also increases production by 1
		// Corrupted Nanoforge: increases production by 1, increases ship quality by 20%p
		// Pristine Nanoforge: increases production by 3, increases ship quality by 50%p
	},
	fuelprod: {
		name: "Fuel Production",
		is_industry: true,
		improvement_desc: "+1 production",
		alpha_desc: "+1 production",
		upkeep: planet => (planet.size - 2) * 10 * 500,
		demands: planet => ({
			volatiles: planet.size,
			heavy_machinery: planet.size - 2,
		}),
		products: (planet, stats, config, industrial_planning) => {
			const shortages = getShortages(this, planet, stats, config)
			const limiter = largestShortage(shortages)
			const modifiers =
				(config.synchrotron ? 3 : 0) +
				config.improvements * 1 +
				(config.aicore >= 3 ? 1 : 0) +
				industrial_planning * 1 -
				(limiter?.amount ?? 0)
			return {
				fuel: nonneg(planet.size - 2 + modifiers),
			}
		},
		artifacts: ["synchrotron"],
		// Improvement: increases production by 1
		// Gamma: reduces demand by 1
		// Beta: also reduces upkeep by 25%
		// Alpha: also increases production by 1
		// Synchrotron Core: increases production by 3
	},
	commerce: {
		name: "Commerce",
		is_industry: true,
		improvement_desc: "+25% income",
		alpha_desc: "+25% income",
		upkeep: planet => (planet.size - 2) * 3 * 500,
		effects: (planet, stats, config) => {
			const modifiers =
				(config.dealmaker_holosuite ? 0.5 : 0) + config.improvements * 0.25 + (config.aicore >= 3 ? 0.25 : 0)
			stats.stability.add(-3, "Commerce")
			stats.income.mul(1.25 + modifiers, "Commerce")
		},
		artifacts: ["dealmaker_holosuite"],
		// Improvement: increases income by 25%p
		// Gamma: reduces demand by 1
		// Beta: also reduces upkeep by 25%
		// Alpha: also increases income by 25%p
		// Dealmaker Holosuite: increases income by 50%p
	},
	orbitalstation: {
		name: "Orbital Station",
		is_industry: false,
		improvement_desc: "+1 stability",
		alpha_desc: "increases station combat effectiveness",
		upkeep: planet => 1500,
		demands: planet => ({
			supplies: planet.size - 3,
			crew: planet.size - 3,
		}),
		effects: (planet, stats, config) => {
			const shortages = getShortages(this, planet, stats, config)
			const limiter = largestShortage(shortages)
			const supplies_met =
				1 - (shortages.supplies ? shortages.supplies.amount / this.demands(planet).supplies : 0)
			stats.ground_forces.mul(1 + 0.5 * supplies_met, this.name)
			if (config.improvements) stats.stability.add(1, `Improvements (${this.name})`)
			if ((limiter?.amount ?? 0) < 1) stats.stability.add(1 - (limiter?.amount ?? 0), this.name)
		},
		// Improvement: Increases stability by 1
		// Gamma: reduces demand by 1
		// Beta: also reduces upkeep by 25%
		// Alpha: also increases station combat effectiveness
	},
	battlestation: {
		name: "Battlestation",
		is_industry: false,
		improvement_desc: "+1 stability",
		alpha_desc: "increases station combat effectiveness",
		upkeep: planet => 6000,
		demands: planet => ({
			supplies: planet.size - 1,
			crew: planet.size - 1,
		}),
		effects: (planet, stats, config) => {
			const shortages = getShortages(this, planet, stats, config)
			const limiter = largestShortage(shortages)
			const supplies_met =
				1 - (shortages.supplies ? shortages.supplies.amount / this.demands(planet).supplies : 0)
			stats.ground_forces.mul(1 + 1.0 * supplies_met, this.name)
			if (config.improvements) stats.stability.add(1, `Improvements (${this.name})`)
			if ((limiter?.amount ?? 0) < 2) stats.stability.add(2 - (limiter?.amount ?? 0), this.name)
		},
		// Improvement: Increases stability by 1
		// Gamma: reduces demand by 1
		// Beta: also reduces upkeep by 25%
		// Alpha: also increases station combat effectiveness
	},
	starfortress: {
		name: "Star Fortress",
		is_industry: false,
		improvement_desc: "+1 stability",
		alpha_desc: "increases station combat effectiveness",
		upkeep: planet => 12500,
		demands: planet => ({
			supplies: planet.size + 1,
			crew: planet.size + 1,
		}),
		effects: (planet, stats, config) => {
			const shortages = getShortages(this, planet, stats, config)
			const limiter = largestShortage(shortages)
			const supplies_met =
				1 - (shortages.supplies ? shortages.supplies.amount / this.demands(planet).supplies : 0)
			// TODO: Morvah 45% test shows that the game might not actually
			// take this multiplier into account. Bug?
			stats.ground_forces.mul(1 + 2.0 * supplies_met, this.name)
			if (config.improvements) stats.stability.add(1, `Improvements (${this.name})`)
			if ((limiter?.amount ?? 0) < 3) stats.stability.add(3 - (limiter?.amount ?? 0), this.name)
		},
		// Improvement: Increases stability by 1
		// Gamma: reduces demand by 1
		// Beta: also reduces upkeep by 25%
		// Alpha: also increases station combat effectiveness
	},
	grounddefenses: {
		name: "Ground Defenses",
		is_industry: false,
		improvement_desc: "x1.25 ground defenses",
		alpha_desc: "x1.5 ground defenses",
		upkeep: planet => (planet.size - 2) * 2 * 500,
		demands: planet => ({
			supplies: planet.size,
			marines: planet.size,
			hand_weapons: planet.size - 2,
		}),
		effects: (planet, stats, config) => {
			const shortages = getShortages(this, planet, stats, config)
			const limiter = largestShortage(shortages)
			const fraction_met = 1 - (limiter ? limiter.amount / this.demands(planet)[limiter.commodity] : 0)
			if (config.aicore >= 3) stats.ground_forces.mul(1.5, `Alpha core (${this.name})`)
			if (config.improvements) stats.ground_forces.mul(1.25, `Improvements (${this.name})`)
			if (config.drone_replicator) stats.ground_forces.mul(1.5, "Combat drone replicator")
			stats.ground_forces.mul(1 + 1.0 * fraction_met, this.name)
			if ((limiter?.amount ?? 0) < 1) stats.stability.add(1 - (limiter?.amount ?? 0), this.name)
		},
		artifacts: ["drone_replicator"],
		// Improvement: Multiplies colony ground force by 1.25
		// Gamma: reduces demand by 1
		// Beta: also reduces upkeep by 25%
		// Alpha: also multiplies colony ground force by 1.5
		// Combat Drone Replicators: Multiplies colony ground force by 1.5
	},
	heavybatteries: {
		name: "Heavy Batteries",
		is_industry: false,
		improvement_desc: "x1.25 ground defenses",
		alpha_desc: "x1.5 ground defenses",
		upkeep: planet => (planet.size - 2) * 3 * 500,
		demands: planet => ({
			supplies: planet.size,
			marines: planet.size,
			hand_weapons: planet.size - 2,
		}),
		effects: (planet, stats, config) => {
			const shortages = getShortages(this, planet, stats, config)
			const limiter = largestShortage(shortages)
			const fraction_met = 1 - (limiter ? limiter.amount / this.demands(planet)[limiter.commodity] : 0)
			if (config.aicore >= 3) stats.ground_forces.mul(1.5, `Alpha core (${this.name})`)
			if (config.improvements) stats.ground_forces.mul(1.25, `Improvements (${this.name})`)
			if (config.drone_replicator) stats.ground_forces.mul(1.5, "Combat drone replicator")
			stats.ground_forces.mul(1 + 2.0 * fraction_met, this.name)
			if ((limiter?.amount ?? 0) < 1) stats.stability.add(1 - (limiter?.amount ?? 0), this.name)
		},
		artifacts: ["drone_replicator"],
		// Improvement: Multiplies colony ground force by 1.25
		// Gamma: reduces demand by 1
		// Beta: also reduces upkeep by 25%
		// Alpha: also multiplies colony ground force by 1.5
		// Combat Drone Replicators: Multiplies colony ground force by 1.5
	},
	patrolhq: {
		name: "Patrol HQ",
		is_industry: false,
		improvement_desc: "+1 medium patrol",
		alpha_desc: "x1.25 fleet size",
		upkeep: planet => 4000,
		demands: planet => ({
			fuel: planet.size - 1,
			supplies: planet.size - 1,
			ships: planet.size - 1,
		}),
		products: (planet, stats, config, industrial_planning) => {
			const modifiers = industrial_planning * 1
			return {
				crew: planet.size + modifiers,
			}
		},
		effects: (planet, stats, config) => {
			const shortages = getShortages(this, planet, stats, config)
			const limiter = largestShortage(shortages)
			const supplies_met =
				1 - (shortages.supplies ? shortages.supplies.amount / this.demands(planet).supplies : 0)
			if (config.aicore >= 3) stats.fleet_size.mul(1.25, `Alpha core (${this.name})`)
			stats.ground_forces.mul(1 + 0.1 * supplies_met, this.name)
			if ((limiter?.amount ?? 0) < 1) stats.stability.add(1 - (limiter?.amount ?? 0), this.name)
			if (config.cryoarithmetic_engine) {
				if (planet.conditions.temperature + stats.lamp_heat == 4) {
					stats.fleet_size.add(1, "Cryoarithmetic Engine")
				} else if (planet.conditions.temperature + stats.lamp_heat == 3) {
					stats.fleet_size.add(0.25, "Cryoarithmetic Engine")
				}
			}
			// TODO: Do shortages affect the number of light/medium/heavy fleets produced?
			return {
				fleets: { light: 2, medium: config.improvements * 1, heavy: 0 },
			}
		},
		artifacts: ["cryoarithmetic_engine"],
		// 2 light patrol fleets
		// Improvement: adds 1 medium patrol fleet
		// Gamma: reduces demand by 1
		// Beta: also reduces upkeep by 25%
		// Alpha: also increases fleet size by 1.25x (applies a multiplier)
		// Cryoarithmetic Engine: adds 25% to base fleet size
	},
	militarybase: {
		name: "Military Base",
		is_industry: true,
		improvement_desc: "+1 heavy patrol",
		alpha_desc: "x1.25 fleet size",
		upkeep: planet => (planet.size - 2) * 10 * 500,
		demands: planet => ({
			fuel: planet.size + 1,
			supplies: planet.size + 1,
			ships: planet.size + 1,
		}),
		products: (planet, stats, config, industrial_planning) => {
			const modifiers = industrial_planning * 1
			return {
				crew: planet.size + modifiers,
				marines: planet.size + modifiers,
			}
		},
		effects: (planet, stats, config) => {
			const shortages = getShortages(this, planet, stats, config)
			const limiter = largestShortage(shortages)
			const supplies_met =
				1 - (shortages.supplies ? shortages.supplies.amount / this.demands(planet).supplies : 0)
			if (config.aicore >= 3) stats.fleet_size.mul(1.25, `Alpha core (${this.name})`)
			stats.ground_forces.mul(1 + 0.2 * supplies_met, this.name)
			if ((limiter?.amount ?? 0) < 2) stats.stability.add(2 - (limiter?.amount ?? 0), this.name)
			if (config.cryoarithmetic_engine) {
				if (planet.conditions.temperature + stats.lamp_heat == 4) {
					stats.fleet_size.add(1, "Cryoarithmetic Engine")
				} else if (planet.conditions.temperature + stats.lamp_heat == 3) {
					stats.fleet_size.add(0.25, "Cryoarithmetic Engine")
				}
			}
			// TODO: Do shortages affect the number of light/medium/heavy fleets produced?
			return {
				fleets: { light: 3, medium: 2, heavy: 1 + config.improvements * 1 },
			}
		},
		artifacts: ["cryoarithmetic_engine"],
		// 3 light, 2 medium, 1 heavy patrol fleets
		// Improvement: adds 1 heavy patrol fleet
		// Gamma: reduces demand by 1
		// Beta: also reduces upkeep by 25%
		// Alpha: also increases fleet size by 1.25x (applies a multiplier)
		// Cryoarithmetic Engine: adds 25% to base fleet size
	},
	highcommand: {
		name: "High Command",
		is_industry: true,
		improvement_desc: "+1 heavy patrol",
		alpha_desc: "x1.25 fleet size",
		upkeep: planet => (planet.size - 2) * 14 * 500,
		demands: planet => ({
			fuel: planet.size + 2,
			supplies: planet.size + 2,
			ships: planet.size + 2,
		}),
		products: (planet, stats, config, industrial_planning) => {
			const modifiers = industrial_planning * 1
			return {
				crew: planet.size + modifiers,
				marines: planet.size + modifiers,
			}
		},
		effects: (planet, stats, config) => {
			const shortages = getShortages(this, planet, stats, config)
			const limiter = largestShortage(shortages)
			const supplies_met =
				1 - (shortages.supplies ? shortages.supplies.amount / this.demands(planet).supplies : 0)
			if (config.aicore >= 3) stats.fleet_size.mul(1.25, `Alpha core (${this.name})`)
			stats.ground_forces.mul(1 + 0.3 * supplies_met, this.name)
			if ((limiter?.amount ?? 0) < 2) stats.stability.add(2 - (limiter?.amount ?? 0), this.name)
			if (config.cryoarithmetic_engine) {
				if (planet.conditions.temperature + stats.lamp_heat == 4) {
					stats.fleet_size.add(1, "Cryoarithmetic Engine")
				} else if (planet.conditions.temperature + stats.lamp_heat == 3) {
					stats.fleet_size.add(0.25, "Cryoarithmetic Engine")
				}
			}
			// TODO: Do shortages affect the number of light/medium/heavy fleets produced?
			return {
				fleets: { light: 3, medium: 3, heavy: 2 + config.improvements * 1 },
			}
		},
		artifacts: ["cryoarithmetic_engine"],
		// 3 light, 3 medium, 2 heavy patrol fleets
		// Improvement: adds 1 heavy patrol fleet
		// Gamma: reduces demand by 1
		// Beta: also reduces upkeep by 25%
		// Alpha: also increases fleet size by 1.25x (applies a multiplier)
		// Cryoarithmetic Engine: adds 25% to base fleet size
	},
	planetaryshield: {
		name: "Planetary Shield",
		is_industry: false,
		improvement_desc: "x1.25 ground defenses",
		alpha_desc: "x1.5 ground defenses",
		upkeep: planet => (planet.size - 2) * 3 * 500,
		effects: (planet, stats, config) => {
			if (config.aicore >= 3) stats.ground_forces.mul(1.5, `Alpha core (${this.name})`)
			if (config.improvements) stats.ground_forces.mul(1.25, `Improvements (${this.name})`)
			stats.ground_forces.mul(3, this.name)
		},
		// Multiplies colony ground force by 3
		// Improvement: Multiplies colony ground force by 1.25
		// Gamma: reduces demand by 1
		// Beta: also reduces upkeep by 25%
		// Alpha: also multiplies colony ground force by 1.5
	},
	cryorevival: {
		name: "Cryorevival Facility",
		is_industry: false,
		improvement_desc: "x2 population growth bonus",
		alpha_desc: "x2 population growth bonus",
		upkeep: planet => (planet.size - 2) * 5 * 500,
		demands: planet => ({
			organics: 10,
		}),
		effects: (planet, stats, config) => {
			// Cryosleeper Effectiveness (Beta Far Salish)
			//  Alpha Far Salish: "1.2 light years, 89% effectiveness" (distance: 2461.4308846685094)
			//  Alpha Laphirial: "6.0 light years, 46% effectiveness" (distance: 11990.34215525145)
			//  Delta Accreter-Hkere: "7.2 light years, 35% effectiveness" (distance: 14472.855454263336)
			//  Delta Michon: "9.5 light years, 15% effectiveness" (distance: 18991.831322966198)
			// Distance Effectiveness Multiplier: 1 - .9 * (ly_dist / 10)
			// "If any demand is unmet, maxiumum growth bonus is reduced by 50%."
			// 3 met, 7 unmet: "15% growth bonus multiplier based on met demand" (4 / 30 on AFS)
			// 6 met, 4 unmet: "30% growth bonus multiplier based on met demand" (8 / 30 on AFS)
			// 8 met, 2 unmet: "40% growth bonus multiplier based on met demand" (11 / 30 on AFS)
			// 9 met, 1 unmet: "45% growth bonus multiplier based on met demand" (12 / 30 on AFS)
			// Alpha core and improvements separately add floor(the same growth bonus as the structure itself).
			// Alpha and beta core change 5% step to 5.5% step, like fusion lamp
			return {}
		},
		// Increases growth point total by up to planet.size * 10. Lower bonus further away from cryosleeper.
		// Improvement: Doubles population growth bonus
		// Gamma: reduces demand by 1
		// Beta: also reduces upkeep by 25%
		// Alpha: also doubles population growth bonus
	},
}

function getShortages(structure, planet, stats, config) {
	const structureDemands = structure.demands(planet, stats, config)
	const shortages = {}
	for (const commodityId in structureDemands) {
		const commodity = stats.commodities[commodityId]
		const available = commodity.produced + commodity.imported_crossfaction + commodity.imported_infaction
		const amount = nonneg(structureDemands[commodityId] - (config.aicore ? 1 : 0) - available)
		if (amount > 0) {
			shortages[commodityId] = { commodity: commodityId, amount, name: COMMODITIES[commodityId].name }
		}
	}
	return shortages
}

function largestShortage(shortages, commodities = []) {
	let list = Object.values(shortages)
	if (commodities.length > 0) {
		list = list.filter(shortage => shortage.commodity in commodities)
	}
	list.sort((a, b) => -(a.amount - b.amount))
	return list[0]
}
