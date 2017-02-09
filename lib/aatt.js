var fs = require('fs');
var nemoRunner = require('nemo');
var debug = require('debug')('UAT:AATT');
var chalk = require('chalk');

const accessBaseUrl = (nemo, options) => {
	return new Promise((resolve, reject) => {
		nemo.driver.get(nemo.data.baseUrl)
		.then(() => {
			debug(`Successfully accessed base URL: ${nemo.data.baseUrl}`);
			resolve({nemo, options});
		})
		.catch(err => {
			reject(new Error(`Could not access base URL: ${nemo.data.baseUrl}`, err));
		});
	});
};

const setLocalstorage = vars => {
	const nemo = vars.nemo;
	const options = vars.options;
	// Local storage
	return new Promise((resolve, reject) => {
		if (options.localstorage) {
			const items = options.localstorage.split(':', 1);
			const itemId = items[0];
			const itemValue = items[1];
			nemo.driver.executeScript(`window.localStorage.setItem("${itemId}", "${itemValue}")`)
			.then(() => {
				debug(`Successfully set localstorage: ${itemId}`);
				resolve(vars);
			})
			.catch(e => {
				reject(new Error(`Could not set localstorage: ${options.localstorage}`, e));
			});
		} else {
			resolve(vars);
		}
	});
};

const getUrlsToScan = vars => {
	const nemo = vars.nemo;
	const options = vars.options;
	// File
	return new Promise((resolve, reject) => {
		if (options.file) {
			fs.readFile(options.file, 'utf8', (err, data) => {
				if (err) {
					reject(new Error(`Could read file: ${options.file}`, err));
				}
				const urls = data.split('\n');
				resolve({nemo, urls});
			});
		}
	});
};

const scanOptions = {
	output: 'json'
};

const checkMaxErrors = (nemo, url, result) => {
	const options = nemo.data.options;
	nemo.data.errorsCount = nemo.data.errorsCount || 0;
	if ('checkMaxErrors' in options) {
		const errorNumber = result[result.length - 1].errorcount;
		if (errorNumber > options.checkMaxErrors) {
			nemo.data.errorsCount++;
			process.exitCode = 1;
			console.log(chalk.red(`✖	${errorNumber} error${errorNumber === 1 ? '' : 's'}	${url}`));
		} else {
			console.log(chalk.green(`✔	${errorNumber} error${errorNumber === 1 ? '' : 's'}	${url}`));
		}
	}
};

const scanUrl = (nemo, url, reportFilepath) => {
	return new Promise((resolve, reject) => {
		// Access URL
		nemo.driver.get(url)
		.then(() => {
			debug(`Successfully accessed URL: ${url}`);

			// Scan URL for accessibility
			nemo.accessibility.scan(scanOptions).then(function (result) {
				// Write report HTML file
				fs.writeFile(reportFilepath, JSON.stringify(result, null, 2), function (err) {
					if (err) {
						reject(Error(`Error when trying to create report file for URL: ${url}, at ${reportFilepath}`, err));
					}
					debug(`Created accessibility report for URL: ${url}, at ${reportFilepath}`);
					checkMaxErrors(nemo, url, result);
					resolve();
				});
			})
			.catch(err => {
				debug('Error', err);
				reject(new Error(`Page scan failed for URL: ${url}`, err));
			});
		})
		.catch(err => {
			debug('Error', err);
			reject(Error(`Could not access URL: ${url}`, err));
		});
	});
};

const scanUrls = vars => {
	const nemo = vars.nemo;
	const urls = vars.urls;
	return new Promise((resolve, reject) => {
		// Concurrent calls will break nemo
		// Promise.all(urls.map((pathname, index) => {
		// 	const url = `${nemo.data.baseUrl}${pathname}`;
		// 	const reportFile = `${nemo.data.options.out}accessibilityResult-${index}.json`;
		// 	return scanUrl(nemo, url, reportFile);
		// }))
		// So we use a sync version =>
		urls.reduce((previous, pathname, index) => {
			return previous.then(() => {
				const url = `${nemo.data.baseUrl}${pathname}`;
				const reportFile = `${nemo.data.options.out}accessibilityResult-${index}.json`;
				return scanUrl(nemo, url, reportFile);
			});
		}, Promise.resolve())
		.then(() => resolve(vars))
		.catch(reject);
	});
};

const quitDriver = vars => {
	const nemo = vars.nemo;
	debug('Scan finished. Quitting webdriver.');
	nemo.driver.quit();
};

const handleErrors = (nemo, err) => {
	// Tries to quite driver anyways
	quitDriver({nemo});
	debug('Final', err);
	throw err;
};

const createNemoOptions = options => {
	return {
		driver: {
			server: `http://${options.webdriverHost}:${options.webdriverPort}/wd/hub`,
			browser: 'chrome'
		},
		data: {
			baseUrl: `${options.baseUrl}`,
			options: options
		},
		plugins: {
			accessibility: {
				module: 'nemo-accessibility',
				arguments: [`http://${options.auditorHost}:${options.auditorPort}/evaluate`]
			},
			screenshot: {
				module: 'nemo-screenshot',
				arguments: ['screenshot', ['click', 'exception']]
			},
			cookie: {
				module: 'path:./examples/plugin/nemo-cookie'
			}
		}
	};
};

const runAatt = options => {
	const nemoOptions = createNemoOptions(options);
	nemoRunner(nemoOptions, function (err, nemo) {
		debug('Initiating nemo');

		if (err) {
			// TODO: change to share exit func
			debug('Error during Nemo setup', err);
			throw new Error('Error during Nemo setup', err);
		}

		debug(`Using webdriver: ${nemoOptions.driver.server}`);
		debug(`Using AATT: ${nemoOptions.plugins.accessibility.arguments[0]}`);

		console.log(`Maximum accepted number of errors: ${chalk.green(options.checkMaxErrors)}`);

		accessBaseUrl(nemo, options)
		.then(setLocalstorage)
		.then(getUrlsToScan)
		.then(scanUrls)
		.then(quitDriver)
		.catch(handleErrors.bind(null, nemo));
	});
};

module.exports = runAatt;
