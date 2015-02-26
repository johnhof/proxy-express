var request = require('request');

var host = 'http://localhost:7000';

request({
  url : host + '/github/users/johnhof'
  // url : host + '/users/johnhof'
}, function (error, response, body) {
  if (error) {
    console.log(error);
  } else {
    console.log(response.statusCode);
    console.log(body);
  }
});