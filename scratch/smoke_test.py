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
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

phone = '13800000003'  # 小刚
code = req('/api/auth/send-code', {'phone': phone})[1]['data']['code']
_, v = req('/api/auth/verify-code', {'phone': phone, 'code': code})
tok = v['data']['token']
cid = v['data']['user']['children'][0]['id']

paths = [
    ('GET /api/children',            '/api/children'),
    ('GET /api/garden/state',        '/api/garden/state?child_id=%d' % cid),
    ('GET /api/checkin/today',       '/api/checkin/today?child_id=%d' % cid),
    ('GET /api/checkin/calendar',    '/api/checkin/calendar?child_id=%d' % cid),
    ('GET /api/badges/awarded',      '/api/badges/awarded?child_id=%d' % cid),
    ('GET /api/badges/defs',         '/api/badges/defs'),
    ('GET /api/classroom/modules',   '/api/classroom/modules?child_id=%d' % cid),
    ('GET /api/report/weekly',       '/api/report/weekly?child_id=%d' % cid),
    ('GET /api/stool/latest',        '/api/stool/latest?child_id=%d' % cid),
    ('GET /api/garden/actions/today-count', '/api/garden/actions/today-count?child_id=%d' % cid),
]

for name, p in paths:
    st, body = req(p, token=tok)
    err = '' if st == 200 else ('  !! ' + body.get('message', ''))
    print('%s -> %s%s' % (name, st, err))
