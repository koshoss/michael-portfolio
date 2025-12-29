-- Michael's 3D Portfolio - Complete Database Schema
-- Run this ENTIRE script in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop ALL existing tables
DROP TABLE IF EXISTS public.site_content CASCADE;
DROP TABLE IF EXISTS public.faqs CASCADE;
DROP TABLE IF EXISTS public.additional_terms CASCADE;
DROP TABLE IF EXISTS public.terms_sections CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.pricing CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1. Profiles Table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  discord_id TEXT,
  discord_username TEXT,
  discord_avatar TEXT,
  display_name TEXT,
  is_banned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Projects Table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  images JSONB DEFAULT '[]',
  category TEXT NOT NULL DEFAULT 'Characters',
  tags TEXT[] DEFAULT '{}',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Pricing Table
CREATE TABLE public.pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  price_label TEXT DEFAULT 'per model',
  delivery_time TEXT DEFAULT '1-2 days',
  description TEXT DEFAULT '',
  features TEXT[] DEFAULT '{}',
  is_popular BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Reviews Table (auto-approved by default)
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  discord_username TEXT,
  discord_avatar TEXT,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Terms Sections Table (4 main cards)
CREATE TABLE public.terms_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  icon TEXT DEFAULT 'FileText',
  items TEXT[] DEFAULT '{}',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Additional Terms Table
CREATE TABLE public.additional_terms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. FAQs Table
CREATE TABLE public.faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Site Content Table (for all editable content)
CREATE TABLE public.site_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page TEXT NOT NULL,
  section TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(page, section)
);

-- Disable RLS
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.terms_sections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.additional_terms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.projects TO anon, authenticated;
GRANT ALL ON public.pricing TO anon, authenticated;
GRANT ALL ON public.reviews TO anon, authenticated;
GRANT ALL ON public.terms_sections TO anon, authenticated;
GRANT ALL ON public.additional_terms TO anon, authenticated;
GRANT ALL ON public.faqs TO anon, authenticated;
GRANT ALL ON public.site_content TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, discord_username, discord_avatar, discord_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'preferred_username',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'provider_id'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pricing;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
ALTER PUBLICATION supabase_realtime ADD TABLE public.terms_sections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.additional_terms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.faqs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_content;

-- Insert Default Projects
INSERT INTO public.projects (title, description, image_url, images, category, tags, order_index) VALUES
('Cyber Warrior', 'High-poly character model with detailed armor and weapons', '', '[{"url": "", "color": "#ff0000", "name": "Red"}, {"url": "", "color": "#0066ff", "name": "Blue"}]', 'Characters', ARRAY['Blender', 'Substance Painter'], 1),
('Crystal Blade', 'Mystical dagger with glowing crystal blade', '', '[{"url": "", "color": "#00ff88", "name": "Green"}, {"url": "", "color": "#ff00ff", "name": "Purple"}]', 'Weapons', ARRAY['Blender', 'Substance Painter'], 2),
('Hover Car', 'Sleek futuristic vehicle with detailed interior', '', '[{"url": "", "color": "#ffcc00", "name": "Gold"}, {"url": "", "color": "#333333", "name": "Black"}]', 'Vehicles', ARRAY['Blender', 'Substance Painter'], 3);

-- Insert Default Pricing (order: Basic=1, Professional=2 (popular, middle), Premium=3)
INSERT INTO public.pricing (name, price, price_label, delivery_time, description, features, is_popular, order_index) VALUES
('Basic', 5, 'per model', 'Delivery in 1 - 2 days', 'Perfect for simple modeling needs', ARRAY['Low-Poly modeling', 'Up to 1 revision', 'Low texture details', 'No rigging', 'No animation'], false, 1),
('Professional', 10, 'per model', 'Delivery in 2 - 4 days', 'Recommended for most projects', ARRAY['Mid-Poly modeling', 'Up to 3 revisions', 'High Texture details', 'Rigging (if needed)', 'No animation'], true, 2),
('Premium', 25, 'per model', 'Delivery in 4 - 7 days', 'Everything you need for professional work', ARRAY['High-Poly Modeling', 'Unlimited revisions', 'High Texture details', 'Rigging (if needed)', 'Animation (if needed)'], false, 3);

