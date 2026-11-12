# Structured output and "regex or LLM"

## First: do you need an LLM to parse this?

Structured text with a repeating shape (invoices from one vendor, log lines, quiz files, bank SMS, CSV-ish exports) is often parsed better, cheaper and faster by code.

Hybrid recipe

1. Write a regex or grammar parser for the common cases. Run it on a real sample of at least 100 items.
2. Score each parse with a confidence signal: all required fields found, values in valid ranges, checksum or total matches, no leftover unparsed text.
3. Items with high confidence ship as is. Items below the threshold go to the LLM with the same output schema.
4. Compare both paths on a labelled sample. Track the share routed to the LLM; that is your cost driver.
5. Add the LLM-fixed items back as parser test cases; the parser improves over time and the LLM share falls.

| Input | Use |
|---|---|
| Fixed format, high volume | Parser only, alert on unparsed rows |
| Several formats, mostly regular | Parser plus LLM fallback |
| Free text (emails, notes, chat) | LLM with a schema |
| Needs meaning ("is this a complaint?") | LLM or a trained classifier |
| Arithmetic, dates, currency conversion | Code on the extracted fields, never the LLM |

## Getting reliable structure from a model

Prefer mechanisms in this order:

1. **Provider-enforced structured output** (JSON schema mode, tool or function call with a schema, grammar-constrained decoding). The format cannot be violated; content can still be wrong.
2. **Forced tool call** whose arguments are the schema, when schema mode is not available.
3. **Prompt-only JSON** with a validator and a repair loop. Last resort.

For Anthropic features and parameters (tool use, structured outputs), use the built-in `claude-api` skill for the current syntax.

Schema design

- Flat and small beats deep and wide. Under about 15 fields per call; split otherwise.
- Use enums for closed sets and describe each value. Add `"other"` or `null` where reality has gaps.
- Every field has a description that says how to decide it, not just what it is.
- Make required only what you truly need; invite `null` instead of invented values.
- Units and formats explicit: `amount_minor_units` (integer), ISO 8601 dates, ISO currency codes.
- Include a short `reasoning` or `evidence` field before the answer fields when accuracy matters; strip it before storing.
- Add a `confidence` or `needs_review` field only if you will act on it.

## Validate every response

Treat the model as an untrusted source.

1. Parse (JSON.parse, `model_validate_json`, `json.Unmarshal`, `Json.decodeFromString`, `JSONDecoder`).
2. Validate against the schema library: type, required, enums, ranges, string lengths.
3. Validate business rules in code: totals add up, dates in range, ids exist, the user may touch that record.
4. On failure: retry once with the validation error appended ("Field X must be Y"), at lower temperature if supported. On a second failure, route to a fallback (manual queue, default, error to user). Never loop without a cap.
5. Log the failure class, not the raw content, if it may include personal data.

Per stack

| Stack | Schema and validation |
|---|---|
| TypeScript | Zod or Valibot schema, `safeParse`; derive the JSON Schema from it |
| Python | Pydantic models, `model_validate_json`; `TypedDict` is not validation |
| Go | Structs with tags plus `go-playground/validator`; `DisallowUnknownFields` on the decoder |
| Kotlin / Android | `kotlinx.serialization` with `ignoreUnknownKeys = false` where strictness matters |
| Swift | `Codable` with strict decoding; Foundation Models `@Generable` for on-device |
| Java / .NET | Jackson or System.Text.Json with strict settings plus Bean Validation / FluentValidation |
| Rust | `serde` with `deny_unknown_fields` plus explicit checks |
| PHP / Ruby | JSON Schema validator gems/packages (`opis/json-schema`, `json_schemer`) |

## Extraction quality tips

- Quote the evidence: ask for the exact source span for each extracted field and verify the span exists in the input. This catches hallucinated values cheaply.
- Normalise in code after extraction (trim, case, currency), not in the prompt.
- Handle multi-item documents with a list field and an explicit "no items" empty list.
- Long documents: chunk, extract per chunk, merge deterministically, then dedupe.
- Test with empty input, garbage input, and input in another language.
- Money, health and legal values extracted by a model are shown with a review step or a source link until proven by eval to meet your accuracy bar.

## Classification

- Closed label set with definitions and examples; include `other`.
- Return one label plus a confidence only if calibrated; otherwise use the model for ranking and a threshold chosen on your eval set.
- For high volume, a small tier or a fine-tuned small classifier often matches a large model at a fraction of the cost. Measure.
