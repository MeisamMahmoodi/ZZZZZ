/*
  # Fix auth_user_company_id execute permissions

  The previous migration revoked EXECUTE on auth_user_company_id() from the
  authenticated role, which broke all RLS policies that call this function.
  RLS policies run in the context of the querying user and require the user
  to have EXECUTE on the function.

  The correct approach to block public RPC access is to keep EXECUTE for
  authenticated (needed for RLS) but revoke it from anon only, and rely on
  the fact that the function returns NULL for unauthenticated calls anyway.

  Fix:
  - Re-grant EXECUTE to authenticated role (required for RLS policies)
  - Keep EXECUTE revoked from anon (public unauthenticated callers)
*/

GRANT EXECUTE ON FUNCTION public.auth_user_company_id() TO authenticated;
