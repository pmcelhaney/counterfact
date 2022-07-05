export class Tools {
  constructor({ headers = {} } = {}) {
    this.headers = headers;
  }

  oneOf(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  accepts(contentType) {
    const acceptHeader = this.headers.Accept;

    if (!acceptHeader) {
      return true;
    }

    const acceptTypes = acceptHeader.split(",");

    return acceptTypes.some((acceptType) => {
      const [type, subtype] = acceptType.split("/");

      return (
        (type === "*" || type === contentType.split("/")[0]) &&
        (subtype === "*" || subtype === contentType.split("/")[1])
      );
    });
  }
}
