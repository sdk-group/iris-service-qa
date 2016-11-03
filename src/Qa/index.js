'use strict'

let events = {
	qa: {}
};

let tasks = [];


module.exports = {
	module: require('./qa.js'),
	name: 'qa',
	permissions: [],
	exposed: true,
	tasks: tasks,
	events: {
		group: 'qa',
		shorthands: events.qa
	}
};