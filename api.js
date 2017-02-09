var runAatt = require('./lib/aatt');
var {runTanaguru} = require('./lib/tanaguru');

const auditorRunners = {
	aatt: runAatt,
	tanaguru: runTanaguru,
	asqatasun: runTanaguru
};

const run = options => {
	if (options.auditor in auditorRunners) {
		auditorRunners[options.auditor](options);
	} else {
		throw new Error(`Unknown auditor. Please chose an available one: ${Object.keys(auditorRunners).join(',')}`);
	}
};

module.exports = run;
