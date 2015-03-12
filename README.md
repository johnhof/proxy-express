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

## Proxy options

### Simple proxy

Forward all results to the host specified. if `forceHttps` is `true`, all requests to the proxied server will be https

```javascript
  server.use(proxy('www.foo.com'), [forceHttps]);
```

### Simple proxy with prefit

Forward all results to the host specified. Only requests made with the prefix in the URL will be run through the proxy. The prefix will be stripped from the request before it's made to the proxied server. if `forceHttps` is `true`, all requests to the proxied server will be https

forward

```javascript
  server.use(proxy('www.foo.com', '/foo', [forceHttps]));
  // GET /users => ignored by proxy
  // GET /foo/users => proxied to GET www.foo.com/users
```

### Cofigured proxy

Allows complex configuration. More details in the config section

```javascript
  server.use(proxy('ww.foo.com', {
    forceHttps : true,
    prefix     : 'github',
    headers    : {
      'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
    }
  }));
```

## Config options

The following config options are allowed

```javascript
{
  // Prefix : Only requests made with the prefix in the URL will be run through the proxy.
  //   The prefix will be stripped from the request before it's made to the proxied server
  prefix : String

  // Restrict : Matches against the request path. paths which fail to match are ignored
  //   String => accepts paths containing the restricted substring
  //   RegExp => accepts paths matching the restricted regex
  //   Array => accepts paths matching at leas one of its String/RegExp matches
  restrict : String || RegExp || Array,

  // Request : used to override values from incoming requests
  request {

    // Force Https : if true, all requsts to proxied server are made in https
    forceHttps : Boolean,

    // Headers : each key/value pair is applied to the proxied request headers
    headers : Object,

    // Query : each key/value pair is applied to the proxied request query string
    query : Object,

    // Form : each key/value pair is applied to the proxied request form body (requires that the server uses bodyParser)
    form : Object,
  },


  // Pre : occurs before request is made. updates to proxyObj will affec tthe proxy request
  pre : function (proxyObj, callback) {
    // proxyObj contains
    // {
    //   req      : Object // express request
    //   res      : Object // express request
    //   proxyObj : Object // object used in the 'request' module request
    // }
    return callback();
  }

  // Post : occurs after request is made. updates to proxyObj will affect the response to the client
  post : function (proxyObj, callback) {
    // proxyObj contains
    // {
    //   req      : Object // express request
    //   res      : Object // express request
    //   proxyObj : Object // object used in the 'request' module request
    //   result   : Object // contains 'response' and 'body' objects
    // }
    return callback();
  }
}
```

## Tests

to run tests: `npm install && npm test`

tests must be added for each new feature to maintain coverage

