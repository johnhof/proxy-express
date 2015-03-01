var request = require('request');

request({
  url : 'http://localhost:7000/github/users/johnhof'
}, function (error, response, body) {
  console.log(body)
})