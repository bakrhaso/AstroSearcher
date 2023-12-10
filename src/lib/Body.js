import { surveyLevelToNumber } from "$lib/gameUtils.js"

class Body {
	constructor(system, name, type, surveyLevel, keywords, tags, ruinExplored, coreTechMiningMult) {
		this.system = system
		this.name = name
		this.type = type
		this.size = 6 // Market size, not actual planet size
		this.surveyLevel = surveyLevelToNumber(surveyLevel)
		this.keywords = keywords
		if (this.keywords) {
			this.setConditions(this.keywords)
		}
		this.tags = tags
		this.coronalTap = false
		this.coronalTapDiscovered = false
		this.cryosleeper = false
		this.cryosleeperDiscovered = false
		this.ruinExplored = ruinExplored
		if (this.ruinExplored === "none" && this.keywords != null) {
			if (
				this.keywords.includes("ruins_scattered") ||
				this.keywords.includes("ruins_widespread") ||
				this.keywords.includes("ruins_extensive") ||
				this.keywords.includes("ruins_vast")
			) {
				this.ruinExplored = "false"
			}
		}
		this.coreTechMiningMult = coreTechMiningMult
	}

	setConditions(keywords) {
		this.conditions = {
			decivilization: 0,
			temperature: 2,
			tectonics: 0,
			atmosphere: 2,
			weather: 1,
			gravity: 1,
			radiation: 0,
			biosphere: 0,
			water: 0,
			light: 2,
			meteors: 0,
			techmining: 0,
			mining: 0,
			farming: 0,
			aquaculture: 0,
			pollution: 0,
		}
		for (const keyword of keywords) {
			const effects = CONDITION_EFFECTS[keyword]
			for (const cond in effects) {
				if (cond !== "hazard_rating" && cond !== "stability") {
					this.conditions[cond] = effects[cond]
				}
			}
		}
	}

	getStats(criteria) {
		const stats = {
			accessibility: new Stat(),
			hazardRating: new Stat(1, "Base value"),
			stability: new Stat(5, "Base value"), // clamped 0-10
			groundForces: new Stat(),
			fleetSize: new Stat(),
			shipQuality: new Stat(),
			growth: 0, // TODO: Pay more attention to this. Growth rate % equals growth / (300 * 2 ^ (size - 3))
			income: new Stat(),
			upkeep: new Stat(),
			profit: new Stat(),
			lampHeat: 0,
			tapIndustry: 0,
		}

		for (const keyword of this.keywords) {
			const effects = CONDITION_EFFECTS[keyword]
			for (const cond in effects) {
				if (cond == "hazard_rating") {
					stats.hazardRating.add(effects[cond], HAZARD_NAMES[keyword])
				} else if (cond == "stability") {
					stats.stability.add(effects[cond], HAZARD_NAMES[keyword])
				}
			}
		}

		if (this.keywords.includes("solar_array")) {
			stats.hazardRating.unadd(HAZARD_NAMES.hot)
			stats.hazardRating.unadd(HAZARD_NAMES.poor_light)
		}

		if (criteria.structures.population.orbital_fusion_lamp_optional) {
			if (
				stats.hazardRating.includes(HAZARD_NAMES.cold) ||
				stats.hazardRating.includes(HAZARD_NAMES.very_cold) ||
				stats.hazardRating.includes(HAZARD_NAMES.poor_light) ||
				stats.hazardRating.includes(HAZARD_NAMES.dark)
			) {
				criteria.structures.population.artifact = "orbital_fusion_lamp"
				criteria.structures.population.orbital_fusion_lamp = true
			} else {
				delete criteria.structures.population.artifact
				delete criteria.structures.population.orbital_fusion_lamp_optional
			}
		}

		if (criteria.structures.population.orbital_fusion_lamp) {
			stats.hazardRating.unadd(HAZARD_NAMES.cold)
			stats.hazardRating.unadd(HAZARD_NAMES.very_cold)
			stats.hazardRating.unadd(HAZARD_NAMES.poor_light)
			stats.hazardRating.unadd(HAZARD_NAMES.dark)
			if (this.keywords.includes("hot")) {
				stats.hazardRating.unadd(HAZARD_NAMES.hot)
				stats.hazardRating.add(CONDITION_EFFECTS.very_hot.hazard_rating, HAZARD_NAMES.very_hot)
				stats.lampHeat = 1
			} else if (
				!(
					this.keywords.includes("very_hot") ||
					this.keywords.includes("cold") ||
					this.keywords.includes("very_cold")
				)
			) {
				stats.hazardRating.add(CONDITION_EFFECTS.hot.hazard_rating, HAZARD_NAMES.hot)
				stats.lampHeat = 1
			}
		}

		return stats
	}

