-- Drop existing RLS policies on expenses table
DROP POLICY IF EXISTS "Users can delete group expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert group expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update group expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can view group expenses" ON public.expenses;

-- Create new RLS policies that handle both group expenses and direct (non-group) expenses
-- For direct expenses (group_id IS NULL), allow if user is involved (paid_by or owes_user_id)

-- SELECT: Users can view expenses they're involved in (either group-based or direct)
CREATE POLICY "Users can view their expenses"
ON public.expenses
FOR SELECT
USING (
  (group_id IS NOT NULL AND is_group_member(group_id))
  OR (group_id IS NULL AND (paid_by = get_current_profile_id() OR owes_user_id = get_current_profile_id()))
);

-- INSERT: Users can insert expenses if they're the payer (group or direct)
CREATE POLICY "Users can insert expenses"
ON public.expenses
FOR INSERT
WITH CHECK (
  paid_by = get_current_profile_id()
  AND (group_id IS NULL OR is_group_member(group_id))
);

-- UPDATE: Users can update expenses they're involved in
CREATE POLICY "Users can update their expenses"
ON public.expenses
FOR UPDATE
USING (
  (group_id IS NOT NULL AND is_group_member(group_id) AND (paid_by = get_current_profile_id() OR owes_user_id = get_current_profile_id()))
  OR (group_id IS NULL AND (paid_by = get_current_profile_id() OR owes_user_id = get_current_profile_id()))
);

-- DELETE: Users can delete expenses they paid for
CREATE POLICY "Users can delete their expenses"
ON public.expenses
FOR DELETE
USING (
  paid_by = get_current_profile_id()
  AND (group_id IS NULL OR is_group_member(group_id))
);