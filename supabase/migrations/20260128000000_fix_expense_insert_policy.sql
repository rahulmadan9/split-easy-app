-- Fix RLS policy to allow users to add expenses paid by their roommate
-- This fixes the issue where users get "New row violates role-level security policy"
-- when trying to add an expense that was paid by the other person

-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert expenses" ON public.expenses;

-- Create new INSERT policy that allows users to insert expenses if they're involved
-- Either as the payer (paid_by) OR as the person who owes (owes_user_id)
CREATE POLICY "Users can insert expenses they're involved in"
  ON public.expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (paid_by = get_current_profile_id() OR owes_user_id = get_current_profile_id())
    AND (group_id IS NULL OR is_group_member(group_id))
  );
