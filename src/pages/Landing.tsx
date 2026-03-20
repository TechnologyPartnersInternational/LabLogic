import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import heroScientist from '@/assets/hero-scientist.jpg';
import {
  FlaskConical, TestTubes, ShieldCheck, FileBarChart,
  Users, Settings2, ArrowRight, Building2,
  ChevronRight, CheckCircle2, Beaker, BarChart3,
  Sparkles, Play, Zap,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

/* ── scroll-reveal ── */
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
  return <div ref={ref} className={cn('reveal-section', className)} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}

/* ── data ── */
const features = [
  { icon: TestTubes, title: 'Sample Tracking', desc: 'Full chain of custody from receipt through analysis to final reporting.' },
  { icon: Settings2, title: 'Auto-Calculations', desc: 'Real-time computed parameters: hardness, SAR, nitrogen balance, and more.' },
  { icon: ShieldCheck, title: 'QA Validation', desc: 'Scientific validation rules catch errors before results leave the lab.' },
  { icon: FileBarChart, title: 'COA Generation', desc: 'One-click Certificates of Analysis exported to Excel, ready for clients.' },
  { icon: Users, title: 'Role-Based Access', desc: 'Analysts, supervisors, QA officers: each sees exactly what they need.' },
  { icon: Building2, title: 'Multi-Industry', desc: 'Environmental, petrochemical, food & beverage: pre-configured for your industry.' },
];

const steps = [
  { num: '01', title: 'Register Your Lab', desc: 'Create your organization, pick your industry suite, and invite your team.' },
  { num: '02', title: 'Configure Your Tests', desc: 'Set up parameters, methods, matrices, and validation rules.' },
  { num: '03', title: 'Log Samples', desc: 'Register client projects, generate sample IDs, and assign tests.' },
  { num: '04', title: 'Report Results', desc: 'Enter results, run QA validation, and generate Certificates of Analysis.' },
];

