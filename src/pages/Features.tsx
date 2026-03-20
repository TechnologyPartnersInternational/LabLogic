import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  TestTubes, Calculator, ShieldCheck, FileBarChart,
  Users, Layers, Database, ArrowRight,
  ClipboardList, BarChart3,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

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
    <div ref={ref} className={cn('reveal-section', className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

const sections = [
  {
    icon: TestTubes,
    title: 'Sample Management',
    desc: 'Track every sample from receipt to disposal with full chain-of-custody documentation.',
    bullets: [
      'Auto-generated sample IDs with configurable formats',
      'Support for 12+ environmental matrices',
      'Batch sample registration with test-package assignment',
      'Real-time status tracking across departments',
    ],
  },
  {
    icon: Calculator,
    title: 'Automated Calculations',
    desc: 'Let the system compute derived parameters in real-time as analysts enter raw results.',
    bullets: [
      'Total Hardness, SAR, Langelier Index, and more',
      'Nitrogen & solids balance checks',
      'Ionic balance (cation-anion) validation',
      'Configurable conversion factors per organization',
    ],
  },
  {
    icon: ClipboardList,
    title: 'Results Entry',
    desc: 'A purpose-built grid for fast, accurate data entry with inline validation feedback.',
    bullets: [
      'Department-grouped parameter grids',
      'MDL / LOQ enforcement and below-MDL reporting',
      'Bulk upload from instruments via CSV',
      'Revision tracking with full audit trail',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Review & QA Validation',
    desc: 'Multi-tier review workflow ensures nothing leaves the lab without proper sign-off.',
    bullets: [
      'Supervisor review with approve / reject / revise actions',
      'QA officer final approval layer',
      'Scientific validation rules (range, spike recovery, duplicates)',
      'Override with documented justification',
    ],
  },
  {
    icon: FileBarChart,
    title: 'Reporting & COA',
    desc: 'Generate client-ready Certificates of Analysis with one click.',
    bullets: [
      'Branded Excel COA export',
      'Method references and regulatory program tags',
      'Below-MDL result formatting per parameter',
      'Project release workflow with audit stamp',
    ],
  },
  {
    icon: Users,
    title: 'Role-Based Access Control',
    desc: 'Fine-grained permissions keep data secure and workflows clean.',
    bullets: [
      'Six lab-specific roles (Analyst, Supervisor, QA Officer, Admin...)',
      'Department-level access restrictions',
      'Invitation-based onboarding with pre-assigned roles',
      'Full audit log of every action',
    ],
  },
  {
    icon: Layers,
    title: 'Multi-Department Workflows',
    desc: 'Organize work by department: wet chemistry, instrumentation, microbiology, each with its own parameter catalog.',
    bullets: [
      'Custom analyte groups per department',
      'Department-specific result queues',
      'Cross-department project tracking',
      'Configurable department templates',
    ],
  },
  {
    icon: Database,
    title: 'Configuration & Flexibility',
    desc: 'Every lab is different. Configure parameters, methods, matrices, and validation rules to match your SOPs.',
    bullets: [
      'Parameter library with MDL, LOQ, unit, and method links',
      'Method library tied to regulatory standards',
      'Matrix-specific parameter configurations',
      'Calculation and validation rule toggle per org',
    ],
  },
];

export default function Features() {
  return (
    <div className="overflow-x-hidden">
      {/* Hero */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-28 px-6 text-center">
        <Reveal>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.1]" style={{ textWrap: 'balance' }}>
            Features Built for Real Labs
          </h1>
        </Reveal>
        <Reveal delay={80}>
          <p className="mt-5 mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Every feature in LabLogic is designed around real laboratory workflows: environmental, petrochemical, and food &amp; beverage. Not bolted on as an afterthought.
          </p>
        </Reveal>
      </section>

      {/* Feature sections */}
      <section className="pb-24 md:pb-32 px-6 space-y-20 md:space-y-28">
        {sections.map((s, i) => {
          const isEven = i % 2 === 0;
          return (
            <Reveal key={s.title} delay={60}>
              <div className={cn(
                'mx-auto max-w-5xl flex flex-col md:flex-row items-start gap-10 md:gap-16',
                !isEven && 'md:flex-row-reverse'
              )}>
                {/* Icon side */}
                <div className="flex-shrink-0">
                  <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center">
                    <s.icon className="h-8 w-8 text-accent" />
                  </div>
                </div>

                {/* Text side */}
                <div className="space-y-4 flex-1">
                  <h2 className="text-2xl font-bold text-foreground tracking-tight">{s.title}</h2>
                  <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
                  <ul className="space-y-2.5 pt-2">
                    {s.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <BarChart3 className="h-4 w-4 mt-0.5 text-accent flex-shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          );
        })}
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28 px-6 bg-primary text-primary-foreground">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">See It in Action</h2>
            <p className="text-primary-foreground/70 max-w-lg mx-auto">
              Book a personalised demo and we'll walk you through your exact workflow.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" variant="secondary" className="h-12 px-8 text-base" asChild>
                <Link to="/contact">Book a Demo <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/register-lab">Start Free Trial</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
