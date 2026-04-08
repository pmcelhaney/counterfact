import { describe, expect, it } from "@jest/globals";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeFile, mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";

import { loadConfigFile } from "../../src/util/load-config-file.js";

async function writeTemp(content: string): Promise<string> {
  const dir = join(tmpdir(), `counterfact-test-${randomUUID()}`);
  await mkdir(dir, { recursive: true });
  const filePath = join(dir, "counterfact.yaml");
  await writeFile(filePath, content, "utf8");
  return filePath;
}

describe("loadConfigFile", () => {
  it("returns an empty object when the file does not exist (default)", async () => {
    const result = await loadConfigFile("/nonexistent/path/counterfact.yaml");
    expect(result).toEqual({});
  });

  it("throws when the file does not exist and required=true", async () => {
    await expect(
      loadConfigFile("/nonexistent/path/counterfact.yaml", true),
    ).rejects.toThrow("Config file not found");
  });

  it("returns an empty object for an empty file", async () => {
    const filePath = await writeTemp("");
    const result = await loadConfigFile(filePath);
    expect(result).toEqual({});
  });

  it("parses simple key/value pairs", async () => {
    const filePath = await writeTemp("port: 4000\nserve: true\n");
    const result = await loadConfigFile(filePath);
    expect(result).toEqual({ port: 4000, serve: true });
  });

  it("normalizes kebab-case keys to camelCase", async () => {
    const filePath = await writeTemp(
      "proxy-url: https://example.com\nalways-fake-optionals: true\n",
    );
    const result = await loadConfigFile(filePath);
    expect(result).toEqual({
      proxyUrl: "https://example.com",
      alwaysFakeOptionals: true,
    });
  });

  it("leaves camelCase keys unchanged", async () => {
    const filePath = await writeTemp(
      "proxyUrl: https://example.com\nroutePrefix: /api/v1\n",
    );
    const result = await loadConfigFile(filePath);
    expect(result).toEqual({
      proxyUrl: "https://example.com",
      routePrefix: "/api/v1",
    });
  });

  it("throws when the config file is a YAML list (not a mapping)", async () => {
    const filePath = await writeTemp("- item1\n- item2\n");
    await expect(loadConfigFile(filePath)).rejects.toThrow(
      "Config file must be a YAML object",
    );
  });

  it("throws when the config file is a scalar (not a mapping)", async () => {
    const filePath = await writeTemp("just a string\n");
    await expect(loadConfigFile(filePath)).rejects.toThrow(
      "Config file must be a YAML object",
    );
  });

  it("parses a realistic counterfact.yaml config", async () => {
    const filePath = await writeTemp(
      [
        "spec: ./openapi.yaml",
        "port: 8080",
        "serve: true",
        "repl: true",
        "watch: true",
        "proxy-url: https://api.example.com",
        "prefix: /api/v1",
        "always-fake-optionals: false",
      ].join("\n"),
    );
    const result = await loadConfigFile(filePath);
    expect(result).toEqual({
      spec: "./openapi.yaml",
      port: 8080,
      serve: true,
      repl: true,
      watch: true,
      proxyUrl: "https://api.example.com",
      prefix: "/api/v1",
      alwaysFakeOptionals: false,
    });
  });
});
