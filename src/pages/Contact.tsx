import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, Clock, ArrowRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
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

export default function Contact() {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulated send
    setTimeout(() => {
      setSubmitting(false);
      toast({ title: 'Message sent', description: 'We will get back to you within 24 hours.' });
      (e.target as HTMLFormElement).reset();
    }, 800);
  };

  return (
    <div className="overflow-x-hidden">
      <section className="pt-32 pb-24 md:pt-40 md:pb-32 px-6">
        <div className="mx-auto max-w-5xl grid md:grid-cols-2 gap-16 items-start">
          {/* Left — info */}
          <div className="space-y-8">
            <Reveal>
              <h1 className="text-4xl font-bold tracking-tight text-foreground leading-[1.1]">
                Let's Talk
              </h1>
            </Reveal>
            <Reveal delay={80}>
              <p className="text-muted-foreground leading-relaxed max-w-md">
                Whether you want a live demo, have a question about features, or need help migrating from another system, we're here.
              </p>
            </Reveal>

            <Reveal delay={160}>
              <div className="space-y-5 pt-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Email</p>
                    <p className="text-sm text-muted-foreground">hello@envirolab.app</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Response Time</p>
                    <p className="text-sm text-muted-foreground">We respond within 24 hours on business days.</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Right — form */}
          <Reveal delay={100}>
            <Card className="shadow-md">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" placeholder="Jane Mwangi" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Work Email</Label>
                      <Input id="email" type="email" placeholder="jane@lab.co" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lab">Lab / Organization</Label>
                    <Input id="lab" placeholder="AquaTest Labs" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">How can we help?</Label>
                    <Textarea id="message" rows={5} placeholder="Tell us about your lab and what you're looking for…" required />
                  </div>
                  <Button type="submit" className="w-full h-11" disabled={submitting}>
                    {submitting ? 'Sending…' : 'Send Message'} <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
