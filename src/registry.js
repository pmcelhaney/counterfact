export class Registry {
  modules = {};

  moduleTree = {};

  store;

  paths = [];

  constructor(store = {}) {
    this.store = store;
  }

  get modulesList() {
    return Object.keys(this.modules);
  }

  add(url, script) {
    this.modules[url] = script;

    function addToTree(tree, path) {
      const nodeName = path[0];

      if (path.length === 1) {
        return {
          ...tree,
          [nodeName]: { ...tree[nodeName], script },
        };
      }

      return {
        ...tree,

        [nodeName]: {
          ...tree[nodeName],
          children: addToTree(tree[nodeName]?.children ?? {}, path.slice(1)),
        },
      };
    }

    this.moduleTree = addToTree(this.moduleTree, url.split("/").slice(1));
  }

  remove(path) {
    delete this.modules[path];
  }

  exists(method, path) {
    return Boolean(this.modules[path]?.[method]);
  }

  endpoint(method, url) {
    function findHandler(tree, staticPath, fallback) {
      const path = tree[staticPath[0]]
        ? staticPath
        : ["[user_id]", ...staticPath.slice(1)];
      const node = tree[path[0]];

      const handler = node?.script?.[method] ?? fallback;

      if (path.length === 0) {
        return handler;
      }

      if (node?.children) {
        return findHandler(node.children, path.slice(1), handler);
      }

      return (context) =>
        handler({ ...context, pathParameters: { user_id: 123 } });
    }

    function notFoundFallback() {
      return {
        status: 404,
        body: `${method} method for endpoint at "${url}" does not exist`,
      };
    }

    return findHandler(
      this.moduleTree,
      url.split("/").slice(1),
      notFoundFallback
    );
  }
}
