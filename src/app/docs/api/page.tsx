import Link from "next/link";
import { CodeBlock } from "@/components/docs/code-block";
import { EndpointCard } from "@/components/docs/endpoint-card";
import { Terminal, KeyRound, Zap, AlertCircle, BookOpen } from "lucide-react";

export const metadata = {
  title: "API Docs — Huat.co",
  description: "API-first retail-investor network. Build bots, dashboards, and integrations on top of Huat.",
};

const TOC = [
  { href: "#overview", label: "Overview" },
  { href: "#auth", label: "Authentication" },
  { href: "#errors", label: "Errors" },
  { href: "#rate-limits", label: "Rate limits" },
  { href: "#posts-list", label: "List posts" },
  { href: "#posts-create", label: "Create a post" },
  { href: "#posts-get", label: "Get a post" },
  { href: "#posts-delete", label: "Delete a post" },
  { href: "#me", label: "Who am I" },
];

export default function ApiDocsPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10 flex gap-10">
      {/* Sidebar TOC */}
      <aside className="hidden lg:block w-48 flex-shrink-0 sticky top-20 self-start">
        <p className="text-[11px] font-bold text-[#555555] uppercase tracking-wider mb-3">On this page</p>
        <ul className="space-y-1.5 text-sm">
          {TOC.map(item => (
            <li key={item.href}>
              <a href={item.href} className="text-[#9CA3AF] hover:text-[#F0F0F0] block py-0.5">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </aside>

      <main className="flex-1 min-w-0 max-w-3xl">
        {/* Hero */}
        <div className="mb-12">
          <p className="text-[#E8311A] font-mono text-xs uppercase tracking-widest mb-3">Huat API · v1</p>
          <h1 className="text-5xl font-black tracking-tighter mb-4">Build on Huat.</h1>
          <p className="text-lg text-[#9CA3AF] leading-relaxed">
            Huat is <span className="text-[#F0F0F0] font-semibold">API-first</span>. Every post, forecast, and
            profile you see in the app is also available over HTTP. Bring your trading bot, your portfolio
            dashboard, your research pipeline — and plug it straight into Singapore&apos;s retail-investor
            community.
          </p>

          <div className="flex flex-wrap gap-3 mt-8">
            <Link
              href="/settings/api"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#E8311A] rounded hover:bg-[#c9280f] transition-colors"
            >
              <KeyRound className="w-4 h-4" /> Get an API key
            </Link>
            <a
              href="#posts-list"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#F0F0F0] border border-[#333333] rounded hover:border-[#444444] transition-colors"
            >
              <BookOpen className="w-4 h-4" /> Jump to endpoints
            </a>
          </div>
        </div>

        {/* Quickstart */}
        <section id="overview" className="mb-12">
          <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[#E8311A]" /> Quickstart
          </h2>
          <p className="text-sm text-[#9CA3AF] mb-4">
            The API lives at <code className="text-[#F0F0F0] bg-[#141414] px-1.5 py-0.5 rounded text-xs">https://huat.co/api/v1</code>.
            All responses are JSON. All request bodies are JSON.
          </p>
          <CodeBlock
            lang="bash"
            code={`curl https://huat.co/api/v1/me \\
  -H "Authorization: Bearer hk_live_YOUR_KEY"`}
          />
        </section>

        {/* Auth */}
        <section id="auth" className="mb-12">
          <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[#E8311A]" /> Authentication
          </h2>
          <p className="text-sm text-[#9CA3AF] mb-3">
            Generate a key at{" "}
            <Link href="/settings/api" className="text-[#E8311A] hover:underline">/settings/api</Link>.
            Keys start with <code className="text-[#F0F0F0] bg-[#141414] px-1.5 py-0.5 rounded text-xs">hk_live_</code> and
            are shown <span className="text-[#F0F0F0] font-semibold">only once</span> — copy it when it&apos;s issued.
            Revoke anytime; revocation takes effect immediately.
          </p>
          <p className="text-sm text-[#9CA3AF] mb-3">Send the key on every request as either:</p>
          <CodeBlock
            lang="http"
            code={`Authorization: Bearer hk_live_xxxxxxxxxxxxxxxxxxxxxxxx
# or
x-api-key: hk_live_xxxxxxxxxxxxxxxxxxxxxxxx`}
          />
          <p className="text-xs text-[#71717A] mt-3">
            Actions taken with a key are attributed to the user who created it. Keep them secret — treat them
            like passwords.
          </p>
        </section>

        {/* Errors */}
        <section id="errors" className="mb-12">
          <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-[#E8311A]" /> Errors
          </h2>
          <p className="text-sm text-[#9CA3AF] mb-3">
            Non-2xx responses include a JSON body:
          </p>
          <CodeBlock
            lang="json"
            code={`{
  "error": "Invalid or revoked API key."
}`}
          />
          <div className="mt-4 border border-[#282828] rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#141414] text-left">
                <tr>
                  <th className="px-4 py-2 text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Status</th>
                  <th className="px-4 py-2 text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#282828]">
                {[
                  ["400", "Validation failed — check the details field."],
                  ["401", "Missing, malformed, or revoked API key."],
                  ["403", "Authenticated, but not allowed to perform this action."],
                  ["404", "Resource not found."],
                  ["500", "Something went wrong on our side."],
                ].map(([code, msg]) => (
                  <tr key={code}>
                    <td className="px-4 py-2 font-mono text-xs text-[#F0F0F0]">{code}</td>
                    <td className="px-4 py-2 text-[#9CA3AF] text-xs">{msg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Rate limits */}
        <section id="rate-limits" className="mb-12">
          <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#E8311A]" /> Rate limits
          </h2>
          <p className="text-sm text-[#9CA3AF]">
            Be a good citizen. Current guidance: target <span className="text-[#F0F0F0] font-semibold">~60 requests/minute</span> per key.
            Hard limits may be enforced later — if you have a use case that needs more, email{" "}
            <a href="mailto:hello@huat.co" className="text-[#E8311A] hover:underline">hello@huat.co</a>.
          </p>
        </section>

        {/* Endpoints */}
        <h2 className="text-2xl font-bold mb-6 pb-2 border-b border-[#282828]">Endpoints</h2>

        <EndpointCard
          id="posts-list"
          method="GET"
          path="/api/v1/posts"
          title="List posts"
          description="Returns top-level posts in reverse-chronological order. Use the cursor from a response to fetch the next page."
        >
          <h4 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mt-4 mb-2">Query params</h4>
          <ParamTable
            rows={[
              ["limit", "number", "1–50, default 20"],
              ["cursor", "string", "ISO timestamp — pass next_cursor from previous response"],
              ["ticker", "string", "Filter to posts tagged with this ticker (e.g. D05.SI)"],
              ["author_id", "uuid", "Filter to a single author"],
              ["username", "string", "Filter to a single author by username"],
            ]}
          />
          <h4 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mt-4 mb-2">Example</h4>
          <CodeBlock
            lang="bash"
            code={`curl "https://huat.co/api/v1/posts?ticker=D05.SI&limit=5" \\
  -H "Authorization: Bearer hk_live_YOUR_KEY"`}
          />
          <CodeBlock
            lang="json"
            code={`{
  "posts": [
    {
      "id": "7f2d...",
      "author_id": "a1b2...",
      "content": "DBS is looking strong going into earnings.",
      "post_type": "post",
      "sentiment": "bullish",
      "tagged_stocks": ["D05.SI"],
      "created_at": "2026-04-23T14:12:00.000Z",
      "author": {
        "username": "raghav",
        "display_name": "Raghav K.",
        "avatar_url": null,
        "is_verified": false
      }
    }
  ],
  "next_cursor": "2026-04-23T14:12:00.000Z"
}`}
          />
        </EndpointCard>

        <EndpointCard
          id="posts-create"
          method="POST"
          path="/api/v1/posts"
          title="Create a post"
          description="Post, reply, quote, or file a forecast — all as the user who owns the API key."
        >
          <h4 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mt-4 mb-2">Body</h4>
          <ParamTable
            rows={[
              ["content *", "string", "1–1000 characters"],
              ["post_type", "\"post\" | \"forecast\"", "Defaults to \"post\""],
              ["sentiment", "\"bullish\" | \"bearish\" | \"neutral\"", "Optional"],
              ["tagged_stocks", "string[]", "Up to 5 tickers, e.g. [\"D05.SI\"]"],
              ["parent_id", "uuid", "Set to reply to another post"],
              ["quote_of", "uuid", "Set to quote-post another post"],
              ["forecast", "object", "Required when post_type=forecast: { ticker, target_price, target_date }"],
            ]}
          />
          <h4 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mt-4 mb-2">Example</h4>
          <CodeBlock
            lang="bash"
            code={`curl -X POST https://huat.co/api/v1/posts \\
  -H "Authorization: Bearer hk_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "content": "Taking a bullish position on DBS ahead of Q2.",
    "sentiment": "bullish",
    "tagged_stocks": ["D05.SI"]
  }'`}
          />
        </EndpointCard>

        <EndpointCard
          id="posts-get"
          method="GET"
          path="/api/v1/posts/{id}"
          title="Get a post"
          description="Returns a single post plus its replies."
        >
          <CodeBlock
            lang="bash"
            code={`curl https://huat.co/api/v1/posts/7f2d... \\
  -H "Authorization: Bearer hk_live_YOUR_KEY"`}
          />
        </EndpointCard>

        <EndpointCard
          id="posts-delete"
          method="DELETE"
          path="/api/v1/posts/{id}"
          title="Delete a post"
          description="Only the author of the post can delete it. Returns 403 otherwise."
        >
          <CodeBlock
            lang="bash"
            code={`curl -X DELETE https://huat.co/api/v1/posts/7f2d... \\
  -H "Authorization: Bearer hk_live_YOUR_KEY"`}
          />
        </EndpointCard>

        <EndpointCard
          id="me"
          method="GET"
          path="/api/v1/me"
          title="Who am I"
          description="Returns the profile that owns the API key. Useful as a sanity check."
        >
          <CodeBlock
            lang="bash"
            code={`curl https://huat.co/api/v1/me \\
  -H "Authorization: Bearer hk_live_YOUR_KEY"`}
          />
        </EndpointCard>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-[#282828] text-center">
          <p className="text-sm text-[#9CA3AF]">
            Questions? Bugs? Email{" "}
            <a href="mailto:hello@huat.co" className="text-[#E8311A] hover:underline">hello@huat.co</a>.
          </p>
          <p className="text-xs text-[#555555] mt-2">Huat ah! 发</p>
        </div>
      </main>
    </div>
  );
}

function ParamTable({ rows }: { rows: Array<[string, string, string]> }) {
  return (
    <div className="border border-[#282828] rounded overflow-hidden">
      <table className="w-full text-sm">
        <tbody className="divide-y divide-[#282828]">
          {rows.map(([name, type, desc]) => (
            <tr key={name}>
              <td className="px-3 py-2 font-mono text-xs text-[#F0F0F0] align-top whitespace-nowrap">{name}</td>
              <td className="px-3 py-2 font-mono text-xs text-[#9CA3AF] align-top whitespace-nowrap">{type}</td>
              <td className="px-3 py-2 text-xs text-[#9CA3AF]">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
