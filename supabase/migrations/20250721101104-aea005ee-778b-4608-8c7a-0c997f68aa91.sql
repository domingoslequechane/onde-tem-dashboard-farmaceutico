-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  user_type TEXT NOT NULL DEFAULT 'client' CHECK (user_type IN ('admin', 'pharmacy', 'client')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create regions table
CREATE TABLE public.regions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Brasil',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pharmacies table
CREATE TABLE public.pharmacies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  phone TEXT,
  email TEXT,
  address TEXT NOT NULL,
  region_id UUID NOT NULL REFERENCES public.regions(id),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  opening_hours JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medicines table
CREATE TABLE public.medicines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  active_ingredient TEXT,
  manufacturer TEXT,
  category TEXT,
  description TEXT,
  requires_prescription BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clients/patients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  birth_date DATE,
  gender TEXT CHECK (gender IN ('masculino', 'feminino', 'outro')),
  address TEXT,
  region_id UUID REFERENCES public.regions(id),
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  allergies TEXT[],
  medical_conditions TEXT[],
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create consultations table
CREATE TABLE public.consultations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  symptoms TEXT NOT NULL,
  ai_recommendation TEXT,
  recommended_medicines UUID[] DEFAULT '{}',
  urgency_level TEXT NOT NULL CHECK (urgency_level IN ('baixa', 'media', 'alta', 'emergencia')),
  consultation_type TEXT NOT NULL DEFAULT 'ai' CHECK (consultation_type IN ('ai', 'human', 'emergency')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI interactions table
CREATE TABLE public.ai_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE SET NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('symptom_check', 'medicine_search', 'emergency_triage', 'general_inquiry')),
  user_input TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  confidence_score DECIMAL(3, 2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medicine stock table
CREATE TABLE public.medicine_stocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  expiry_date DATE,
  batch_number TEXT,
  minimum_stock INTEGER DEFAULT 10,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(pharmacy_id, medicine_id, batch_number)
);

-- Create stock alerts table
CREATE TABLE public.stock_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id UUID NOT NULL REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'expired', 'expiring_soon')),
  threshold_value INTEGER,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Regions policies (public read)
CREATE POLICY "Everyone can view regions" ON public.regions FOR SELECT USING (true);

-- Medicines policies (public read)
CREATE POLICY "Everyone can view medicines" ON public.medicines FOR SELECT USING (true);

-- Pharmacies policies
CREATE POLICY "Everyone can view active pharmacies" ON public.pharmacies FOR SELECT USING (is_active = true);
CREATE POLICY "Pharmacy owners can manage their pharmacy" ON public.pharmacies FOR ALL USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = owner_id));

-- Clients policies
CREATE POLICY "Users can view their own client data" ON public.clients FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = profile_id) OR 
  profile_id IS NULL
);
CREATE POLICY "Users can insert client data" ON public.clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own client data" ON public.clients FOR UPDATE USING (
  auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = profile_id)
);

-- Consultations policies
CREATE POLICY "Users can view their own consultations" ON public.consultations FOR SELECT USING (
  client_id IN (
    SELECT id FROM public.clients WHERE profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);
CREATE POLICY "Users can insert their own consultations" ON public.consultations FOR INSERT WITH CHECK (true);

-- AI interactions policies
CREATE POLICY "Users can view their own AI interactions" ON public.ai_interactions FOR SELECT USING (
  client_id IN (
    SELECT id FROM public.clients WHERE profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);
CREATE POLICY "Anyone can insert AI interactions" ON public.ai_interactions FOR INSERT WITH CHECK (true);

-- Medicine stocks policies
CREATE POLICY "Everyone can view available stock" ON public.medicine_stocks FOR SELECT USING (is_available = true);
CREATE POLICY "Pharmacy owners can manage their stock" ON public.medicine_stocks FOR ALL USING (
  pharmacy_id IN (
    SELECT id FROM public.pharmacies WHERE owner_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);

-- Stock alerts policies
CREATE POLICY "Pharmacy owners can view their alerts" ON public.stock_alerts FOR SELECT USING (
  pharmacy_id IN (
    SELECT id FROM public.pharmacies WHERE owner_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  )
);
CREATE POLICY "System can create alerts" ON public.stock_alerts FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_pharmacies_region_id ON public.pharmacies(region_id);
CREATE INDEX idx_pharmacies_owner_id ON public.pharmacies(owner_id);
CREATE INDEX idx_clients_profile_id ON public.clients(profile_id);
CREATE INDEX idx_clients_region_id ON public.clients(region_id);
CREATE INDEX idx_consultations_client_id ON public.consultations(client_id);
CREATE INDEX idx_ai_interactions_client_id ON public.ai_interactions(client_id);
CREATE INDEX idx_ai_interactions_session_id ON public.ai_interactions(session_id);
CREATE INDEX idx_medicine_stocks_pharmacy_id ON public.medicine_stocks(pharmacy_id);
CREATE INDEX idx_medicine_stocks_medicine_id ON public.medicine_stocks(medicine_id);
CREATE INDEX idx_stock_alerts_pharmacy_id ON public.stock_alerts(pharmacy_id);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pharmacies_updated_at BEFORE UPDATE ON public.pharmacies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_medicines_updated_at BEFORE UPDATE ON public.medicines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON public.consultations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_medicine_stocks_updated_at BEFORE UPDATE ON public.medicine_stocks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, user_type)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'user_type', 'client')
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();