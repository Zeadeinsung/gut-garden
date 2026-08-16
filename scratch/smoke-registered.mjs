// Registered-flow smoke test — exercises exactly what the frontend wiring calls.
const BASE = 'http://localhost:3000/api'
const PHONE = process.env.SMOKE_PHONE || '1390000' + String(Date.now()).slice(-6)

let pass = 0, fail = 0
function check(label, cond, detail = '') {
  if (cond) { pass++; console.log(`  ✅ ${label}`) }
  else { fail++; console.log(`  ❌ ${label} ${detail}`) }
}

async function main() {
  // 1. send-code (needs the code; we read it from the server log via grep in bash, so print it)
  const send = await (await fetch(`${BASE}/auth/send-code`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: PHONE }) })).json()
  console.log(`SMS_CODE_NEEDED_FOR=${PHONE}`)
  check('send-code', send.code === 0, JSON.stringify(send))

  // 2. verify-code — we substitute the code read from log below
  const code = process.env.SMS_CODE
  if (!code) { console.log('  ⏭ verify-code skipped (no SMS_CODE env)'); return }
  const verify = await (await fetch(`${BASE}/auth/verify-code`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: PHONE, code }) })).json()
  const token = verify?.data?.token
  check('verify-code returns token', verify.code === 0 && !!token)
  const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  // 3. create child
  const child = await (await fetch(`${BASE}/children`, { method: 'POST', headers: auth, body: JSON.stringify({ nickname: '小明', age: 6 }) })).json()
  const childId = child?.data?.id
  check('create child', child.code === 0 && !!childId, JSON.stringify(child))
  console.log(`  CHILD_ID=${childId}`)

  // 4. checkin/today (what useApiSync calls)
  const today = await (await fetch(`${BASE}/checkin/today?child_id=${childId}`, { headers: auth })).json()
  check('checkin/today', today.code === 0 && Array.isArray(today.data.tasks) && today.data.tasks.length === 5, JSON.stringify(today))

  // 5. confirm-task (what CheckinPage.toggleTask calls)
  const confirm = await (await fetch(`${BASE}/checkin/confirm-task`, { method: 'POST', headers: auth, body: JSON.stringify({ child_id: childId, task_code: 'eat' }) })).json()
  check('confirm-task eat', confirm.code === 0 && confirm.data.tasks.find(t => t.code === 'eat').status === 'done', JSON.stringify(confirm))

  // 6. garden/log-action (what useFeedLogic.handleDrop calls)
  const feed = await (await fetch(`${BASE}/garden/log-action`, { method: 'POST', headers: auth, body: JSON.stringify({ child_id: childId, action_type: 'feed', action_detail: { food_type: 'broccoli' } }) })).json()
  check('log-action feed', feed.code === 0 && feed.data.garden_xp >= 2 && feed.data.interaction_count >= 1, JSON.stringify(feed))

  // 7. stool/select-icon (what StoolModal.handleConfirm calls)
  const stool = await (await fetch(`${BASE}/stool/select-icon`, { method: 'POST', headers: auth, body: JSON.stringify({ child_id: childId, bristol_type: 4 }) })).json()
  check('select-icon', stool.code === 0 && stool.data.bristol_type === 4, JSON.stringify(stool))

  // 8. report/monthly (what ReportPage fetches)
  const report = await (await fetch(`${BASE}/report/monthly?child_id=${childId}`, { headers: auth })).json()
  check('report/monthly', report.code === 0 && report.data && report.data.checkin_rate >= 0, JSON.stringify(report))

  // 9. classroom/modules (what useApiSync calls)
  const mods = await (await fetch(`${BASE}/classroom/modules?child_id=${childId}`, { headers: auth })).json()
  check('classroom/modules', mods.code === 0 && Array.isArray(mods.data), JSON.stringify(mods).slice(0, 120))

  // 10. badges/awarded (what useApiSync calls)
  const badges = await (await fetch(`${BASE}/badges/awarded?child_id=${childId}`, { headers: auth })).json()
  check('badges/awarded', badges.code === 0, JSON.stringify(badges))

  // 11. ai/chat SSE (what AIChatModal calls)
  const aiRes = await fetch(`${BASE}/ai/chat`, { method: 'POST', headers: { ...auth }, body: JSON.stringify({ message: '为什么要吃蔬菜？' }) })
  const aiText = await aiRes.text()
  check('ai/chat SSE', aiRes.status === 200 && aiText.includes('data:'), aiText.slice(0, 160))

  console.log(`\nRESULT: ${pass} passed, ${fail} failed`)
  process.exit(fail ? 1 : 0)
}

main().catch((e) => { console.error(e); process.exit(1) })
