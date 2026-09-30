-- demo seed: two users, twenty links, three months of clicks
/** @env development */

select setseed(0.42);

insert into users (email, name, passwordHash) values
  ('ada@shortwick.test', 'Ada Lovelace', crypt('shortwick-demo', genSalt('bf', 12))),
  ('grace@shortwick.test', 'Grace Hopper', crypt('shortwick-demo', genSalt('bf', 12)));

create temp table seedLinks (
  owner text,
  slug text,
  url text,
  title text,
  tags text[],
  enabled boolean,
  ageDays int,
  expiresInDays int,
  stopDaysAgo int,
  weight numeric,
  topReferrer text,
  spikeDaysAgo int
);

insert into seedLinks values
  ('ada', 'launch', 'https://brightloom.example/blog/launch-week', 'Launch week post', '{launch,blog}', true, 95, null, 0, 6, 'hackerdesk.example', 62),
  ('ada', 'docs', 'https://docs.brightloom.example/', 'Docs home', '{docs}', true, 94, null, 0, 5, 'search.example', null),
  ('ada', 'pricing-q3', 'https://brightloom.example/pricing?utm_source=chirp', 'Pricing page, Q3 campaign', '{campaign,marketing}', true, 70, null, 0, 4, 'chirp.example', 30),
  ('ada', 'talk-slides', 'https://slides.example/ada/reactive-sql', 'Conference talk slides', '{talks}', true, 60, null, 0, 2.5, 'worknet.example', 45),
  ('ada', 'hiring', 'https://brightloom.example/careers/frontend-engineer', 'Frontend engineer role', '{hiring}', true, 50, null, 0, 3, 'worknet.example', null),
  ('ada', 'newsletter-42', 'https://letters.example/ada/archive/42', 'Newsletter #42', '{newsletter}', true, 40, null, 0, 3, 'letters.example', 38),
  ('ada', 'gh', 'https://codehub.example/brightloom/shortwick', 'Source code', '{oss}', true, 88, null, 0, 3, 'codehub.example', null),
  ('ada', 'survey', 'https://forms.example.com/user-survey-2026', 'User survey 2026', '{research}', true, 25, 10, 0, 2, 'direct', null),
  ('ada', 'webinar', 'https://brightloom.example/webinar/postgres-live', 'Webinar signup', '{events,marketing}', true, 45, -5, 5, 2.5, 'worknet.example', null),
  ('ada', 'summer-sale', 'https://brightloom.example/summer-sale', 'Summer sale', '{campaign}', false, 92, null, 30, 3.5, 'chirp.example', null),
  ('ada', 'ep118', 'https://podcasts.example.com/episodes/118', 'Podcast episode 118', '{talks,audio}', true, 33, null, 0, 1.8, 'threads.example', null),
  ('ada', 'changelog', 'https://brightloom.example/changelog', 'Changelog', '{blog}', true, 91, null, 0, 2.2, 'direct', null),
  ('grace', 'cobol', 'https://example.org/guides/cobol-modernization', 'COBOL modernization guide', '{guides}', true, 93, null, 0, 3.5, 'search.example', null),
  ('grace', 'nanosecond', 'https://video.example/watch/nanosecond-lecture', 'Nanosecond lecture', '{video,talks}', true, 90, null, 0, 5, 'threads.example', 55),
  ('grace', 'meetup-oct', 'https://meetups.example/navy-devs/october', 'October meetup', '{events}', true, 20, 20, 0, 1.5, 'direct', null),
  ('grace', 'reading', 'https://example.org/reading-list', 'Reading list', '{personal}', true, 80, null, 0, 1.2, 'direct', null),
  ('grace', 'compilers', 'https://example.org/posts/first-compiler', 'The first compiler', '{blog}', true, 75, null, 0, 3.5, 'hackerdesk.example', 12),
  ('grace', 'office-hours', 'https://calendar.example/grace/mentoring', 'Mentoring office hours', '{personal}', true, 66, null, 0, 1, 'worknet.example', null),
  ('grace', 'first-bug', 'https://example.org/posts/first-bug', 'The first actual bug', '{blog}', true, 58, null, 0, 4, 'chirp.example', 21),
  ('grace', 'archive', 'https://example.org/archive', 'Old archive', '{archive}', false, 89, null, 40, 1, 'direct', null);

insert into links (userId, slug, url, title, tags, enabled, expiresAt, createdAt)
  select u.id,
         s.slug,
         s.url,
         s.title,
         s.tags,
         s.enabled,
         case when s.expiresInDays is null then null else now() + make_interval(days => s.expiresInDays) end,
         now() - make_interval(days => s.ageDays)
    from seedLinks s
    join users u on u.email = s.owner || '@shortwick.test';

-- One row per click. Each link gets a daily volume from its weight, a slow
-- upward trend, quieter weekends, and a launch spike where it has one.
insert into clicks (linkId, createdAt, referrer, country, device)
  select l.id,
         least(d.day + random() * interval '1 day' + n * interval '0 second', now() - random() * interval '10 minutes'),
         (array[s.topReferrer, s.topReferrer, s.topReferrer, s.topReferrer,
                'direct', 'direct', 'direct', 'search.example', 'search.example', 'chirp.example',
                'hackerdesk.example', 'worknet.example', 'threads.example', 'codehub.example',
                'lookup.example'])[1 + floor(random() * 15 + n * 0)::int],
         (array['US', 'US', 'US', 'US', 'US', 'US', 'US', 'US',
                'GB', 'GB', 'GB', 'DE', 'DE', 'DE', 'IN', 'IN', 'IN',
                'CA', 'CA', 'FR', 'FR', 'BR', 'BR', 'JP', 'AU', 'NL', 'SE', 'ES'])[1 + floor(random() * 28 + n * 0)::int],
         (array['desktop', 'desktop', 'desktop', 'desktop', 'desktop', 'desktop',
                'desktop', 'desktop', 'desktop', 'desktop', 'desktop',
                'mobile', 'mobile', 'mobile', 'mobile', 'mobile', 'mobile',
                'mobile', 'mobile', 'tablet'])[1 + floor(random() * 20 + n * 0)::int]
    from links l
    join seedLinks s on s.slug = l.slug
    cross join lateral generate_series(
      greatest(date_trunc('day', l.createdAt), date_trunc('day', now()) - interval '90 days'),
      date_trunc('day', now()) - make_interval(days => s.stopDaysAgo),
      interval '1 day'
    ) as d(day)
    cross join lateral generate_series(1, floor(
      s.weight
      * (0.4 + random())
      * (0.55 + 0.45 * extract(epoch from d.day - (now() - interval '90 days')) / extract(epoch from interval '90 days'))
      * (case when extract(isodow from d.day) in (6, 7) then 0.55 else 1 end)
      * (case
           when s.spikeDaysAgo is null then 1
           when d.day = date_trunc('day', now()) - make_interval(days => s.spikeDaysAgo) then 9
           when d.day = date_trunc('day', now()) - make_interval(days => s.spikeDaysAgo - 1) then 4
           when d.day = date_trunc('day', now()) - make_interval(days => s.spikeDaysAgo - 2) then 2
           else 1
         end)
    )::int) as n;

update links l
   set clicks = c.total,
       lastClickedAt = c.latest
  from (select linkId, count(*) as total, max(createdAt) as latest from clicks group by linkId) c
 where c.linkId = l.id;

drop table seedLinks;
