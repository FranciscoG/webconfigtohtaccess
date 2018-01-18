#!/usr/bin/env node
'use strict';
var fs = require('fs');
var request = require('request');
var argv = require('minimist')(process.argv.slice(2));

/**
 * Console logs the CLI help info
 */
function displayHelp(){
  var helptext = `
  url redirect checker
  it outputs in TSV format which you can output directly to a file if you want

  Usage:
    node checker.js --json /path/to/test-data.json --domain http://www.mysite.com > results.tsv
  `;
  console.log(helptext);
}

/***************************************************
 * Process CLI arguments
 */
var jsonFile = argv.json;
 if ( !jsonFile ) {
  displayHelp();
  process.exit(1);
}

var domain = argv.domain;
if (domain) {
  // replace leading double slash if detected
  domain = domain.replace(/^\/\//, '');

  // add protocol if it doesn't exist
  if (!/^https?:\/\//.test(domain)) {
    domain = 'http://' + domain;
  }
}

/***************************************************
 * begin
 */

var testData = require(jsonFile);

function checkResults(res) {
  // console.log(res.statusCode);
  // console.log(res.statusMessage);
  // console.log(res.request.headers.referer);
  // console.log(res.request.href);
  return `${res.statusCode}\t${res.statusMessage}\t${res.request.headers.referer}\t${res.request.href}`;
}

function doRequest(url) {
  return new Promise(function (resolve, reject) {
    request(url, function (error, res, body) {
      if (!error) {
        resolve(res, body);
      } else {
        reject(error);
      }
    });
  });
}


console.log(`statusCode\tstatusMessage\treferer\thref`)
testData.forEach(async function (el) {
  let url = domain + el.match;
  try {
    let res = await doRequest(url);
    console.log(checkResults(res));
  } catch (err) {
    console.error(e);
  }

});

