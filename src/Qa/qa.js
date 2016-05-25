'use strict'


let ServiceApi = require('resource-management-framework')
	.ServiceApi;

class Qa {
	constructor() {
		this.emitter = message_bus;
	}

	init() {
		this.iris = new ServiceApi();
		this.iris.initContent();
	}
	launch() {
			this.emitter.listenTask('ticket.emit.state', ({
				ticket,
				org_addr,
				workstation,
				event_name
			}) => {
				let to_join = ['ticket', event_name, org_addr, workstation];
				// console.log("EMITTING", _.join(to_join, "."));
				this.emitter.emit('broadcast', {
					event: _.join(to_join, "."),
					data: ticket
				});
			});
			return Promise.resolve(true);
		}
		//API
	actionQuestions({
		code,
		device_type
	}) {
		let ticket;
		return this.emitter.addTask('ticket', {
				_action: "by-code",
				code
			})
			.then((res) => {
				ticket = res[0];
				let permitted = [];
				switch (device_type) {
				case 'terminal':
					permitted = ['closed'];
					break;
				case 'qa':
					permitted = ['processing'];
					break;
				}
				if (device_type && !_.find(permitted, v => (v == ticket.state)))
					return Promise.reject(new Error(`Ticket ${ticket.state}.`));
				if (_.find(ticket.history, (entry) => (entry.event_name == 'qa-check')))
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
		code
	}) {
		let org;
		let tick;
		return Promise.props({
				history: this.emitter.addTask('history', {
					_action: 'make-entry',
					subject: {
						type: 'system',
						id: workstation
					},
					event_name: 'qa-check',
					reason: {}
				}),
				ticket: this.emitter.addTask('ticket', {
					_action: 'by-code',
					code
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
				// console.log("QA", ticket, pre, history);
				org = pre[workstation];
				tick = ticket[0];
				if (_.find(tick.history, (entry) => (entry.event_name == 'qa-check')))
					return Promise.reject(new Error(`Rating done.`));
				history.object = tick.id;
				history.local_time = moment.tz(org.org_merged.org_timezone);
				tick.history = tick.history || [];
				tick.history.push(history);
				tick.qa_answers = answers;
				return Promise.props({
					srv: this.iris.getEntryTypeless(tick.service)
						.then(res => res[tick.service]),
					tick: this.emitter.addTask('ticket', {
						_action: 'set-ticket',
						ticket: tick
					})
				});
			})
			.then(({
				srv
			}) => {
				this.emitter.command('mkgu.send.rates', {
					service: srv,
					organization: org.org_merged,
					ticket: tick
				});
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