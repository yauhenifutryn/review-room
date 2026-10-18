# Review Room

A compact, collaborative application-review room for ChatGPT Sites. Code is public; application records, reviews and comments belong to the private deployment.

- Four weighted criteria: ownership (30%), growth (20%), community service (30%) and motivation (20%). Reviews are independent per account.
- Candidate briefs, evidence checks and department recommendations when supplied.
- Referrals/comments, activity indicators, reviewer completion and CSV results.
- Coordinator-controlled closure. No automatic acceptance, ranking regeneration or Notion write.

## One codebase, one deployment

This version targets **ChatGPT Sites**, whose server runtime is Cloudflare Workers. It uses Sites-provided identity and a private R2 binding. It does not require a second Cloudflare deployment or a Vercel project.

GitHub is the maintained code source. Sites has its own publication workflow and deployment source copy. A push here does **not** automatically publish the Site; an owner or same-workspace Site editor must publish the chosen version through Sites. Changes made through a Site editor should be brought back to this repository to avoid divergent implementations.

This is a clean reusable release, not a copy of a live recruitment database. There are no real candidates, assessments, private Notion mappings, account allowlists, deployment IDs or pre-existing Git history in this repository. The examples are fictional.

## Quick start

Requires Node.js 22 or newer.

```sh
npm ci
npm test
npm run build
npm run validate
npm run privacy
```

The default build produces `dist/server/index.js`, a Worker ESM entrypoint, and uses the public hosting example without a Site identity. The bundle script never reads the ignored `.openai/hosting.json`. To create a Site-specific output for a known Site, pass its actual ID explicitly: `npm run build -- --project-id <actual-returned-id>`. This validates the ID and writes only `project_id` to ignored `dist/.openai/hosting.json`; it does not publish or configure a Site. Never commit `dist/`. Run `npm run privacy` after the default build, before creating a Site-specific output. The checker scans public text files, including the built artifact; it skips `.env*`, `.dev.vars*`, `.private/`, the local Site configuration and symlink targets before reading. It fails if Git tracks a private configuration path or a symlink. It checks common email, credential, local user path and Site ID patterns; it cannot identify real names without a denylist.

## Create or update a Site

1. Use the Sites workflow in ChatGPT/Codex to create a Site, or open an existing Site that you own or can edit. Do not create a second Site when updating an existing one.
2. Use the official Sites workflow to select the target. For a known Site-specific artifact, run `npm run build -- --project-id <actual-returned-id>` and then `npm run validate`; the argument must be the ID returned by the Sites workflow. The bundler writes the ID only to ignored `dist/.openai/hosting.json`. The default build has no Site identity and uses `.openai/hosting.example.json`. The script never reads or copies the ignored `.openai/hosting.json`; preserve any helper-managed source identity there for the official workflow. Do not commit `dist/` or publish a Site-specific artifact through GitHub.
3. In the managed Site configuration, provide the private R2 binding and set `COORDINATOR_EMAILS` to the coordinator addresses, comma-separated. Confirm both are available before importing.
4. Publish the selected source/build through the official Sites workflow. A push to GitHub does not automatically synchronize or publish the Site. GitHub Pages cannot run this protected server.
5. Choose the Site audience deliberately. While reviewing is open, signed-in visitors allowed by the Site can read applications and Results. Restrict the audience if this should only be your team.
6. Sign in as a configured coordinator and import the dataset as described below.

Site editor access is separate from visitor access and this app's coordinator setting. A Site owner can grant edit access to an active member of the same ChatGPT workspace. GitHub collaborator access alone does not grant permission to publish a Site.

## Import your own data

```sh
npm run import -- examples/candidates.json
# Or: npm run import -- /path/to/your/applications.csv
```

The importer writes `.private/candidates.json`, which is ignored by Git. It validates IDs and fields, drops structured contact/demographic columns and applies best-effort email/phone scrubbing to answer text. It does not generate AI judgments. Names and application answers are still personal data; scrubbing is not a guarantee of anonymity. Read [the data guide](docs/DATA.md) before importing real applications.

In the Site, sign in as a coordinator, expand **Import applications**, select that JSON file, and submit. Import is create-only: an existing dataset or any review history prevents replacement. Use a fresh Site/storage for a new recruitment round. Keep IDs stable; do not reuse them for a different person.

Candidates are stored in private R2 runtime storage, separately from the code. A later code deployment therefore does not need to contain application data. Submitted reviews, comments and room settings also persist in R2. Unsubmitted drafts are held in browser memory only. Activity markers expire after 15 minutes. The CSV export contains aggregate results and names, not contact fields, reviewer identities or free-text notes; it is not a full backup.

## Hosting elsewhere later

The Worker ESM shape and review logic are reusable, but **this is not a secure standalone Cloudflare or Vercel starter as-is**. Sites currently supplies the trusted identity boundary. Never deploy it publicly elsewhere and trust caller-supplied `oai-authenticated-*` headers.

For an independent Cloudflare deployment, add a verified authentication adapter such as Cloudflare Access (email OTP or an identity provider), configure its allowlist, and bind private storage. For Vercel, also provide a compatible server/storage adapter. Those adapters are deliberately not duplicated here. See [deployment choices](docs/DEPLOYMENT.md).

## Operational limits

This is a single-room review tool, not a multi-tenant recruitment platform. Submissions lock after sending. Results scan stored review metadata; large cohorts need indexed database queries. Closing is checked immediately before writes, but R2 cannot make a settings change and an unrelated review write one transaction. A write already admitted may finish after closure. Already downloaded records cannot be remotely revoked. Use transactional storage/serialized admission for a strict close barrier.

The app exposes only a CSV summary export today. Establish a full private backup/export process before a production migration or storage deletion. Do not mistake source-code availability for a data backup.

## License

MIT. Application data and deployment credentials are not part of this license or repository. No third-party branding assets are included.
