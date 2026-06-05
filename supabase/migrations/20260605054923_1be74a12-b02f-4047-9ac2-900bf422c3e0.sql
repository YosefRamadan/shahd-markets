
UPDATE public.settings
SET value = to_jsonb('متاح 24 ساعة يومياً - طوال أيام الأسبوع'::text)
WHERE key = 'working_hours_ar';

INSERT INTO public.settings (key, value, is_public, description)
VALUES (
  'contact_phones',
  '["01008336388"]'::jsonb,
  true,
  'قائمة أرقام التواصل'
)
ON CONFLICT (key) DO NOTHING;
