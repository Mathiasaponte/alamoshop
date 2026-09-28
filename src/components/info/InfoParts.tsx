import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/** Discreet scroll reveal: fades up once when entering the viewport. */
export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setInView(true), io.disconnect()), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, inView };
}

export function InfoHero({ eyebrow, title, subtitle, note }: { eyebrow?: string; title: string; subtitle?: string; note?: string }) {
  return (
    <section className="mx-auto max-w-3xl px-5 pb-10 pt-14 md:px-6 md:pt-20">
      <Reveal>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-3 text-4xl leading-[1.05] text-primary md:text-6xl">{title}</h1>
        {subtitle && <p className="mt-5 max-w-xl text-lg leading-relaxed">{subtitle}</p>}
        {note && <p className="mt-4 text-sm text-muted-foreground">{note}</p>}
        <div className="rule-gold mt-10 h-px w-24" />
      </Reveal>
    </section>
  );
}

export function Section({ eyebrow, title, children, tone = "plain" }: { eyebrow?: string; title?: string; children: ReactNode; tone?: "plain" | "soft" }) {
  return (
    <section className={tone === "soft" ? "bg-secondary" : "bg-background"}>
      <div className="mx-auto max-w-3xl px-5 py-14 md:px-6 md:py-20">
        <Reveal>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          {title && <h2 className="mt-2 text-3xl leading-tight text-primary md:text-4xl">{title}</h2>}
          <div className={title ? "mt-6" : ""}>{children}</div>
        </Reveal>
      </div>
    </section>
  );
}

export function Accordion({ title, children, id, defaultOpen }: { title: string; children: ReactNode; id?: string; defaultOpen?: boolean }) {
  return (
    <details id={id} open={defaultOpen} className="group border-b border-border py-1 scroll-mt-24">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-base font-medium text-foreground [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="pb-5 text-sm leading-relaxed text-muted-foreground [&_li]:mt-1.5 [&_ul]:list-disc [&_ul]:pl-5">{children}</div>
    </details>
  );
}

export type Split = { label: string; amount: number; tone: "gold" | "primary" | "muted" };

const TONE: Record<Split["tone"], string> = {
  gold: "bg-gold",
  primary: "bg-primary",
  muted: "bg-foreground/60",
};

/** Animated divided bar showing how an amount is split. */
export function SplitBar({ total, parts }: { total: number; parts: Split[] }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div ref={ref}>
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-border">
        {parts.map((p, i) => (
          <div
            key={p.label}
            className={`${TONE[p.tone]} h-full transition-all duration-1000 ease-out`}
            style={{ width: inView ? `${(p.amount / total) * 100}%` : "0%", transitionDelay: `${i * 200}ms` }}
          />
        ))}
      </div>
      <div className={`mt-6 grid gap-6 ${parts.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {parts.map((p) => (
          <div key={p.label}>
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${TONE[p.tone]}`} />
              <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{Math.round((p.amount / total) * 100)}%</span>
            </div>
            <p className="mt-1 font-display text-3xl font-semibold text-primary md:text-4xl">
              ${p.amount.toLocaleString("es-MX", { minimumFractionDigits: p.amount % 1 ? 2 : 0 })}
            </p>
            <p className="text-sm">{p.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Toc({ items }: { items: { id: string; label: string }[] }) {
  return (
    <nav className="flex flex-wrap gap-2">
      {items.map((i, n) => (
        <a key={i.id} href={`#${i.id}`} className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary">
          {n + 1}. {i.label}
        </a>
      ))}
    </nav>
  );
}
