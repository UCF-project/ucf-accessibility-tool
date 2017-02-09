# ucf-accessibility-tool

CLI for using different accessibility tools. It will load
scenarios/files containing the URLs to be evaluated, launch the audits
and output the results. Available auditors tools are: aatt, tanaguru,
asqatasun.

Auditors are ran externally and this CLI interact with them over HTTP.
Check
[ucf-audit-docker](https://github.com/UCF-project/ucf-audit-docker)
project to access Dockerfiles to build container images with auditors.

## Installation

Using in a project with npm:

```
$ npm install https://github.com/UCF-project/ucf-accessibility-tool.git
$ ./node_modules/.bin/uat --version
0.1.0
```

In development:

```
$ git clone https://github.com/UCF-project/ucf-accessibility-tool.git
$ cd ucf-accessibility-tool
$ npm install
$ node cli.js --version
0.1.0
```

## Usage

Check the CLI help for up to date usage information.

```
$ uat --help

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
```

Dockerfile, docker compose and usage examples of UCF Accessibility
Tool are available at
[ucf-audit-docker](https://github.com/UCF-project/ucf-audit-docker)
project.
