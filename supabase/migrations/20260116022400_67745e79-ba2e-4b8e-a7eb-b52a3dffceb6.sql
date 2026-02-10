-- Add CHECK constraints for server-side input validation on expenses table

-- Ensure amount is positive and reasonable (up to 1 million)
ALTER TABLE public.expenses
  ADD CONSTRAINT amount_reasonable CHECK (amount > 0 AND amount <= 1000000);

-- Limit description length to 200 characters
ALTER TABLE public.expenses
  ADD CONSTRAINT description_length CHECK (LENGTH(description) <= 200);

-- Limit notes length to 1000 characters (if provided)
ALTER TABLE public.expenses
  ADD CONSTRAINT notes_length CHECK (notes IS NULL OR LENGTH(notes) <= 1000);

-- Ensure expense_date is reasonable (not before year 2000, not more than 1 year in future)
ALTER TABLE public.expenses
  ADD CONSTRAINT reasonable_date CHECK (expense_date >= '2000-01-01' AND expense_date <= CURRENT_DATE + INTERVAL '1 year');

-- Ensure custom_split_amount is valid (non-negative and not exceeding total amount)
ALTER TABLE public.expenses
  ADD CONSTRAINT custom_split_valid CHECK (custom_split_amount IS NULL OR (custom_split_amount >= 0 AND custom_split_amount <= amount));