	evaluate_artifacts() {
		this.possible_artifacts = {
			coronal_portal: true, // Hypershunt Tap. See consider_other_factors for 10 ly logic.
			orbital_fusion_lamp: true,
			fullerene_spool: this.type != "gas_giant" && this.conditions.weather < 2 && this.conditions.tectonics < 2,
			soil_nanites:
				this.conditions.farming && !("rare_ore" in this.conditions) && !("volatiles" in this.conditions),
			mantle_bore: this.type != "gas_giant" && !this.keywords.includes("habitable"),
			plasma_dynamo: this.type == "gas_giant", // TODO: || ice_giant
			catalytic_core: this.conditions.atmosphere == 0,
			biofactory_embryo: this.keywords.includes("habitable"),
			corrupted_nanoforge: true,
			pristine_nanoforge: true,
			synchrotron: this.conditions.atmosphere == 0,
			dealmaker_holosuite: true,
			cryoarithmetic_engine: this.keywords.includes("hot") || this.keywords.includes("very_hot"), // Installable on Hot planet with Orbital Solar Array!
			drone_replicator: true,
		}
	}

	apply_structure_effects(stats, structure, config, timing) {
		const effect_func = timing == "early" ? "early_effects" : "effects"
		if (!(effect_func in INDUSTRIES[structure])) {
			return false
		}
		const effects = INDUSTRIES[structure][effect_func](this, stats, config) || {}
		for (const cond in effects) {
			if (cond.endsWith("_multiplier")) {
				stats[cond].push(effects[cond])
			} else {
				// TODO: Does this even happen?
				this.conditions[cond] += effects[cond]
			}
		}
	}

