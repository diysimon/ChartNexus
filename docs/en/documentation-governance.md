---
doc_id: documentation-governance
version: "0.1"
status: implementation-baseline
updated: 2026-10-29
language: en
---

# Bilingual documentation and governance

[简体中文](../zh-CN/documentation-governance.md)

## Document status and precedence
This documentation is an implementation baseline; field-level APIs, compatibility matrices, and workflows still require implementation according to their status. Precedence: explicit user task authorization, root AGENTS execution rules, accepted RFCs/specs, general standards, then examples. Record and resolve conflicts; examples do not override contracts.
English is the baseline for public terminology and API specification; Chinese must carry equivalent meaning. Do not indefinitely defer translation defects under English precedence. Fix both in the same PR; accepted contracts and tests establish behavior.

## Bilingual rules
Every standard and template has English and Chinese files with reciprocal links and shared doc_id/version/status/updated metadata. Update both in the same PR for behavioral rules. Do not translate identifiers, error codes, package names, or commands. Localized explanation/context must preserve semantics.
Register new resources in docs/manifest.json with relative paths, versions, and languages; check pair existence. Similar lengths or heading counts are hints, not semantic review.
Avoid machine-absolute paths in public standards. The initialization snapshot uses the workspace path solely to locate this delivery. Use obvious credential placeholders, never working secrets.

## RFCs and ADRs
Cross-package architecture, breaking contracts, default data semantics, and new execution permissions need RFCs describing problem, constraints, proposal, alternatives, compatibility, migration, validation, and decision. States: proposed/accepted/rejected/superseded; accepted records maintainer and date.
Smaller internal decisions may use ADRs linked to specs. Do not bulk-label this design as individually user-approved decisions.

## Contributions and review
Keep PRs focused and reviewable with spec/AC links, tests, bilingual assets, and changesets when release packages change. Do not mix bug fixes with unrelated broad refactors. Conventional Commits are recommended, but changesets and compatibility rules determine releases.
Maintainers own contracts, releases, and security reports. Configure CODEOWNERS only after actual GitHub identities/responsibilities are established. Convert supplied templates into GitHub templates later; they are not deployed yet.

## Licensing, branding, provenance
Use Apache-2.0 and retain upstream LICENSE/NOTICE obligations. Do not invent an Apache-official NOTICE or claim ASF project status for ChartNexus.
Record third-party code, documentation, image, and data licenses separately. Apache-2.0 does not automatically grant brand or third-party training-data rights. “for Apache ECharts” describes the technical relationship; comply with applicable trademark policies.

## Release documentation
Each release includes bilingual changes, compatibility, migrations, and limitations. Distinguish planned/experimental/verified/deprecated. Do not show apparently usable npm installation instructions for unpublished examples. Associate documentation versions with packages; do not silently rewrite historical pages to describe new behavior.
