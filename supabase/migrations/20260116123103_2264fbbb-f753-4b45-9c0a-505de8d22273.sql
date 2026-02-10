-- Fix overly permissive UPDATE policy on expenses table
-- Only the person who created/paid the expense should be able to modify it

DROP POLICY IF EXISTS "Users can update their expenses" ON public.expenses;

CREATE POLICY "Creators can update their expenses"
  ON public.expenses 
  FOR UPDATE 
  TO authenticated
  USING (
    (group_id IS NOT NULL AND is_group_member(group_id) AND paid_by = get_current_profile_id())
    OR (group_id IS NULL AND paid_by = get_current_profile_id())
  );