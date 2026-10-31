---
doc_id: spec-0022-spec
version: "0.1"
status: implemented
updated: 2026-10-31
language: en
---
# Explicit time instants
[简体中文](spec.zh-CN.md)
## Goal and scope
Extend experimental 0.2 temporal line charts with explicit offset-bearing instants without inferring a machine timezone. Existing calendar-date and 0.1 behavior remain unchanged.
## Contract
`encoding.x` uses `{field,type:"temporal",temporalKind:"instant"}`. Accept strict `YYYY-MM-DDTHH:mm:ss[.SSS]Z` or explicit `±HH:mm`; allow one to three fractional digits, years 1000–9999, offsets at most ±14:00, seconds 00–59, valid Gregorian dates and times. Reject offset-less/local datetimes, unknown offset `-00:00`, leap seconds and excess fractional precision. UTC milliseconds and `useUTC` determine chart coordinates and display; original values and data revision are retained by the host. No implicit sorting; category sorting compares absolute instants. If different strings in the same chart denote the same instant, reject the ambiguity instead of silently merging categories across series. Existing same-string duplicate rules and grouping apply. No named timezones, timezone conversions for display or timestamp-number input.
## Acceptance
Test UTC/offset equivalence rejection, chronological sorting, invalid date/time/offset, grouped gaps and original row mapping, aggregation, unit/theme combinations, reference and input immutability, cross-timezone determinism, browser/SVG, agent discovery, 0.1 and calendar-date regression. Document experimental limitations honestly.

Evidence: unit/SVG tests and a local Chrome example pass; UTC, Asia/Shanghai and America/Los_Angeles process probes produced the same UTC coordinate. No real-model or named-timezone verification.
