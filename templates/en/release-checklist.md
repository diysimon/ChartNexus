---
doc_id: template-release-checklist
version: "0.1"
status: template
updated: 2026-10-29
language: en
---

# Release checklist template

[简体中文](../zh-CN/release-checklist.md)

# <version> release record

Status: planned; Source commit: <SHA>; Dist-tag: <alpha/beta/latest>; Owner: <actual identity>

- [ ] Scope, changesets, and bilingual notes agree.
- [ ] Public API/schema/peer compatibility and migrations reviewed.
- [ ] Required CI passes on the fixed commit.
- [ ] Actual tarballs pass clean installation, exports, and license checks.
- [ ] Supported matrix entries have versions/evidence; unverified entries are not supported.
- [ ] Release authorization, environment protection, and least privilege are ready.
- [ ] Prereleases do not replace latest; published versions are not overwritten.
- [ ] Artifact versions, checksums, provenance, and source mapping recorded.
- [ ] Documentation, GitHub release, and known limitations synchronized.

## Artifacts
| Package | Version | npm status | Commit | Checksum/evidence |
| --- | --- | --- | --- | --- |
| <package> | <version> | not-published | <SHA> | <evidence> |

## Failure and recovery
<Published/unpublished packages, recovery actions/results; never mark dry-run as published.>
