-- Create notifications table for per-user notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- info, warning, error, success
  read BOOLEAN NOT NULL DEFAULT false,
  dismissed BOOLEAN NOT NULL DEFAULT false,
  source_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  entity_type TEXT, -- result, sample, project, validation_error
  entity_id UUID,
  link TEXT, -- URL to navigate to when clicked
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_user_dismissed ON public.notifications(user_id, dismissed);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read/dismissed)
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
USING (user_id = auth.uid());

-- System/admins can insert notifications for any user
CREATE POLICY "Authorized users can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (
  is_admin(auth.uid()) 
  OR is_lab_supervisor(auth.uid()) 
  OR is_qa_officer(auth.uid())
  OR user_id = auth.uid()
);

-- Function to create notification for a user
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id UUID,
  _title TEXT,
  _message TEXT,
  _type TEXT DEFAULT 'info',
  _source_user_id UUID DEFAULT NULL,
  _entity_type TEXT DEFAULT NULL,
  _entity_id UUID DEFAULT NULL,
  _link TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id, title, message, type, source_user_id, entity_type, entity_id, link
  ) VALUES (
    _user_id, _title, _message, _type, _source_user_id, _entity_type, _entity_id, _link
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Function to notify on result status changes
CREATE OR REPLACE FUNCTION public.notify_result_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sample_record RECORD;
  project_record RECORD;
  analyst_id UUID;
  reviewer_name TEXT;
  approver_name TEXT;
BEGIN
  -- Get sample and project info
  SELECT s.*, p.code as project_code, p.title as project_title
  INTO sample_record
  FROM samples s
  JOIN projects p ON s.project_id = p.id
  WHERE s.id = NEW.sample_id;
  
  analyst_id := NEW.entered_by;
  
  -- Notify on review completion (pending_review -> reviewed)
  IF OLD.status = 'pending_review' AND NEW.status = 'reviewed' THEN
    -- Get reviewer name
    SELECT full_name INTO reviewer_name FROM profiles WHERE id = NEW.reviewed_by;
    
    -- Notify the analyst
    IF analyst_id IS NOT NULL THEN
      PERFORM create_notification(
        analyst_id,
        'Result Reviewed',
        'Your result for sample ' || sample_record.sample_id || ' has been reviewed by ' || COALESCE(reviewer_name, 'a supervisor'),
        'info',
        NEW.reviewed_by,
        'result',
        NEW.id,
        '/review'
      );
    END IF;
  END IF;
  
  -- Notify on approval (reviewed -> approved)
  IF OLD.status = 'reviewed' AND NEW.status = 'approved' THEN
    SELECT full_name INTO approver_name FROM profiles WHERE id = NEW.approved_by;
    
    -- Notify the analyst
    IF analyst_id IS NOT NULL THEN
      PERFORM create_notification(
        analyst_id,
        'Result Approved',
        'Your result for sample ' || sample_record.sample_id || ' has been approved by ' || COALESCE(approver_name, 'QA'),
        'success',
        NEW.approved_by,
        'result',
        NEW.id,
        '/completed'
      );
    END IF;
    
    -- Notify all admins
    INSERT INTO notifications (user_id, title, message, type, source_user_id, entity_type, entity_id, link)
    SELECT 
      ur.user_id,
      'Result Approved',
      'Result for sample ' || sample_record.sample_id || ' in project ' || sample_record.project_code || ' has been approved',
      'success',
      NEW.approved_by,
      'result',
      NEW.id,
      '/completed'
    FROM user_roles ur
    WHERE ur.role = 'admin' AND ur.user_id != COALESCE(NEW.approved_by, '00000000-0000-0000-0000-000000000000');
  END IF;
  
  -- Notify on rejection
  IF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    IF analyst_id IS NOT NULL THEN
      PERFORM create_notification(
        analyst_id,
        'Result Rejected',
        'Your result for sample ' || sample_record.sample_id || ' was rejected. Reason: ' || COALESCE(NEW.rejection_reason, 'No reason provided'),
        'error',
        NEW.rejected_by,
        'result',
        NEW.id,
        '/results'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for result status changes
DROP TRIGGER IF EXISTS on_result_status_change ON public.results;
CREATE TRIGGER on_result_status_change
  AFTER UPDATE ON public.results
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_result_status_change();

-- Function to notify on validation errors
CREATE OR REPLACE FUNCTION public.notify_validation_error()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_record RECORD;
  sample_record RECORD;
BEGIN
  -- Get result and sample info
  SELECT r.*, s.sample_id as sample_label
  INTO result_record
  FROM results r
  JOIN samples s ON r.sample_id = s.id
  WHERE r.id = NEW.result_id;
  
  -- Notify the analyst who entered the result
  IF result_record.entered_by IS NOT NULL THEN
    PERFORM create_notification(
      result_record.entered_by,
      'Validation Error',
      'Validation error on sample ' || result_record.sample_label || ': ' || NEW.message,
      'warning',
      NULL,
      'validation_error',
      NEW.id,
      '/validations'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for validation errors
DROP TRIGGER IF EXISTS on_validation_error_created ON public.validation_errors;
CREATE TRIGGER on_validation_error_created
  AFTER INSERT ON public.validation_errors
  FOR EACH ROW
  EXECUTE FUNCTION notify_validation_error();