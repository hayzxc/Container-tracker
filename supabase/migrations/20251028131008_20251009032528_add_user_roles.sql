-- Create enum for user roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
  END IF;
END $$;

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Policy: Users can view their own roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Users can view their own roles'
  ) THEN
    CREATE POLICY "Users can view their own roles"
    ON public.user_roles
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Admins can manage roles'
  ) THEN
    CREATE POLICY "Admins can manage roles"
    ON public.user_roles
    FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Add verification columns to containers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'containers' AND column_name = 'verified'
  ) THEN
    ALTER TABLE public.containers ADD COLUMN verified BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'containers' AND column_name = 'verified_at'
  ) THEN
    ALTER TABLE public.containers ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'containers' AND column_name = 'verified_by'
  ) THEN
    ALTER TABLE public.containers ADD COLUMN verified_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Policy: Admins can view all containers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'containers' AND policyname = 'Admins can view all containers'
  ) THEN
    CREATE POLICY "Admins can view all containers"
    ON public.containers
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'containers' AND policyname = 'Admins can update all containers'
  ) THEN
    CREATE POLICY "Admins can update all containers"
    ON public.containers
    FOR UPDATE
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'containers' AND policyname = 'Admins can delete all containers'
  ) THEN
    CREATE POLICY "Admins can delete all containers"
    ON public.containers
    FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'shippers' AND policyname = 'Admins can view all shippers'
  ) THEN
    CREATE POLICY "Admins can view all shippers"
    ON public.shippers
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'shippers' AND policyname = 'Admins can delete all shippers'
  ) THEN
    CREATE POLICY "Admins can delete all shippers"
    ON public.shippers
    FOR DELETE
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;