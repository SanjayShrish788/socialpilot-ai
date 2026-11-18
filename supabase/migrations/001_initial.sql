-- SocialPilot AI: authenticated, single-owner workspaces and normalized snapshots.
-- Run once in the Supabase SQL editor. No service-role key is used by the app.
create extension if not exists pgcrypto;
create table public.workspaces (id uuid primary key default gen_random_uuid(), owner_id uuid not null unique references auth.users(id) on delete cascade, name text not null, updated_at timestamptz not null default now());
create table public.workspace_snapshots (user_id uuid primary key references auth.users(id) on delete cascade, workspace_id uuid not null references public.workspaces(id) on delete cascade, payload jsonb not null check(jsonb_typeof(payload)='object'), updated_at timestamptz not null default now());
create table public.brand_profiles (workspace_id uuid primary key references public.workspaces(id) on delete cascade, name text not null, voice text not null, audience text not null, industry text not null, goals text not null, prohibited_phrases text not null, channels jsonb not null);
create table public.social_accounts (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, channel text not null check(channel in ('Instagram','LinkedIn','Facebook')), mode text not null default 'demo' check(mode in ('demo','live')), unique(workspace_id,channel));
create table public.content_posts (workspace_id uuid not null references public.workspaces(id) on delete cascade, id text not null, title text not null, caption text not null, hashtags text not null, slides text not null, channel text not null check(channel in ('Instagram','LinkedIn','Facebook')), status text not null check(status in ('Draft','In review','Changes requested','Approved','Scheduled','Published (demo)')), primary key(workspace_id,id));
create table public.calendar_entries (workspace_id uuid not null, post_id text not null, scheduled_date date not null, primary key(workspace_id,post_id), foreign key(workspace_id,post_id) references public.content_posts(workspace_id,id) on delete cascade);
create table public.engagement_items (workspace_id uuid not null references public.workspaces(id) on delete cascade, id text not null, author text not null, channel text not null, kind text not null, body text not null, category text not null, reply text not null, status text not null, received_at timestamptz not null, responded_at timestamptz, primary key(workspace_id,id));
create table public.crisis_alerts (workspace_id uuid not null, id text not null, engagement_id text not null, reason text not null, status text not null check(status in ('Open','Resolved')), owner text not null, primary key(workspace_id,id), foreign key(workspace_id,engagement_id) references public.engagement_items(workspace_id,id) on delete cascade);
create table public.approval_records (workspace_id uuid not null references public.workspaces(id) on delete cascade, id text not null, target_id text not null, decision text not null, actor text not null, recorded_at timestamptz not null, content text not null, primary key(workspace_id,id));
create table public.agent_execution_logs (workspace_id uuid not null references public.workspaces(id) on delete cascade, id text not null, tool text not null, status text not null check(status in ('success','error')), detail text not null, recorded_at timestamptz not null, primary key(workspace_id,id));
create table public.analytics_snapshots (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, source text not null default 'demo', summary text not null, captured_at timestamptz not null default now());
create table public.snapshot_history (id uuid primary key default gen_random_uuid(), workspace_id uuid not null references public.workspaces(id) on delete cascade, user_id uuid not null references auth.users(id), payload jsonb not null, created_at timestamptz not null default now());
create index calendar_by_date on public.calendar_entries(workspace_id,scheduled_date);
create index engagement_by_status on public.engagement_items(workspace_id,status);
create index logs_by_time on public.agent_execution_logs(workspace_id,recorded_at desc);
alter table public.workspaces enable row level security;
create policy owner_read on public.workspaces for select to authenticated using(owner_id=auth.uid());
alter table public.workspace_snapshots enable row level security;
create policy owner_read on public.workspace_snapshots for select to authenticated using(user_id=auth.uid());
-- Writes go exclusively through the atomic SECURITY DEFINER RPC below.
do $$ declare t text; begin
 foreach t in array array['brand_profiles','social_accounts','content_posts','calendar_entries','engagement_items','crisis_alerts','approval_records','agent_execution_logs','analytics_snapshots','snapshot_history'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create policy owner_read on public.%I for select to authenticated using (exists(select 1 from public.workspaces w where w.id=workspace_id and w.owner_id=auth.uid()))',t);
 end loop;
end $$;
create or replace function public.save_workspace(payload jsonb) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare uid uuid := auth.uid(); wid uuid; item jsonb; b jsonb := payload->'brand';
begin
 if uid is null then raise exception 'Authentication required'; end if;
 if octet_length(payload::text)>2000000 or jsonb_typeof(payload->'posts')<>'array' or coalesce(length(b->>'name'),0)=0 then raise exception 'Invalid workspace payload'; end if;
 insert into workspaces(owner_id,name) values(uid,b->>'name') on conflict(owner_id) do update set name=excluded.name,updated_at=now() returning id into wid;
 -- Row lock serializes saves for the same owner. Explicit snapshots are last-save-wins.
 perform 1 from workspaces where id=wid for update;
 insert into workspace_snapshots(user_id,workspace_id,payload) values(uid,wid,payload) on conflict(user_id) do update set payload=excluded.payload,updated_at=now();
 insert into snapshot_history(workspace_id,user_id,payload) values(wid,uid,payload);
 insert into brand_profiles values(wid,b->>'name',b->>'voice',b->>'audience',b->>'industry',b->>'goals',b->>'prohibited',b->'channels') on conflict(workspace_id) do update set name=excluded.name,voice=excluded.voice,audience=excluded.audience,industry=excluded.industry,goals=excluded.goals,prohibited_phrases=excluded.prohibited_phrases,channels=excluded.channels;
 delete from social_accounts where workspace_id=wid;
 for item in select * from jsonb_array_elements(b->'channels') loop insert into social_accounts(workspace_id,channel) values(wid,item#>>'{}'); end loop;
 delete from content_posts where workspace_id=wid;
 for item in select * from jsonb_array_elements(payload->'posts') loop
 insert into content_posts values(wid,item->>'id',item->>'title',item->>'caption',item->>'hashtags',item->>'slides',item->>'channel',item->>'status');
 insert into calendar_entries values(wid,item->>'id',(item->>'date')::date);
 end loop;
 delete from engagement_items where workspace_id=wid;
 for item in select * from jsonb_array_elements(payload->'engagements') loop insert into engagement_items values(wid,item->>'id',item->>'author',item->>'channel',item->>'kind',item->>'text',item->>'category',item->>'reply',item->>'status',(item->>'receivedAt')::timestamptz,(item->>'respondedAt')::timestamptz); end loop;
 for item in select * from jsonb_array_elements(payload->'alerts') loop insert into crisis_alerts values(wid,item->>'id',item->>'engagementId',item->>'reason',item->>'status',item->>'owner'); end loop;
 for item in select * from jsonb_array_elements(payload->'approvals') loop insert into approval_records values(wid,item->>'id',item->>'targetId',item->>'decision',item->>'actor',(item->>'time')::timestamptz,item->>'content') on conflict do nothing; end loop;
 for item in select * from jsonb_array_elements(payload->'logs') loop insert into agent_execution_logs values(wid,item->>'id',item->>'tool',item->>'status',item->>'detail',(item->>'time')::timestamptz) on conflict do nothing; end loop;
 insert into analytics_snapshots(workspace_id,summary) values(wid,coalesce(payload->>'insight',''));
 return wid;
end $$;
revoke all on function public.save_workspace(jsonb) from public;
grant execute on function public.save_workspace(jsonb) to authenticated;
-- These records are demo backups, not an authorization source for real social delivery.
-- For production live delivery, enforce immutable revision approvals and role checks server-side.
