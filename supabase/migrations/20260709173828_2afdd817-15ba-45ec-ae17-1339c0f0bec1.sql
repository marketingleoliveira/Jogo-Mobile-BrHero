
CREATE POLICY "Authenticated can read apk"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'apk');

CREATE POLICY "Authenticated can upload apk"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'apk');

CREATE POLICY "Authenticated can update apk"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'apk')
WITH CHECK (bucket_id = 'apk');

CREATE POLICY "Authenticated can delete apk"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'apk');
