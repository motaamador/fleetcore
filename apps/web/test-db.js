import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function check() {
  const { data, error } = await supabase.from('vehicles').select('*')
  console.log(error || `Found ${data.length} vehicles. Lat/Lng of first:`, data[0]?.current_lat, data[0]?.current_lng)
}
check()
