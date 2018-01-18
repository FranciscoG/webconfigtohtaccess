# web.config to .htaccess

Node-based CLI to convert Web.config rewrite rules to .htaccess file

## Important note
This is something mainly suited to my own needs and not meant to handle all uses cases. It's a starting point, you'll still need to go in and edit the .htaccess file and add all your other .htaccess file things. It doesn't generate a fully complete and ready to go file. 

# wc2hta.js

basic use
```
node wc2hta.js /path/to/Web.Config
```
## options

`--status` - include an https status in the Redirect    

`--prefix` - include a domain to be prefixed to every destination url that does not have a full domain already (make sure to include the protocol as well)

`--test` - a bit misleading option, might change its name. It creates a JSON file with an array of objects to make it easy to test if the redirect rules are in place. you can use the `checker.js` file to check http status

Example with options
```
node wc2hta.js Web.config --status 301 --prefix https://www.mywebsite.com
```

**note**: I'm not 100% sure but I think 301 redirects require full domain for the destination so I might have to make prefix required. For now I'm just going to always use it.

### NPM Dependencies
I try to keep my dependencies as shallow and little as possible    
[lodash](https://www.npmjs.com/package/lodash) - no sub-dependencies    
[minimist](https://www.npmjs.com/package/minimist) - no sub-dependencies    
[xml-js](https://www.npmjs.com/package/xml-js) - 1 dep    
 - [sax](https://www.npmjs.com/package/sax)


# checker.js

Take the generated `test-data.json` file that was created by `wc2hta.js` and check if the redirects worked.

```
node checker.js --json /path/to/test-data.json --domain http://www.mysite.com > results.tsv
```
## options

`--json` - the location of the `test-data.json` file

`--domain` - the domain to prefix in front of the origin urls

### NPM Dependencies
Well, I tried to keep it shallow but then I went and added request and, well, you know    
[request](https://github.com/request/request) - [view dependency graph here](http://npm.broofa.com/?q=request)