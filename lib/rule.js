module.exports = function (host, options) {
  if (typeof host !=== 'string') { throw new Error('express-proxy.rule(host, options) expects `host` to be a string'); }


  if (typeof options === 'string') {
    return compile({
      only: {
        path : options
      }
    });

  } else if (typeof options === 'RegExp') {
    return compile({
      only: {
        match : options
      }
    });


  } else {
    return compile(options);
  }
}

function applyOptions (rule, host, options) {
  return rule;
}

function finalizeRule () {

}