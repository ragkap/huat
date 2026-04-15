import { GoogleGenAI, Type } from "@google/genai";
import type { Content, FunctionDeclaration, Part } from "@google/genai";

const MCP_URL =
  "https://y2qpdesxs0.execute-api.ap-southeast-1.amazonaws.com/mcp";

const TOOLS: FunctionDeclaration[] = [
  {
    name: "fetch_recent_research_by_company",
    description:
      "Retrieve analyst research, insights, and commentary on a specific company. Use for: research/analysis requests, analyst views, investment perspectives, or any company/ticker mention.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        search_string: {
          type: Type.STRING,
          description: "Company name, ticker, or exchange code.",
        },
      },
      required: ["search_string"],
    },
  },
  {
    name: "fetch_recent_primer_by_company",
    description:
      "Retrieve a comprehensive company primer/tear-sheet. Use when user requests a primer, tear-sheet, or company profile.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        search_string: {
          type: Type.STRING,
          description: "Company name, ticker, or exchange code.",
        },
      },
      required: ["search_string"],
    },
  },
  {
    name: "fetch_recent_research_by_theme",
    description:
      "Search research on investment themes, sectors, trends, or topics across multiple companies.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        search_string: {
          type: Type.STRING,
          description:
            "Theme, sector, industry, or trend e.g. 'AI stocks', 'China EVs'.",
        },
      },
      required: ["search_string"],
    },
  },
  {
    name: "fetch_share_price_of_company",
    description:
      "Retrieve price and fundamental data for a company including P/E, market cap, dividend yield.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        search_string: {
          type: Type.STRING,
          description: "Company name, ticker, or exchange code.",
        },
      },
      required: ["search_string"],
    },
  },
  {
    name: "fetch_shareholders_of_company",
    description: "Retrieve top 5 shareholders for a company.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        search_string: {
          type: Type.STRING,
          description: "Company name, ticker, or exchange code.",
        },
      },
      required: ["search_string"],
    },
  },
  {
    name: "fetch_peers_of_company",
    description: "Retrieve top 5 peers for a company.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        search_string: {
          type: Type.STRING,
          description: "Company name, ticker, or exchange code.",
        },
      },
      required: ["search_string"],
    },
  },
  {
    name: "fetch_estimates_of_company",
    description:
      "Retrieve Revenue, EBITDA, and EPS analyst estimates/consensus for a company.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        search_string: {
          type: Type.STRING,
          description: "Company name, ticker, or exchange code.",
        },
      },
      required: ["search_string"],
    },
  },
  {
    name: "fetch_recent_research_by_content_vertical",
    description:
      "Search recent research by type/vertical: Event-Driven (M&A), ECM (IPOs), ESG, Quant, Macro, Crypto, etc.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        search_string: {
          type: Type.STRING,
          description:
            "Vertical name or keyword e.g. 'M&A', 'ESG', 'IPO', 'crypto'.",
        },
      },
      required: ["search_string"],
    },
  },
  {
    name: "fetch_recent_research_by_author_name",
    description: "Search recent research by analyst/author name.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        search_string: {
          type: Type.STRING,
          description: "Analyst/author name (full or partial).",
        },
      },
      required: ["search_string"],
    },
  },
  {
    name: "fetch_recent_earnings_by_company_name",
    description: "Retrieve the latest earnings report for a company.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        search_string: {
          type: Type.STRING,
          description: "Company name, ticker, or exchange code.",
        },
      },
      required: ["search_string"],
    },
  },
  {
    name: "fetch_next_dividend_date_by_company_name",
    description:
      "Retrieve next dividend payment info including ex-dividend and pay dates.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        search_string: {
          type: Type.STRING,
          description: "Company name, ticker, or exchange code.",
        },
      },
      required: ["search_string"],
    },
  },
  {
    name: "fetch_latest_filing_by_company",
    description:
      "Retrieve the latest regulatory filing for a company (SEC docs, annual reports, etc.).",
    parameters: {
      type: Type.OBJECT,
      properties: {
        search_string: {
          type: Type.STRING,
          description: "Company name, ticker, or exchange code.",
        },
      },
      required: ["search_string"],
    },
  },
  {
    name: "fetch_top_authors_by_content_vertical",
    description:
      "Search top research analysts by methodology: M&A, ESG, IPO, Quant, Technical, Macro, etc.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        search_string: {
          type: Type.STRING,
          description: "Vertical name or keyword.",
        },
      },
      required: ["search_string"],
    },
  },
  {
    name: "fetch_top_authors_by_country",
    description: "Search top research analysts by country they cover.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        search_string: {
          type: Type.STRING,
          description: "Country name or ISO code.",
        },
      },
      required: ["search_string"],
    },
  },
  {
    name: "fetch_top_authors_by_theme",
    description:
      "Search top research analysts by topic/sector/theme they cover.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        search_string: {
          type: Type.STRING,
          description:
            "Theme e.g. 'Japan ECM', 'China EVs', 'Singapore REITs', 'AI'.",
        },
      },
      required: ["search_string"],
    },
  },
  {
    name: "fetch_recent_corporate_call_by_company",
    description:
      "Retrieve latest corporate call/presentation audio and report URLs.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        search_string: {
          type: Type.STRING,
          description: "Company name, ticker, or exchange code.",
        },
      },
      required: ["search_string"],
    },
  },
  {
    name: "fetch_next_corporate_call_by_company",
    description: "Retrieve next upcoming corporate call/event date and title.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        search_string: {
          type: Type.STRING,
          description: "Company name, ticker, or exchange code.",
        },
      },
      required: ["search_string"],
    },
  },
  {
    name: "fetch_news_by_topic",
    description:
      "Retrieve recent news headlines for a given topic from Google News.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        topic: {
          type: Type.STRING,
          description:
            "Predefined topic (top, business, stocks, crypto, etc.) or custom query.",
        },
        limit: {
          type: Type.INTEGER,
          description: "Max headlines. Default 5.",
        },
        hours_since: {
          type: Type.INTEGER,
          description: "Headlines from past N hours. Default 24.",
        },
      },
      required: ["topic"],
    },
  },
  {
    name: "fetch_stock_picks_by_country_and_sector",
    description:
      "Find top stock picks based on SmartScores, filtered by country and/or GICS sector.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        country: {
          type: Type.STRING,
          description: "Full country name (optional).",
        },
        sector: {
          type: Type.STRING,
          description: "GICS sector name (optional).",
        },
        limit: {
          type: Type.INTEGER,
          description: "Max results. Default 5.",
        },
      },
    },
  },
  {
    name: "fetch_recent_research_by_country",
    description:
      "Retrieve recent analyst research focused on a specific country.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        search_string: {
          type: Type.STRING,
          description:
            "Full country name e.g. 'United States', 'Japan', 'Singapore'.",
        },
      },
      required: ["search_string"],
    },
  },
  {
    name: "fetch_recent_research_by_sector",
    description:
      "Retrieve recent research focused on a specific GICS sector.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        search_string: {
          type: Type.STRING,
          description:
            "Full GICS sector name e.g. 'Information Technology', 'Financials'.",
        },
      },
      required: ["search_string"],
    },
  },
  {
    name: "fetch_trending_research",
    description:
      "Fetch trending research across Smartkarma. Use for generic questions about what's popular or trending.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
];

