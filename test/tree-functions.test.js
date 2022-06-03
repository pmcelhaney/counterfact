import { deepestAcceptableNodeInPath } from "../src/tree-functions.js";

describe("traces the path to the last matching node", () => {
  it("when all nodes are acceptable", () => {
    const tree = {
      children: {
        alpha: {
          value: "alpha",

          children: {
            beta: {
              value: "beta",

              children: {
                gamma: {
                  value: "gamma",
                },
              },
            },
          },
        },
      },
    };

    expect(
      deepestAcceptableNodeInPath({
        tree,
        path: ["alpha", "beta", "gamma"],
        isAcceptable: () => true,
        findChild: (node, name) => node.children[name],
      }).value
    ).toBe("gamma");

    expect(
      deepestAcceptableNodeInPath({
        tree,
        path: ["alpha", "beta"],
        isAcceptable: () => true,
        findChild: (node, name) => node.children[name],
      }).value
    ).toBe("beta");
  });

  it("when some nodes are not acceptable", () => {
    const tree = {
      children: {
        alpha: {
          value: "alpha",

          children: {
            beta: {
              value: "beta",

              children: {
                gamma: {
                  value: "gamma",
                },
              },
            },
          },
        },
      },
    };

    expect(
      deepestAcceptableNodeInPath({
        tree,
        path: ["alpha", "beta", "gamma"],
        isAcceptable: (node) => node.value !== "gamma",
        findChild: (node, name) => node.children[name],
      }).value
    ).toBe("beta");
  });

  it("when the path is calculated", () => {
    const tree = {
      children: {
        alpha: {
          value: "alpha",

          children: {
            beta: {
              value: "beta",

              children: {
                gamma: {
                  value: "gamma",
                },
              },
            },

            "[dynamic]": {
              children: {
                gamma: {
                  value: "gamma-in-dynamic-path",
                },
              },
            },
          },
        },
      },
    };

    expect(
      deepestAcceptableNodeInPath({
        tree,
        path: ["alpha", "not a match", "gamma"],
        isAcceptable: () => true,

        findChild: (node, name) =>
          // eslint-disable-next-line jest/no-conditional-in-test
          node.children[name] ?? node.children["[dynamic]"],
      }).value
    ).toBe("gamma-in-dynamic-path");
  });

  it("when the path points to a non-existent child", () => {
    const tree = {
      children: {
        alpha: {
          value: "alpha",

          children: {
            beta: {
              value: "beta",

              children: {
                gamma: {
                  value: "gamma",
                },
              },
            },
          },
        },
      },
    };

    expect(
      deepestAcceptableNodeInPath({
        tree,
        path: ["alpha", "beta", "goose"],
        isAcceptable: () => true,
        findChild: (node, name) => node.children[name],
      }).value
    ).toBe("beta");
  });
});
