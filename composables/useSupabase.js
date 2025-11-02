import { createClient } from '@supabase/supabase-js';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnbWl4eWxid3JoZ2F6cW5xeGxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMzA4OTUsImV4cCI6MjA3NzYwNjg5NX0.PPHC97gCkSvr8OxDc7tt2fUnb0-WcId0VghvyH8NLJ0';
const SUPABASE_URL = 'https://qgmixylbwrhgazqnqxlj.supabase.co';
const useSupabase = () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  return {
    supabase,
  };
};
export default useSupabase;
