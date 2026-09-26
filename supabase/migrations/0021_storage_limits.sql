-- Code Sellers — limites de tamanho e tipo nos depósitos de arquivos.
-- Os mesmos limites que o app já valida, agora também no servidor: ninguém
-- consegue subir arquivos enormes ou de tipos perigosos chamando a API direto.

update storage.buckets
  set file_size_limit = 2097152,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
  where id = 'avatars';

update storage.buckets
  set file_size_limit = 10485760,
      allowed_mime_types = array[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
  where id = 'proposals';

update storage.buckets
  set file_size_limit = 5242880,
      allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png']
  where id = 'receipts';
