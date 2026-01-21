-- Fix the audit log function to handle tables with different columns
CREATE OR REPLACE FUNCTION public.log_audit_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id uuid;
  new_record jsonb;
BEGIN
  -- Get the current user
  current_user_id := auth.uid();
  
  -- If no authenticated user, try to extract from the record
  IF current_user_id IS NULL AND TG_OP IN ('INSERT', 'UPDATE') THEN
    new_record := to_jsonb(NEW);
    current_user_id := COALESCE(
      (new_record->>'created_by')::uuid,
      (new_record->>'entered_by')::uuid,
      (new_record->>'user_id')::uuid
    );
  END IF;
  
  -- If still null, skip audit logging
  IF current_user_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (entity_type, entity_id, action, user_id, new_value)
    VALUES (TG_TABLE_NAME, NEW.id, 'create', current_user_id, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (entity_type, entity_id, action, user_id, previous_value, new_value)
    VALUES (TG_TABLE_NAME, NEW.id, 'update', current_user_id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (entity_type, entity_id, action, user_id, previous_value)
    VALUES (TG_TABLE_NAME, OLD.id, 'delete', current_user_id, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$