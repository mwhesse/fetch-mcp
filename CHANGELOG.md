# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.3] - 2025-01-26

### Changed
- Updated MCP server version

## [1.0.2] - 2025-01-26

### Changed
- Removed all vulnerable third-party IP detection libraries
- Implemented secure custom `isPrivateIP()` and `isPrivateUrl()` methods in `Fetcher.ts`
- Added comprehensive IPv4 and IPv6 private range detection
- Updated tests to work with custom implementation
- Updated server version to match package version (1.0.1)

## [1.0.1] - 2025-01-26

### Security
- **CRITICAL**: Fixed high severity vulnerability (CVSS 8.2) in `private-ip` package
  - Vulnerability: Server-Side Request Forgery (SSRF) - [GHSA-9h3q-32c7-r533](https://github.com/advisories/GHSA-9h3q-32c7-r533)
  - Impact: Could allow attackers to make requests to private IP addresses
  - Solution: Implemented custom private IP detection to avoid all third-party vulnerabilities

### Dependencies
- **Removed**: `private-ip@3.0.2` (vulnerable to SSRF)
- **Removed**: `is-private-host@1.0.2` (ES module compatibility issues)
- **Removed**: `ip@2.0.1` (vulnerable to SSRF)
- **Solution**: Zero-dependency custom implementation for maximum security

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