#!/usr/bin/env node
'use strict';
var fs = require('fs');
var xmljs = require('xml-js');
var _ = require('lodash');
var argv = require('minimist')(process.argv.slice(2));

var file = argv._[0];
var status = argv.status || '';
// replace trailing forward slash
var prefix = argv.prefix || '';

var testArray = [];

function displayHelp(){
  var helptext = `
  Web.Config to .htaccess Rewrite Rule converter
  Usage:
    node wc2hta.js Web.config [--status 301] [--prefix https://wwww.something.com]

    --status      add an http status to your redirect
    --prefix      add a domain to the domain destination 
    --test        create a JSON object with the results for testing
  `;
  console.log(helptext);
}

/*
  Check for required arguments
 */
if ( !file ) {
  displayHelp();
  process.exit(1);
}

function formatDestination(dest) {
  if ( !/^(https?:)?\/\//.test(dest)) {
    // ensure dest always begins with a foward slash
    if (!/^\//.test(dest) ) {
      dest = '/'+dest;
    }
    // add the domain prefix if it exists, removing trailing slash
    return prefix.replace(/\/$/,'') + dest;
  }
  return dest;
}

function createRewriteRule(match, dest, comment) {
  dest = formatDestination(dest);
  if (comment) {
    return `  # ${comment}\n  RewriteRule ${status} ${match} ${dest} \n`;
  } 
  return `  RewriteRule ${status} ${match} ${dest}\n`;
}

function createRedirect(match, dest) {
  dest = formatDestination(dest);
  return `  Redirect ${status} ${match} ${dest}\n`;
}


function convertRules(result){
  var rewrites = `
# ##################################################### 
# Web.Config rewrite rules
# #####################################################
<IfModule mod_rewrite.c>
  RewriteEngine on\n\n`;

  var regex = /{R:(\d{1})}/;

  // get the deeply nested Rule array, lodash FTW
  var ruleArray = _.get(result, 'configuration["system.webServer"].rewrite.rules.rule', []);

  ruleArray.forEach(r => {
    var type = _.get(r, 'action._attributes.type');
    let match = _.get(r, 'match._attributes.url');
    let url = _.get(r, 'action._attributes.url');
    let name = _.get(r, '_attributes.name');

    if (type === "Redirect" && match && url) {
    
      if (regex.test(url)) {
        url = url.replace(regex, '$' + RegExp.$1 );
      }
      
      rewrites += createRewriteRule(match, url, name);

      if (argv.test) {
        testArray.push( {'match': match, 'destination': formatDestination(url)} );
      }
    } 
  });

  return rewrites += '\n</IfModule>\n';
}

/**
 * Convert a list of rewriteMaps
 * <rewriteMap> <add key="" value="" /> </rewriteMap>
 * 
 * @param {object} maps 
 * @returns {string}
 */
function convertMaps(maps){
  var rewrites = "";;
    var addsArray = _.get(maps, 'rewriteMaps.rewriteMap.add', []);
  
  addsArray.forEach(a=>{
    let match = _.get(a, '_attributes.key');
    let dest = _.get(a, '_attributes.value');
    if (match && dest) {
      rewrites += createRedirect(match, dest); 
    }
    if (argv.test) {
      testArray.push( {'match': match, 'destination': formatDestination(dest)} );
    }
  });

  return rewrites += '\n</IfModule>\n';
}

/**
 * Checks if the Web.config has an external config file with more rewriteMaps
 * it will attempt to load external file and process those rules as well
 * 
 * @param {object} result 
 * @returns {string}
 */
function checkForMaps(result) {
  var mapsResults = '';
  var rewriteMapsConfig = _.get(result, 'configuration["system.webServer"].rewrite.rewriteMaps._attributes.configSource');
  
  if (rewriteMapsConfig) {
    console.log(`An external rewrite maps config file detected: ${rewriteMapsConfig}`);
    console.log("Attempting to process that one as well");
    
    try {
      var rewriteMapsConfigFile = fs.readFileSync(''+rewriteMapsConfig, {encoding: 'utf-8'});
      var mapsResult = xmljs.xml2js(rewriteMapsConfigFile, {compact: true, spaces: 4});

      mapsResults = `
# ##################################################### 
# Redirects processed from: ${rewriteMapsConfig} 
# #####################################################
<IfModule mod_rewrite.c>
  RewriteEngine on\n\n`;

      mapsResults += convertMaps(mapsResult);
    } catch (e) {
      console.log('Error loading rewriteMaps file');
      console.log(e);
    }
   
  }
  return mapsResults;
}

function saveHtaccess(h){
  try {
    fs.writeFileSync('.htaccess', h);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
  
  console.log('.htaccess file created in current folder')
  console.log('done!')
}

try {
  // load web config sync
  var webconfig = fs.readFileSync(''+file, {encoding: 'utf-8'});
  var result = xmljs.xml2js(webconfig, {compact: true, spaces: 4});
} catch (e) {
  console.error(e);
  process.exit(1);
}


var htaccess = "";
htaccess += checkForMaps(result);
htaccess += convertRules(result);

saveHtaccess(htaccess);

if (argv.test) {
  try {
    fs.writeFileSync('test-data.json', JSON.stringify(testArray, null, 2));
  } catch (e) {
    console.error(e);
    process.exit(1);
  } 
}