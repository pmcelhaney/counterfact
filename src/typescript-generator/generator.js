import { File } from "./file.js";
import { YamlSource } from "./yaml-source.js";

function defaultNamer(url, takenNames) {
  const name = url.split("/").pop();

  let candidate = name;

  let index = 1;

  while (takenNames.has(candidate)) {
    candidate = name + index;
    index += 1;
  }

  return candidate;
}

export class Generator {
  constructor() {
    this.files = new Map();
    this.sources = new Map();
  }

  // eslint-disable-next-line max-params
  export(filename, url, printer, namer = defaultNamer) {
    if (!this.files.has(filename)) {
      this.files.set(filename, new File(this));
    }

    const file = this.files.get(filename);

    return file.addExport(url, printer, namer);
  }

  addSource(path, data) {
    const source = {
      load() {
        return data;
      },
    };

    this.sources.set(path, source);
  }

  getSource(fullUrl) {
    const [url] = fullUrl.split("#");

    if (this.sources.has(url)) {
      return this.sources.get(url);
    }

    const source = new YamlSource(url);

    this.sources.set(url, source);

    return source;
  }
}
