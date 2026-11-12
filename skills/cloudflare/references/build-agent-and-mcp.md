# Build an agent or a remote MCP server on Cloudflare

Adapted from the Cloudflare plugin's `build-agent` and `build-mcp` commands (Apache-2.0, see `NOTICE`). The API changes fast: read the vendored guide and fetch the current Agents docs before writing code.

Start with `../vendor/agents-sdk/GUIDE.md`, then `../vendor/agents-sdk/references/configuration.md` and `../vendor/agents-sdk/references/routing.md` for project setup. Live docs: `https://developers.cloudflare.com/agents/`.

## Pick the base class

| Need | Use | Package |
|---|---|---|
| Custom stateful logic, RPC methods, scheduling | `Agent` | `agents` |
| AI chat with streaming, tools, message persistence | `AIChatAgent` | `@cloudflare/ai-chat` |
| AI chat with an automatic tool loop and a built-in workspace | `Think` (experimental when this was written; confirm status) | `@cloudflare/think` |
| Remote MCP server | `McpAgent` | `agents/mcp` |

## Which reference for which feature

| Feature | Reference in `../vendor/agents-sdk/references/` |
|---|---|
| Chat and streaming | `streaming-chat.md`, `client-sdk.md` |
| State and scheduled tasks | `state-scheduling.md` |
| RPC methods callable from clients | `callable.md` |
| Background work, retries | `workflows.md`, `durable-execution.md`, `queue-retries.md` |
| MCP client or server | `mcp.md` |
| Email in or out | `email.md` |
| Webhooks and push | `webhooks-push.md` |
| Human approval steps | `human-in-the-loop.md` |
| Voice | `voice.md` |
| Browsing tools | `browse-the-web.md` |
| Code-mode tool calling | `codemode.md` |
| Higher-level chat | `think.md` |
| Logs and tracing | `observability.md` |

## Scaffold an agent

1. Create the project with the current create-cloudflare template for agents (retrieve the exact command; `npm create cloudflare@latest` with the agents starter was the path when this was written).
2. Config: a Durable Object binding for the agent class, a `new_sqlite_classes` migration entry for it, the AI binding if you use Workers AI, assets if you serve a client.
3. Implement the class (`Agent` or `AIChatAgent`).
4. Route requests with `routeAgentRequest` in the default export `fetch`.
5. Client: the `useAgent` and `useAgentChat` React hooks, or the client SDK for other frameworks.
6. Run `wrangler types`, then test locally with `wrangler dev`.
7. The owner deploys.

Rules for agents:

- State lives in the agent (SQLite-backed). Do not keep conversation state in module variables.
- Each tool has a typed input schema, a description that says when not to use it, and a bounded output.
- Tools that spend money, send messages or change data need an approval step (`human-in-the-loop.md`).
- Cap loop iterations and tokens per run. Log tool calls with ids, not payloads.
- Prompt, tool and eval design: `lll:ai`.

## Scaffold a remote MCP server

1. Read `../vendor/agents-sdk/references/mcp.md` and the live McpAgent API page.
2. Install `@modelcontextprotocol/sdk` and `zod` (pin versions).
3. Config: a Durable Object binding and a `new_sqlite_classes` migration for the `McpAgent` class.
4. Implement: extend `McpAgent`, create the `McpServer`, register tools in `init()` with zod input schemas.
5. Serve over Streamable HTTP at `/mcp`. SSE is the legacy transport for old clients only.
6. Authentication: public servers need OAuth or another real auth layer. Retrieve the "securing MCP servers" docs. An open MCP server that can read or write user data is a `critical` finding.
7. Test with the MCP inspector (pinned version) against `wrangler dev`.
8. The owner deploys.

Shape (check types against the installed package):

```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";

export class MyMCP extends McpAgent<Env> {
  server = new McpServer({ name: "my-mcp", version: "1.0.0" });
  async init() {
    this.server.registerTool(
      "lookup_order",
      { description: "Find one order by id. Read-only.", inputSchema: { orderId: z.string() } },
      async ({ orderId }) => ({ content: [{ type: "text", text: await findOrder(this.env, orderId) }] })
    );
  }
}
export default {
  fetch: (req: Request, env: Env, ctx: ExecutionContext) =>
    MyMCP.serve("/mcp", { binding: "MyMCP" }).fetch(req, env, ctx),
};
```

| Transport | Method | Use for |
|---|---|---|
| Streamable HTTP | `serve("/mcp")` | Public and external clients (recommended) |
| SSE | `serveSSE("/sse")` | Legacy clients only |
| RPC | `addMcpServer(name, env.Binding)` | Calls inside the same Worker |

## Sandboxes for agent code execution

If the agent must run shell commands or generated code, use the Sandbox SDK (`../vendor/sandbox-next/GUIDE.md` or `../vendor/sandbox-stable/GUIDE.md`, depending on the package line the project already uses) and treat all output as untrusted data. Never mount secrets into the sandbox.
