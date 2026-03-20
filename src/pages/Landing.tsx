import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import heroScientist from '@/assets/hero-scientist.jpg';
import {
  FlaskConical, TestTubes, ShieldCheck, FileBarChart,
  Users, Settings2, ArrowRight, Building2,
  ChevronRight, CheckCircle2, Beaker, BarChart3,
  Sparkles, Globe,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

/* scroll-reveal hook */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('revealed'); io.unobserve(el); } },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useReveal();
  return (
    <div
      ref={ref}
      className={cn('reveal-section', className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* data */
const features = [
  { icon: TestTubes, title: 'Sample Tracking', desc: 'Full chain of custody from receipt through analysis to final reporting.' },
  { icon: Settings2, title: 'Auto-Calculations', desc: 'Real-time computed parameters: hardness, SAR, nitrogen balance, and more.' },
  { icon: ShieldCheck, title: 'QA Validation Engine', desc: 'Scientific validation rules catch errors before results leave the lab.' },
  { icon: FileBarChart, title: 'COA Generation', desc: 'One-click Certificates of Analysis exported to Excel, ready for clients.' },
  { icon: Users, title: 'Role-Based Access', desc: 'Analysts, supervisors, QA officers: each sees exactly what they need.' },
  { icon: Building2, title: 'Multi-Industry Suites', desc: 'Environmental, petrochemical, and food & beverage: pre-configured for your industry.' },
];

const steps = [
  { num: '01', title: 'Register Your Lab', desc: 'Create your organization, pick your industry suite, and invite your team.' },
  { num: '02', title: 'Configure Your Tests', desc: 'Set up parameters, methods, matrices, and validation rules.' },
  { num: '03', title: 'Create Projects & Log Samples', desc: 'Register client projects, generate sample IDs, and assign tests.' },
  { num: '04', title: 'Review, Approve & Report', desc: 'Enter results, run QA validation, and generate Certificates of Analysis.' },
];

const industries = [
  { icon: Beaker, title: 'Environmental', items: ['Wet Chemistry', 'Instrumentation', 'Microbiology'] },
  { icon: BarChart3, title: 'Petrochemical', items: ['Fuel Testing', 'Lubricant Analysis', 'Quality Control'] },
  { icon: FlaskConical, title: 'Food & Beverage', items: ['Nutritional Analysis', 'Contaminant Testing', 'Shelf Life Studies'] },
];

const stats = [
  { value: '12+', label: 'Matrix Types' },
  { value: '30+', label: 'Auto-Calculations' },
  { value: '5', label: 'Workflow Stages' },
  { value: '100%', label: 'Audit Trail' },
];

export default function Landing() {
  return (
    <div className="overflow-x-hidden">
      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 px-6 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 -z-0 opacity-[0.04]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        </div>
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[hsl(var(--accent))] opacity-[0.07] rounded-full blur-[120px] -z-0" />

        <div className="relative z-10 mx-auto max-w-6xl grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Text side */}
          <div className="space-y-7">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--accent))]" />
                Built for Modern Laboratories
              </span>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="text-4xl sm:text-5xl md:text-[3.25rem] lg:text-5xl font-bold tracking-tight leading-[1.08]" style={{ textWrap: 'balance' }}>
                The Modern LIMS Your Laboratory Deserves
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="max-w-lg text-lg text-white/70 leading-relaxed" style={{ textWrap: 'pretty' }}>
                From sample intake to Certificate of Analysis, manage every step of your laboratory workflow with precision, compliance, and speed. Built for environmental, petrochemical, and food & beverage labs.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <Button size="lg" className="h-12 px-8 text-base bg-[hsl(var(--accent))] hover:bg-[hsl(175_60%_35%)] text-white" asChild>
                  <Link to="/register-lab">
                    Get Started Free <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="h-12 px-8 text-base border-white/20 text-white hover:bg-white/10" asChild>
                  <Link to="/contact">Book a Demo</Link>
                </Button>
              </div>
            </Reveal>
          </div>

          {/* Image side */}
          <Reveal delay={200}>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                <img
                  src={heroScientist}
                  alt="Lab scientist smiling in a modern laboratory"
                  className="w-full h-auto object-cover aspect-[4/5] md:aspect-[3/4]"
                  loading="eager"
                />
              </div>
              <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-2xl bg-[hsl(var(--accent))]/20 -z-10" />
              <div className="absolute -top-4 -right-4 h-16 w-16 rounded-xl bg-white/5 -z-10" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════ STATS BAR ═══════════════════ */}
      <section className="bg-[hsl(var(--accent))] text-white">
        <div className="mx-auto max-w-5xl px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 80}>
              <div className="text-center space-y-1">
                <p className="text-3xl font-bold tabular-nums">{s.value}</p>
                <p className="text-sm text-white/70">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════════ FEATURES ═══════════════════ */}
      <section className="py-24 md:py-32 px-6 bg-background">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="text-center mb-16 space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-4 py-1.5 text-xs font-medium text-muted-foreground">
                <Globe className="h-3.5 w-3.5 text-[hsl(var(--accent))]" />
                Core Capabilities
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                Everything Your Lab Needs
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto" style={{ textWrap: 'pretty' }}>
                Purpose-built tools that replace spreadsheets, paper logs, and disjointed systems.
              </p>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 70}>
                <div className="group relative rounded-xl border border-border bg-card p-7 shadow-sm hover:shadow-lg hover:border-[hsl(var(--accent))]/30 transition-all duration-300">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[hsl(var(--accent))]/10">
                    <f.icon className="h-5 w-5 text-[hsl(var(--accent))]" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ INDUSTRY SUITES ═══════════════════ */}
      <section className="py-24 md:py-32 px-6 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="text-center mb-16 space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-medium text-white/80">
                <Building2 className="h-3.5 w-3.5 text-[hsl(var(--accent))]" />
                Industry-Ready
              </span>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Tailored for Your Industry
              </h2>
              <p className="text-white/60 max-w-lg mx-auto">
                Pre-configured suites with the right parameters, methods, and workflows for your laboratory type.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {industries.map((ind, i) => (
              <Reveal key={ind.title} delay={i * 100}>
                <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-7 space-y-5 hover:bg-white/[0.08] transition-colors duration-300">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-[hsl(var(--accent))]/15">
                    <ind.icon className="h-5 w-5 text-[hsl(var(--accent))]" />
                  </div>
                  <h3 className="text-lg font-semibold">{ind.title}</h3>
                  <ul className="space-y-2">
                    {ind.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-white/70">
                        <CheckCircle2 className="h-4 w-4 text-[hsl(var(--accent))] shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ HOW IT WORKS ═══════════════════ */}
      <section className="py-24 md:py-32 px-6 bg-background">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                How It Works
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                Go from zero to issuing Certificates of Analysis in four clear steps.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-4 gap-8 md:gap-4">
            {steps.map((s, i) => (
              <Reveal key={s.num} delay={i * 100}>
                <div className="relative text-center md:text-left space-y-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--accent))] text-white text-sm font-bold">
                    {s.num}
                  </span>
                  {i < steps.length - 1 && (
                    <ChevronRight className="hidden md:block absolute top-2 -right-4 h-5 w-5 text-border" />
                  )}
                  <h3 className="text-lg font-semibold text-foreground">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ TESTIMONIALS ═══════════════════ */}
      <section className="py-24 md:py-32 px-6 bg-secondary/40">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="text-center mb-14 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                Trusted by Lab Professionals
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              { quote: 'LabLogic cut our reporting turnaround in half. The auto-calculation engine alone saves hours every week.', name: 'Dr. Amara Okafor', role: 'Lab Director, Greenfield Environmental' },
              { quote: 'Finally, a LIMS that understands real laboratory workflows, not just generic lab management.', name: 'James Mensah', role: 'QA Manager, AquaTest Labs' },
            ].map((t, i) => (
              <Reveal key={i} delay={i * 120}>
                <div className="rounded-xl border border-border bg-card p-8 shadow-sm space-y-5">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, j) => (
                      <svg key={j} className="h-4 w-4 text-[hsl(var(--warning))]" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-foreground leading-relaxed italic">"{t.quote}"</p>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ CTA ═══════════════════ */}
      <section className="py-24 md:py-32 px-6 bg-[hsl(var(--accent))] text-white">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Ready to Modernize Your Lab?
            </h2>
            <p className="text-white/70 max-w-xl mx-auto leading-relaxed">
              Join labs that have moved beyond spreadsheets. Start free, no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="h-12 px-8 text-base bg-white text-[hsl(var(--primary))] hover:bg-white/90 font-semibold" asChild>
                <Link to="/register-lab">
                  Get Started Free <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base border-white/30 text-white hover:bg-white/10" asChild>
                <Link to="/features">Explore Features</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
