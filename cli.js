#!/usr/bin/env node

'use strict';

const meow = require('meow');
const uat = require('./api');

const cli = meow(`
	Usage
		$ uat <options>

	Options
		--file <filepath> File with URLs to evaluate (for aatt auditor only).
		--scenario <filepath> File with scenario to evaluate (for tanaguru and asqatasun auditors only).
		--localstorage <id:value> Set variable identified by id to value.
		--webdriver-host <wbhost> Set webdriver server host. Default is environment variable WB_HOST.
		--webdriver-port <wbport> Set webdriver server port. Default is environment variable WB_PORT.
		--auditor-host <auditorhost> Set auditor server host. Default is environment variable AUDITOR_HOST.
		--auditor-port <auditorport> Set auditor server port. Default is environment variable AUDITOR_PORT.
		--base-url <appurl> Set your application URL. Default is environment variable BASE_URL.
		--out <folderpath> Set the folder where reports will be written.
		--auditor <auditor> Set the auditor to perform the accessibility check. Available auditors are: aatt, tanaguru, asqatasun
		--check-min-mark <value> Set the minimum RawMark accepted as success for tanaguru and asqatasun auditors.
		--check-max-errors <value> Set the maximum number of errors per page accepted as success for aatt.

	Examples
		$ uat --file myurlsfile.txt --localstorage myvar:mysecret --out report/
`, {
	default: {
		// TODO: better defaults (if no argument, neither env, what then?)
		webdriverHost: process.env.WB_HOST,
		webdriverPort: process.env.WB_PORT,
		auditorHost: process.env.AUDITOR_HOST,
		auditorPort: process.env.AUDITOR_PORT,
		baseUrl: process.env.BASE_URL,
		out: ''
	}
});

uat(cli.flags);
