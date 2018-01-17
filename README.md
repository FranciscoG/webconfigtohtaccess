# web.config to .htaccess

This is something mainly suited to my own needs and not meant to handle all uses cases

Node-based CLI to convert Web.config rewrite rules to .htaccess file

basic use
```
node wc2hta.js /path/to/Web.Config
```

options

`--status` - include an https status in the RewriteRule

`--prefix` - include an https status in the RewriteRule

**note**: I'm not 100% sure but I think 301 redirects require full domain for the destination so I might have to make prefix required. For now I'm just going to always use it.