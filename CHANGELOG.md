# Changelog

All notable changes to `@chainpayto/mcp-server` will be documented in this file.

This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] — 2026-04-24

### ⚠️ BREAKING CHANGES

This release aligns with ChainPay backend's new API authentication protocol. **Any user upgrading from 1.x must take the actions below, or requests will fail with 401.**

1. **`CHAINPAY_API_SECRET` is now the plaintext secret, not a SHA256 hash.**
   - Before: `CHAINPAY_API_SECRET="<sha256 hex of your plaintext>"`
   - After: `CHAINPAY_API_SECRET="<plaintext exactly as shown in dashboard>"`
   - Migration: go to ChainPay merchant dashboard → **Settings → API Keys** → reset your key, copy the new plaintext secret, paste it into your MCP config as-is.
2. **Request signing now sends a new required header `X-Signature-Version: v1`.**
   - Handled automatically by the client; you only need to upgrade the package.
3. **Empty-string parameters are now signed (not filtered).**
   - Previously `{ description: "" }` would be dropped from the signing payload. Now it's kept. Matches backend's `signParams` byte-for-byte. Invisible unless you were relying on the old behavior.

### Changed

- `src/apiClient.js`: add `X-Signature-Version: v1` header on every request.
- `src/config.js`: update comments to reflect plaintext secret.
- `README.md`: rewrite "Getting API Credentials" section, removing all SHA256 hashing steps.
- `package.json`: fix `repository.url` and `bugs.url` pointing to the correct GitHub org (`chainpayto`, not `chainpay`).

### Migration checklist

- [ ] Upgrade: `npx -y @chainpayto/mcp-server@2` or bump your config.
- [ ] In ChainPay merchant dashboard, reset your API Key and grab the new plaintext secret.
- [ ] Replace `CHAINPAY_API_SECRET` value in your MCP client config (Claude Desktop / Cursor / etc.) with the **plaintext** secret.
- [ ] Restart the MCP client; test by asking the agent something like "list my supported chains".

---

## [1.0.0] — 2026-04-20

### Added

- Initial release.
- Tools: `get_supported_chains`, `create_order`, `get_order`, `list_orders`, `get_balance`, `create_withdrawal`.
- Authentication via HMAC-SHA256 signed headers (legacy: hashed secret).

[2.0.0]: https://github.com/chainpayto/mcp-server/releases/tag/v2.0.0
[1.0.0]: https://github.com/chainpayto/mcp-server/releases/tag/v1.0.0
