import { useState, useEffect, useCallback } from 'react';
import Joyride, { CallBackProps, STATUS, ACTIONS, EVENTS, Step } from 'react-joyride';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export function WelcomeTour({ forceRun = false, onFinish }: { forceRun?: boolean; onFinish?: () => void }) {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const [run, setRun] = useState(false);

  const { data: hasCompletedTour } = useQuery({
    queryKey: ['tourStatus', user?.id],
    queryFn: async () => {
      if (!user?.id) return true;
      const { data, error } = await supabase
        .from('profiles')
        .select('has_completed_tour')
        .eq('id', user.id)
        .single();
      if (error) return true;
      return data?.has_completed_tour ?? false;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (forceRun) {
      setRun(true);
    } else if (hasCompletedTour === false) {
      // Small delay so DOM targets render
      const timer = setTimeout(() => setRun(true), 800);
      return () => clearTimeout(timer);
    }
  }, [hasCompletedTour, forceRun]);

  const markTourComplete = useCallback(async () => {
    if (!user?.id) return;
    await supabase
      .from('profiles')
      .update({ has_completed_tour: true } as any)
      .eq('id', user.id);
    queryClient.invalidateQueries({ queryKey: ['tourStatus', user?.id] });
    onFinish?.();
  }, [user?.id, queryClient, onFinish]);

  const handleCallback = useCallback(async (data: CallBackProps) => {
    const { status, action } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(status)) {
      setRun(false);
      if (!forceRun) {
        await markTourComplete();
      } else {
        onFinish?.();
      }
    }
    if (action === ACTIONS.CLOSE) {
      setRun(false);
      if (!forceRun) {
        await markTourComplete();
      } else {
        onFinish?.();
      }
    }
  }, [forceRun, markTourComplete, onFinish]);

  const orgName = organization?.name || 'LabLogic';

  const steps: Step[] = [
    {
      target: 'body',
      placement: 'center',
      title: `Welcome to ${orgName}!`,
      content: "Let's take a quick look around your new Laboratory Information Management System.",
      disableBeacon: true,
    },
    {
      target: '#app-sidebar',
      placement: 'right',
      title: 'Your Departments',
      content: 'Here you can access your configured lab sections, such as Wet Chemistry or Microbiology. You\'ll only see what your role permits.',
      disableBeacon: true,
    },
    {
      target: '#new-project-link',
      placement: 'bottom',
      title: 'Start Your First Project',
      content: 'Click here to register a new client project and generate Chain of Custody (COC) records.',
      disableBeacon: true,
    },
    {
      target: '#global-search-bar',
      placement: 'bottom',
      title: 'Find Anything Instantly',
      content: 'Use this search bar to quickly locate Samples, Projects, Clients, or Parameter configurations.',
      disableBeacon: true,
    },
  ];

  if (!run) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      scrollToFirstStep
      disableOverlayClose
      callback={handleCallback}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour',
      }}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: 'hsl(var(--primary))',
          textColor: 'hsl(var(--foreground))',
          backgroundColor: 'hsl(var(--card))',
          arrowColor: 'hsl(var(--card))',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
        },
        tooltipTitle: {
          fontSize: '1.1rem',
          fontWeight: 600,
        },
        tooltipContent: {
          fontSize: '0.9rem',
          lineHeight: 1.5,
        },
        buttonNext: {
          backgroundColor: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
          borderRadius: '0.5rem',
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
        },
        buttonBack: {
          color: 'hsl(var(--muted-foreground))',
          fontSize: '0.875rem',
        },
        buttonSkip: {
          color: 'hsl(var(--muted-foreground))',
          fontSize: '0.8rem',
        },
        spotlight: {
          borderRadius: '0.5rem',
        },
      }}
    />
  );
}
