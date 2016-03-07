(function (context) {
/*jscs:disable validateIndentation*//*jscs:enable validateIndentation*/
// -----------------------------------------------------------------------------

'use strict';

var id = 'Promise';
var dependencies = Promise ? [] : ['./polyfill'];

function factory(Polyfill) {
  var PromiseConstructor = Polyfill || Promise;

  /**
   * ES3-compatible alias for
   * `[Promise.prototype.catch()](https://goo.gl/u3nRi1)`.
   */
  PromiseConstructor.prototype.$catch = PromiseConstructor.prototype['catch'];

  return PromiseConstructor;
}

// -----------------------------------------------------------------------------
var x = dependencies.length; var o = 'object';
context = typeof global === o ? global : typeof window === o ? window : context;
if (typeof define === 'function' && define.amd) {
  define(dependencies, function () {
    return factory.apply(context, [].slice.call(arguments));
  });
} else if (typeof module === o && module.exports) {
  for (; x--;) {dependencies[x] = require(dependencies[x]);}
  module.exports = factory.apply(context, dependencies);
} else {
  for (; x--;) {dependencies[x] = context[dependencies[x]];}
  context[id] = factory.apply(context, dependencies);
}
}(this));