	prefilter_structures(criteria, spoiler_level) {
		let ruins_pass = true
		if (criteria.requested_ruins_score != null) {
			if (this.conditions.tech == null) ruins_pass = false
			else ruins_pass = this.conditions.tech >= criteria.requested_ruins_score
		}
		let ore_pass = true
		if (criteria.requested_ore_score != null) {
			if (this.conditions.ore == null) ore_pass = false
			else ore_pass = this.conditions.ore >= criteria.requested_ore_score
		}
		let rare_ore_pass = true
		if (criteria.requested_rare_ore_score != null) {
			if (this.conditions.rare_ore == null) rare_ore_pass = false
			else rare_ore_pass = this.conditions.rare_ore >= criteria.requested_rare_ore_score
		}
		let volatiles_pass = true
		if (criteria.requested_volatiles_score != null) {
			if (this.conditions.volatiles == null) volatiles_pass = false
			else volatiles_pass = this.conditions.volatiles >= criteria.requested_volatiles_score
		}
		let organics_pass = true
		if (criteria.requested_organics_score != null) {
			if (this.conditions.organics == null) organics_pass = false
			else organics_pass = this.conditions.organics >= criteria.requested_organics_score
		}
		let farmland_pass = true
		if (criteria.requested_farmland_score != null) {
			if (this.conditions.tech == null) farmland_pass = false
			else farmland_pass = this.conditions.food >= criteria.requested_farmland_score
		}

		const needs = criteria.structures
		return (
			ruins_pass &&
			ore_pass &&
			rare_ore_pass &&
			volatiles_pass &&
			organics_pass &&
			farmland_pass &&
			!(
				(needs.techmining && !this.conditions.techmining) ||
				(needs.farmingaquaculture && !(this.conditions.farming || this.conditions.aquaculture)) ||
				(needs.mining && !this.conditions.mining) ||
				(needs.population?.coronal_portal &&
					((spoiler_level == 0 && this.coronalTapDiscovered === false) ||
						(spoiler_level > 0 && this.coronalTap === false))) ||
				((needs.spaceport?.fullerene_spool || needs.megaport?.fullerene_spool) &&
					!this.possible_artifacts.fullerene_spool) ||
				(needs.farmingaquaculture?.soil_nanites && !this.possible_artifacts.soil_nanites) ||
				(needs.mining?.mantle_bore && !this.possible_artifacts.mantle_bore) ||
				(needs.mining?.plasma_dynamo && !this.possible_artifacts.plasma_dynamo) ||
				(needs.refining?.catalytic_core && !this.possible_artifacts.catalytic_core) ||
				(needs.lightindustry?.biofactory_embryo && !this.possible_artifacts.biofactory_embryo) ||
				(needs.fuelprod?.synchrotron && !this.possible_artifacts.synchrotron) ||
				(!this.possible_artifacts.cryoarithmetic_engine &&
					(needs.patrolhq?.cryoarithmetic_engine ||
						needs.militarybase?.cryoarithmetic_engine ||
						needs.highcommand?.cryoarithmetic_engine)) ||
				(needs.cryorevival &&
					((spoiler_level == 0 && this.cryosleeperDiscovered === false) ||
						(spoiler_level > 0 && this.cryosleeper === false))) ||
				(criteria.market.domain_relay &&
					((spoiler_level == 0 && !this.domain_relay_discovered) ||
						(spoiler_level > 0 && !this.domain_relay))) ||
				(criteria.market.gate &&
					((spoiler_level == 0 && !this.gate_discovered) || (spoiler_level > 0 && !this.gate))) ||
				(criteria.market.solar_array && !this.keywords.includes("solar_array")) ||
				(criteria.market.habitable && !this.keywords.includes("habitable")) ||
				(criteria.market.decivilized && !this.keywords.includes("decivilized")) ||
				(criteria.market.cold && !this.keywords.includes("cold")) ||
				(criteria.market.very_cold && !this.keywords.includes("very_cold")) ||
				(criteria.market.hot && !this.keywords.includes("hot")) ||
				(criteria.market.very_hot && !this.keywords.includes("very_hot")) ||
				(criteria.market.tectonic_activity && !this.keywords.includes("tectonic_activity")) ||
				(criteria.market.extreme_tectonic_activity && !this.keywords.includes("extreme_tectonic_activity")) ||
				(criteria.market.no_atmosphere && !this.keywords.includes("no_atmosphere")) ||
				(criteria.market.thin_atmosphere && !this.keywords.includes("thin_atmosphere")) ||
				(criteria.market.toxic_atmosphere && !this.keywords.includes("toxic_atmosphere")) ||
				(criteria.market.dense_atmosphere && !this.keywords.includes("dense_atmosphere")) ||
				(criteria.market.mild_climate && !this.keywords.includes("mild_climate")) ||
				(criteria.market.extreme_weather && !this.keywords.includes("extreme_weather")) ||
				(criteria.market.low_gravity && !this.keywords.includes("low_gravity")) ||
				(criteria.market.high_gravity && !this.keywords.includes("high_gravity")) ||
				(criteria.market.irradiated && !this.keywords.includes("irradiated")) ||
				(criteria.market.inimical_biosphere && !this.keywords.includes("inimical_biosphere")) ||
				(criteria.market.water_surface && !this.keywords.includes("water_surface")) ||
				(criteria.market.poor_light && !this.keywords.includes("poor_light")) ||
				(criteria.market.dark && !this.keywords.includes("dark")) ||
				(criteria.market.meteor_impacts && !this.keywords.includes("meteor_impacts")) ||
				(criteria.market.pollution && !this.keywords.includes("pollution")) ||
				(!(
					!criteria.market.type_arid &&
					!criteria.market.type_barren &&
					!criteria.market.type_barren_bombarded &&
					!criteria.market.type_barren_desert &&
					!criteria.market.type_cryovolcanic &&
					!criteria.market.type_desert &&
					!criteria.market.type_frozen &&
					!criteria.market.type_gas_giant &&
					!criteria.market.type_ice_giant &&
					!criteria.market.type_irradiated &&
					!criteria.market.type_jungle &&
					!criteria.market.type_rocky_ice &&
					!criteria.market.type_rocky_metallic &&
					!criteria.market.type_rocky_unstable &&
					!criteria.market.type_terran &&
					!criteria.market.type_terran_eccentric &&
					!criteria.market.type_toxic &&
					!criteria.market.type_tundra &&
					!criteria.market.type_volcanic &&
					!criteria.market.type_water
				) &&
					((!criteria.market.type_arid && this.type == "arid") ||
						(!criteria.market.type_barren &&
							(this.type == "barren" ||
								this.type == "barren2" ||
								this.type == "barren3" ||
								this.type == "barren_castiron" ||
								this.type == "barren_venuslike")) ||
						(!criteria.market.type_barren_bombarded && this.type == "barren-bombarded") ||
						(!criteria.market.type_barren_desert && this.type == "barren-desert") ||
						(!criteria.market.type_cryovolcanic && this.type == "cryovolcanic") ||
						(!criteria.market.type_desert && (this.type == "desert" || this.type == "desert1")) ||
						(!criteria.market.type_frozen &&
							(this.type == "frozen" ||
								this.type == "frozen1" ||
								this.type == "frozen2" ||
								this.type == "frozen3")) ||
						(!criteria.market.type_gas_giant && this.type == "gas_giant") ||
						(!criteria.market.type_ice_giant && this.type == "ice_giant") ||
						(!criteria.market.type_irradiated && this.type == "irradiated") ||
						(!criteria.market.type_jungle && this.type == "jungle") ||
						(!criteria.market.type_rocky_ice && this.type == "rocky_ice") ||
						(!criteria.market.type_rocky_metallic && this.type == "rocky_metallic") ||
						(!criteria.market.type_rocky_unstable && this.type == "rocky_unstable") ||
						(!criteria.market.type_terran && this.type == "terran") ||
						(!criteria.market.type_terran_eccentric && this.type == "terran-eccentric") ||
						(!criteria.market.type_toxic && (this.type == "toxic" || this.type == "toxic_cold")) ||
						(!criteria.market.type_tundra && this.type == "tundra") ||
						(!criteria.market.type_volcanic && (this.type == "lava_minor" || this.type == "lava")) ||
						(!criteria.market.type_water && this.type == "water")))
			)
		)
	}

