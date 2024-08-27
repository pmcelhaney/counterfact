"use strict";

module.exports = {
  uncachedRequire: function uncachedRequire(moduleName) {
    delete require.cache[require.resolve(moduleName)];

    // eslint-disable-next-line security/detect-non-literal-require
    return Promise.resolve(require(moduleName));
  },
};
