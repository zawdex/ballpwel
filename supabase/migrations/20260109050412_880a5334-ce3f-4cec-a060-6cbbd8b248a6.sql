-- Insert website title and favicon settings if they don't exist
INSERT INTO public.app_settings (setting_key, setting_value)
VALUES 
  ('website_title', 'Live Sports TV'),
  ('favicon_url', '')
ON CONFLICT (setting_key) DO NOTHING;