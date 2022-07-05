export class Line {
  constructor(source, url, printer) {
    this.source = source;
    this.url = url;
    this.printer = printer;
  }

  async print() {
    const tree = await this.source.load();

    const path = this.url.split("#")[1].split("/").slice(1);

    return this.printTree(tree, path);
  }

  printTree(tree, path) {
    const [head, ...tail] = path;

    if (path.length === 1) {
      return this.printer(tree[head], head);
    }

    if (path.length === 0) {
      return this.printer(tree[head], "[root]");
    }

    return this.printTree(tree[head], tail);
  }
}
