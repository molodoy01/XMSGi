# Security Policy

This document describes the security model, storage practices, and responsible disclosure process for XMSGi.

## Scope

This policy applies to the desktop application, local account storage, IPC validation, and any public release distributed through the project repository.

## Security model

### Local-first architecture

XMSGi stores Telegram session data locally on the device. The application is designed to work with a personal Telegram account and does not rely on a Telegram bot for the core scheduling workflow.

### Secure storage

When supported by the operating system, Electron's secure storage APIs are used to protect local sensitive data. The app also validates IPC flows and provides guarded handling for account/session persistence.

### Data handling expectations

- Sensitive tokens and session state should remain local to the user's machine.
- Secret values should never be committed to Git.
- Local development credentials must not be published in releases or public issue reports.
- External services such as Telegram remain subject to their own security and availability policies.

## Responsible disclosure

If you discover a security issue, please report it privately before creating a public issue or disclosure.

Send a detailed report to the project maintainer or the repository contact used by the project owner. Include:

- a precise description of the issue
- affected version or release
- reproduction steps
- impact assessment
- suggested remediation if available

## Supported release policy

The project aims to keep the current public release and its latest patch line updated. Security fixes are prioritized for active release lines and should be included in a subsequent public release when appropriate.

## Disclosure timeline

Security reports are handled privately and reviewed on a best-effort basis. The goal is to acknowledge the report, assess risk, and prepare a remediation path as quickly as possible without exposing the issue publicly before a fix is available.

## Out of scope

The following are not acceptable as public disclosure channels:

- posting a vulnerability in a public issue thread
- creating a public PR that discloses an exploitable bug
- sharing session data, passwords, or Telegram credentials

## Security best practices for contributors

- Avoid adding secrets to source code, config files, or logs.
- Validate new IPC endpoints and storage paths before merging.
- Keep user session handling minimal and explicit.
- Prefer secure, platform-native storage mechanisms over ad hoc plaintext persistence.

## Reporting examples

Examples of issues that should be reported through the private disclosure process include:

- session leakage through logs or generated files
- unsafe plaintext persistence of Telegram credentials
- malformed IPC access that exposes or alters local account state
- arbitrary file or config access caused by application logic

## Notes

This project is a desktop app with local persistence and user-controlled account access. Security reviews should focus on safe storage, clear separation of sensitive local state, and strict control over privileged IPC operations.
