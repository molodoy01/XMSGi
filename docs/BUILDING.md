# Build and Release Guide

This document describes how to build, verify, and package XMSGi for release.

## Project requirements

- Node.js 18+
- npm
- Git
- A desktop environment capable of running Electron locally

## Install dependencies

```bash
npm install
```

## Run locally

```bash
npm start
```

This starts the Vite/Electron development flow for local testing.

## Production build

```bash
npm run build
```

This validates the application build and creates the production bundle used by the desktop app.

## Test validation

Before packaging or publishing a release, run the automated checks:

```bash
npm test
```

If a release candidate is being prepared, prefer validating the relevant suite and the full project build together.

## Package a release

For the Windows release build:

```bash
npm run dist
```

This uses Electron Builder to generate the distributable package.

## Verify generated artifacts

After packaging, check the release directory and validate that the expected files exist before publishing them.

Typical validation steps:

1. confirm the output file name matches the version
2. verify the build is not empty
3. ensure the app launches successfully on a clean environment
4. confirm the public website/documentation links match the release version

## Release checklist

Before making a release public:

- [ ] version is updated in package metadata
- [ ] changelog contains the relevant release notes
- [ ] README reflects the current version and download links
- [ ] build passes successfully
- [ ] tests pass or the known failing set is explicitly documented
- [ ] packaged artifact exists and is verified
- [ ] public website links point to the correct release version

## Troubleshooting

If the local build fails:

- verify dependencies are installed with `npm install`
- confirm Node.js version matches the project requirements
- run the build again after cleaning temporary generated files
- check the terminal output for missing Electron packaging assets or broken release configuration

## Security note

Do not include secrets, personal tokens, or local-only credentials in release artifacts or documentation. See [SECURITY.md](../SECURITY.md) for the project security policy.
