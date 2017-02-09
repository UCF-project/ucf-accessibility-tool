var fs = require('fs');
var path = require('path');
var debugFactory = require('debug');
var fetch = require('node-fetch');
var FormData = require('form-data');
var chalk = require('chalk');

let debug;

// const getScenario = scenarioFilepath => {
// 	return new Promise((resolve, reject) => {
// 		if (scenarioFilepath) {
// 			fs.readFile(scenarioFilepath, 'utf8', (err, data) => {
// 				if (err) {
// 					reject(new Error(`Could read scenario file: ${scenarioFilepath}`, err));
// 				}
// 				resolve(data);
// 			});
// 		}
// 	});
// };

// Helper functions

const auditConstants = {
	line0: 'Audit terminated with success at ',
	line1: 'Audit Id : ',
	error: 'crash (id+message): ',
	page: 'Subject : ',
	testDetail: '    -> '
};

const auditTestTypes = {
	NOT_APPLICABLE: {notApplicable: true},
	NEED_MORE_INFO: {needMoreInfo: true},
	PASSED: {passed: true},
	FAILED: {failed: true}
};

const reSummary = new RegExp(/RawMark : ([\d\.]+)%\nWeightedMark : ([\d\.]+)%\nNb Passed : (\d+)\nNb Failed test : (\d+)\nNb Failed occurences : (\d+)\nNb Pre-qualified : (\d+)\nNb Not Applicable : (\d+)\nNb Not Tested : (\d+)/);
const getSummary = summaryStr => {
	const summaryInfo = summaryStr.match(reSummary);
	if (summaryInfo && summaryInfo.length === 9) {
		return {
			rawMark: `${summaryInfo[1]}%`,
			weightedMark: `${summaryInfo[2]}%`,
			nbPassed: parseInt(summaryInfo[3], 10),
			nbFailedTest: parseInt(summaryInfo[4], 10),
			nbFailedOccurences: parseInt(summaryInfo[5], 10),
			nbPreQualified: parseInt(summaryInfo[6], 10),
			nbNotApplicable: parseInt(summaryInfo[7], 10),
			nbNotTested: parseInt(summaryInfo[8], 10)
		};
	}
	debug('Error, summaryInfo:', summaryInfo);
	throw new Error('Could not parse summary');
};

const auditStr2Json = auditStr => {
	const auditJson = {};
	const auditLines = auditStr.split('\n').filter(str => str.trim().length);

	// Two first lines should always exist.

	// Finished At
	if (!auditLines[0].startsWith(auditConstants.line0)) {
		throw new Error(`Unknown line 0: ${auditLines[0]}`);
	}
	auditJson.finishedAt = auditLines[0].substring(auditConstants.line0.length, auditLines[0].length);

	// Audit id
	if (!auditLines[1].startsWith(auditConstants.line1)) {
		throw new Error(`Unknown line 1: ${auditLines[1]}`);
	}
	auditJson.auditId = parseInt(auditLines[1].substring(auditConstants.line1.length, auditLines[1].length), 10);

	// In case of error
	if (auditLines[auditLines.length - 1].startsWith(auditConstants.error)) {
		auditJson.error = true;
		auditJson.stackTrace = auditLines.slice(2, auditLines.length - 1).join('\n');
	} else {
	// In case of success

		// Summary information
		auditJson.error = false;
		const summaryStr = auditLines.slice(2, 10).join('\n');
		auditJson.summary = getSummary(summaryStr);

		// Pages information
		auditJson.pages = [];
		let auditTests;
		let lineIndex = 10;
		// debug('auditLines', auditLines);
		debug('Count lines', auditLines.length);
		while (lineIndex < auditLines.length) {
			const line = auditLines[lineIndex];
			// debug('line', lineIndex, line);
			if (line.startsWith(auditConstants.page)) {
				auditTests = [];
				auditJson.pages.push({
					url: line.substring(auditConstants.page.length, line.length),
					summary: getSummary(auditLines.slice(lineIndex + 1, lineIndex + 9).join('\n')),
					tests: auditTests
				});
				lineIndex += 9;
			} else {
				// Basic test information
				const infos = line.split(': ', 2);
				const testInfo = Object.assign({testId: infos[0]}, auditTestTypes[infos[1]]);

				// Extra information about the test
				let elements = [];
				while ((lineIndex + 1) < auditLines.length && auditLines[lineIndex + 1][0] === ' ') {
					const testParts = auditLines[lineIndex + 1].substring(5, auditLines[lineIndex + 1].length).split(' ');
					const testElement = Object.assign({message: testParts[1]}, auditTestTypes[testParts[0]]);
					lineIndex += 1;
					const details = [];
					while ((lineIndex + 1) < auditLines.length && auditLines[lineIndex + 1].startsWith(auditConstants.testDetail)) {
						details.push(auditLines[lineIndex + 1].substring(auditConstants.testDetail.length, auditLines[lineIndex + 1].length));
						lineIndex += 1;
					}
					if (details.length) {
						testElement.details = details;
					}
					elements.push(testElement);
				}
				if (elements.length) {
					testInfo.elements = elements;
				}
				lineIndex += 1;
				auditTests.push(testInfo);
				// debug('testInfo', testInfo);
			}
		}
		// debug('auditTests', auditTests);
	}
	return auditJson;
};

