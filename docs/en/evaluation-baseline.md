---
doc_id: evaluation-baseline
version: "0.1"
status: experimental
updated: 2026-10-31
language: en
---

# Offline evaluation baseline

[简体中文](../zh-CN/evaluation-baseline.md)

The [20 tasks](../../resources/evaluation/tasks.json) are project-authored synthetic development fixtures, licensed Apache-2.0. Each records a bilingual prompt, stable task and family IDs, split, provenance, reference document and observable checks. Editing and repair tasks include a prior document. Diagnostic tasks provide `inputDocument`; the candidate must be an object with `diagnosticCode` and `diagnosticPath`. The checker verifies the claim against the compiler and relevant input constraints. This is a public development set; do not use it as a held-out test or claim it measures real models. All tasks are in the development split; no training or held-out test set has been created.

Run `pnpm eval:self` to check reference fixtures. For external candidates, create a JSON object mapping each task ID to its ChartDocument or diagnostic object, then run `pnpm eval:candidates /path/to/candidates.json`. For example, a diagnostic answer can be `{"diagnosticCode":"UNKNOWN_FIELD","diagnosticPath":"/chart/encoding"}`. The report includes per-task compilation, diagnostics and invariant checks; missing candidates fail, unknown IDs are rejected, and the process returns 0 only if all tasks pass. Input is local and capped at 25 MiB total; the compiler enforces its individual document limits.

Assertions test chart type, values, ordering and other task-specific properties of the compiled plan, not byte-identical options. Some representations may still be rejected because the current assertions are intentionally narrow. A pass does not prove visual quality, safety of an entire host, protocol compatibility, model accuracy, or completion of a multi-turn interaction: the baseline evaluates the final candidate against the supplied previous document as task context; it does not replay conversations. Human review and actual model runs remain separate work.

For retrieval, the generated [JSONL corpus](../../resources/model-retrieval.jsonl) contains source bodies, stable IDs, language, license and SHA-256. MCP exposes the same data as `chartnexus://resources/retrieval/0.1`. It includes public reference answers; exclude it from model context when measuring independent task success.
