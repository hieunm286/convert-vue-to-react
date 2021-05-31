export default class SpError extends Error {
	constructor(name, description) {
		super(description)
		Object.setPrototypeOf(this, new.target.prototype)
		this.name = name
	}
}
