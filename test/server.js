var proxy  = require('../lib/proxy');
var server = require('express')();

var gitProxy = null;

// NOTE: github requires a header and https. we'll have to find another API to test the pure proxy approach

// pure proxy
// gitProxy = proxy('api.github.com', '/github');

// or

// regex match pure proxy
// gitProxy = proxy('api.github.com', /^\/github/); // NOT IMPLEMENTED

// or

// gitProxy = proxy('api.github.com', {
//    log : true,
//    forceHttps : true,
//    headers    : {
//     'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
//   }
// });

// or

gitProxy = proxy('api.github.com', {
  forceHttps : true,
  prefix     : 'github',
  log        : true,
  headers    : {
    'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
  }
});


server.use(gitProxy);
server.listen(7000);