-- Insert Default Terms Sections
INSERT INTO public.terms_sections (title, icon, items, order_index) VALUES
('Service Agreement', 'FileText', ARRAY[
  'All 3D modeling services are provided on a project basis with clear deliverables outlined before work begins.',
  'Clients must provide detailed briefs, reference materials, and specifications for accurate project completion.',
  'Project scope changes may result in additional charges and extended delivery times.',
  'Final delivery includes agreed-upon file formats (typically .blend, .fbx, .obj, and textures).'
], 1),
('Payment Terms', 'CreditCard', ARRAY[
  'Only two payment methods are accepted: PayPal and Roblox wallet (Robux currency).',
  'A 50% upfront payment is required before starting any project over $100.',
  'The remaining payment is due upon project completion and client approval.',
  'Refund Policy: Refunds are only applicable for orders above $100 and must be requested within 48 hours of project start if no work has been done.'
], 2),
('Delivery & Revisions', 'Clock', ARRAY[
  'Delivery timeframes are estimated and may vary based on project complexity.',
  'Revision requests must be submitted within 7 days of initial delivery.',
  'Additional revisions beyond the package limit will incur extra charges.',
  'Rush delivery (50% faster) available for an additional 50% surcharge.'
], 3),
('Intellectual Property', 'Shield', ARRAY[
  'Upon full payment, clients receive full commercial rights to the delivered 3D models.',
  'I retain the right to showcase completed work in my portfolio unless otherwise agreed.',
  'Client-provided reference materials must not infringe on third-party copyrights.',
  'Original design concepts and techniques remain my intellectual property.'
], 4);

-- Insert Default Additional Terms
INSERT INTO public.additional_terms (title, content, order_index) VALUES
('Quality Guarantee', 'All models are delivered with professional quality standards. If you''re not satisfied, I''ll work with you to make it right.', 1),
('Communication', 'Regular project updates provided via email or your preferred communication method. Response time typically within 24 hours.', 2),
('File Delivery', 'All files delivered via secure cloud storage with download links valid for 30 days. Backup copies maintained for 6 months.', 3),
('Confidentiality', 'All client projects and information are kept strictly confidential. NDAs available upon request for sensitive projects.', 4);

-- Insert Default FAQs
INSERT INTO public.faqs (question, answer, order_index) VALUES
('How do I pay?', 'I accept PayPal and Robux. For projects over $100, 50% upfront payment is required.', 1),
('Can I get a refund?', 'Refunds are available for orders above $100 if requested within 48 hours of project start and no work has begun.', 2),
('What''s included in rigging?', 'Basic rigging includes bone structure for animation. Advanced rigging with IK/FK controls is available in Premium package.', 3);

-- Insert Default Site Content
INSERT INTO public.site_content (page, section, content) VALUES
-- Home Page
('home', 'hero', '{"name": "Michael", "subtitle": "I''m 19 years old with 3 years of experience in 3D modeling"}'),
('home', 'about', '{"title": "About Me", "text": "I make game-ready 3D models using Blender, focusing on stylized characters, weapons, and props for Roblox games. I enjoy turning ideas into clean, optimized models that look great and perform well in-game.", "highlight": "Blender"}'),
('home', 'cta', '{"title": "Ready to bring your ideas to life?", "subtitle": "Let''s collaborate and create something amazing together"}'),
('home', 'tools', '{"modeling": ["Blender", "Roblox Studio", "ZBrush"], "texturing": ["Adobe Substance 3D Painter", "Krita"]}'),

-- Pricing Page
('pricing', 'header', '{"title": "Pricing Plans", "subtitle": "1$ = 250 Robux"}'),
('pricing', 'package_deals', '{"title": "Package Deals", "subtitle": "Order multiple models and save!", "items": ["3 Models = 5% OFF", "5 Models = 10% OFF", "10+ Models = 15% OFF"]}'),
('pricing', 'rush_delivery', '{"title": "Rush Delivery", "subtitle": "Need it faster? We''ve got you covered!", "items": ["24-48 hours delivery", "+30% of base price", "Priority queue"]}'),
('pricing', 'loyalty', '{"title": "Loyalty Program", "description": "Returning customers get special discounts! After 5 completed orders, enjoy 5% off all future projects. After 10 orders, get 10% off permanently."}'),
('pricing', 'custom_quote', '{"title": "Need a custom quote?", "description": "For large projects, bulk orders, or specialized requirements, I offer custom pricing tailored to your specific needs."}'),

-- Reviews Page
('reviews', 'header', '{"title": "Client Reviews", "subtitle": "See what my clients say about their experience working with me on their 3D modeling projects."}'),
('reviews', 'stats', '{"stat1_value": "4+", "stat1_label": "Total Projects", "stat2_value": "100%", "stat2_label": "Happy Clients", "stat3_value": "5.0/5", "stat3_label": "Average Rating", "stat4_value": "100%", "stat4_label": "On-Time Delivery"}'),
('reviews', 'cta', '{"title": "Ready to join my satisfied clients?", "subtitle": "Let''s discuss your project and bring your 3D vision to life with the same quality and attention to detail."}'),

-- Terms Page
('terms', 'header', '{"title": "Terms & Conditions", "subtitle": "Clear and transparent terms for our professional 3D modeling services. Please read carefully before starting your project."}'),
('terms', 'footer', '{"text": "Last updated: December 2024"}'),
('terms', 'contact', '{"title": "Questions about these terms?", "subtitle": "If you have any questions about these terms and conditions, feel free to reach out before starting your project."}')

ON CONFLICT (page, section) DO UPDATE SET content = EXCLUDED.content, updated_at = NOW();

-- Confirm admin
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = 'se7smo7amed@gmail.com';

SELECT 'Database setup complete!' as status;
