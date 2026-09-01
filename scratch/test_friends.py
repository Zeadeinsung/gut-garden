# -*- coding: utf-8 -*-
import json, urllib.request, urllib.error

BASE = 'http://localhost:3001'

def req(path, body=None, token=None):
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    headers = {'Content-Type': 'application/json'}
    if token: headers['Authorization'] = 'Bearer ' + token
    r = urllib.request.Request(url, data=data, headers=headers, method='POST' if body is not None else 'GET')
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        print('  !! HTTP', e.code, e.read().decode()[:800])
        raise

phone = '13800000003'   # 小刚
print('== 1. send-code (小刚) ==')
r = req('/api/auth/send-code', {'phone': phone})
code = r['data']['code']
print('code =', code)

print('== 2. verify-code ==')
r = req('/api/auth/verify-code', {'phone': phone, 'code': code})
token = r['data']['token']
user = r['data']['user']
print('parent_id =', user['parent_id'])
print('children =', [(c['id'], c['name']) for c in user['children']])
if not user['children']:
    print('!! 没有 children —— 说明数据库里没有这个账号的数据')
    raise SystemExit
child_id = user['children'][0]['id']

print('== 3. GET /api/friends ==')
r = req('/api/friends?child_id=%d' % child_id, token=token)
friends = r['data']
print('friend count =', len(friends))
for f in friends:
    print('  - id=%s %s [%s] 打卡%d 徽章%d' % (f['id'], f['name'], f['stage_label'], f['checkin_days'], f['badge_count']))
