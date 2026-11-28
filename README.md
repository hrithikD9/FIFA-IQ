# FIFA-IQ

FIFA-IQ is a football intelligence web app: live and recent football data (fixtures, results, live scores, teams, players) plus match outcome prediction for international matches, with user and admin dashboards.

## Features

- **Fixtures, Results & Scorecards, Live Scores**: real data from football-data.org, with head-to-head records.
- **Teams and Players**: club profiles, squads, league tables, top scorers and player profiles (photos and bios from TheSportsDB). FC Barcelona is the featured club.
- **Match Prediction** (international matches only): home / draw / away probabilities. Predictions can be saved and are **graded automatically** against real results. A built-in **model check** grades the active model on the latest World Cup.
- **User dashboard**: your prediction history and grades, the featured club, upcoming fixtures and recent results.
- **Admin dashboard**: users, prediction activity, model accuracy and external API health.

> **Prediction model:** the active model is a *baseline rating formula* (`baseline-0.1`) that covers six national teams. A deep-learning model is in development and will replace it behind the same interface (`backend/app/services/predictor.py`).

## Project structure

| Path | What it is |
|---|---|
| `frontend/` | React 19 + Vite + Tailwind CSS single-page app |
| `backend/` | FastAPI API (Python), Supabase for auth and data |
| `backend/supabase_*.sql` | Database schema and migrations (run in the Supabase SQL editor) |
| `backend/tests/` | Backend tests (pytest) |

## Setup

### 1. Accounts and keys

- A **Supabase** project (database and authentication).
- A free **football-data.org** API key: <https://www.football-data.org/client/register>.
- TheSportsDB needs no key (its public free key is used).

### 2. Database

In the Supabase SQL editor, run these files **in order** (each is safe to re-run):

1. `backend/supabase_schema.sql`: teams, matches, predictions and access policies
2. `backend/supabase_football_api.sql`: football API cache and request log
3. `backend/supabase_predictions_grading.sql`: prediction grading and model versions

### 3. Backend

Create `backend/.env`:

```env
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service role key>    # server only, never in the frontend
FOOTBALL_DATA_API_KEY=<football-data.org key>
# Optional
CORS_ORIGINS=http://localhost:5173              # comma-separated allowed origins
FOOTBALL_WARMUP=1                               # background cache warm-up (0 to disable)
```

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000
```

The API runs at <http://localhost:8000>; interactive docs are at <http://localhost:8000/docs>.

### 4. Frontend

Create `frontend/.env`:

```env
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon / publishable key>
VITE_API_BASE_URL=http://localhost:8000/api/v1   # optional, this is the default
```

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>.

### 5. Make an admin

Admin access comes from server-controlled metadata. In the Supabase SQL editor:

```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
where email = '<your email>';
```

Sign out and back in for it to take effect. Admins see `/admin`; regular users see `/dashboard`.

## Tests and checks

From the repository root:

```bash
npm run lint            # frontend ESLint
npm run build           # frontend production build
npm run test:frontend   # frontend unit tests (Vitest)
npm run test:backend    # backend tests (pytest; activate backend/venv first)
```

## Free data tier limits

football-data.org's free plan allows **10 requests per minute**, has **delayed** (not real-time) scores, and no lineups, goal scorers, match statistics or national-team profiles. The backend caches every response (memory + Supabase), rate-limits itself, serves the last saved copy if the provider fails, and refreshes common data in the background. The app labels data the free tier cannot provide instead of showing invented numbers.

## Security notes

- Keep `.env` files out of version control (they are git-ignored).
- The service role key bypasses database row-level security, so it must only ever be used by the backend.
- All football endpoints require a signed-in user, so anonymous traffic cannot use up the API quota.
