Express Proxy
=============

A configurable proxy as express middleware

### this module is still in pre-production. use is not recommended

Example server

```javascript
var proxy  = require('express-proxy');
var routes = require('/routes');
var server = require('express')();

server.use(routes);

server.use(proxy('api.travis.com', '/travis'));

server.use(proxy('jira.atlassian.com', '/jira'));

server.use(proxy('api.github.com', {
  forceHttps : true,
  prefix     : 'github',
  headers    : {
    'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
  }
}));

server.listen(7000);
```