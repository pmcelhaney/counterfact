export function deepestAcceptableNodeInPath({
  tree,
  path,
  isAcceptable,
  findChild,
}) {
  if (path.length === 0) {
    return isAcceptable(tree) ? tree : undefined;
  }

  const [head, ...tail] = path;

  const child = findChild(tree, head);

  return (
    deepestAcceptableNodeInPath({
      tree: child,
      path: tail,
      isAcceptable,
      findChild,
    }) ?? tree
  );
}
