# Setup Instructions

## Environment Variables

Before running the application, you need to create a `.env.local` file in the project root with your Supabase credentials:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Database Schema

You need to create the following tables in your Supabase database:

### 1. Profiles Table
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  total_earnings DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see only their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### 2. Events Table
```sql
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  event_name TEXT NOT NULL,
  metric_1 DECIMAL NOT NULL,
  metric_2 DECIMAL NOT NULL,
  calculated_score DECIMAL NOT NULL,
  calculated_token_amount DECIMAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see only their own events
CREATE POLICY "Users can view own events" ON events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events" ON events
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 3. Function to Update Total Earnings (Optional)
```sql
-- Function to automatically update total earnings when a new event is added
CREATE OR REPLACE FUNCTION update_total_earnings()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the user's total earnings
  INSERT INTO profiles (id, email, total_earnings)
  VALUES (
    NEW.user_id, 
    (SELECT email FROM auth.users WHERE id = NEW.user_id),
    NEW.calculated_token_amount
  )
  ON CONFLICT (id) 
  DO UPDATE SET 
    total_earnings = profiles.total_earnings + NEW.calculated_token_amount;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_earnings_trigger
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_total_earnings();
```

## Running the Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up your `.env.local` file with Supabase credentials

3. Create the database tables using the SQL above

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser


