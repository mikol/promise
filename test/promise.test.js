'use strict';

require('../lib/criteria/criteria'); /* globals scope, test */

const is = require('is');
const PolyfillPromise = require('promise');

scope('Polyfill Promise Tests',
function () {
  scope('Promise.* implementations are correct.', function () {
    test('`all()` rejects.',
    function (must) {
      var expected = [
        'I swear.',
        new Error('Hand to g_d.'),
        'You have my word.'
      ];

      var promise = PolyfillPromise.all([
        new PolyfillPromise(function (_resolve) {
          setTimeout(function () {
            _resolve(expected[0]);
          }, 10);
        }),
        new PolyfillPromise(function (_resolve, _reject) {
          setTimeout(function () {
            _reject(expected[1]);
          }, 5);
        }),
        PolyfillPromise.resolve(expected[2])
      ]);

      return must.reject(promise, function (actual) {
        must.true(() => actual === expected[1]);
      }, null, 'Expected Promise.all() to reject.');
    });

    test('`all()` resolves.',
    function (must) {
      var expected = ['I swear.', 'Hand to g_d.', 'You have my word.'];
      var promise = PolyfillPromise.all([
        new PolyfillPromise(function (_resolve) {
          setTimeout(function () {
            _resolve(expected[0]);
          }, 10);
        }),
        new PolyfillPromise(function (_resolve) {
          setTimeout(function () {
            _resolve(expected[1]);
          }, 5);
        }),
        PolyfillPromise.resolve(expected[2])
      ]);

      return must.resolve(promise, function (actual) {
        must.true(() => actual[0] === expected[0]);
        must.true(() => actual[1] === expected[1]);
        must.true(() => actual[2] === expected[2]);
      });
    });

    test('`all([])` resolves.',
    function (must) {
      var promise = PolyfillPromise.all([]);

      return must.resolve(promise, function (actual) {
        must.true(() => actual.length === 0);
      });
    });

    test('`race()` resolves.',
    function (must) {
      var expected = ['I swear.', 'Hand to g_d.', 'You have my word.'];
      var promise = PolyfillPromise.race([
        new PolyfillPromise(function (_resolve) {
          setTimeout(function () {
            _resolve(expected[0]);
          }, 10);
        }),
        new PolyfillPromise(function (_resolve) {
          setTimeout(function () {
            _resolve(expected[1]);
          }, 5);
        }),
        PolyfillPromise.resolve(expected[2])
      ]);

      return must.resolve(promise, function (actual) {
        must.true(() => actual === expected[2]);
      });
    });

    test('`race()` rejects.',
    function (must) {
      var expected = [
        'I swear.',
        'Hand to g_d.',
        new Error('You have my word.')
      ];

      var promise = PolyfillPromise.race([
        new PolyfillPromise(function (_resolve) {
          setTimeout(function () {
            _resolve(expected[0]);
          }, 10);
        }),
        new PolyfillPromise(function (_resolve) {
          setTimeout(function () {
            _resolve(expected[1]);
          }, 5);
        }),
        PolyfillPromise.reject(expected[2])
      ]);

      return must.reject(promise, function (actual) {
        must.true(() => actual === expected[2]);
      }, null, 'Expected Promise.race() to reject.');
    });

    test('`race([])` never resolves.',
    function (must) {
      var promise = PolyfillPromise.race([]);
      var caught = false;

      promise.then(function () {
        caught = true;
      }, function () {
        caught = true;
      });

      return must.resolve(new Promise(function (resolve, reject) {
        var reason = new Error('Promise.race([])');
        setTimeout(function () {
          if (caught) {
            reject(reason);
          } else {
            resolve();
          }
        }, 10);
      }));
    });

    test('`reject()` rejects.',
    function (must) {
      var expected = new Error('Hand to g_d.');
      var promise = PolyfillPromise.reject(expected);

      return must.reject(promise, function (actual) {
        must.true(() => actual === expected);
      }, null, 'Expected Promise.reject() to reject.');
    });

    test('`resolve()` resolves.',
    function (must) {
      var expected = 'I swear.';
      var promise = PolyfillPromise.resolve(expected);

      return must.resolve(promise, function (actual) {
        must.true(() => actual === expected);
      });
    });
  });

  scope('Promise.prototype.* implementations are correct.', function () {
    test('`catch()` returns a promise.',
    function (must) {
      var promise = new PolyfillPromise(function (resolve) { resolve(13); });
      var _catch = promise.catch();

      must.true(() => _catch && is.function(_catch.then));
      must.true(() => promise.constructor === _catch.constructor);
      must.true(() => promise !== _catch);
    });

    test('`catch(() => { throw ... })` rejects.',
    function (must) {
      var expected = new Error('You have my word.');
      var promise = new PolyfillPromise(function (resolve) { resolve(13); });
      var then = promise.then(function () {
        throw new Error('!');
      }).catch(function () {
        throw expected;
      });

      return must.reject(then, function (actual) {
        must.true(() => actual === expected);
      });
    });

    test('`catch(() => ...)` resolves.',
    function (must) {
      var expected = new Error('You have my word.');
      var promise = new PolyfillPromise(function (resolve) { resolve(13); });
      var then = promise.then(function () {
        throw expected;
      });

      return then.catch(function (actual) {
        must.true(() => actual === expected);
      });
    });

    test('`then()` returns a promise.',
    function (must) {
      var promise = new PolyfillPromise(function (resolve) { resolve(13); });
      var then = promise.then();

      must.true(() => then && is.function(then.then));
      must.true(() => promise.constructor === then.constructor);
      must.true(() => promise !== then);
    });

    test('`then(() => { throw ... })` rejects.',
    function (must) {
      var expected = new Error('You have my word.');
      var promise = new PolyfillPromise(function (resolve) { resolve(13); });
      var then = promise.then(function () {
        throw expected;
      });

      return must.reject(then, function (actual) {
        must.true(() => actual === expected);
      });
    });

    test('`then(() => ...)` resolves.',
    function (must) {
      var expected = 'You have my word.';
      var promise = new PolyfillPromise(function (resolve) { resolve(13); });
      var then = promise.then(function () {
        return expected;
      });

      return must.resolve(then, function (actual) {
        must.true(() => actual === expected);
      });
    });
  });
});
