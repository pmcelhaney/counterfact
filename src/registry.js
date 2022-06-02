export class Registry {
  modules = {};

  moduleTree = {
    children: {},
  };

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

    function decorateTree(path, tree) {
      const [nodeName] = path;

      const dynamicPathVariableName =
        nodeName.startsWith("[") && nodeName.endsWith("]")
          ? nodeName.slice(1, -1)
          : undefined;

      if (dynamicPathVariableName) {
        tree.dynamicPathVariableName = dynamicPathVariableName;
      }

      if (path.length === 1) {
        return {
          ...tree,

          children: {
            ...tree.children,
            [nodeName]: { ...tree?.children?.[nodeName], script },
          },
        };
      }

      return {
        ...tree,

        children: {
          ...tree.children,

          [nodeName]: decorateTree(
            path.slice(1),
            tree?.children?.[nodeName] ?? {}
          ),
        },
      };
    }

    this.moduleTree = decorateTree(url.split("/").slice(1), this.moduleTree);
  }

  remove(path) {
    delete this.modules[path];
  }

  exists(method, path) {
    return Boolean(this.modules[path]?.[method]);
  }

  endpoint(method, url) {
    function findHandler(parentNode, path, fallback) {
      const nodeName = parentNode.children[path[0]]
        ? path[0]
        : `[${parentNode.dynamicPathVariableName}]`;
      const node = parentNode.children[nodeName];

      // probably extract this to findBestMatchHandler(node, method, fallback)
      const matchingHandler = node?.script?.[method];
      const handler = matchingHandler
        ? (context) =>
            matchingHandler({
              ...context,
              pathParameters: { [nodeName.slice(1, -1)]: path[0] },
            })
        : fallback;

      if (path.length === 0) {
        return handler;
      }

      if (node?.children) {
        return findHandler(node, path.slice(1), handler);
      }

      return handler;
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
