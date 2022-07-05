export class Line {
  constructor(url, printer) {
    this.url = url;
    this.printer = printer;
  }

  print() {
    return this.printer();
  }
}
