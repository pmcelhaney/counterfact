"use strict";

module.exports = {
  uncachedRequire: function uncachedRequire(moduleName) {
    delete require.cache[require.resolve(moduleName)];

    // eslint-disable-next-line n/global-require, security/detect-non-literal-require, import/no-dynamic-require
    return Promise.resolve(require(moduleName));
  },
};
