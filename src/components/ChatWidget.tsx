import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { MessageCircle, Send, X } from "lucide-react";

import { useI18n } from "@/lib/i18n";

type ChatMessage = { role: "user" | "assistant"; text: string };

const copy = {
  en: {
    open: "Open customer chat",
    close: "Close chat",
    title: "Visit Hijaz help",
    subtitle: "Ask about Visit Hijaz or general questions",
    greeting:
      "Assalamu alaikum! Ask about Makkah and Madinah Ziyarat, transport, and current offers, or ask a general question. I can’t verify live weather, availability, or bookings here.",
    placeholder: "Ask a question…",
    send: "Send message",
    sending: "Thinking…",
    error: "Sorry, chat is temporarily unavailable. Please try again shortly.",
    links: "Booking pages and offers",
    makkah: "Book Makkah",
    madinah: "Book Madinah",
    offers: "View offers",
  },
  ar: {
    open: "افتح محادثة العملاء",
    close: "إغلاق المحادثة",
    title: "مساعدة زيارة الحجاز",
    subtitle: "اسأل عن خدمات زيارة الحجاز أو أسئلة عامة",
    greeting:
      "السلام عليكم! يمكنني المساعدة بشأن رحلات الزيارة في مكة والمدينة والنقل والعروض، أو الإجابة عن أسئلة عامة. لا أستطيع التحقق من الطقس المباشر أو التوفر أو تأكيد الحجوزات هنا.",
    placeholder: "اكتب سؤالك…",
    send: "إرسال الرسالة",
    sending: "جارٍ التفكير…",
    error: "عذرًا، المحادثة غير متاحة مؤقتًا. يُرجى المحاولة بعد قليل.",
    links: "الحجز والعروض",
    makkah: "احجز مكة",
    madinah: "احجز المدينة",
    offers: "عرض العروض",
  },
  ur: {
    open: "کسٹمر چیٹ کھولیں",
    close: "چیٹ بند کریں",
    title: "وزٹ حجاز مدد",
    subtitle: "Visit Hijaz کی خدمات یا عام سوالات پوچھیں",
    greeting:
      "السلام علیکم! میں مکہ اور مدینہ کی زیارت، ٹرانسپورٹ اور آفرز کے بارے میں مدد یا عام سوالات کے جواب دے سکتا ہوں۔ میں موجودہ موسم، دستیابی یا بکنگ کی تصدیق نہیں کر سکتا۔",
    placeholder: "اپنا سوال لکھیں…",
    send: "پیغام بھیجیں",
    sending: "سوچ رہا ہوں…",
    error: "معذرت، چیٹ عارضی طور پر دستیاب نہیں۔ کچھ دیر بعد دوبارہ کوشش کریں۔",
    links: "بکنگ اور آفرز",
    makkah: "مکہ بک کریں",
    madinah: "مدینہ بک کریں",
    offers: "آفرز دیکھیں",
  },
} as const;

export function ChatWidget() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { lang, dir } = useI18n();
  const labels = copy[lang];
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: labels.greeting },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 1) {
      setMessages([{ role: "assistant", text: labels.greeting }]);
    }
  }, [labels.greeting, messages.length]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending, open]);

  if (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/driver" ||
    pathname.startsWith("/driver/")
  ) {
    return null;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const history = messages
      .filter((message) => message.role === "user")
      .slice(-4)
      .map((message) => message.text);
    setInput("");
    setMessages((current) => [...current, { role: "user", text }]);
    setSending(true);

    try {
      const response = await fetch("/api/customer-chat", {
        method: "POST",
        credentials: "omit",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });
      const payload = (await response.json()) as { reply?: unknown };
      if (!response.ok || typeof payload.reply !== "string") {
        throw new Error("Chat request failed");
      }
      setMessages((current) => [...current, { role: "assistant", text: payload.reply as string }]);
    } catch {
      setMessages((current) => [...current, { role: "assistant", text: labels.error }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-4 z-[70] sm:right-6" dir={dir}>
      {open && (
        <section
          role="dialog"
          aria-label={labels.title}
          aria-modal="false"
          className="mb-3 flex h-[min(34rem,calc(100dvh-7rem))] w-80 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl sm:w-96"
        >
          <header className="flex items-start justify-between gap-3 bg-primary px-4 py-3 text-primary-foreground">
            <div>
              <h2 className="text-sm font-semibold">{labels.title}</h2>
              <p className="mt-0.5 text-xs text-primary-foreground/80">{labels.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={labels.close}
              className="rounded-full p-1.5 transition hover:bg-primary-foreground/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4" aria-live="polite">
            {messages.map((message, index) => (
              <div
                key={`${index}-${message.role}`}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <p
                  className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-muted text-foreground"
                  }`}
                >
                  {message.text}
                </p>
              </div>
            ))}
            {sending && (
              <p
                className="w-fit rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground"
                role="status"
              >
                {labels.sending}
              </p>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-border px-3 py-2">
            <p className="mb-2 text-[11px] font-medium text-muted-foreground">{labels.links}</p>
            <div className="flex flex-wrap gap-1.5">
              <Link
                to="/ziyarat/makkah"
                className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
              >
                {labels.makkah}
              </Link>
              <Link
                to="/ziyarat/madinah"
                className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
              >
                {labels.madinah}
              </Link>
              <Link
                to="/offers"
                className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
              >
                {labels.offers}
              </Link>
            </div>
          </div>

          <form onSubmit={submit} className="flex items-center gap-2 border-t border-border p-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={600}
              placeholder={labels.placeholder}
              aria-label={labels.placeholder}
              autoComplete="off"
              className="min-w-0 flex-1 rounded-full border border-input bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label={labels.send}
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="size-4" aria-hidden="true" />
            </button>
          </form>
        </section>
      )}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? labels.close : labels.open}
        aria-expanded={open}
        className="ml-auto flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {open ? (
          <X className="size-5" aria-hidden="true" />
        ) : (
          <MessageCircle className="size-5" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