	rename_farmingaquaculture(criteria) {
		if (criteria.structures.farmingaquaculture) {
			if (this.conditions.farming) {
				criteria.structures.farming = criteria.structures.farmingaquaculture
			} else if (this.conditions.aquaculture) {
				criteria.structures.aquaculture = criteria.structures.farmingaquaculture
			}
			delete criteria.structures.farmingaquaculture
		}
	}

	calculate_accessibility(criteria, stats, economy) {
		// Accessibility can be negative
		const distance_access = economy.search_markets[criteria.new_colony_id].proximity_isolation
		if (distance_access >= 0) {
			stats.accessibility.add(distance_access, "Proximity to other colonies")
		} else {
			stats.accessibility.add(distance_access, "Isolation from other colonies")
		}
		stats.accessibility.add(-economy.faction_hostilities.player, "Hostilities with other factions")
		if (this.conditions.gravity == 0) {
			stats.accessibility.add(0.1, HAZARD_NAMES["low_gravity"])
		} else if (this.conditions.gravity == 2) {
			stats.accessibility.add(-0.1, HAZARD_NAMES["high_gravity"])
		}
		if (this.size >= 5) {
			stats.accessibility.add(0.1 + 0.05 * nonneg(this.size - 5), "Colony size")
		}
		if (!("spaceport" in criteria.structures || "megaport" in criteria.structures)) {
			stats.accessibility.add(-1, "No spaceport")
		}
		if (criteria.market.free_port) {
			stats.accessibility.add(0.25, "Free port")
		}
		if (criteria.market.hypercognition) {
			stats.accessibility.add(0.1, "Hypercognition")
		}
		for (const structure in criteria.structures) {
			this.apply_structure_effects(stats, structure, criteria.structures[structure], "early")
		}
	}

