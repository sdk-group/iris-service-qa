'use strict'

let Qa = require("./Qa/qa");
let config = require("./config/db_config.json");

describe("Qa service", () => {
	let service = null;
	let bucket = null;
	before(() => {
		service = new Qa();
		service.init();
	});
	describe("Qa service", () => {
		it("should mark ticket called", (done) => {
			return service.actionTicketCalled()
				.then((res) => {
					console.log(res);
					done();
				})
				.catch((err) => {
					done(err);
				});
		})
	})

});