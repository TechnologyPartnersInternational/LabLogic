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
      title: `Welcome to ${orgName}! 👋`,
      content: 'Let\'s take a quick tour of your new Laboratory Information Management System. We will show you where everything is so you can get started right away.',
      disableBeacon: true,
    },
    {
      target: '#app-sidebar',
      placement: 'right',
      title: 'Your Command Center',
      content: 'Here is your main navigation. It adapts to your role, showing only what you have permission to access.',
      disableBeacon: true,
    },
    {
      target: '#nav-projects',
      placement: 'right',
      title: 'Manage Client Projects',
      content: 'Create and track projects, generate Chain of Custody (COC) records, and monitor progress from start to finish.',
      disableBeacon: true,
    },
    {
      target: '#nav-samples',
      placement: 'right',
      title: 'Track Samples',
      content: 'Log incoming containers, assign them unique IDs, and track their location and status throughout the lab.',
      disableBeacon: true,
    },
    {
      target: '#nav-results',
      placement: 'right',
      title: 'Results Entry',
      content: 'Enter and validate your analytical results here. This section is divided by departments like Wet Chemistry and Microbiology.',
      disableBeacon: true,
    },
    {
      target: '#global-search-bar',
      placement: 'bottom-start',
      title: 'Find Anything Instantly 🔍',
      content: 'Use this powerful global search to quickly locate Samples, Projects, Clients, or Parameter configurations from anywhere.',
      disableBeacon: true,
    },
    {
      target: '#notifications-btn',
      placement: 'bottom',
      title: 'Stay Notified 🔔',
      content: 'Watch this space for important alerts like samples ready for review, QA validations, or new assignments.',
      disableBeacon: true,
    },
    {
      target: '#user-menu-btn',
      placement: 'bottom-end',
      title: 'Your Account Settings ⚙️',
      content: 'Manage your profile, adjust your preferences, or sign out using this menu.',
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
          overlayColor: 'rgba(0, 0, 0, 0.65)',
        },
        tooltip: {
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid hsl(var(--border))',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipTitle: {
          fontSize: '1.25rem',
          fontWeight: 700,
          color: 'hsl(var(--foreground))',
          marginBottom: '8px',
          lineHeight: 1.2,
        },
        tooltipContent: {
          fontSize: '0.95rem',
          lineHeight: 1.6,
          color: 'hsl(var(--muted-foreground))',
          padding: '10px 0',
        },
        buttonNext: {
          backgroundColor: 'hsl(var(--primary))',
          color: 'hsl(var(--primary-foreground))',
          borderRadius: '8px',
          padding: '8px 16px',
          fontSize: '0.9rem',
          fontWeight: 500,
          transition: 'opacity 0.2s',
        },
        buttonBack: {
          color: 'hsl(var(--muted-foreground))',
          fontSize: '0.9rem',
          marginRight: '12px',
          fontWeight: 500,
        },
        buttonSkip: {
          color: 'hsl(var(--muted-foreground))',
          fontSize: '0.85rem',
          fontWeight: 500,
        },
        spotlight: {
          borderRadius: '12px',
        },
      }}
    />
  );
}
