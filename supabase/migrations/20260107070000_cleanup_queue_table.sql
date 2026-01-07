-- Cleanup Queue Table for Ephemeral Storage Management
-- Tracks scheduled asset deletions with 24-hour retention policy

create table if not exists cleanup_queue (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  asset_type text not null check (asset_type in ('final-video', 'intermediate-audio', 'intermediate-video')),
  asset_url text not null,
  scheduled_deletion_at timestamptz not null,
  status text default 'pending' check (status in ('pending', 'completed', 'failed')),
  error_message text,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- Index for efficient scheduled deletion queries
create index idx_cleanup_queue_scheduled on cleanup_queue(scheduled_deletion_at, status);
create index idx_cleanup_queue_project on cleanup_queue(project_id);

-- RLS Policies
alter table cleanup_queue enable row level security;

create policy "Users can view their own cleanup queue"
  on cleanup_queue for select
  using (auth.uid() = user_id);

create policy "System can manage cleanup queue"
  on cleanup_queue for all
  using (true);

-- Function to automatically schedule final video deletion after creation
create or replace function schedule_video_deletion()
returns trigger as $$
begin
  if new.video_url is not null and old.video_url is null then
    insert into cleanup_queue (
      project_id,
      user_id,
      asset_type,
      asset_url,
      scheduled_deletion_at
    ) values (
      new.id,
      new.user_id,
      'final-video',
      new.video_url,
      now() + interval '24 hours'
    );
  end if;
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-schedule deletion when video URL is set
create trigger trigger_schedule_video_deletion
  after update on projects
  for each row
  execute function schedule_video_deletion();

comment on table cleanup_queue is 'Manages ephemeral storage with 24-hour retention for final videos and immediate cleanup for intermediate files';