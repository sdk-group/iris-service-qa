'use strict'

let emitter = require("global-queue");
let ServiceApi = require('resource-management-framework')
	.ServiceApi;

class Qa {
	constructor() {
		this.emitter = emitter;
	}

	init() {
		this.iris = new ServiceApi();
		this.iris.initContent();
	}
	launch() {
			this.emitter.on('ticket.emit.state', ({
				ticket,
				org_addr,
				workstation,
				event_name
			}) => {
				let to_join = ['ticket', event_name, org_addr, workstation];
				this.emitter.emit('broadcast', {
					event: _.join(to_join, "."),
					data: ticket
				});
			});
		}
		//API
	actionQuestions({
		code
	}) {
		let ticket;
		return this.emitter.addTask('ticket', {
				_action: "by-code",
				code
			})
			.then((res) => {
				ticket = res[0];
				if (ticket.state !== 'closed')
					return Promise.reject(new Error(`Ticket ${ticket.state}.`));
				if (_.find(ticket.history, (entry) => (entry.event_name == 'qa')))
					return Promise.reject(new Error(`Rating done.`));
				return this.iris.getQaQuestions();
			})
			.then((res) => {
				return {
					success: true,
					questions: res
				};
			})
			.catch((err) => {
				return {
					success: false,
					reason: ticket ? err.message : "Ticket not found."
				}
			});
	}


	actionAnswers({
		answers,
		workstation
	}) {
		return Promise.resolve({
			success: true
		});
	}

	actionBootstrap({}) {
		return Promise.resolve({
			success: true
		});
	}

	actionReady({}) {
		return Promise.resolve({
			success: true
		});
	}
}

module.exports = Qa;
