-- Create job_applications table
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.job(job_id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    resume_url TEXT,
    cover_letter TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    portfolio_url TEXT,
    status TEXT NOT NULL DEFAULT 'submitted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Create policies for job applications
CREATE POLICY "Enable read access for authenticated users" 
ON public.job_applications 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable insert for anonymous users"
ON public.job_applications
FOR INSERT
TO anon
WITH CHECK (true);

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;   
END;
$$ language 'plpgsql';

CREATE TRIGGER update_job_applications_updated_at
BEFORE UPDATE ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_email ON public.job_applications(email);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);
