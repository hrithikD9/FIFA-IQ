-- FIFA-IQ: prediction grading + model versioning
-- Run in the Supabase SQL editor after supabase_schema.sql. Safe to re-run.

-- football-data.org match id when a prediction was made for a real fixture.
-- Lets the backend grade the prediction automatically once the match finishes.
alter table public.predictions
    add column if not exists external_match_id bigint;

-- Which model produced the probabilities (e.g. "baseline-0.1"), so accuracy can be
-- compared across model versions once the deep-learning model replaces the baseline.
alter table public.predictions
    add column if not exists model_version text;

create index if not exists idx_predictions_external_match_id
    on public.predictions (external_match_id)
    where external_match_id is not null;