const industries = [
  { icon: Beaker, title: 'Environmental', desc: 'Water, soil, air quality testing with regulatory compliance built in.', items: ['Wet Chemistry', 'Instrumentation', 'Microbiology'] },
  { icon: BarChart3, title: 'Petrochemical', desc: 'Fuel testing, lubricant analysis, and refinery quality control.', items: ['Fuel Testing', 'Lubricant Analysis', 'Quality Control'] },
  { icon: FlaskConical, title: 'Food & Beverage', desc: 'Nutritional analysis, contaminant testing, and safety compliance.', items: ['Nutritional Analysis', 'Contaminant Testing', 'Shelf Life Studies'] },
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

      {/* ════════════════════════════════════════════════════
          HERO — Dark immersive with image
      ════════════════════════════════════════════════════ */}
      <section className="relative min-h-[92vh] flex items-center px-6 bg-[hsl(222,46%,8%)] overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-[-20%] left-[10%] w-[700px] h-[700px] bg-[hsl(var(--accent))] opacity-[0.06] rounded-full blur-[160px]" />
        <div className="absolute bottom-[-10%] right-[5%] w-[500px] h-[500px] bg-[hsl(260,50%,50%)] opacity-[0.04] rounded-full blur-[140px]" />

        <div className="relative z-10 mx-auto max-w-7xl w-full grid lg:grid-cols-[1.1fr_0.9fr] gap-16 lg:gap-20 items-center py-32 lg:py-0">
          {/* Text */}
          <div className="space-y-8">

            <Reveal delay={100}>
              <h1 className="text-[2.75rem] sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-extrabold tracking-[-0.025em] text-white leading-[1.05]" style={{ textWrap: 'balance' }}>
                The Modern LIMS
                <br />
                <span className="text-[hsl(var(--accent))]">Your Lab Deserves</span>
              </h1>
            </Reveal>

            <Reveal delay={180}>
              <p className="max-w-lg text-base sm:text-lg text-white/50 leading-relaxed" style={{ textWrap: 'pretty' }}>
                From sample intake to Certificate of Analysis, manage every step of your laboratory workflow with precision, compliance, and speed.
              </p>
            </Reveal>

            <Reveal delay={260}>
              <div className="flex flex-col sm:flex-row items-start gap-4 pt-2">
                <Button size="lg" className="h-13 px-9 text-base font-semibold bg-[hsl(var(--accent))] hover:bg-[hsl(175,60%,35%)] text-white shadow-lg shadow-[hsl(var(--accent))]/20 transition-all duration-300 active:scale-[0.97]" asChild>
                  <Link to="/register-lab">
                    Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="lg" className="h-13 px-6 text-base text-white/60 hover:text-white hover:bg-white/[0.06] gap-2 transition-all duration-300 active:scale-[0.97]" asChild>
                  <Link to="/contact">
                    <Play className="h-4 w-4 fill-current" /> Book a Demo
                  </Link>
                </Button>
              </div>
            </Reveal>

            {/* Trust line */}
            <Reveal delay={340}>
              <div className="flex items-center gap-3 pt-4 text-xs text-white/30">
                <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--accent))]/60" />
                No credit card required
                <span className="w-px h-3 bg-white/10" />
                <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--accent))]/60" />
                Setup in under 5 minutes
                <span className="w-px h-3 bg-white/10 hidden sm:block" />
                <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--accent))]/60 hidden sm:block" />
                <span className="hidden sm:inline">Full audit trail</span>
              </div>
            </Reveal>
          </div>

          {/* Image */}
          <Reveal delay={200}>
            <div className="relative hidden lg:block">
              <div className="rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl shadow-black/40">
                <img
                  src={heroScientist}
                  alt="Lab scientist smiling in a modern laboratory"
                  className="w-full h-auto object-cover aspect-[3/4]"
                  loading="eager"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          STATS — Teal accent bar
      ════════════════════════════════════════════════════ */}
      <section className="bg-[hsl(var(--accent))]">
        <div className="mx-auto max-w-6xl px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 60}>
              <div className="text-center space-y-0.5">
                <p className="text-2xl sm:text-3xl font-bold text-white tabular-nums">{s.value}</p>
                <p className="text-xs sm:text-sm text-white/70 font-medium">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          FEATURES — Light with subtle warm tint
      ════════════════════════════════════════════════════ */}
      <section className="py-28 md:py-36 px-6 bg-[hsl(220,20%,97%)]">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="text-center mb-20 space-y-4">
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-[hsl(var(--accent))]">Core Capabilities</p>
              <h2 className="text-3xl md:text-[2.75rem] font-bold text-foreground tracking-tight leading-tight">
                Everything Your Lab Needs,
                <br className="hidden sm:block" />
                Nothing It Doesn't
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto text-base" style={{ textWrap: 'pretty' }}>
                Purpose-built tools that replace spreadsheets, paper logs, and disjointed systems.
              </p>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 70}>
                <div className="group relative h-full flex flex-col rounded-2xl bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06),0_16px_40px_rgba(0,0,0,0.1)] transition-all duration-500 active:scale-[0.98] border-0 hover:-translate-y-1">
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--accent))]/10 group-hover:bg-[hsl(var(--accent))] transition-colors duration-300">
                    <f.icon className="h-5 w-5 text-[hsl(var(--accent))] group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          INDUSTRY SUITES — Dark section
      ════════════════════════════════════════════════════ */}
      <section className="py-28 md:py-36 px-6 bg-[hsl(222,46%,8%)] text-white relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[1px] bg-gradient-to-r from-transparent via-[hsl(var(--accent))]/30 to-transparent" />
        
        <div className="mx-auto max-w-6xl relative z-10">
          <Reveal>
            <div className="text-center mb-20 space-y-4">
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-[hsl(var(--accent))]">Industry-Ready</p>
              <h2 className="text-3xl md:text-[2.75rem] font-bold tracking-tight leading-tight">
                Tailored for Your Industry
              </h2>
              <p className="text-white/45 max-w-lg mx-auto text-base">
                Pre-configured suites with the right parameters, methods, and workflows for your laboratory type.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {industries.map((ind, i) => (
              <Reveal key={ind.title} delay={i * 100}>
                <div className="group rounded-2xl border border-white/[0.07] bg-white/[0.03] p-8 space-y-5 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-400">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--accent))]/10 group-hover:bg-[hsl(var(--accent))]/20 transition-colors duration-300">
                    <ind.icon className="h-5 w-5 text-[hsl(var(--accent))]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1.5">{ind.title}</h3>
                    <p className="text-sm text-white/40 leading-relaxed">{ind.desc}</p>
                  </div>
                  <ul className="space-y-2.5 pt-2 border-t border-white/[0.06]">
                    {ind.items.map((item) => (
                      <li key={item} className="flex items-center gap-2.5 text-sm text-white/60">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--accent))] shrink-0" />
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

      {/* ════════════════════════════════════════════════════
          HOW IT WORKS — Light
      ════════════════════════════════════════════════════ */}
      <section className="py-28 md:py-36 px-6 bg-white">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="text-center mb-20 space-y-4">
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-[hsl(var(--accent))]">Simple Workflow</p>
              <h2 className="text-3xl md:text-[2.75rem] font-bold text-foreground tracking-tight leading-tight">
                Four Steps to Your First Report
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto text-base">
                Go from zero to issuing Certificates of Analysis in four clear steps.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-4 gap-10 md:gap-6">
            {steps.map((s, i) => (
              <Reveal key={s.num} delay={i * 100}>
                <div className="relative text-center space-y-4">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--accent))] text-white text-sm font-bold shadow-lg shadow-[hsl(var(--accent))]/20">
                    {s.num}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-7 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-px bg-border" />
                  )}
                  <h3 className="text-base font-semibold text-foreground">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          TESTIMONIALS — Subtle tinted background
      ════════════════════════════════════════════════════ */}
      <section className="py-28 md:py-36 px-6 bg-[hsl(220,20%,97%)]">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <div className="text-center mb-16 space-y-4">
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-[hsl(var(--accent))]">Testimonials</p>
              <h2 className="text-3xl md:text-[2.75rem] font-bold text-foreground tracking-tight">
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
                <div className="rounded-2xl border border-border/60 bg-white p-9 shadow-sm space-y-6">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, j) => (
                      <svg key={j} className="h-4 w-4 text-[hsl(var(--warning))]" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-foreground text-[15px] leading-relaxed">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[hsl(var(--accent))]/10 flex items-center justify-center text-sm font-bold text-[hsl(var(--accent))]">
                      {t.name.charAt(0)}{t.name.split(' ').pop()?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          CTA — Dark premium
      ════════════════════════════════════════════════════ */}
      <section className="relative py-28 md:py-36 px-6 bg-[hsl(222,46%,8%)] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:5rem_5rem]" />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[hsl(var(--accent))] opacity-[0.06] rounded-full blur-[150px]" />

        <Reveal>
          <div className="relative z-10 mx-auto max-w-2xl text-center space-y-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--accent))]/10 mx-auto mb-2">
              <Zap className="h-6 w-6 text-[hsl(var(--accent))]" />
            </div>
            <h2 className="text-3xl md:text-[2.75rem] font-bold tracking-tight leading-tight">
              Ready to Modernize
              <br />
              Your Laboratory?
            </h2>
            <p className="text-white/40 max-w-md mx-auto leading-relaxed text-base">
              Join labs that have moved beyond spreadsheets. Start free, no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Button size="lg" className="h-13 px-9 text-base font-semibold bg-[hsl(var(--accent))] hover:bg-[hsl(175,60%,35%)] text-white shadow-lg shadow-[hsl(var(--accent))]/20 transition-all duration-300 active:scale-[0.97]" asChild>
                <Link to="/register-lab">
                  Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="ghost" className="h-13 px-8 text-base text-white/50 hover:text-white hover:bg-white/[0.06] transition-all duration-300" asChild>
                <Link to="/features">Explore Features</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
