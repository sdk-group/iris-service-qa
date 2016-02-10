'use strict'

let emitter = require("global-queue");
let WorkstationApi = require('resource-management-framework').WorkstationApi;

class Qa {
	constructor() {
		this.emitter = emitter;
	}

	init() {
		this.iris = new WorkstationApi();
		this.iris.initContent();
	}

	//API
	actionBootstrap({
		workstation,
		user_id,
		user_type = "SystemEntity"
	}) {
		let qa;
		return this.emitter.addTask('workstation', {
				_action: 'by-id',
				user_id,
				user_type,
				workstation
			})
			.then((res) => {
				qa = _.find(res, (val) => (val.device_type === 'qa'));

				return Promise.props({
					ws: this.emitter.addTask('workstation', {
							_action: 'occupy',
							user_id,
							user_type,
							workstation
						})
						.then((res) => {
							return res.workstation;
						})
						// 					questions : [{
						//   text : String,
						//   code : String,
						//   answers : [{
						//       text : String,
						//       code : String
						//     }]
						// }]
				});
			})
			.catch(err => {
				console.log("QA BTSTRP ERR", err.stack);
			})
	}

	actionReady({
		user_id,
		workstation
	}) {
		return Promise.resolve({
			success: true
		});
	}

	actionSendAnswers({
		workstation,
		answers
	}) {

	}
}

module.exports = Qa;