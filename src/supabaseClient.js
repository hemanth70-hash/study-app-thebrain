import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://auvfnfgsieqgewsgzyyx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1dmZuZmdzaWVxZ2V3c2d6eXl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMzAxOTAsImV4cCI6MjA4MzYwNjE5MH0.x-jMkMGEVmbtwvHeRJDjCPyPVBi5DlVaMOQjAPN2N4c'

export const supabase = createClient(supabaseUrl, supabaseKey)