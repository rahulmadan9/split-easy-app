-- Create a security definer function to get the current user's profile id
CREATE OR REPLACE FUNCTION public.get_current_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Authenticated users can view all expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can delete expenses" ON public.expenses;

-- Create new restrictive policies based on user ownership
-- Users can only view expenses where they are the payer or the one who owes
CREATE POLICY "Users can view their own expenses"
ON public.expenses
FOR SELECT
TO authenticated
USING (
  paid_by = public.get_current_profile_id() 
  OR owes_user_id = public.get_current_profile_id()
);

-- Users can only insert expenses where they are the payer
CREATE POLICY "Users can insert their own expenses"
ON public.expenses
FOR INSERT
TO authenticated
WITH CHECK (
  paid_by = public.get_current_profile_id()
);

-- Users can only update expenses they are involved in
CREATE POLICY "Users can update their own expenses"
ON public.expenses
FOR UPDATE
TO authenticated
USING (
  paid_by = public.get_current_profile_id() 
  OR owes_user_id = public.get_current_profile_id()
);

-- Users can only delete expenses they paid for
CREATE POLICY "Users can delete their own expenses"
ON public.expenses
FOR DELETE
TO authenticated
USING (
  paid_by = public.get_current_profile_id()
);