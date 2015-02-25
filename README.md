Express Proxy
=============

A configurable proxy as express middleware

```javscript


server.use(proxy.rule('example.host.com', 'prefix/*') // (use grunt matching template)
// or
server.use(proxy.rule('example.host.com', //);
// or
server.use(proxy.rule('example.host.com', { // no options straight proxies all routes to host

  //
  // conditions (no condition matches any route)
  //

  condition : 'prefix/*' // (use grunt matching template)
  // or
  condition : /prefix/.*/
  // or
  only : {
    match : '',
    paths : '',
    headers : '',
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