import { expectType } from "tsd";

import type {
  OmitAll,
  IfHasKey,
  GenericResponseBuilderInner,
} from "../../src/server/types";

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
    ["application/json"]
  >
>({ yaml: "" });

// test exact match
expectType<
  IfHasKey<
    {
      "application/json": string;
    },
    ["application/json"],
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
    ["application/json"],
    true,
    false
  >
>(false);
