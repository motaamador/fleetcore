import fs from 'fs'

const env = fs.readFileSync('.env.local', 'utf-8')
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)

if (urlMatch && keyMatch) {
  const res = await fetch(`${urlMatch[1].trim()}/rest/v1/vehicles?select=id,status,current_lat,current_lng`, {
    headers: {
      apikey: keyMatch[1].trim(),
      Authorization: `Bearer ${keyMatch[1].trim()}`
    }
  })
  const json = await res.json()
  console.log('Vehicles from DB:', json)
}
