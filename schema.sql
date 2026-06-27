-- Duewell Database Schema
-- Paste this script into the Supabase SQL Editor to create the tables,
-- set up Row Level Security (RLS) policies, and prepare your database.

-- 1. Create Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    deadline TIMESTAMPTZ NOT NULL,
    estimated_minutes INTEGER DEFAULT 30,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low', 'urgent')),
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    category TEXT DEFAULT 'Work',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security for tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
CREATE POLICY "Users can create their own tasks" 
    ON public.tasks 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own tasks" 
    ON public.tasks 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" 
    ON public.tasks 
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" 
    ON public.tasks 
    FOR DELETE 
    USING (auth.uid() = user_id);


-- 2. Create Habits Table
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    streak INTEGER DEFAULT 0,
    completed_dates TEXT[] DEFAULT '{}', -- Store dates as 'YYYY-MM-DD' in an array
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security for habits
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for habits
CREATE POLICY "Users can create their own habits" 
    ON public.habits 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own habits" 
    ON public.habits 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits" 
    ON public.habits 
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits" 
    ON public.habits 
    FOR DELETE 
    USING (auth.uid() = user_id);


-- 3. Create Daily Plans Table (To save AI-generated plan history, optional but nice)
CREATE TABLE IF NOT EXISTS public.daily_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    plan_date DATE DEFAULT current_date NOT NULL,
    plan_data JSONB NOT NULL, -- Array of schedule items
    encouragement TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_plan_date UNIQUE (user_id, plan_date)
);

-- Enable Row Level Security for daily_plans
ALTER TABLE public.daily_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_plans
CREATE POLICY "Users can create their own daily plans" 
    ON public.daily_plans 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own daily plans" 
    ON public.daily_plans 
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily plans" 
    ON public.daily_plans 
    FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily plans" 
    ON public.daily_plans 
    FOR DELETE 
    USING (auth.uid() = user_id);
