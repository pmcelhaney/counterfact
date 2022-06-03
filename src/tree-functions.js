export function deepestAcceptableNodeInPath({
  tree,
  path,
  isAcceptable,
  findChild,
}) {
  if (path.length === 0) {
    return tree;
  }

  const [head, ...tail] = path;

  const child = findChild(tree, head);

  if (child !== undefined && isAcceptable(child)) {
    return deepestAcceptableNodeInPath({
      tree: child,
      path: tail,
      isAcceptable,
      findChild,
    });
  }

  return tree;
}
