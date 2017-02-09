import fs from 'fs';
import test from 'ava';
import {auditStr2Json, initDebug} from '../lib/tanaguru';

// const debug = require('debug')('UAT:Tests:AuditParse');

test.before(() => {
	initDebug('Testing');
});

const readFile = filepath => {
	return new Promise((resolve, reject) => {
		fs.readFile(filepath, 'utf8', (err, data) => {
			if (err) {
				reject(new Error(`Could read scenario file: ${filepath}`, err));
			}
			resolve(data);
		});
	});
};

const readJson = async filepath => {
	const data = await readFile(filepath);
	return JSON.parse(data);
};

test('parse audit error', async t => {
	const auditFilepath = 'assets/audit-error.txt';
	const auditStr = await readFile(auditFilepath);
	const auditJson = auditStr2Json(auditStr);
	const expectedJson = {
		finishedAt: '2016-10-10 09:20:29.0',
		auditId: 32,
		error: true,
		stackTrace: `java.lang.NullPointerException
	at org.asqatasun.runner.Asqatasun.auditCompleted(Asqatasun.java:277)
	at org.asqatasun.service.AuditServiceImpl.fireAuditCompleted(AuditServiceImpl.java:218)
	at org.asqatasun.service.AuditServiceImpl.auditCompleted(AuditServiceImpl.java:210)
	at org.asqatasun.service.AuditServiceThreadQueueImpl.fireAuditCompleted(AuditServiceThreadQueueImpl.java:238)
	at org.asqatasun.service.AuditServiceThreadQueueImpl.auditCompleted(AuditServiceThreadQueueImpl.java:201)
	at org.asqatasun.service.AuditServiceThreadImpl.fireAuditCompleted(AuditServiceThreadImpl.java:142)
	at org.asqatasun.service.AuditServiceThreadImpl.run(AuditServiceThreadImpl.java:100)
	at java.lang.Thread.run(Thread.java:745)`
	};
	t.is(auditJson.auditId, expectedJson.auditId);
	t.is(auditJson.finishedAt, expectedJson.finishedAt);
	t.is(auditJson.error, expectedJson.error);
	t.is(auditJson.stackTrace, expectedJson.stackTrace);
	t.deepEqual(auditJson, expectedJson);
});

test('parse audit partial one page', async t => {
	const auditFilepath = 'assets/audit-partial-one-page.txt';
	const auditStr = await readFile(auditFilepath);
	const auditJson = auditStr2Json(auditStr);
	const expectedJson = {
		finishedAt: '2016-10-10 08:15:02.0',
		auditId: 29,
		error: false,
		summary: {
			rawMark: '77.78%',
			weightedMark: '62.7551%',
			nbPassed: 7,
			nbFailedTest: 2,
			nbFailedOccurences: 2,
			nbPreQualified: 5,
			nbNotApplicable: 123,
			nbNotTested: 137
		},
		pages: [
			{
				url: 'https://10.50.0.102:8443/#/?_k=je990t',
				summary: {
					rawMark: '77.78%',
					weightedMark: '62.7551%',
					nbPassed: 7,
					nbFailedTest: 2,
					nbFailedOccurences: 2,
					nbPreQualified: 5,
					nbNotApplicable: 123,
					nbNotTested: 137
				},
				tests: [
					{testId: 'Rgaa30-1-1-1', notApplicable: true},
					{testId: 'Rgaa30-1-2-1', needMoreInfo: true,
					elements: [
						{
							needMoreInfo: true,
							message: 'CheckNatureOfElementWithNotEmptyAltAttribute',
							details: ['src:http://www.alterway.fr/wp-content/uploads/2015/10/ecran-offres-train.png', 'title:attribute-absent', 'alt:ecran-offres-train']
						},
						{
							needMoreInfo: true,
							message: 'CheckNatureOfElementWithNotEmptyAltAttribute',
							details: ['alt:Envoi en cours ...', 'src:https://www.alterway.fr/wp-content/plugins/contact-form-7/images/ajax-loader.gif', 'title:attribute-absent']
						}
					]},
					{testId: 'Rgaa30-3-3-3', needMoreInfo: true, elements: [{needMoreInfo: true, message: 'NotTreatedBackgroundColor', details: ['Element-Name:rgba(106; 231; 0; 0.75)']}]},
					{testId: 'Rgaa30-8-1-1', passed: true},
					{testId: 'Rgaa30-8-4-1', failed: true, elements: [{failed: true, message: 'MalformedLanguage', details: ['Language:']}]},
					{testId: 'Rgaa30-9-1-1', failed: true, elements: [{failed: true, message: 'H1TagMissing'}]}
				]
			}
		]
	};
	t.is(auditJson.auditId, expectedJson.auditId);
	t.is(auditJson.finishedAt, expectedJson.finishedAt);
	t.is(auditJson.error, expectedJson.error);
	t.deepEqual(auditJson.summary, expectedJson.summary);
	t.deepEqual(auditJson.pages[0].summary, expectedJson.pages[0].summary);
	expectedJson.pages[0].tests.forEach((tinfo, tinfoIndex) => {
		t.deepEqual(auditJson.pages[0].tests[tinfoIndex], tinfo);
	});
	t.deepEqual(auditJson.pages[0].tests, expectedJson.pages[0].tests);
	t.deepEqual(auditJson.pages, expectedJson.pages);
	t.deepEqual(auditJson, expectedJson);
});

test('parse audit one page', async t => {
	const auditBaseFile = 'assets/audit-one-page';
	const auditStr = await readFile(`${auditBaseFile}.txt`);
	const auditJson = auditStr2Json(auditStr);
	const expectedJson = await readJson(`${auditBaseFile}.json`);
	t.is(auditJson.auditId, expectedJson.auditId);
	t.is(auditJson.finishedAt, expectedJson.finishedAt);
	t.is(auditJson.error, expectedJson.error);
	t.deepEqual(auditJson.summary, expectedJson.summary);
	t.deepEqual(auditJson.pages[0].summary, expectedJson.pages[0].summary);
	expectedJson.pages[0].tests.forEach((tinfo, tinfoIndex) => {
		t.deepEqual(auditJson.pages[0].tests[tinfoIndex], tinfo);
	});
	t.deepEqual(auditJson.pages[0].tests, expectedJson.pages[0].tests);
	t.deepEqual(auditJson.pages, expectedJson.pages);
	t.deepEqual(auditJson, expectedJson);
});

test('parse audit multi page', async t => {
	const auditBaseFile = 'assets/audit-multi-page';
	const auditStr = await readFile(`${auditBaseFile}.txt`);
	const auditJson = auditStr2Json(auditStr);
	const expectedJson = await readJson(`${auditBaseFile}.json`);
	t.is(auditJson.auditId, expectedJson.auditId);
	t.is(auditJson.finishedAt, expectedJson.finishedAt);
	t.is(auditJson.error, expectedJson.error);
	t.deepEqual(auditJson.summary, expectedJson.summary);
	t.deepEqual(auditJson.pages[0].summary, expectedJson.pages[0].summary);
	expectedJson.pages[0].tests.forEach((tinfo, tinfoIndex) => {
		t.deepEqual(auditJson.pages[0].tests[tinfoIndex], tinfo);
	});
	t.deepEqual(auditJson.pages[0].tests, expectedJson.pages[0].tests);
	t.deepEqual(auditJson.pages, expectedJson.pages);
	t.deepEqual(auditJson, expectedJson);
});
