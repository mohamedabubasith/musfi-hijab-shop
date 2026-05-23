import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/authStore";

interface Message { role: "user" | "assistant"; content: string }

const BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

// ── Inline markdown renderer ──────────────────────────────────────────────────

function parseInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[2]) parts.push(<strong key={match.index} className="font-semibold text-foreground">{match[2]}</strong>);
    else if (match[3]) parts.push(<em key={match.index} className="italic">{match[3]}</em>);
    else if (match[4]) parts.push(<code key={match.index} className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs font-mono">{match[4]}</code>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

const NUMBERED_RE = /^(\d+)\.\s+(.+)/;

function preprocessMarkdown(raw: string): string {
  return raw
    // strip ** immediately before a numbered item: "**1. " → "1. "
    .replace(/\*\*(\d+\.\s)/g, "$1")
    // strip trailing ** at end of a numbered item line: "1. text**" → "1. text"
    .replace(/^(\d+\.\s+.+?)\*{1,2}\s*$/gm, "$1")
    // newline before inline numbered items: " 2. Text" → "\n2. Text"
    .replace(/([^\n]) (\d+)\. /g, "$1\n$2. ")
    // newline before inline bullet items: " – Text" or " - Text" mid-sentence
    .replace(/([^\n]) [-–] ([A-Z\*])/g, "$1\n- $2")
    // collapse 3+ newlines to 2
    .replace(/\n{3,}/g, "\n\n");
}

function MarkdownMessage({ content }: { content: string }) {
  const lines = preprocessMarkdown(content).split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // H2 heading
    if (line.startsWith("## ")) {
      elements.push(
        <div key={i} className="mt-4 mb-2 first:mt-0">
          <h2 className="text-sm font-bold text-primary">{parseInline(line.slice(3))}</h2>
          <div className="mt-1 h-px bg-primary/20" />
        </div>
      );

    // H3 heading
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-sm font-semibold text-foreground mt-3 mb-1">
          {parseInline(line.slice(4))}
        </h3>
      );

    // Horizontal rule
    } else if (trimmed === "---" || trimmed === "***") {
      elements.push(<div key={i} className="my-3 h-px bg-border" />);

    // Unordered list — collect consecutive items
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(
          <li key={i} className="flex gap-2.5 items-start">
            <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
            <span className="leading-relaxed">{parseInline(lines[i].slice(2))}</span>
          </li>
        );
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="space-y-1.5 my-2 pl-0.5">{items}</ul>
      );
      continue;

    // Numbered list — collect consecutive items
    } else if (NUMBERED_RE.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length) {
        const m = NUMBERED_RE.exec(lines[i]);
        if (!m) break;
        items.push(
          <li key={i} className="flex gap-2.5 items-start">
            <span className="mt-0.5 min-w-[20px] text-xs font-bold text-primary/70 shrink-0">{m[1]}.</span>
            <span className="leading-relaxed">{parseInline(m[2])}</span>
          </li>
        );
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="space-y-1.5 my-2 pl-0.5">{items}</ol>
      );
      continue;

    // Empty line → section gap
    } else if (trimmed === "") {
      if (elements.length > 0) elements.push(<div key={`sp-${i}`} className="h-2" />);

    // Regular paragraph
    } else {
      elements.push(
        <p key={i} className="leading-relaxed text-foreground">
          {parseInline(line)}
        </p>
      );
    }
    i++;
  }

  return <div className="space-y-0.5 text-sm">{elements}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────

export default function AiAdvisorPage() {
  const { t, i18n } = useTranslation();
  const token = useAuthStore((s) => s.accessToken);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const chips = [
    t("ai.chips.low_stock"),
    t("ai.chips.best_seller"),
    t("ai.chips.monthly_profit"),
    t("ai.chips.growth_tips"),
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || streaming) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setStreaming(true);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      const res = await fetch(`${BASE_URL}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message: text,
          language: i18n.language,
          history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const chunk = line.slice(6);
            if (chunk === "[DONE]") break;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: "assistant",
                content: updated[updated.length - 1].content + chunk,
              };
              return updated;
            });
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: t("errors.generic") };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  };

  return (
    <PageWrapper title={t("ai.title")}>
      <div className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl mx-auto">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full gap-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <h2 className="text-lg font-semibold text-foreground">{t("ai.title")}</h2>
                <p className="text-sm text-muted-foreground mt-1">{t("ai.empty_subtitle")}</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {chips.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => sendMessage(chip)}
                    className="px-3 py-1.5 bg-card border border-border rounded-full text-sm text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.role === "assistant" ? "bg-primary/10" : "bg-muted"}`}>
                  {msg.role === "assistant"
                    ? <Bot className="w-4 h-4 text-primary" />
                    : <User className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm text-sm"
                    : "bg-card border border-border text-foreground rounded-tl-sm shadow-sm"
                }`}>
                  {msg.role === "user"
                    ? <p className="text-sm">{msg.content}</p>
                    : msg.content
                      ? <MarkdownMessage content={msg.content} />
                      : streaming && i === messages.length - 1
                        ? <span className="text-sm animate-pulse text-muted-foreground">▋</span>
                        : null}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Chips when messages exist */}
        {messages.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {chips.map((chip) => (
              <button
                key={chip}
                onClick={() => sendMessage(chip)}
                disabled={streaming}
                className="px-2.5 py-1 bg-card border border-border rounded-full text-xs text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <Input
            placeholder={t("ai.placeholder")}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
            disabled={streaming}
            className="flex-1"
          />
          <Button onClick={() => sendMessage(input)} disabled={streaming || !input.trim()} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
}
