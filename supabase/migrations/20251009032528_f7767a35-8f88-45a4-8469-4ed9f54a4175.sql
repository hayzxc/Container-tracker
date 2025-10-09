-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
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
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Only admins can insert roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Add verification columns to containers table
ALTER TABLE public.containers
ADD COLUMN verified BOOLEAN DEFAULT false,
ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN verified_by UUID REFERENCES auth.users(id);

-- Policy: Admins can view all containers
CREATE POLICY "Admins can view all containers"
ON public.containers
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can update all containers (for verification)
CREATE POLICY "Admins can update all containers"
ON public.containers
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can delete all containers
CREATE POLICY "Admins can delete all containers"
ON public.containers
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can view all shippers
CREATE POLICY "Admins can view all shippers"
ON public.shippers
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can delete all shippers
CREATE POLICY "Admins can delete all shippers"
ON public.shippers
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));