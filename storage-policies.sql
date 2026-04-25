-- Allow anyone (including anonymous users) to see files in the 'reports' bucket
-- This is necessary for signed URLs to work if generated on the client,
-- OR for public access if the bucket was public.
-- Since we want to use signed URLs, the user needs 'select' permission.

insert into storage.policies (name, bucket_id, role, operation, definition)
values (
  'Allow Public Select',
  'reports',
  'anon',
  'SELECT',
  '(bucket_id = ''reports''::text)'
);

-- Also allow authenticated users just in case
insert into storage.policies (name, bucket_id, role, operation, definition)
values (
  'Allow Auth Select',
  'reports',
  'authenticated',
  'SELECT',
  '(bucket_id = ''reports''::text)'
);
