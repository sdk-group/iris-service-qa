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
				console.log("EMITTING", _.join(to_join, "."));
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
		workstation,
		ticket
	}) {
		return Promise.props({
				history: this.emitter.addTask('history', {
					_action: 'make-entry',
					subject: {
						type: 'system',
						id: workstation
					},
					object: ticket,
					event_name: 'qa',
					reason: {}
				}),
				ticket: this.emitter.addTask('ticket', {
					_action: 'ticket',
					query,
					keys: [ticket]
				}),
				pre: this.emitter.addTask('workstation', {
					_action: 'workstation-organization-data',
					workstation
				})
			})
			.then(({
				history,
				ticket,
				pre
			}) => {
				let tick = ticket[ticket];
				history.local_time = moment.tz(pre.org_merged.org_timezone);
				tick.history = tick.history || [];
				tick.history.push(history);
				return this.emitter.addTask('ticket', {
					_action: 'set-ticket',
					ticket: tick
				});
			})
			.then((res) => {
				return Promise.resolve({
					success: true
				});
			})
			.catch((err) => {
				return Promise.resolve({
					success: false,
					reason: err.message
				});
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
