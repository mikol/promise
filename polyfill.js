(function (context) {
/*jscs:disable validateIndentation*//*jscs:enable validateIndentation*/
// -----------------------------------------------------------------------------

'use strict';

var id = '';
var dependencies = ['defer', 'instance', 'is', 'noop', 'type'];

function factory(defer, instance, is, noop, type) {
  /**
   * @enum {string}
   * @private
   */
  var PromiseState = {
    PENDING: 'pending',
    FULFILLED: 'fulfilled',
    REJECTED: 'rejected'
  };

  /**
   * @const {undefined}
   */
  var U;

  function PollyfillPromise(executor) {
    instance.props(this, {
      // 2.2.6 `then` may be called multiple times on the same promise.
      onFulfilled: [],
      // 2.2.6 `then` may be called multiple times on the same promise.
      onRejected: [],
      // 2.1.1 When pending, a promise...
      // 2.1.2 May transition to either the fulfilled or rejected state.
      state: {value: PromiseState.PENDING, writable: true},
    });

    executor.call(this, resolve.bind(U, this), reject.bind(U, this));
  }

  type(PollyfillPromise)['implements']({
    all: {
      static: function PollyfillPromise$all(promises) {
        var next = new PollyfillPromise(noop);
        var pending = promises.length;
        var values = new Array(pending);

        if (pending === 0) {
          resolve(next, values);
          return next;
        }

        for (var x = 0, nx = pending; x < nx; ++x) {
          var promise = promises[x];

          if (!is.thenable(promise)) {
            promise = PollyfillPromise.resolve(promise);
            --pending;
          }

          all(promise, x, _resolve, _reject);
        }

        function _resolve(value, x) {
          values[x] = value;

          if (--pending === 0) {
            resolve(next, values);
          }
        }

        function _reject(reason) {
          pending = 0;
          reject(next, reason);
        }

        return next;
      }
    },

    race: {
      static: function (promises) {
        var next = new PollyfillPromise(noop);

        for (var x = 0, nx = promises.length; x < nx; ++x) {
          var promise = promises[x];

          if (!is.thenable(promise)) {
            _resolve(promise);
            break;
          }

          race(promise, _resolve, _reject);
        }

        function _resolve(value) {
          resolve(next, value);
        }

        function _reject(reason) {
          reject(next, reason);
        }

        return next;
      }
    },

    reject: {
      static: function (reason) {
        return reject(new PollyfillPromise(noop), reason);
      }
    },

    resolve: {
      static: function (value) {
        return resolve(new PollyfillPromise(noop), value);
      }
    },

    'catch': function (onRejected) {
      return this.then(U, onRejected);
    },

    // 2.2 A promise must provide a `then` method to access its current or
    // eventual value or reason. A promise’s `then` method accepts two
    // arguments: `onFulfilled` and `onRejected`.
    // 2.2.1 Both `onFulfilled` and `onRejected` are optional arguments.
    then: function (onFulfilled, onRejected) {
      var next = new PollyfillPromise(noop);

      if (is.function(onFulfilled)) {
        // 2.2.2 If `onFulfilled` is a function...
        // 2.2.2.1 It must be called after promise is fulfilled, with promise’s
        // value as its first argument.
        // 2.2.2.2 It must not be called before promise is fulfilled.
        // 2.2.2.3 It must not be called more than once.
        this.onFulfilled[this.onFulfilled.length] = function (value) {
          try {
            // 2.2.7.1 If either `onFulfilled` or `onRejected` returns a value
            // `x`, run the Promise Resolution Procedure.
            resolve(next, onFulfilled(value));
          } catch (e) {
            // 2.2.7.2 If either `onFulfilled` or `onRejected` throws an
            // exception `e`, the promise must be rejected with `e` as
            // the reason.
            reject(next, e);
          }
        };
      } else {
        // 2.2.1.1 If `onFulfilled` is not a function, it must be ignored.
        this.onFulfilled[this.onFulfilled.length] = function (value) {
          // 2.2.7.3 If `onFulfilled` is not a function and this promise is
          // fulfilled, the next promise must be fulfilled with the same value
          // as this promise.
          resolve(next, value);
        };
      }

      if (is.function(onRejected)) {
        // 2.2.3 If onRejected is a function...
        // 2.2.3.1 It must be called after promise is rejected, with promise’s
        // reason as its first argument.
        // 2.2.3.2 It must not be called before promise is rejected.
        // 2.2.3.3 It must not be called more than once.
        this.onRejected[this.onRejected.length] = function (reason) {
          try {
            // 2.2.7.1 If either `onFulfilled` or `onRejected` returns a value
            // `x`, run the Promise Resolution Procedure.
            resolve(next, onRejected(reason));
          } catch (e) {
            // 2.2.7.2 If either `onFulfilled` or `onRejected` throws an
            // exception `e`, the promise must be rejected with `e` as
            // the reason.
            reject(next, e);
          }
        };
      } else {
        // 2.2.1.2 If `onRejected` is not a function, it must be ignored.
        this.onRejected[this.onRejected.length] = function (reason) {
          // 2.2.7.4 If `onRejected` is not a function and this promise is
          // rejected, the next promise must be rejected with the same reason as
          // this promise.
          reject(next, reason);
        };
      }

      dispatch(this);

      // 2.2.7 `then` must return a promise.
      return next;
    },

    /** @inheritdoc */
    toString: function () {
      var s = 'pending';

      if (this.state === PromiseState.FULFILLED) {
        var value = this.value;
        var t = typeof value;
        if (!value) {
          s = value;
        } if (t === 'boolean' || t === 'number' || t === 'string') {
          s = JSON.stringify(value);
        } else {
          s = (is.def(value.constructor) ? value.constructor.name : '') +
              Object.prototype.toString(value);
        }
      } else if (this.state === PromiseState.REJECTED) {
        s = 'rejected: ' + this.reason;
      }

      return 'PollyfillPromise {' + s + '}';
    }
  });

  /**
   * @private
   */
  function all(promise, index, resolve, reject) {
    promise.then(function (value) {
      resolve(value, index);
    }, function (reason) {
      reject(reason);
    });
  }

  /**
   * @private
   */
  function dispatch(promise) {
    var state = promise.state;
    if (state === PromiseState.PENDING) {
      return promise;
    }

    var a; // List of callbacks.
    var x; // `value` if promise is resolved or `reason` if it is rejected.
    if (state === PromiseState.FULFILLED) {
      // 2.2.6.1 If/when `promise` is fulfilled, all respective `onFulfilled`
      // callbacks must execute in the order of their originating calls to then.
      a = promise.onFulfilled.splice(0);
      x = promise.value;
    } else {
      // 2.2.6.2 If/when `promise` is rejected, all respective `onRejected`
      // callbacks must execute in the order of their originating calls to then.
      a = promise.onRejected.splice(0);
      x = promise.reason;
    }

    // 2.2.4 `onFulfilled` or `onRejected` must not be called until the
    // execution context stack contains only platform code.
    defer(function () {
      for (var i = 0, ni = a.length, fn = a[i]; i < ni; fn = a[++i]) {
        // 2.2.5 `onFulfilled` and `onRejected` must be called as function
        // (that is, with no `this` value).
        fn(x);
      }
    });

    return promise;
  }

  /**
   * @private
   */
  function race(promise, resolve, reject) {
    promise.then(function (value) {
      resolve(value);
    }, function (reason) {
      reject(reason);
    });
  }

  /**
   * @private
   */
  function reject(promise, reason) {
    if (promise.state === PromiseState.PENDING) {
      // 2.3.3.3.2 If both `resolvePromise` and `rejectPromise` are called, or
      // multiple calls to the same argument are made, the first call takes
      // precedence, and any further calls are ignored.
      // 2.3.3.3.4 If calling `then` throws an exception `e`...
      // 2.3.3.3.4.1 If `resolvePromise` or `rejectPromise` have been called,
      // ignore it.
      instance.props(promise, {
        reason: reason,
        state: PromiseState.REJECTED
      });
    }

    return dispatch(promise);
  }

  /**
   * @private
   */
  function resolve(promise, x) {
    if (promise === x) {
      // 2.3.1 If `promise` and `x` refer to the same object, reject `promise`
      // with a `TypeError` as the reason.
      reject(promise, new TypeError('A promise cannot resolve to itself.'));
      return;
    }

    if (promise.state === PromiseState.PENDING) {
      // 2.1.1 When pending, a promise...
      // 2.1.1.1 May transition to either the fulfilled or rejected state.
      // 2.3.3.3.2 If both `resolvePromise` and `rejectPromise` are called, or
      // multiple calls to the same argument are made, the first call takes
      // precedence, and any further calls are ignored.
      // 2.3.3.3.4 If calling `then` throws an exception `e`...
      // 2.3.3.3.4.1 If `resolvePromise` or `rejectPromise` have been called,
      // ignore it.
      var then;
      var unresolved = true;

      if (is.object(x)) {
        if (x.constructor === PollyfillPromise) {
          // 2.3.2 If x is a promise, adopt its state.
          unresolved = false;

          if (x.state === PromiseState.FULFILLED) {
            // 2.1.2 When fulfilled, a promise...
            // 2.1.2.1 Must not transition to any other state.
            // 2.1.2.1 Must have a value, which must not change.
            instance.props(promise, {
              state: PromiseState.FULFILLED,
              value: x.value
            });
          } else if (x.state === PromiseState.REJECTED) {
            // 2.1.3 When rejected, a promise...
            // 2.1.3.1 Must not transition to any other state.
            // 2.1.3.1 Must have a reason, which must not change.
            instance.props(promise, {
              reason: x.reason,
              state: PromiseState.REJECTED
            });
          }

          // 2.3.2.1 If `x` is pending, `promise` must remain pending until `x`
          // is fulfilled or rejected.
          x.then(function (value) {
            // 2.3.2.2 If/when `x` is fulfilled, fulfill `promise` with the
            // same value.
            resolve(promise, value);
          }, function (reason) {
            // 2.3.2.3 If/when `x` is rejected, reject `promise` with the
            // same reason.
            reject(promise, reason);
          });
        } else {
          // 2.3.3 Otherwise, if `x` is an object or function...
          try {
            // 2.3.3.1 Let `then` be `x.then`.
            then = x.then;
          } catch (e) {
            // 2.3.3.2 If retrieving the property `x.then` results in a thrown
            // exception `e`, reject `promise` with `e` as the reason.
            reject(promise, e);
            return;
          }

          if (is.function(then)) {
            // 2.3.3.3 If `then` is a function, call it with `x` as this,
            // first argument `resolvePromise`, and second argument
            // `rejectPromise`.
            unresolved = false;

            try {
              then.call(x,
                // 2.3.3.3.1 If/when `resolvePromise` is called with a value
                // `y`, run [[Resolve]](promise, y).
                resolve.bind(U, promise),
                // 2.3.3.3.2 If/when `rejectPromise` is called with a reason
                // `r`, reject promise with r.
                reject.bind(U, promise));
            } catch (e) {
              // 2.3.3.3.4 If calling `then` throws an exception `e`...
              // 2.3.3.3.4.2 Reject `promise` with `e` as the reason.
              reject(promise, e);
              return;
            }
          }
        }
      }

      if (unresolved) {
        // 2.3.3.3.4 If `then` is not a function, fulfill `promise` with `x`.
        // 2.3.4 If `x` is not an object or function, fulfill `promise`
        // with `x`.
        unresolved = false;

        instance.props(promise, {
          state: PromiseState.FULFILLED,
          value: x
        });
      }
    }

    return dispatch(promise);
  }

  return PollyfillPromise;
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
