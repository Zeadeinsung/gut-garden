// Demo account + sample data seeder. Two-phase: run once without SMS_CODE to send the code,
// read the 6-digit code from the server log, then run again with SMS_CODE=<code>.
const BASE = 'http://localhost:3000/api'
const PHONE = process.env.SMOKE_PHONE || '13800006666'
const NAME = '小明'

async function j(res) { return res.json() }

async function main() {
  const code = process.env.SMS_CODE
  if (code) {
    // Skip re-sending when a code is already provided — avoids the 60s AUTH_002 throttle.
  } else {
    const send = await j(await fetch(`${BASE}/auth/send-code`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: PHONE }) }))
    console.log(`SMS_CODE_NEEDED_FOR=${PHONE}`)
    if (send.code !== 0) { console.log('  send-code:', JSON.stringify(send)); return }
    console.log('  ⏭ read the 6-digit code from the server log, then run again with SMS_CODE to finish')
    return
  }

  const verify = await j(await fetch(`${BASE}/auth/verify-code`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: PHONE, code }) }))
  const token = verify?.data?.token
  if (!token) { console.log('  verify failed:', JSON.stringify(verify)); return }
  const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  console.log('  ✅ verified, token ok')

  let childId = verify.data.user?.active_child_id
  if (!childId) {
    const child = await j(await fetch(`${BASE}/children`, { method: 'POST', headers: auth, body: JSON.stringify({ nickname: NAME, age: 6 }) }))
    childId = child?.data?.id
    console.log(`  ✅ created child id=${childId}`)
  }

  const post = (path, body) => fetch(`${BASE}${path}`, { method: 'POST', headers: auth, body: JSON.stringify(body) }).then(j)

  // Garden feeds — 5 healthy + 1 candy for state variety
  for (const food of ['broccoli', 'yogurt', 'apple', 'corn', 'carrot', 'candy']) {
    const r = await post('/garden/log-action', { child_id: childId, action_type: 'feed', action_detail: { food_type: food } })
    console.log(`  🥗 feed ${food} → xp=${r.data?.garden_xp} state=${r.data?.current_state}`)
  }

  // Checkin — confirm the 4 confirmable tasks (explore auto-dones after 6 interactions)
  for (const code of ['eat', 'sleep', 'water', 'sport']) {
    const r = await post('/checkin/confirm-task', { child_id: childId, task_code: code })
    console.log(`  ✅ confirm ${code} → streak=${r.data?.streak} makeups_used=${r.data?.makeups_used}`)
  }

  // Stool — healthy banana (type 4)
  const stool = await post('/stool/select-icon', { child_id: childId, bristol_type: 4 })
  console.log(`  💩 select-icon type4 → diagnosis=${stool.data?.diagnosis}`)

  // Makeup for 3 past days (yesterday, -2, -3)
  for (let i = 1; i <= 3; i++) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const r = await post('/checkin/makeup', { child_id: childId, calendar_date: date })
    console.log(`  🔧 makeup ${date} → streak=${r.data?.streak} makeups_used=${r.data?.makeups_used}`)
  }

  // Classroom quizzes — answer fiber_square questions correctly
  const quizAnswers = [
    { question_id: 'fiber_square_q1', answer: 1 },
    { question_id: 'fiber_square_q2', answer: [0, 1, 2] },
    { question_id: 'fiber_square_q3', answer: [1, 2, 0] },
  ]
  for (const q of quizAnswers) {
    const r = await post('/classroom/quiz/answer', { child_id: childId, question_id: q.question_id, answer: q.answer })
    console.log(`  🧠 ${q.question_id} → correct=${r.data?.correct}`)
  }

  // Trigger daily-reset to backfill calendar + snapshot
  const cron = await post('/admin/cron/daily-reset', {})
  console.log(`  🕐 daily-reset → ${JSON.stringify(cron.data)}`)

  // Final report to confirm data exists
  const report = await j(await fetch(`${BASE}/report/monthly?child_id=${childId}`, { headers: auth }))
  const d = report.data
  console.log('\n  === 月报汇总 ===')
  if (d) {
    console.log(`  打卡天数=${d.active_days} 最长连续=${d.max_streak} 投喂=${d.feed_count} 便便=${d.stool_count}`)
    console.log(`  徽章=${d.badges.total} 问答正确率=${d.quiz_accuracy}% 模块=${d.modules_completed}/5 阶段=${d.stage_label}`)
  } else {
    console.log('  暂无数据')
  }
  console.log(`\n  DONE. 手机号: ${PHONE}  (登录时点“发送验证码”，验证码在服务端控制台/server-dev.log)`)
}

main().catch((e) => { console.error(e); process.exit(1) })
