# wnpm CLI

`wnpm` is a small command-line tool that sits in front of **`npm install`**.
Use it when you want installs to go through a **consistent policy layer** instead of calling `npm` directly.

## Requirements

- **Node.js 18+** (uses the built-in `fetch` client)

## Install

```bash
npm install -g @_wnpm/wnpm-cli
```

## Usage

**Install one or more packages** (names are checked first, then `npm install` runs with the resolved list):

```bash
wnpm install lodash
wnpm i react react-dom
```

**Install with a version range** (same idea as `npm`):

```bash
wnpm i lodash@^4.17.0
```

**Install everything in the current `package.json`** (no package names after `install` / `i`):

```bash
wnpm install
wnpm i
```

## What you will see

- The CLI prints short status lines while checks run.
- You may be prompted to confirm **switching to a suggested version** when the service recommends one.
- Some installs may be **refused** if the service does not allow them under its rules.
- When checks pass, **`npm install`** runs with the final package list.

Exact rules and signals live on the **server**; the CLI is only the client.

## Data the CLI sends

For each package being considered, the CLI resolves a concrete version (via `npm view` locally) and sends **package name and version** to the wnpm API. It does not read your source code; it uses your arguments and, when applicable, the local `package.json` dependency names.

## Scope

- This tool is focused on the **install** path (`install` / `i`). Other `npm` subcommands are not the primary use case.
- You need a **reachable wnpm API**; without it, installs that require checks will fail at the network step.

## License

ISC
