Express Proxy
=============

A configurable proxy as express middleware

### this module is still in pre-production. use is not recommended

First draft

```javscript


server.use(proxy.rule('example.host.com') // straight proxy
// or
server.use(proxy.rule('example.host.com', 'prefix/*') // (use grunt matching template)
// or
server.use(proxy.rule('example.host.com', /.+?_example.+?/);
// or
server.use(proxy.rule('example.host.com', {

  //
  // conditions (no condition matches any route)
  //

  condition : 'prefix/*' // (use grunt matching template)
  // or
  condition : /prefix/.*/
  // or
  filter : {
    match : '',
    headers : { headerName: value},
    query : { param : value},
    body : { param: value },
    relaxed : true // match for any sinle condition
  }

  //
  // options
  //

  trueProxy : ['.img', /.+?_example_.+?.js/], // ignores middleware and user defined manipulation (do this by default)

  headers : {}

  //
  // digest
  //

  digest : {

    // conditions (no condition matches any route)

    condition : 'prefix/*' // (use grunt matching template),
    // or
    condition : /.+.html/,
    // or
    condition : ['.html', /.+?_example2_.+?.js/]
    // default to all routes

    // auto digest

    body : {
      relativePaths : true // make urls relative
    }

    // middleware
    // proxyObj contains:
    // {
    //   req: req,
    //   res: res,
    //   reqOpts : requestOptions, // proxy set's before calling 'before'
    //   result  : { // undefined in 'before'
    //     error    : error,
    //     response : response,
    //     body     : body
    //   }
    // }

    before : function (proxyObj, callback) {},
    // or
    before : [function (proxyObj, callback) {}, function (proxyObj, next) {}],

    after : function (proxyObj, callback) () {},
    // or
    after : [function (proxyObj, callback) () {}, function (proxyObj, next) {}],
  }
})
```