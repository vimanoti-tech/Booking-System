/*
  # Fix RLS Policy Infinite Recursion

  1. Security Updates
    - Drop the problematic "Super admins can read all profiles" policy that causes infinite recursion
    - Create a simpler policy structure that avoids self-referential queries
    - Maintain security while preventing recursion loops

  2. Policy Changes
    - Remove recursive policy that checks profiles table within profiles policy
    - Keep simple user-based policies that don't cause loops
    - Super admins will need to use service role for admin operations
*/

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Super admins can read all profiles" ON profiles;

-- Keep the simple, non-recursive policies
-- Users can read their own profile (already exists, no recursion)
-- Users can update their own profile (already exists, no recursion)

-- Note: Super admin operations that need to read all profiles should be handled
-- through the application layer using the service role key, not through RLS policies
-- that would cause recursion by querying the same table they're protecting.