export class Stat {
	constructor(value, label) {
		this.addends = []
		if (value != null && label != null) {
			this.addends.push({ value, label })
		}
		this.multipliers = []
	}

	includes(label) {
		return this.addends.some(it => it.label === label)
	}

	add(value, label) {
		// TODO: Don't add if value === 0?
		this.addends.push({ value, label })
	}

	unadd(label) {
		this.addends = this.addends.filter(item => item.label !== label)
	}

	mul(value, label) {
		this.multipliers.push({ value, label })
	}

	value() {
		const base = this.addends.reduce((sum, item) => sum + item.value, 0)
		return this.multipliers.reduce((product, item) => product * item.value, base)
	}
}