const checkMinMark = (minMark, auditJson) => {
	console.log(`Minimum accepted RawMark: ${chalk.green(`${minMark}%`)}`);
	if (auditJson.error) {
		process.exitCode = 1;
		console.log(`✖	Audit failed`);
		console.log(auditJson.stackTrace);
	} else {
		const auditRawMark = parseFloat(auditJson.summary.rawMark.substring(0, auditJson.summary.rawMark.length - 2), 10);
		if (auditRawMark < minMark) {
			process.exitCode = 1;
			console.log(chalk.red(`✖	RawMark	${auditRawMark}%`));
		} else {
			console.log(chalk.green(`✔	RawMark	${auditRawMark}%`));
		}
	}
};

const removeFirstLine = str => {
	return str.substring(str.indexOf('\n') + 1);
};

// Steps on the runTanaguru

const getAudit = (auditorUrl, scenarioFilepath) => {
	var form = new FormData();
	const scenarioFinalPath = path.resolve(process.cwd(), scenarioFilepath);
	form.append('file', fs.createReadStream(scenarioFinalPath));
	debug(`Request audit at ${auditorUrl} with scenario ${scenarioFinalPath} (takes long time ~3min)`);
	return fetch(auditorUrl, {
		method: 'post',
		body: form
	})
	.then(response => {
		debug('Response received');
		return response.text();
	});
};

const saveAudit = (reportFilepath, auditStr) => {
	debug('Saving audit');
	auditStr = removeFirstLine(auditStr);
	return new Promise((resolve, reject) => {
		// Write report HTML file
		fs.writeFile(reportFilepath, auditStr, function (err) {
			if (err) {
				reject(Error(`Error when trying to create report file at ${reportFilepath}`, err));
			}
			debug(`Created accessibility report at ${reportFilepath}`);
			resolve(auditStr);
		});
	});
};

const parseAudit = (minMark, auditStr) => {
	debug('Parsing audit');
	const auditJson = auditStr2Json(auditStr);
	debug('Checking audit');
	checkMinMark(minMark, auditJson);
	return auditStr;
};

const quitAudit = () => {
	debug('Scan finished. Quitting audit.');
};

const handleErrors = err => {
	debug('Final', err);
	throw err;
};

const initDebug = auditorName => {
	debug = debugFactory(`UAT:${auditorName}`);
};

const runTanaguru = options => {
	initDebug(options.auditor);
	debug(`Initiating ${options.auditor}`);

	const reportFilepath = `${options.out}accessibilityResult.txt`;
	const auditorUrl = `http://${options.auditorHost}:${options.auditorPort}/audit`;

	// getScenario(options.scenario)
	getAudit(auditorUrl, options.scenario)
	// .then(getAudit)
	.then(saveAudit.bind(null, reportFilepath))
	.then(parseAudit.bind(null, options.checkMinMark))
	.then(quitAudit)
	.catch(handleErrors);
};

module.exports = {
	runTanaguru,
	auditStr2Json,
	initDebug
};
