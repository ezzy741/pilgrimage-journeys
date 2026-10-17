#!/usr/bin/env python3
"""Run against a built stage only, using temporary synthetic data and credentials."""
import json, os, secrets, shutil, socket, subprocess, sys, tempfile, time, urllib.request, urllib.error, uuid
from pathlib import Path
from datetime import datetime, timedelta, timezone

release=Path(sys.argv[1]).resolve()
node=os.environ.get('NODE_BINARY') or shutil.which('node')
if not node: raise SystemExit('Node.js 22.18+ is required')
root=Path(tempfile.mkdtemp(prefix='hijaz-booking-test-'))
os.chmod(root,0o700)
data=root/'records'
key=secrets.token_urlsafe(48)
with socket.socket() as sock:
    sock.bind(('127.0.0.1',0)); port=sock.getsockname()[1]
base=f'http://127.0.0.1:{port}'
process=None
log=open(root/'server.log','w')
os.chmod(root/'server.log',0o600)

def stop():
    global process
    if process:
        process.terminate()
        try: process.wait(timeout=8)
        except subprocess.TimeoutExpired: process.kill(); process.wait(timeout=5)
        process=None

def start(auth=True):
    global process
    env=os.environ.copy()
    for name in ('BOOKING_ADMIN_TOKEN','BOOKING_ADMIN_TOKEN_FILE','BOOKING_TRUST_PROXY'):
        env.pop(name,None)
    env.update(HOST='127.0.0.1',NITRO_HOST='127.0.0.1',PORT=str(port),NITRO_PORT=str(port),BOOKING_DATA_DIR=str(data))
    if auth: env['BOOKING_ADMIN_TOKEN']=key
    process=subprocess.Popen([node,'.output/server/index.mjs'],cwd=release,env=env,stdout=log,stderr=log)
    for _ in range(60):
        if process.poll() is not None: raise AssertionError('Stage server exited before readiness')
        try:
            with urllib.request.urlopen(base+'/',timeout=2) as r:
                if r.status==200:return
        except (urllib.error.URLError,TimeoutError): pass
        time.sleep(.25)
    raise AssertionError('Stage not ready')

def request(path,method='GET',body=None,auth=False,origin=True,raw=None):
    host='admin.visit-hijaz.com' if path.startswith('/api/admin/') else 'visit-hijaz.com'
    headers={'Host':host}
    if origin: headers['Origin']='https://'+host if origin is True else origin
    if auth: headers['Authorization']='Bearer '+(key if auth is True else auth)
    if body is not None or raw is not None: headers['Content-Type']='application/json'
    payload=raw if raw is not None else json.dumps(body).encode() if body is not None else None
    req=urllib.request.Request(base+path,data=payload,headers=headers,method=method)
    try: response=urllib.request.urlopen(req,timeout=10)
    except urllib.error.HTTPError as exc: response=exc
    with response:
        content=response.read(); kind=response.headers.get('Content-Type','')
        result=json.loads(content) if 'application/json' in kind else content.decode(errors='replace')
        return response.status,result,response.headers

def check(label,condition):
    assert condition,label
    print('PASS',label,flush=True)

def payload(**changes):
    body=dict(idempotencyKey=str(uuid.uuid4()),customerName='TEST Booking Persistence',phone='+966500000000',zone='makkah',vehicle='sedan',stopIds=['nour'],pickupText='',departure={'lat':21.422882,'lng':39.825734},destination=None,pickupAt=(datetime.now(timezone(timedelta(hours=3)))+timedelta(days=2)).isoformat(timespec='seconds'),notes='Synthetic test only',promoCode='',consent=True)
    body.update(changes); return body

try:
    start(auth=False)
    status,_,_=request('/api/bookings','POST',payload())
    check('missing admin configuration fails closed',status==503)
    stop(); start()
    status,_,_=request('/api/admin/bookings',origin=False)
    check('private booking list rejects anonymous access',status==401)
    status,_,_=request('/api/admin/bookings',auth='incorrect-key',origin=False)
    check('private booking list rejects wrong key',status==401)
    status,_,_=request('/api/bookings','POST',payload(),origin=False)
    check('missing Origin rejected',status==403)
    status,_,_=request('/api/bookings','POST',payload(),origin='https://evil.example')
    check('cross-origin write rejected',status==403)
    original=payload()
    status,receipt,headers=request('/api/bookings','POST',original)
    check('customer booking durably accepted',status==201 and receipt.get('reference') and receipt.get('id'))
    check('server-owned fare and pending review',receipt['estimatedFare']==178 and receipt['status']=='pending_review')
    check('receipt omits customer contact data','phone' not in receipt and 'customerName' not in receipt)
    check('booking response is not cacheable','no-store' in headers.get('Cache-Control',''))
    status,duplicate,_=request('/api/bookings','POST',original)
    check('same request retry cannot duplicate booking',status==200 and duplicate['id']==receipt['id'])
    status,_,_=request('/api/bookings','POST',{**original,'notes':'Changed content'})
    check('same key with changed payload rejected',status==409)
    for label,body in [('client fare tampering',payload(estimatedFare=0)),('unknown stop',payload(stopIds=['not-real'])),('out-of-region coordinate',payload(destination={'lat':0,'lng':0})),('combo promo on single-city ride',payload(promoCode='ZIYARAT20')),('past pickup',payload(pickupAt='2020-01-01T10:00:00+03:00'))]:
        status,_,_=request('/api/bookings','POST',body)
        check(label+' rejected',status in (400,422))
    status,_,_=request('/api/bookings','POST',raw=b'{"x":"'+b'a'*18000+b'"}')
    check('oversized body rejected',status==413)
    status,custom,_=request('/api/bookings','POST',payload(destination={'lat':21.45,'lng':39.85}))
    check('custom map destination stays quote-only',status==201 and custom['estimatedFare'] is None and custom['status']=='quote_requested')
    patch={'departure':{'lat':21.422882,'lng':39.825734},'destination':{'lat':21.46,'lng':39.86},'pickupText':'TEST custom pickup'}
    status,_,_=request('/api/admin/bookings/'+receipt['id'],'PATCH',patch)
    check('anonymous route update rejected',status==401)
    status,updated,_=request('/api/admin/bookings/'+receipt['id'],'PATCH',patch,auth=True)
    check('admin saves route to actual booking',status==200 and updated['booking']['destination']==patch['destination'])
    check('route change invalidates fare estimate',updated['booking']['estimatedFare'] is None and updated['booking']['status']=='quote_requested')
    stop(); start()
    status,listing,_=request('/api/admin/bookings',auth=True,origin=False)
    check('bookings survive a full server restart',status==200 and len(listing['bookings'])==2)
    found=next(row for row in listing['bookings'] if row['id']==receipt['id'])
    check('admin route changes survive restart',found['destination']==patch['destination'] and found['pickupText']==patch['pickupText'])
    databases=list(data.glob('*.sqlite*'))+list(data.glob('*.db'))
    check('database exists outside release',bool(databases))
    check('data directory private',data.stat().st_mode & 0o777==0o700)
    check('database files private',all(path.stat().st_mode & 0o077==0 for path in databases))
    print('ALL BOOKING HTTP INTEGRATION TESTS PASSED',flush=True)
finally:
    stop(); log.close(); shutil.rmtree(root)
