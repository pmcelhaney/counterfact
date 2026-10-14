# Contributing

## Where I need help

- **Feedback:** First and foremost, send me feedback. What makes sense? What's confusing? What's missing? What's broken? [Send me an email](pmcelhaney@gmail.com), [open an issue](https://github.com/pmcelhaney/counterfact/issues/new), or [start a discussion](https://github.com/pmcelhaney/counterfact/discussions).
- **Documentation:** There are probably typos in this very document. Please send PRs, large and small. You can do it right from your browser. If you're viewing this document in GitHub, click the pencil button in the top right corner.
- **Graphic design:** I'm terrible at graphic design. I know good design when I see it, and I can tell you why it's good, but struggle with the creative process. Whether it's building a web site, designing a logo, brainstorming on a GUI, or fixing up some ugly Markdown code, I'll take whatever help I can get!
- **Tests:** Test coverage is pretty good, but there are gaps. Filling those gaps is an easy way to gain some familiarity with the codebase.
- **Code Generation:** As of this writing, the code that writes the code works okay, but it's kind of sloppy. Instead of printing strings of source code directly, I'd like to refactor everything to build ASTs. I'd also like to bring in [json-schema-to-typescript](https://github.com/bcherny/json-schema-to-typescript), which is more accurate than my hand-rolled MVP.
- **Convert to TypeScript**: While Counterfact generates and runs TypeScript, ironically the code itself is in JavaScript. That's partly because running the unit tests in Jest requires [--experimental-vm-modules](https://jestjs.io/docs/ecmascript-modules). Getting Jest working with that and TypeScript at the same time was too much trouble when the project was getting off the ground.
- **New features and bug fixes:** See the [issues list](https://github.com/pmcelhaney/counterfact/issues). If you plan on working on something, please add a comment and/or assign yourself.
- **Spread the word!** If you find this project useful, please let others know about it. Share it in your team Slack, on social media, etc.

## Development

This is a Yarn 4 workspace monorepo. The published application is in
`packages/counterfact`; repository-wide tooling, examples, black-box tests, and
the documentation website remain at the root.

```sh
git clone git@github.com:pmcelhaney/counterfact.git
cd counterfact
corepack enable
yarn install
yarn lint
yarn test
```

The [code generator](./packages/counterfact/src/typescript-generator/README.md)
and server runtime are currently part of the `counterfact` workspace. Root
scripts coordinate builds and checks, so contributors do not need to change
directories for the standard workflow.

### Build feedback

Run `yarn build` from the repository root to build the development workspaces.
It reports each stage as it starts and finishes, with elapsed times and a final
build summary. Compiler diagnostics remain visible, and a failed stage stops
the build with a nonzero exit status.

This progress output belongs to repository tooling. The published Counterfact
CLI and the workspace build used for packaging keep their own behavior.

### Development container

Counterfact includes a [Development Container](./.devcontainer/devcontainer.json)
for a reproducible Node 24, Yarn 4, and Python environment. It is intended for
local development and testing; it does not grant a coding agent access outside
the checked-out repository.

Install Docker Desktop and a Dev Containers-compatible editor, then open this
repository and choose **Reopen in Container**. The container enables Corepack;
its post-create setup installs the immutable Yarn dependency tree and installs
the Python dependencies used by the black-box test suite into a container-local
virtual environment.

Run the full Linux CI-equivalent check inside the container with:

```sh
bash .devcontainer/verify.sh
```

#### Codex Desktop

The development container makes dependencies reproducible. Codex Desktop's
native sandbox remains the boundary for agent commands, so a devcontainer does
not automatically make every Desktop command execute inside Docker.

In ChatGPT Desktop, select **Codex**, open the project local-environment
settings, and add actions that run these commands in the integrated terminal:

```sh
# Set up a newly created worktree
yarn install --immutable

# Fast checks
yarn lint && yarn typecheck && yarn test

# Product black-box tests
yarn build && yarn test:black-box

# Full Linux CI-equivalent check (when the worktree is opened in the container)
bash .devcontainer/verify.sh
```

Use a separate Git worktree and branch for each task. After the required checks
pass, task branches may be pushed and opened as pull requests; releases,
deployments, production data, paid services, and credential changes require
separate authorization.

### Documentation drift checks

Run `yarn check:drift` from the repository root to check documentation and agent
guidance against related Git-tracked changes. The pinned `catchmydrift` development
dependency reads [`catchmydrift.config.json`](./catchmydrift.config.json).

Each of the 72 selected documents has an explicit watch rule connected to named
implementation, configuration, and test groups. For example, the route-builder
guide follows the client builder/catalog/HTTP transport and REPL integration;
state guides follow context loading and registries; the REPL _skill_ follows the
HTTP admin API it actually describes. The migration and utility READMEs follow
their own modules rather than the whole application.

Package READMEs and the whole-product README, FAQ, reference, comparison, and
design principles retain package-level scopes because they describe those full
interfaces. The monorepo migration account also spans package boundaries,
packaging, and releases. Navigation indexes follow their linked guide inventory;
agent instructions follow the referenced guidance and test conventions.

The initial threshold is 20%, used as a review reminder. Implementation groups
exclude Markdown, fixtures, and snapshots so prose and generated test artifacts
do not dilute code measurements. Guide-navigation and agent-guidance groups
include the Markdown they directly describe. Lockfiles, changelogs, historical
studies, issue proposals, and ADRs are not watched; they record dependencies or
historical decisions rather than current behavior. This check is opt-in and is
not a required CI gate. Relationships operate at file granularity: a change to
an unrelated function in a shared module can still contribute drift.

An exit code of 1 means a watched file needs review, not that the configuration
is invalid; exit code 2 indicates a configuration or operational error. Drift
measures changed lines since the watched file's last update or recorded review,
so a successful setup can still report existing drift.

Read each reported document alongside its related changes and update inaccurate
guidance. If the document is still accurate after review, record that assessment:

```sh
yarn catchmydrift review packages/runtime/README.md
```

This writes `.catchmydrift-state.json`; commit it with the reviewed changes when
that assessment should be shared. Do not bulk-mark documents as reviewed just to
make the check pass. See the [catchmydrift documentation](https://github.com/pmcelhaney/catchmydrift)
for thresholds and review-state behavior.

### Mutation testing

Mutation testing runs against one workspace package at a time so reports stay actionable and CI can process packages in parallel.
Build the workspaces before mutation testing because integration tests consume compiled dependencies from other packages.

```sh
yarn build
yarn test:mutation:dry --package openapi
yarn test:mutation --package openapi
yarn test:mutation:incremental --package openapi
```

The supported package names are `client`, `counterfact`, `generator`, `openapi`, `repl`, and `runtime`.
Omit `--package` to run all mutable production packages together.
Use `--force` with the incremental command to refresh every mutant instead of reusing unchanged results.
Detailed HTML and JSON reports are written to `reports/mutation/<package>/` and are not committed.

The mutation-testing workflow currently runs on Monday mornings and by manual dispatch rather than as a required pull-request check.
After two stable full baselines, maintainers can record per-package thresholds and enable the planned no-regression pull-request gate.

Testing and linting changes is important, but at this point I'm more concerned about changing the word "I" in this page to "we", so don't hesitate to create a PR, even it's not "finished".

Thanks in advance!
