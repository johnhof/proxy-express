Express Proxy
=============

[![Build Status](https://travis-ci.org/johnhof/express-proxy.svg?branch=master)](https://travis-ci.org/johnhof/express-proxy)

A configurable proxy as express middleware

### this module is still in pre-production. use is not recommended

- [Usage](#usage)
    - ['Server example'](#server-example)
- [Proxy Types](#proxy-types)
    - [Pure proxy](#pure-proxy)
    - [Proxy With Prefix](#proxy-with-prefix)
    - [Proxy With Configuration](#proxy-with-confix)
- [Configuration Options](#configuration-options)
    - [.prefix](#prefix)
    - [.restrict](#restrict)
    - [.request](#request)
      - [.forceHttps](#forcehttps)
      - [.headers](#headers)
      - [.query](#query)
      - [.form](#form)
    - [.pre](#pre)
    - [.post](#post)
- [Example Configuration](#example-configuration)

# Usage

This module is designed to simplify server logic when utilizing 3rd party API's. If the server is serving an application using any number of 3rd party API's, express-proxy can reduce server code to a single file.

### Server example

```javascript
var proxy  = require('express-proxy');
var routes = require('/routes');
var server = require('express')();

server.use(routes);

server.use(proxy('api.travis.com', '/travis'));

server.use(proxy('jira.atlassian.com', '/jira'));

server.use(proxy('api.github.com', {
  prefix  : 'github',
  request : {
    forceHttps : true,
    headers    : {
      'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
    }
  }
}));

server.listen(7000);
```

# Proxy types

## Pure proxy

Forward all requests to the host specified. if `forceHttps` is `true`, all requests to the proxied server will be https

```javascript
  server.use(proxy('www.foo.com'), [forceHttps]);
  // [METHOD] /* => proxied to the 3rd party server
```

## Proxy With Prefix

Forward all requests to the host specified. Only requests made with the prefix in the URL will be run through the proxy. The prefix will be stripped from the request before it's made to the proxied server. if `forceHttps` is `true`, all requests to the proxied server will be https


```javascript
  server.use(proxy('www.foo.com', '/foo', [forceHttps]));
  // [METHOD] /users => ignored by proxy
  // [METHOD] /foo/users => proxied to [METHOD] //www.foo.com/users
```

## Proxy With Configuration

Allows complex configuration. More details in the [configuration section](#configuration-options)

```javascript
  server.use(proxy('ww.foo.com', {
    prefix  : 'foo',
    request : {
      forceHttps : true,
      headers    : {
        'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
      }
    }
  }));

  // [METHOD] /users => ignored by proxy
  // [METHOD] /foo/users => proxied to [METHOD] https://www.foo.com/users with 'User-Agent' set
```

# Configuration Options

The following configuration options are allowed

## .prefix

Type: `String`

The proxy will  match any route with the leading prefix. The prefix will be removed before the request is submitted to the proxied server

```javascript
proxy('www.foo.com', {
  prefix : '/foo'
  // /foo/test => /test
  // /test => ignored by proxy
});
```

## .restrict

Type : `String || RegExp || Array`

Only routes matching the restrictions will be run through the proxy

```javascript
proxy('www.foo.com', {
  restrict : 'bar'
  // /biz/bar => proxied
  // /biz => ignored
});

// OR

proxy('www.foo.com', {
  restrict : /\/bar$/
  // /biz/bar => proxied
  // /bar/biz => ignored
});

// OR

proxy('www.foo.com', {
  restrict : [/\/bar$/, 'foo']
  // /biz/bar => proxied
  // /biz/foo/baz => proxied
  // /bar/biz => ignored
});
```

## .request

Type: `Object`

All options set in the request proper will be applied to the proxy request

### .forceHttps

Type: `Boolean`

If true, all requests to teh proxied server will be made over https

```javascript
proxy('www.foo.com', {
  request : {
    forceHttps : true
  }
});
```

### .headers

Type: `Object`

Any header key/value pair will override the headers being proxied by to the 3rd party server. setting a header to `undefined` will remove it from the proxied request

```javascript
proxy('www.foo.com', {
  request : {
    headers : {
      'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
      'accept-language' : undefined // deleted from all proxied requests
    }
  }
});

### .query

Type: `Object`

Any query key/value pair will override the query being proxied by to the 3rd party server

```javascript
proxy('www.foo.com', {
  request : {
    query : {
      type : 'proxied' // /foo => /foo?type=proxied
    }
  }
});

### .form

Type: `Object`

Requires:  `bodyParser.json()`

Any form key/value pair will override the form/body being proxied by to the 3rd party server

```javascript
proxy('www.foo.com', {
  request : {
    form : {
      type : 'proxied'
    }
  }
});
```

## .pre

Type : `function || Array`

The function passed in will be run ad a callback before the request is made. any changes to `prodyObj.reqOpts` will be used in the request. The reqOpts object will be passed directy into the [request module](https://www.npmjs.com/package/request) after the callback is executed. If using this funciton. please familiarize yourself with the [request module](https://www.npmjs.com/package/request). If an array of functions are sumitted, they will be executed synchronously

```javascript
proxy('www.foo.com', {
  pre : function (proxyObj) {
    // proxyObj contains
    // {
    //   req      : Object // express request
    //   res      : Object // express request
    //   proxyObj : Object // object used in the 'request' module request
    // }
    return callback();
  }
});
```

## .post

Type : `function || Array`

The function passed in will be run ad a callback after the request is made. any changes to `prodyObj.res` and `proxyObj.result` will be used in the response. `proxyObj.result.response` is the response object returned from the [request module](https://www.npmjs.com/package/request). If an array of functions are sumitted, they will be executed synchronously

```javascript
proxy('www.foo.com', {
  post : function (proxyObj) {
    // proxyObj contains
    // {
    //   req      : Object // express request
    //   res      : Object // express request
    //   proxyObj : Object // object used in the 'request' module request
    //   result   : {
    //     response : Object, // response object from the proxied request
    //     body     : Mixed // response body from the proxied request
    //   }
    // }
    return callback();
  }
});
```
# Example configuration

below is a configuration using all of the available components.

```javascript
{
  prefix : String
  restrict : [],
  request {
    forceHttps : true,
      headers : {'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0'
    },
    query : {
      isProxied : 'true'
    },
    form : {
      isProxied : 'true'
    },
  },
  before : function (proxyObj, callback) {
    console.log('sending headers ')
    console.log(proxyObj.reqOpts.headers);
    return callback();
  }

  after : function (proxyObj, callback) {
    console.log('returned headers ')
    console.log(proxyObj.result.response.headers);
    return callback();
  }
}
```


## Tests

to run tests: `npm install && npm test`

tests must be added for each new feature to maintain coverage

