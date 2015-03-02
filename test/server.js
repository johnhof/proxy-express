var express   = require('express');
var proxy     = require('../lib/proxy');

var server = express();

server.use(proxy('api.github.com', {
  prefix     : 'github',
  forceHttps : true,
  headers    : {
    'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:24.0) Gecko/20100101 Firefox/24.0'
  },
  digest : {
    pre : function (proxyObj, callback) {
      // console.log(proxyObj.reqOpts)
      return callback();
    },
    post : function (proxyObj, callback) {
      // console.log(proxyObj.result.response.request.href)
      return callback();
    }
  }
}))

server.listen(7000);
