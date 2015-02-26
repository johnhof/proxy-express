var proxy  = require('../lib/proxy');
var server = require('express')();

server.use(proxy('api.github.com'));

// // or

// server.use(proxy('api.github.com', '/githb'));

// // or

// server.use(proxy('api.github.com', /^\/github/));

// // or

// server.use(proxy('api.github.com', {
//   forceHttps  : true,
//   prefix      : '/github',
//   headers     : {
//     'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0',
//   }
// }));


//   server.listen(7000);
// }