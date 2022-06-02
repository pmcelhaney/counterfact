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
      const [nodeName] = path;

      const dynamicPathName =
        nodeName.startsWith("[") && nodeName.endsWith("]")
          ? nodeName.slice(1, -1)
          : undefined;

      if (dynamicPathName) {
        tree.dynamicPathName = dynamicPathName;
      }

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
    function findHandler(parentNode, path, fallback) {
      const nodeName = parentNode.children[path[0]] ? path[0] : "[user_id]";
      const node = parentNode.children[nodeName];

      // probably extract this to findBestMatchHandler(node, method, fallback)
      const matchingHandler = node?.script?.[method];
      const handler = matchingHandler
        ? (context) =>
            matchingHandler({
              ...context,
              pathParameters: { [nodeName.slice(1, -1)]: 123 },
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
      { children: this.moduleTree },
      url.split("/").slice(1),
      notFoundFallback
    );
  }
}

//
// When recursing, we need to recurse on a node, not children,
// so that we can set and get the dynamic path name (wildcardName).

// That means this.moduleTree should be a node with children.