async function callMcpTool(
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "tools/call",
      params: { name, arguments: args },
      id: Date.now(),
    }),
  });

  const contentType = res.headers.get("content-type") ?? "";

  if (contentType.includes("text/event-stream")) {
    const text = await res.text();
    const lines = text.split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed.result) return parsed.result;
        } catch {
          /* skip non-JSON lines */
        }
      }
    }
    return { error: "No result in SSE stream" };
  }

  return res.json().then((j: { result?: unknown }) => j.result ?? j);
}

const SYSTEM_PROMPT = `You are Huat AI, a financial research assistant powered by Smartkarma αSK. You talk like a friendly Singapore uncle — natural Singlish with lah, lor, hor, wah, sia, can, one, etc. You're the kopitiam kaki who really knows his stocks.

# Voice & personality
- Speak in casual Singlish like chatting at the kopitiam. Mix English with Singlish particles naturally.
- Use expressions like "wah this one solid sia", "not bad lah", "this one a bit jialat", "can consider lor", "you see ah..."
- Be warm, encouraging, uncle-style. Like you genuinely want to help your friend make money.
- Keep it fun but still informative. You know your stuff one.
- Don't overdo it — still need to be readable. Singlish flavor, not parody.

# Response rules
- Max 250 words. Go straight to the point — no need warm up.
- Use short bullet points, tables for comparisons, bold for key figures.
- Numbers: $1.2B, 15.3x, 3.75%. Use tables not repeated prose.
- For research, give headline + one sentence per insight. Link to source when available.
- Omit SmartScore sub-components unless asked. Show overall score only.

# Comparison format
| | Stock A | Stock B |
|---|---|---|
| Price | … | … |

Then 2-3 bullet key differences.

# Grounding & accuracy
- Only state facts supported by the tool results you received. Don't anyhow say — if no data, just say "eh this one I don't have leh".
- When data is dated, mention the date/period so people know how fresh.
- If question outside what your tools can answer, say so honestly.

# Responsible use
- You are NOT a financial advisor. You're just the uncle who reads a lot.
- Never give buy, sell, or hold recommendations. Present data, let them decide.
- Do NOT repeat a disclaimer in every message. The UI already shows "Not financial advice" permanently. Only mention it if the user explicitly asks for a buy/sell recommendation.
- If someone ask you to confirm buy or guarantee returns, decline — tell them go talk to licensed professional.`;

export async function POST(request: Request) {
  const { messages } = (await request.json()) as {
    messages: { role: "user" | "assistant"; content: string }[];
  };

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  // Build Gemini content history
  const contents: Content[] = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  // Tool-calling loop (max 10 iterations to prevent runaway)
  for (let i = 0; i < 10; i++) {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ functionDeclarations: TOOLS }],
      },
    });

    const functionCalls = response.functionCalls;

    if (!functionCalls || functionCalls.length === 0) {
      // No more tool calls — return the text response
      const text = response.text ?? "";
      return Response.json({ content: text });
    }

    // Add the model's response (with function calls) to history
    const modelParts: Part[] =
      response.candidates?.[0]?.content?.parts ?? [];
    contents.push({ role: "model", parts: modelParts });

    // Execute all function calls in parallel against the MCP server
    const results = await Promise.all(
      functionCalls.map(async (fc) => {
        const result = await callMcpTool(
          fc.name!,
          (fc.args as Record<string, unknown>) ?? {}
        );
        return { name: fc.name!, result };
      })
    );

    // Add function responses to history
    contents.push({
      role: "user",
      parts: results.map((r) => ({
        functionResponse: {
          name: r.name,
          response: { result: r.result },
        },
      })),
    });
  }

  return Response.json({
    content: "I'm still processing your request. Please try again.",
  });
}
