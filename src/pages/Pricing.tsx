import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'forever',
    desc: 'Perfect for small labs getting started.',
    features: [
      'Up to 3 users',
      '1 department',
      '100 samples / month',
      'Basic COA export',
      'Community support',
    ],
    cta: 'Get Started',
    to: '/register-lab',
    highlight: false,
  },
  {
    name: 'Professional',
    price: '$149',
    period: '/ month',
    desc: 'For growing labs that need full capabilities.',
    features: [
      'Up to 15 users',
      'Unlimited departments',
      'Unlimited samples',
      'Auto-calculations & validation',
      'Branded COA export',
      'Priority email support',
    ],
    cta: 'Start Free Trial',
    to: '/register-lab',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For multi-site operations and regulatory bodies.',
    features: [
      'Unlimited users & sites',
      'SSO & LDAP integration',
      'Custom API access',
      'Dedicated account manager',
      'SLA & uptime guarantee',
      'On-premise deployment option',
    ],
    cta: 'Contact Sales',
    to: '/contact',
    highlight: false,
  },
];

const faqs = [
  { q: 'Can I try LabLogic before committing?', a: 'Yes. The Starter plan is free forever, and the Professional plan comes with a 14-day free trial. No credit card required.' },
  { q: 'How does pricing scale with team size?', a: 'The Starter plan supports up to 3 users. Professional supports up to 15. For larger teams, contact us for Enterprise pricing tailored to your needs.' },
  { q: 'Is my data secure?', a: 'Absolutely. All data is encrypted at rest and in transit. We use row-level security, role-based access, and full audit logging.' },
  { q: 'Can I migrate from another LIMS?', a: 'Yes. We provide data migration support for Professional and Enterprise customers. Contact us to discuss your migration plan.' },
  { q: 'Do you offer training?', a: 'Professional includes onboarding documentation. Enterprise includes live training sessions and a dedicated success manager.' },
];

export default function Pricing() {
  return (
    <div className="overflow-x-hidden">
      {/* Header */}
      <section className="pt-32 pb-10 md:pt-40 md:pb-16 px-6 text-center">
        <Reveal>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.1]" style={{ textWrap: 'balance' }}>
            Simple, Transparent Pricing
          </h1>
        </Reveal>
        <Reveal delay={80}>
          <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto">
            Start free. Scale when you're ready. No hidden fees.
          </p>
        </Reveal>
      </section>

      {/* Cards */}
      <section className="pb-24 md:pb-32 px-6">
        <div className="mx-auto max-w-5xl grid md:grid-cols-3 gap-6 items-start">
          {plans.map((p, i) => (
            <Reveal key={p.name} delay={i * 100}>
              <div
                className={cn(
                  'rounded-2xl border p-8 shadow-sm flex flex-col h-full transition-shadow duration-300',
                  p.highlight
                    ? 'border-accent bg-card shadow-md ring-1 ring-accent/20'
                    : 'border-border bg-card hover:shadow-md'
                )}
              >
                {p.highlight && (
                  <span className="mb-4 inline-block self-start rounded-full bg-accent/10 text-accent text-xs font-semibold px-3 py-1">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold text-foreground">{p.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground tabular-nums">{p.price}</span>
                  {p.period && <span className="text-sm text-muted-foreground">{p.period}</span>}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{p.desc}</p>

                <ul className="mt-8 space-y-3 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-accent flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  className="mt-8 w-full h-11"
                  variant={p.highlight ? 'default' : 'outline'}
                  asChild
                >
                  <Link to={p.to}>{p.cta} <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 md:py-28 px-6 bg-secondary/20">
        <div className="mx-auto max-w-2xl">
          <Reveal>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-10 tracking-tight">
              Frequently Asked Questions
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-5 bg-card">
                  <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
