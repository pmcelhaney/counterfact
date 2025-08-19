import { expectType } from "tsd";

import type { OmitAll, IfHasKey } from "../../src/server/types";

// test exact match
expectType<
  OmitAll<
    {
      yaml: string;
      json: string;
    },
    ["json"]
  >
>({ yaml: "" });

// test match with suffix
expectType<
  OmitAll<
    {
      yaml: string;
      ["json-utf8"]: string;
    },
    ["json"]
  >
>({ yaml: "" });

// test match with prefix
expectType<
  OmitAll<
    {
      yaml: string;
      ["complex-json"]: string;
    },
    ["json"]
  >
>({ yaml: "" });

// test match with prefix and suffix
expectType<
  OmitAll<
    {
      yaml: string;
      ["complex-json-utf8"]: string;
    },
    ["json"]
  >
>({ yaml: "" });

// test mismatch
expectType<
  OmitAll<
    {
      yaml: string;
    },
    ["json"]
  >
>({ yaml: "" });

// test exact match
expectType<
  IfHasKey<
    {
      json: string;
    },
    ["json"],
    true,
    false
  >
>(true);

// test match with suffix
expectType<
  IfHasKey<
    {
      ["json-utf8"]: string;
    },
    ["json"],
    true,
    false
  >
>(true);

// test match with prefix
expectType<
  IfHasKey<
    {
      ["complex-json"]: string;
    },
    ["json"],
    true,
    false
  >
>(true);

// test match with prefix and suffix
expectType<
  IfHasKey<
    {
      ["complex-json-utf8"]: string;
    },
    ["json"],
    true,
    false
  >
>(true);

// test mismatch
expectType<
  IfHasKey<
    {
      yaml: string;
    },
    ["json"],
    true,
    false
  >
>(false);
