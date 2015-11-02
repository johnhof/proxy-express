var server = require('express')();
var proxy  = require('../lib/proxy');

// travis proxy
server.use(proxy('api.travis-ci.org', {
  prefix  : '/travis',
  request : {
    headers         : {
      'User-Agent' : 'Mozilla/5.0 (X11; Linux i686 (x86_64)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36',
      'Accept'     : 'application/vnd.travis-ci.2+json'
    }
  }
}));

// github proxy
server.use(proxy('api.github.com', {
  prefix  : '/github',
  request : {
    forceHttps : true,
    headers    : {
      'User-Agent' : 'Mozilla/5.0 (X11; Linux i686 (x86_64)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36',
    }
  }
}));

server.use(proxy('i.imgur.com', {
  prefix  : '/imgur',
  log  : true,
  request : {
    headers    : {
      'User-Agent' : 'Mozilla/5.0 (X11; Linux i686 (x86_64)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36',
    }
  }
}));

// simple server health check
server.get('/status', function (req, res) {
  res.send('OK');
})

// return the app for all other routes
server.get('*', function (req, res) {
  res.set({ 'Content-Type': 'text/html; charset=utf-8' });
  res.sendFile(__dirname + '/app.html');
});

console.log('\nserver listening...\n')
server.listen(8000)