-- add users links clicks

-- Auto-update updatedAt on row changes.
create or replace function touchUpdatedAt()
returns trigger
language plpgsql
as $$
begin
  new.updatedAt = now();
  return new;
end;
$$;

create table users (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  email text not null unique,
  name text not null,
  passwordHash text not null
);

create trigger usersTouchUpdatedAt
  before update on users
  for each row execute function touchUpdatedAt();

create table links (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  userId uuid not null references users (id) on delete cascade,
  slug text not null unique,
  url text not null,
  title text not null default '',
  tags text[] not null default '{}',
  enabled boolean not null default true,
  expiresAt timestamptz,
  clicks integer not null default 0,
  lastClickedAt timestamptz
);

create index linksUserId on links (userId);

create trigger linksTouchUpdatedAt
  before update on links
  for each row execute function touchUpdatedAt();

create table clicks (
  id uuid primary key default uuidGenerateV7(),
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now(),
  linkId uuid not null references links (id) on delete cascade,
  referrer text not null default 'direct',
  country text not null default 'unknown',
  device text not null default 'desktop'
);

create index clicksLinkIdCreatedAt on clicks (linkId, createdAt);

create trigger clicksTouchUpdatedAt
  before update on clicks
  for each row execute function touchUpdatedAt();

-- A Date crosses the wire as { $type, $value } in milliseconds.
create or replace function jsDate(ts timestamptz) returns json
language sql immutable as $$
  select case
    when ts is null then 'null'::json
    else json_build_object('$type', 'Date', '$value', (extract(epoch from ts) * 1000)::bigint)
  end;
$$;

-- The redirect bumps the count with plain sql, so the trigger is what makes
-- that write reach the owner's open dashboard. Edits through the LiveTable
-- broadcast themselves and never set clicks.
create or replace function linksClicksNotify() returns trigger
language plpgsql as $$
declare
  payload text;
begin
  payload := json_build_object(
    'op', 'update',
    'data', json_build_object(
      'id', new.id,
      'userId', new.userId,
      'slug', new.slug,
      'url', new.url,
      'title', new.title,
      'tags', to_json(new.tags),
      'enabled', new.enabled,
      'expiresAt', jsDate(new.expiresAt),
      'clicks', new.clicks,
      'lastClickedAt', jsDate(new.lastClickedAt),
      'createdAt', jsDate(new.createdAt)
    )
  )::text;

  if octet_length(payload) >= 8000 then
    payload := json_build_object('op', 'update', 'id', new.id)::text;
  end if;

  perform pg_notify(channel_name('links:userId=' || new.userId), payload);

  return new;
end;
$$;

create trigger linksClicksNotifyTrigger
  after update of clicks on links
  for each row execute function linksClicksNotify();
