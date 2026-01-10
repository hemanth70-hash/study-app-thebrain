# StudyApp – TheBrain

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a Supabase project.

3. In `/src/supabaseClient.js`, add:
   ```js
   const supabaseUrl = "YOUR_SUPABASE_URL"
   const supabaseKey = "YOUR_SUPABASE_ANON_KEY"
   ```

4. Run database SQL schema provided below inside Supabase SQL editor.

5. Start app:
   ```bash
   npm run dev
   ```

## Supabase SQL Schema

```sql
create table profiles (
  id uuid primary key default uuid_generate_v4(),
  username text unique,
  is_admin boolean default false
);

create table questions (
  id bigint generated always as identity primary key,
  subject text,
  question text,
  options jsonb,
  correct_option int
);

create table mocks (
  id bigint generated always as identity primary key,
  subject text,
  duration int
);

create table scores (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id),
  mock_id bigint references mocks(id),
  score int,
  percentage float,
  created_at timestamp default now()
);
```
