---
doc_id: spec-0018-spec
version: "0.1"
status: implemented
updated: 2026-10-31
language: en
---
# Explicit calendar date axis
[简体中文](spec.zh-CN.md)
## Contract
Experimental 0.2 intent line charts accept x `{field, type:"temporal", temporalKind:"date"}`. Values must be valid Gregorian `YYYY-MM-DD`, years 1000–9999. Convert each date to UTC midnight milliseconds only as the render coordinate; set ECharts `useUTC: true` and time axis. Dates represent calendar dates, not local times or instants. Input is preserved, no timezone is inferred, and equal textual dates in a group are rejected by existing duplicate logic. Grouping, gaps, sorting and original row indices follow the existing compiler. Without an explicit sort, series point order stays in input order; the time axis positions dates by time. Invalid dates, missing temporalKind, temporalKind on non-temporal fields, non-line charts and date values outside the range are rejected. Offset-bearing timestamps, local datetimes, other calendars and timezones are out of scope.
## Acceptance
Test valid leap dates, malformed/ambiguous dates, groups, missing values, original row identity, sorting and inputs unchanged, UTC render coordinate and setting, native 0.1 compatibility, SSR/browser, capability discovery and bilingual docs. Do not claim timestamp support or real-model verification.

Evidence: unit and SVG tests and local Chrome 0.2 demo pass. No live-model or accessibility validation was performed.
