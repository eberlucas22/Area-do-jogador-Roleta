-- Phase 8: Identidade visual dinâmica
ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS logo_path          text,
  ADD COLUMN IF NOT EXISTS logo_compact_path  text,
  ADD COLUMN IF NOT EXISTS app_name           text NOT NULL DEFAULT 'Rick Roleta';

-- Storage bucket 'branding' (criar via Dashboard: público, 5MB, jpg/png/webp/svg)
-- Políticas de storage para o bucket 'branding':
CREATE POLICY "branding_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'branding');

CREATE POLICY "branding_admin_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'branding');

CREATE POLICY "branding_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'branding');

CREATE POLICY "branding_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'branding');
