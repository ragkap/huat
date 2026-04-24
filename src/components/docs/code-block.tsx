"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="docs-code relative group rounded my-3">
      {lang && (
        <div className="docs-code-lang absolute top-2 left-3 text-[10px] font-mono uppercase tracking-wider">
          {lang}
        </div>
      )}
      <button
        onClick={handleCopy}
        className="docs-code-copy absolute top-2 right-2 flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Copy code"
      >
        {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /></>}
      </button>
      <pre className="overflow-x-auto p-4 pt-7 text-xs leading-relaxed font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}
