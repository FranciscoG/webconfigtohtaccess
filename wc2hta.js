#!/usr/bin/env node
'use strict';
var fs = require('fs');
var xmljs = require('xml-js');
var _ = require('lodash');
var file = process.argv.slice(2);

function displayHelp(){
  var helptext = `
  Web.Config to .htaccess Rewrite Rule converter
  Usage:
    ./convert.js path/to/your/web.config`;
  console.log(helptext);
}

if ( !file ) {
  displayHelp();
  process.exit(1);
}


function createRewriteRule(match, dest) {
  return `RewriteRule ${match} ${dest} \n`;
}


function convertRules(result){
  var rewrites = "";
  var regex = /{R:(\d{1})}/;

  // get the deeply nested Rule array, lodash FTW
  var ruleArray = _.get(result, 'configuration["system.webServer"].rewrite.rules.rule', []);

  ruleArray.forEach(r => {
    var type = _.get(r, 'action._attributes.type');
    let match = _.get(r, 'match._attributes.url');
    let url = _.get(r, 'action._attributes.url');

    if (type === "Redirect" && match && url) {
    
      if (regex.test(url)) {
        url = url.replace(regex, '$' + RegExp.$1 );
      }
      
      rewrites += createRewriteRule(match, url); 
    } 
  });

  return rewrites;
}


function converMaps(maps){
  var rewrites = "";
  // { rewriteMaps: { rewriteMap: { _attributes: [Object], add: [Array] } } }
  var addsArray = _.get(maps, 'rewriteMaps.rewriteMap.add', []);
  
  addsArray.forEach(a=>{
    // { _attributes: { key: '/events', value: '/acthar-live-events' } },
    let match = _.get(a, '_attributes.key');
    let dest = _.get(a, '_attributes.value');
    if (match && dest) {
      rewrites += createRewriteRule(match, dest); 
    }
  });

  return rewrites;
}

function checkForMaps(result) {
  var mapsResults = "";
  
  var rewriteMapsConfig = _.get(result, 'configuration["system.webServer"].rewrite.rewriteMaps._attributes.configSource');
  
  if (rewriteMapsConfig) {
    console.log(`An external rewrite maps config file detected: ${rewriteMapsConfig}`);
    console.log("Attempting to process that one as well");
    var rewriteMapsConfigFile = fs.readFileSync(''+rewriteMapsConfig, {encoding: 'utf-8'});
    var mapsResult = xmljs.xml2js(rewriteMapsConfigFile, {compact: true, spaces: 4});
    mapsResults += converMaps(mapsResult);
  }
  return mapsResults;
}

function saveHtaccess(h){
  fs.writeFileSync('.htaccess', h);
  console.log('.htaccess file created in current folder')
  console.log('done!')
}

// load web config sync
var webconfig = fs.readFileSync(''+file, {encoding: 'utf-8'});
var htaccess = "";

var result = xmljs.xml2js(webconfig, {compact: true, spaces: 4});
htaccess += checkForMaps(result);
htaccess += convertRules(result);

saveHtaccess(htaccess);