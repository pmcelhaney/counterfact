export class Statement {
  constructor(source, url, printer) {
    this.source = source;
    this.url = url;
    this.printer = printer;

    // Now here's where it gets fun. A printer might need to import an
    // object. It will need to tell to call file.addImport() so it needs
    // a reference to the file.
    //
    // The file will then tell the generator that it needs that file
    // to exist.
  }

  async print() {
    const tree = await this.source.load();

    const path = this.url.split("#").at(-1).split("/").slice(1);

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