	calculate_demand(criteria, stats) {
		stats.demands = {}
		for (const structure in criteria.structures) {
			const config = criteria.structures[structure]
			if ("demands" in INDUSTRIES[structure]) {
				const struct_dem = INDUSTRIES[structure].demands(this, stats, config)
				const aicore_discount = config.aicore ? 1 : 0
				for (const commodity in struct_dem) {
					stats.demands[commodity] = Math.max(
						stats.demands[commodity] ?? 0,
						nonneg(struct_dem[commodity] - aicore_discount),
					)
				}
			}
		}
	}

	calculate_commodity_pool(stats, crossfaction_supply, infaction_supply) {
		stats.commodities = {}
		const port_cap = Math.max(0, Math.floor(stats.accessibility.value() * 10))
		const infaction_cap = Math.max(0, Math.floor(stats.accessibility.value() * 10) + 5)
		for (const commodity_id in COMMODITIES) {
			const commodity = {
				demanded: stats.demands[commodity_id] ?? 0,
				produced: stats.products[commodity_id] ?? 0,
				used_local: 0,
				available_infaction: Math.min(infaction_cap, infaction_supply[commodity_id] ?? 0),
				imported_infaction: 0,
				available_crossfaction: Math.min(port_cap, crossfaction_supply[commodity_id] ?? 0),
				imported_crossfaction: 0,
				shortage: 0,
			}
			commodity.used_local = Math.min(commodity.demanded, commodity.produced)
			let needed = nonneg(commodity.demanded - commodity.produced)
			if (needed > 0) {
				if (
					commodity.available_crossfaction > commodity.available_infaction &&
					commodity.demanded > commodity.available_infaction
				) {
					const desired_import = nonneg((crossfaction_supply[commodity_id] ?? 0) - commodity.produced)
					commodity.imported_crossfaction = Math.min(needed, desired_import, commodity.available_crossfaction)
				} else {
					const desired_import = nonneg((infaction_supply[commodity_id] ?? 0) - commodity.produced)
					commodity.imported_infaction = Math.min(needed, desired_import, commodity.available_infaction)
				}
				needed = nonneg(needed - (commodity.imported_crossfaction + commodity.imported_infaction))
			}
			commodity.shortage = needed
			stats.commodities[commodity_id] = commodity
		}
	}

	calculate_production(criteria, stats, crossfaction_supply, infaction_supply) {
		this.calculate_commodity_pool(stats, crossfaction_supply, infaction_supply)
		const infaction_cap = Math.max(0, Math.floor(stats.accessibility.value() * 10) + 5)
		var availability_changed = false
		for (const structure in criteria.structures) {
			const config = criteria.structures[structure]
			if ("products" in INDUSTRIES[structure]) {
				const struct_prod = INDUSTRIES[structure].products(
					this,
					stats,
					config,
					criteria.market.industrial_planning,
				)
				for (const commodity in struct_prod) {
					const produced = struct_prod[commodity]
					if (produced > (stats.products[commodity] ?? 0)) {
						stats.products[commodity] = produced
						availability_changed = true
					}
					const exportable = Math.min(produced, infaction_cap)
					if (exportable > (infaction_supply[commodity] ?? 0)) {
						infaction_supply[commodity] = exportable
						availability_changed = true
					}
				}
			}
		}
		return availability_changed
	}

