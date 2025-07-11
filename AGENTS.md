# Codex Agent Instructions

## Environment
- Node.js version is specified in `.nvmrc` (20.19.2).
- Use Yarn 4 (`yarn` command) for package management.

## Testing
Run the following commands before committing changes:

```bash
yarn lint
yarn build
```

This repository does not include automated tests. The build step ensures TypeScript compiles successfully.

## Notes
- Do not edit `node_modules` or generated build artifacts.