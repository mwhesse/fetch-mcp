# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-01-26

### Security
- **CRITICAL**: Fixed high severity vulnerability (CVSS 8.2) in `private-ip` package
  - Vulnerability: Server-Side Request Forgery (SSRF) - [GHSA-9h3q-32c7-r533](https://github.com/advisories/GHSA-9h3q-32c7-r533)
  - Impact: Could allow attackers to make requests to private IP addresses
  - Solution: Replaced vulnerable `private-ip@3.0.2` with secure `is-private-host@1.0.2`

### Changed
- Replaced `private-ip` dependency with `is-private-host` for private IP detection
- Updated `Fetcher.ts` to use `isPrivateUrl()` instead of `is_ip_private()`
- Updated tests to mock the new dependency

### Dependencies
- **Removed**: `private-ip@3.0.2` (vulnerable)
- **Added**: `is-private-host@1.0.2` (secure replacement)
- **Added**: `ipaddr.js@2.2.0` (transitive dependency)

## [1.0.0] - 2025-01-26

### Added
- Initial release of fetch-mcp
- HTML content fetching with `Fetcher.html()`
- JSON content fetching with `Fetcher.json()`
- Plain text content extraction with `Fetcher.txt()`
- Markdown conversion with `Fetcher.markdown()`
- Private IP address blocking for security
- Content length limiting and pagination support
- Comprehensive test suite
- TypeScript support

### Security
- Private IP address blocking to prevent SSRF attacks
- User-Agent header spoofing protection
- Error handling for malformed requests