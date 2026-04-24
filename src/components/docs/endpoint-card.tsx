const METHOD_COLOR: Record<string, string> = {
  GET: "text-[#22C55E] border-[#22C55E]/30 bg-[#22C55E]/5",
  POST: "text-[#3B82F6] border-[#3B82F6]/30 bg-[#3B82F6]/5",
  PATCH: "text-[#F59E0B] border-[#F59E0B]/30 bg-[#F59E0B]/5",
  DELETE: "text-[#EF4444] border-[#EF4444]/30 bg-[#EF4444]/5",
};

export function EndpointCard({
  id,
  method,
  path,
  title,
  description,
  children,
}: {
  id: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-10 scroll-mt-20">
      <div className="flex items-center gap-3 flex-wrap mb-2">
        <span className={`px-2 py-0.5 border rounded text-[10px] font-bold font-mono uppercase tracking-wider ${METHOD_COLOR[method]}`}>
          {method}
        </span>
        <code className="font-mono text-sm text-[#F0F0F0]">{path}</code>
      </div>
      <h3 className="text-xl font-bold text-[#F0F0F0] mb-1">{title}</h3>
      {description && <p className="text-sm text-[#9CA3AF] leading-relaxed">{description}</p>}
      {children}
    </section>
  );
}
