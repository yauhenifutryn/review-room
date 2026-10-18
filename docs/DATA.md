# Data import and separation

## Canonical JSON

An array of candidate objects. Required: `id`, `name`. Department values are `Partnerships`, `Event Management`, `People`, `Marketing`, `Finance`. The importer fills missing departments, hours, city, commitment and all six answer fields (`achievement`, `vision`, `initiative`, `ownership`, `motivation`, `additional`) with blanks; it does not infer hours or other missing facts. Use the fictional examples as a starting point.

CSV supports canonical columns and the original recruitment-form question headers. If explicit IDs are absent in a Notion-style export, the importer can derive an ID from the normalized name and creation-time value. It never uses row order. Correcting either source field can change that derived ID, so retain the first canonical JSON and use explicit stable IDs for later exports. Duplicate or missing identity information is rejected rather than guessed.

`ai` is optional. Import does not call a model or produce a new recommendation. Current scores use `ownership` (30%), `growth` (20%), `communityService` (30%) and `motivation` (20%), under rubric version `2026-10-18-v3`. The importer recomputes weighted totals and ignores any supplied total. It rejects old score keys and explicitly older rubric versions; it never renames an old criterion to make it fit. Current stored AI briefs with a missing or older rubric version are marked historical and their numeric scores are hidden. Their text remains a reference, not a new assessment.

## Private records

`.private/` is ignored; do not force-add it. Do not put private files under examples. The importer writes `.private/candidates.json`; a coordinator then uploads that file through the Site's **Import applications** control. The authenticated endpoint persists the dataset outside the Worker bundle. Import is create-only: an existing dataset or any review history blocks it. An empty Site and storage bucket are the supported import target.

The importer excludes structured email, phone, gender, university, LinkedIn and profile-picture columns. Free text can still contain personal information, URLs and identifying facts. Review the output locally before upload. The public repository must never include real applications, assessments, imported JSON, review exports or Notion ID maps.

## Reconciliation and migrations

Exported results use `candidate_id`; names are reference labels, not a unique join key. Keep any mapping from those IDs to private Notion page IDs outside this repository. A missing or ambiguous match must remain unresolved. Do not silently recreate, allocate, accept or reject an application based on that match.

No automatic Notion sync or data migration is implemented. New human reviews use v3 and feed current aggregates. Existing v2 reviews remain available separately in Results as historical records and do not contribute to v3 totals. Before migrating, retain a complete private snapshot of candidates, individual reviews, comments and settings. The current CSV contains summaries only.
