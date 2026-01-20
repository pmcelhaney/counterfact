import net from "net";

const colors = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  bold: "\x1b[1m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
};

function isLikelyJson(headersBlock: string, body: string) {
  const m = headersBlock.match(/^content-type:\s*([^\r\n;]+)/im);
  const ct = (m?.[1] ?? "").toLowerCase();
  if (ct.includes("application/json") || ct.includes("+json")) return true;

  const s = body.trim();
  if (!s) return false;
  return (
    (s.startsWith("{") && s.endsWith("}")) ||
    (s.startsWith("[") && s.endsWith("]"))
  );
}

function highlightJson(text: string) {
  let obj;
  try {
    obj = JSON.parse(text);
  } catch {
    return text;
  }

  const pretty = JSON.stringify(obj, null, 2);

  return pretty.replace(
    /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g,
    (match, str, colon, boolOrNull) => {
      if (str) {
        if (colon) return `${colors.blue}${str}${colors.reset}${colon}`;
        return `${colors.green}${str}${colors.reset}`;
      }
      if (boolOrNull) {
        return `${colors.magenta}${match}${colors.reset}`;
      }
      return `${colors.yellow}${match}${colors.reset}`;
    },
  );
}

function stringifyBody(body: any) {
  if (typeof body === "string") {
    return body;
  }

  if (typeof body === "undefined") {
    return body;
  }

  return JSON.stringify(body);
}

export class RawHttpClient {
  host: string;
  port: number;
  requestNumber = 0;

  constructor(host = "localhost", port = 80) {
    this.host = host;
    this.port = port;
  }

  get(path: string, headers = {}) {
    this.#send("GET", path, "", headers);
  }

  head(path: string, headers = {}) {
    this.#send("HEAD", path, "", headers);
  }

  post(path: string, body = "", headers = {}) {
    this.#send("POST", path, body, headers);
  }

  put(path: string, body = "", headers = {}) {
    this.#send("PUT", path, body, headers);
  }

  delete(path: string, headers = {}) {
    this.#send("DELETE", path, "", headers);
  }

  connect(path: string, headers = {}) {
    this.#send("CONNECT", path, "", headers);
  }

  options(path: string, headers = {}) {
    this.#send("OPTIONS", path, "", headers);
  }

  trace(path: string, headers = {}) {
    this.#send("TRACE", path, "", headers);
  }

  patch(path: string, body = "", headers = {}) {
    this.#send("PATCH", path, body, headers);
  }

  #send(
    method: string,
    path: string,
    bodyAsStringOrObject: any,
    headers: Record<string, string>,
  ) {
    const requestNumber = ++this.requestNumber;

    const body = stringifyBody(bodyAsStringOrObject);

    return new Promise((resolve, reject) => {
      const socket = net.createConnection(
        { host: this.host, port: this.port },
        () => {
          let request = `${method} ${path} HTTP/1.1\r\n`;
          request += `Host: ${this.host}\r\n`;
          request += `Connection: close\r\n`;

          if (body != null) {
            request += `Content-Length: ${Buffer.byteLength(body)}\r\n`;
          }

          for (const [key, value] of Object.entries(headers)) {
            request += `${key}: ${value}\r\n`;
          }

          request += `\r\n`;
          if (body != null) request += body;

          this.#printRequest(request, requestNumber);
          socket.write(request);
        },
      );

      const chunks: Uint8Array<ArrayBufferLike>[] = [];

      socket.on("data", (chunk: Uint8Array<ArrayBufferLike>) => {
        chunks.push(chunk);
      });

      socket.on("end", () => {
        const raw = Buffer.concat(chunks).toString("utf8");
        this.#printResponse(raw, requestNumber);
        process.stdout.write(`${colors.bold}⬣> ${colors.reset}`);
        resolve(raw);
      });

      socket.on("error", reject);
    });
  }

  #printRequest(raw: string, requestNumber: number) {
    const [head = "", body = ""] = raw.split("\r\n\r\n");
    const lines = head.split("\r\n");

    process.stdout.write(
      `${colors.cyan}\n----- REQUEST #${requestNumber} -----${colors.reset}\n`,
    );
    process.stdout.write(`${colors.cyan}${lines[0]}${colors.reset}\n`);

    for (const line of lines.slice(1)) {
      process.stdout.write(`${colors.dim}${line}${colors.reset}\n`);
    }

    if (body) {
      process.stdout.write("\n");

      const outBody = isLikelyJson(head.toLowerCase(), body)
        ? highlightJson(body)
        : body;

      process.stdout.write(outBody + "\n");
    }
  }

  #printResponse(raw: string, requestNumber: number) {
    const [head = "", body = ""] = raw.split("\r\n\r\n");
    const lines = head.split("\r\n");
    const statusLine = lines[0] ?? "";

    let statusColor = colors.green;
    const match = statusLine.match(/HTTP\/\d+\.\d+\s+(\d+)/);
    if (match) {
      const code = Number(match[1]);
      if (code >= 400) statusColor = colors.red;
      else if (code >= 300) statusColor = colors.yellow;
    }

    process.stdout.write(
      `\n${statusColor}----- RESPONSE #${requestNumber} -----${colors.reset}\n`,
    );
    process.stdout.write(`${statusColor}${statusLine}${colors.reset}\n`);

    for (const line of lines.slice(1)) {
      process.stdout.write(`${colors.dim}${line}${colors.reset}\n`);
    }

    if (body) {
      process.stdout.write("\n");

      const outBody = isLikelyJson(head!.toLowerCase(), body)
        ? highlightJson(body)
        : body;

      process.stdout.write(outBody + "\n");
    }
  }
}
