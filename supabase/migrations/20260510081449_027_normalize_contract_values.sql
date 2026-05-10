/*
  # Normalize contract values to Starter/Business/Premium

  Changes:
  - Drops old CHECK constraint that limited values to Basic/Pro/Enterprise
  - Adds new CHECK constraint for Starter/Business/Premium
  - Updates all existing rows to new naming:
      Basic       -> Starter
      Pro         -> Business
      Enterprise  -> Premium
  - Any unrecognized value defaults to Starter
*/

ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_contract_check;

UPDATE companies
SET contract = CASE
  WHEN contract = 'Basic' THEN 'Starter'
  WHEN contract = 'Pro' THEN 'Business'
  WHEN contract = 'Enterprise' THEN 'Premium'
  WHEN contract ILIKE 'starter' THEN 'Starter'
  WHEN contract ILIKE 'business' THEN 'Business'
  WHEN contract ILIKE 'premium' THEN 'Premium'
  ELSE 'Starter'
END;

ALTER TABLE companies
  ADD CONSTRAINT companies_contract_check
  CHECK (contract = ANY (ARRAY['Starter'::text, 'Business'::text, 'Premium'::text]));
