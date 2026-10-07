# Contributing to XMSGi

Thank you for helping improve XMSGi.

This project is open to contributions that improve reliability, usability, packaging, security, and developer experience.

## How to contribute

You can contribute by:

- reporting bugs and regressions
- improving UI and workflows
- fixing logic issues
- adding or updating tests
- improving documentation
- helping with packaging and release validation

## Before opening an issue

Please check whether the issue is already tracked. Include a clear description, reproduce steps, expected behavior, and the actual behavior. The more precise the report, the faster the fix.

## Branching and PR flow

Use a focused branch for each change:

- feature/* for new functionality
- fix/* for bug fixes
- docs/* for documentation-only updates
- chore/* for maintenance tasks

Keep pull requests small and reviewable.

## Prerequisites

Before working on the project, install:

- Node.js 18 or newer
- npm
- Git

## Local setup

```bash
npm install
```

For local development:

```bash
npm start
```

## Development workflow

1. Create a branch for your change.
2. Keep your scope focused on one task or bugfix.
3. Prefer small, reviewable pull requests.
4. Add or update tests for behavior changes.
5. Run the relevant project checks before submitting.

## Testing

Run the project test suite before opening a PR:

```bash
npm test
```

If you are validating a release or packaging flow, also run:

```bash
npm run build
npm run dist
```

## Code expectations

- Keep changes small and easy to review.
- Prefer clear naming and explicit logic over clever abstractions.
- Preserve existing architecture patterns unless there is a strong reason to change them.
- Do not commit secrets, personal tokens, or local environment values.
- Update the relevant documentation when behavior changes.

## Documentation changes

When changing behavior, UI flows, or release steps:

- update README if needed
- update CHANGELOG if the change is user-visible
- keep SECURITY.md for security-specific matters only

## Pull request checklist

Before opening a PR:

- [ ] the change is scoped and explained clearly
- [ ] tests cover the relevant behavior
- [ ] build succeeds
- [ ] no temporary debug logs or ad hoc changes remain
- [ ] documentation is updated when needed
- [ ] no secrets or local-only credentials are included

## Security reporting

Security issues must not be discussed in public issues. Please use the security policy in [SECURITY.md](SECURITY.md).

Do not post exploit details, reproduction steps for a vulnerability, or sensitive session data in public discussions.

## Community norms

Please be respectful, constructive, and practical in discussions. The project values working, maintainable improvements over noisy or speculative changes.
