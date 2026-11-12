# Retrieval-augmented generation (RAG)

Use retrieval when answers depend on facts the model does not reliably have: your documents, recent data, per-user data. Prefer it over fine-tuning for knowledge that changes.

## Pipeline

```
ingest -> clean -> chunk -> embed + index (plus keyword index) -> [query] -> rewrite -> retrieve -> rerank -> assemble context -> generate with citations -> verify
```

Measure each stage separately. Most "the model is wrong" bugs are retrieval bugs.

## Ingest and chunk

- Convert sources to clean text with structure kept (headings, tables as text rows, code blocks). Strip navigation, boilerplate and duplicates.
- Chunk by meaning: headings, paragraphs, list items, functions. Typical size is a few hundred tokens with small overlap; tune on your own questions, not by rule.
- Attach metadata to every chunk: source id, title, section path, URL, date, version, owner, language, and access control (who may see it).
- Keep a parent link so you can expand a hit to its section.
- Tables and PDFs: extract with a layout-aware tool; check a sample by eye. For PDFs use the `anthropic-skills:pdf` skill's extraction methods.
- Re-ingest incrementally: hash content, update changed chunks, delete removed ones (stale facts are worse than missing facts).

## Index and retrieve

| Choice | Guidance |
|---|---|
| Embedding model | Fixed per index; changing it means re-embedding everything. Check language and domain coverage on your own queries |
| Index | Vector index plus keyword (BM25) index; hybrid retrieval usually beats either alone for names, codes and rare terms |
| Top-k | Retrieve wide (20 to 50), rerank, keep a few (3 to 8) |
| Reranker | A cross-encoder or a small LLM scoring query against chunk; biggest single quality gain after hybrid search |
| Filters | Apply metadata and access filters inside the query, before ranking, never after generation |
| Query rewrite | Expand abbreviations, resolve "it" from chat history, split multi-part questions |
| Freshness | Boost recent versions; drop superseded ones |

Cloudflare options (managed AI Search, or Vectorize plus Workers AI) are covered in `lll:cloudflare`; the design here is the same.

## Iterative retrieval (when one pass is not enough)

For questions that span documents or where the right terms are unknown:

1. Dispatch a broad query.
2. Evaluate: grade each hit high, medium, low or none; write down what is still missing.
3. Refine: add vocabulary found in the good hits; exclude confirmed-irrelevant sources.
4. Repeat for at most three cycles. Stop early when at least three high-relevance passages cover the question.

## Generate with sources

- Instruct: answer only from the passages; cite passage ids; if the passages do not contain the answer, say so.
- Number the passages in the prompt and require the id after each claim.
- Verify citations in code: every cited id was in the context, and (for high stakes) the quoted span appears in it.
- Refuse gracefully when retrieval confidence is low (top score under a threshold you set from eval data).
- Keep answers short; link to the source section for detail.
- Do not let retrieved text change the model's instructions: retrieved content is data (see guardrails).

## Access control and privacy

- Enforce permissions at retrieval with filters keyed to the authenticated user or tenant. A leaked chunk is a data breach.
- Separate indexes per tenant when isolation is a hard requirement, otherwise a mandatory `tenant_id` filter tested for every query path.
- Index only what the feature may expose. Remove personal data you do not need before embedding.
- Deleting a source must delete its chunks and vectors, including caches and backups per your retention policy.
- Log queries with care; they contain user intent.

## Evaluate retrieval

Build a set of 50 or more real questions with the passages that answer them.

| Metric | Meaning |
|---|---|
| Recall@k | Share of questions where a correct passage is in the top k |
| MRR / nDCG | How high the correct passage ranks |
| Context precision | Share of retrieved passages that are relevant |
| Faithfulness | Share of answer claims supported by the retrieved text |
| Answer correctness | Compared with a reference answer or judged with a calibrated judge |
| Abstention | On unanswerable questions, does it say it does not know? |

Fix in this order: chunking and cleaning, hybrid search, reranking, query rewrite, then generation prompt. Tune one stage at a time and keep the table of scores.

## Common failures

| Symptom | Cause | Fix |
|---|---|---|
| Right document, wrong answer | Chunk split the needed sentence from its context | Larger chunks, parent expansion, heading prefix on each chunk |
| Misses exact codes, names | Vector-only search | Add keyword search and hybrid fusion |
| Old policy quoted | Stale index or no version filter | Incremental re-ingest, version metadata |
| Answers from the wrong customer's data | Missing tenant filter | Mandatory filter plus a cross-tenant test |
| Fluent but unsupported answer | No citation requirement or low retrieval score still answered | Require citations, abstain below threshold |
| Slow | Many sequential calls, large k | Parallelise, cache embeddings of frequent queries, rerank fewer |
| High cost | Large contexts every call | Smaller top-n after reranking, summarise, cache stable prefix |

## When not to build RAG

- The whole corpus fits comfortably in the context window and changes rarely: put it in the prompt and cache it.
- The questions are lookups on structured data: use SQL or an API, and let the model write the query with validation and read-only credentials.
- Users need exact quotes or legal precision: search with citations, not generation.
