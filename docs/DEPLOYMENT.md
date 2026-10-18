# Deployment choices

## Current supported path: ChatGPT Sites

GitHub stores the reusable source. ChatGPT Sites owns publication, trusted visitor identity and managed Cloudflare Workers/R2 bindings. Keep one deployed room and add same-workspace Site editors when appropriate. Publishing does not require exposing applicant records on GitHub. There is no automatic GitHub-push-to-Sites pipeline in this repository.

Run `npm run build` for the public default output, which uses `.openai/hosting.example.json` and has no Site identity. To prepare output for an existing Site, use the actual ID returned by the official Sites workflow: `npm run build -- --project-id <actual-returned-id>`. The bundler validates the ID and writes only `project_id` in ignored `dist/.openai/hosting.json`; it does not publish, set bindings, or create a Site. For an existing local Sites project, preserve any helper-managed identity in ignored `.openai/hosting.json` and continue through its official workflow. The bundler never reads that file. Keep generated `dist/` out of Git; the privacy check rejects Site IDs in public files.

An app coordinator can close/reopen the room and import into an empty dataset. A Site editor can change/publish code. A GitHub collaborator can change repository code. Those are distinct permissions and should be granted separately.

## Independent Cloudflare hosting is not supported by this release

Workers can run the ESM application shape, but this repository does not include a verified standalone Cloudflare adapter. Private R2 storage can preserve the current record model. A future deployment would need Cloudflare Access or another identity provider plus an adapter that validates signature, issuer, audience and expiry; headers containing an email are not sufficient authentication. Deny missing or invalid identity. Keep the reviewer email allowlist separate from coordinator permissions.

This repository does not include or claim a verified standalone adapter. Moving to an account you control requires that adapter, provider configuration, a custom access policy and an explicit private-data export/import. It does not transfer existing data automatically.

Official references:
- https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/
- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/
- https://developers.cloudflare.com/r2/api/workers/workers-api-usage/

## Vercel is not supported by this release

Vercel is also possible, but this Worker relies on Cloudflare bindings and Sites identity. Add a request/runtime adapter, authentication and durable storage before using it there. A Git repository connection alone does not supply those services. GitHub Pages is static hosting and cannot run this protected server.

For a larger system, keep this interface and move structured candidates/reviews to D1 or PostgreSQL with indexed queries, transactionally enforced uniqueness and a complete backup path. Avoid adding a second implementation solely for portability.
