"use strict";

module.exports = {
  uncachedImport: function uncachedImport(moduleName) {
    delete require.cache[require.resolve(moduleName)];

    // eslint-disable-next-line n/global-require, security/detect-non-literal-require, import/no-dynamic-require
    return require(moduleName);
  },
};
