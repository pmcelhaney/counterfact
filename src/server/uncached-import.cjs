const { pathToFileURL } = require("node:url");

module.exports = {
  uncachedImport: async function uncachedImport(pathName) {
    const fileUrl = `${pathToFileURL(
      pathName,
    ).toString()}?cacheBust=${Date.now()}`;

    return require(fileUrl);
  },
};
