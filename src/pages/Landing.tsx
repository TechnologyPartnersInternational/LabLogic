import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import heroScientist from '@/assets/hero-scientist.jpg';
import {
  FlaskConical, TestTubes, ShieldCheck, FileBarChart,
  Users, Settings2, ArrowRight, Building2,
  ChevronRight,
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

const stats = [
  { value: '12+', label: 'Matrix Types' },
  { value: '30+', label: 'Auto-Calculations' },
  { value: '5', label: 'Workflow Stages' },
  { value: '100%', label: 'Audit Trail' },
];

export default function Landing() {
  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 px-6">
        <div className="absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40" />
        </div>

        <div className="mx-auto max-w-4xl text-center space-y-8">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-4 py-1.5 text-xs font-medium text-muted-foreground">
              <FlaskConical className="h-3.5 w-3.5 text-accent" />
              Built for Modern Laboratories
            </span>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.08]" style={{ textWrap: 'balance' }}>
              The Modern LIMS Your Laboratory Deserves
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed" style={{ textWrap: 'pretty' }}>
              From sample intake to Certificate of Analysis, manage every step of your laboratory workflow with precision, compliance, and speed. Built for environmental, petrochemical, and food &amp; beverage labs.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="h-12 px-8 text-base" asChild>
                <Link to="/register-lab">
                  Get Started Free <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="h-12 px-8 text-base" asChild>
                <Link to="/contact">Book a Demo</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border bg-secondary/30">
        <div className="mx-auto max-w-5xl px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 80}>
              <div className="text-center space-y-1">
                <p className="text-3xl font-bold text-foreground tabular-nums">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 md:py-32 px-6">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="text-center mb-16 space-y-4">
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
                <div className="group relative rounded-xl border border-border bg-card p-7 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10">
                    <f.icon className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 md:py-32 px-6 bg-secondary/20">
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
                  <span className="text-xs font-bold tracking-widest text-accent uppercase">{s.num}</span>
                  {i < steps.length - 1 && (
                    <ChevronRight className="hidden md:block absolute top-0 -right-4 h-5 w-5 text-border" />
                  )}
                  <h3 className="text-lg font-semibold text-foreground">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 md:py-32 px-6">
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

      {/* CTA */}
      <section className="py-24 md:py-32 px-6 bg-primary text-primary-foreground">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Ready to Modernize Your Lab?
            </h2>
            <p className="text-primary-foreground/70 max-w-xl mx-auto leading-relaxed">
              Join labs that have moved beyond spreadsheets. Start free, no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" variant="secondary" className="h-12 px-8 text-base" asChild>
                <Link to="/register-lab">
                  Get Started Free <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/features">Explore Features</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