	calculate_stats(criteria, stats, spoiler_level) {
		if (criteria.market.free_port) {
			stats.stability.add(-3, "Free port")
			stats.growth += 10
		}
		if ((spoiler_level == 0 && this.domain_relay_discovered) || (spoiler_level > 0 && this.domain_relay)) {
			stats.stability.add(2, "Comm relay")
		} else {
			stats.stability.add(1, "Makeshift comm relay")
		}
		stats.fleet_size.add(0.5 + 0.25 * nonneg(this.size - 3), "Colony size")
		stats.fleet_size.mul(1 + 0.125 * (fleet_size_doctrine - 1), "Fleet doctrine")
		stats.ship_quality.add(0.125 * (fleet_quality_doctrine - 1), "Fleet doctrine")
		// TODO: What about size 1 and 2?
		stats.ground_forces.add(
			this.size == 3 ? 50 : 100 * nonneg(this.size - 3),
			`Base value for a size ${this.size} colony`,
		)
		if (criteria.market.hypercognition) {
			stats.fleet_size.add(0.2, "Hypercognition")
			stats.ground_forces.mul(1.5, "Hypercognition")
			stats.stability.add(1, "Hypercognition")
		}
		for (const structure in criteria.structures) {
			this.apply_structure_effects(stats, structure, criteria.structures[structure], "late")
		}
		const industry_count = Object.keys(criteria.structures).reduce((c, s) => c + INDUSTRIES[s].is_industry * 1, 0)
		const max_industries = this.size - 2 + stats.tap_industry
		if (industry_count > max_industries) {
			stats.stability.add(-5, "Maximum number of industries exceeded")
		}
		if (stats.commodities.ships.shortage) {
			const ships_proportion = 1 - stats.commodities.ships.shortage / stats.demands.ships
			stats.fleet_size.mul(ships_proportion, "Ship hulls & weapons shortage")
		}
		if (!stats.commodities.ships.available_infaction) {
			stats.ship_quality.add(-0.25, "Cross-faction imports")
		}
		const clamped_stability = Math.min(Math.max(stats.stability.value(), 0), 10)
		stats.fleet_size.mul(0.75 + 0.05 * clamped_stability, "Stability")
		stats.ship_quality.add(-0.25 + 0.05 * clamped_stability, "Stability")
		stats.ground_forces.mul(0.25 + 0.075 * clamped_stability, "Stability")
		if (clamped_stability < 5) {
			stats.income.mul(clamped_stability / 5, "Stability")
		}
	}

	calculate_profit(criteria, stats, economy) {
		var total_demanded = 0
		var infaction_produced = 0
		for (const commodity in stats.demands) {
			total_demanded += stats.demands[commodity]
			if (stats.commodities[commodity].available_infaction >= stats.demands[commodity]) {
				infaction_produced += Math.min(
					stats.commodities[commodity].available_infaction,
					stats.demands[commodity],
				)
			} else if (stats.products[commodity]) {
				infaction_produced += Math.min(stats.products[commodity], stats.demands[commodity])
			}
		}
		const infaction_proportion = infaction_produced / total_demanded
		const infaction_cost_mod = 1 - Math.round((100 * infaction_proportion) / 2) / 100
		// Calculate total income and upkeep
		stats.income.add(nonneg(this.size - 2) * 10000, "Local income")
		for (const commodity in stats.products) {
			if ((commodity == "drugs" || commodity == "organs") && !criteria.market.free_port) {
				continue
			}
			if (commodity == "crew" || commodity == "marines") {
				continue
			}
			const access_rounded = Math.round(100 * stats.accessibility.value()) / 100
			const income = estimate_income(commodity, criteria.new_colony_id, economy)
			stats.income.add(income, COMMODITIES[commodity].name)
		}
		for (const structure in criteria.structures) {
			const config = criteria.structures[structure]
			const aicore_mod = config.aicore >= 2 ? 0.75 : 1
			stats.upkeep.add(INDUSTRIES[structure].upkeep(this, stats, config) * aicore_mod, INDUSTRIES[structure].name)
		}
		stats.upkeep.mul(stats.hazard_rating.value(), "Hazard rating")
		if (infaction_cost_mod == 1) {
			stats.upkeep.mul(infaction_cost_mod, "All demand supplied out-of-faction; no upkeep reduction")
		} else {
			stats.upkeep.mul(
				infaction_cost_mod,
				`Demand supplied in-faction (${(100 * infaction_proportion).toFixed(0)}%)`,
			)
		}
		stats.profit.add(stats.income.value(), "Income")
		stats.profit.add(-stats.upkeep.value(), "Upkeep")
	}
}
