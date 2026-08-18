-- Cria automaticamente uma linha em public.profiles sempre que um usuário
-- é criado no Supabase Auth (auth.users). Prisma não gerencia o schema
-- `auth`, então isso é aplicado manualmente (via SQL Editor do Supabase ou
-- anexado à primeira migration do Prisma) e não faz parte do schema.prisma.
--
-- Precisa rodar DEPOIS de `prisma migrate dev` ter criado a tabela public.profiles.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
