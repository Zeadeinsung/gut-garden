// Seed two test accounts via the real login flow (SMS code mocked to server log).
// Phase 1 (no SMS_CODE): sends codes for both phones → read both from the server log.
// Phase 2 (SMS_CODE=a,b): verifies both, creates a child for each, prints summary.
const BASE = 'http://localhost:3000/api'

const ACCOUNTS = [
  { phone: process.env.ADMIN_PHONE || '13800008888', role: 'admin', name: '甜甜', age: 5 },
  { phone: process.env.PARENT_PHONE || '13900001111', role: 'parent', name: '豆豆', age: 6 },
]

const j = (res) => res.json()

async function main() {
  const codesEnv = (process.env.SMS_CODE || '').split(',').map((s) => s.trim())
  const hasCodes = codesEnv.length === 2 && codesEnv.every(Boolean)

  if (!hasCodes) {
    for (const a of ACCOUNTS) {
      const r = await j(await fetch(`${BASE}/auth/send-code`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: a.phone }) }))
      console.log(`SMS_CODE_NEEDED_FOR=${a.phone}`)
      if (r.code !== 0) console.log(`  send-code ${a.phone}:`, JSON.stringify(r))
    }
    console.log('\n  ⏭ read both codes from server log, then run again with SMS_CODE=<admin>,<parent>')
    return
  }

  for (let i = 0; i < ACCOUNTS.length; i++) {
    const a = ACCOUNTS[i]
    const code = codesEnv[i]
    const verify = await j(await fetch(`${BASE}/auth/verify-code`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: a.phone, code }) }))
    const token = verify?.data?.token
    if (!token) { console.log(`  ❌ verify ${a.phone} failed:`, JSON.stringify(verify)); continue }
    const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    console.log(`  ✅ ${a.phone} (${a.role}) verified`)

    let childId = verify.data.user?.active_child_id
    if (!childId) {
      const child = await j(await fetch(`${BASE}/children`, { method: 'POST', headers: auth, body: JSON.stringify({ nickname: a.name, age: a.age }) }))
      childId = child?.data?.id
      console.log(`    ✅ created child ${a.name} id=${childId}`)
    } else {
      console.log(`    (existing child id=${childId})`)
    }

    // Verify admin role reaches the admin endpoint
    if (a.role === 'admin') {
      const cron = await j(await fetch(`${BASE}/admin/cron/daily-reset`, { method: 'POST', headers: auth, body: JSON.stringify({}) }))
      console.log(`    🔐 admin cron → ${JSON.stringify(cron.data || cron.code)}`)
    }
  }
  console.log('\nDONE.')
}

main().catch((e) => { console.error(e); process.exit(1) })
