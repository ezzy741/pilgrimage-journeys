#!/usr/bin/env python3
import json, os, secrets, shutil, socket, subprocess, sys, tempfile, time, urllib.request, urllib.error, uuid
from pathlib import Path
from datetime import datetime,timedelta,timezone
release=Path(sys.argv[1]).resolve(); root=Path(tempfile.mkdtemp(prefix='hijaz-portals-test-')); os.chmod(root,0o700)
with socket.socket() as sock: sock.bind(('127.0.0.1',0)); port=sock.getsockname()[1]
node=os.environ.get('NODE_BINARY') or shutil.which('node')
if not node: raise SystemExit('Node.js 22.18+ is required')
base=f'http://127.0.0.1:{port}'; key=secrets.token_urlsafe(48); process=None; log=open(root/'server.log','w'); os.chmod(root/'server.log',0o600)
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs): return None
opener=urllib.request.build_opener(NoRedirect())
def req(path,method='GET',body=None,host='visit-hijaz.com',auth=False,origin=None):
    headers={'Host':host}
    if origin:headers['Origin']=origin
    if auth:headers['Authorization']='Bearer '+key
    if body is not None:headers['Content-Type']='application/json'
    request=urllib.request.Request(base+path,data=json.dumps(body).encode() if body is not None else None,headers=headers,method=method)
    try:response=opener.open(request,timeout=10)
    except urllib.error.HTTPError as exc:response=exc
    with response:
        raw=response.read().decode(); value=json.loads(raw) if 'application/json' in response.headers.get('Content-Type','') else raw
        return response.status,value,response.headers

def start():
    global process
    env=os.environ.copy()
    for name in ('BOOKING_ADMIN_TOKEN','BOOKING_ADMIN_TOKEN_FILE','BOOKING_TRUST_PROXY'):env.pop(name,None)
    env.update(HOST='127.0.0.1',NITRO_HOST='127.0.0.1',PORT=str(port),NITRO_PORT=str(port),BOOKING_DATA_DIR=str(root/'data'),BOOKING_ADMIN_TOKEN=key)
    process=subprocess.Popen([node,'.output/server/index.mjs'],cwd=release,env=env,stdout=log,stderr=log)
    for _ in range(60):
        if process.poll() is not None:raise AssertionError('Stage exited')
        try:
            if req('/')[0]==200:return
        except urllib.error.URLError:pass
        time.sleep(.25)
    raise AssertionError('Stage not ready')
def stop():
    global process
    if process:
        process.terminate()
        try:process.wait(timeout=8)
        except subprocess.TimeoutExpired:process.kill();process.wait()
        process=None
def check(label,condition):assert condition,label; print('PASS',label,flush=True)
try:
    start()
    for host,target in [('drivers.visit-hijaz.com','/drivers/register'),('admin.visit-hijaz.com','/admin')]:
        status,_,headers=req('/',host=host);check(host+' fixed portal redirect',status==302 and headers.get('Location')=='https://'+host+target)
    for path,target in [('/admin','https://admin.visit-hijaz.com/admin'),('/driver','https://drivers.visit-hijaz.com/drivers/register'),('/drivers/register','https://drivers.visit-hijaz.com/drivers/register')]:
        status,_,headers=req(path+'?untrusted=value');check('public staff page redirects safely '+path,status==302 and headers.get('Location')==target)
    for path in ('/api/admin/bookings','/api/admin/drivers','/api/driver-registrations'):
        check('public host cannot serve staff API '+path,req(path,auth=True)[0]==404)
    for host in ('admin.visit-hijaz.com','drivers.visit-hijaz.com'):
        check('portal cannot accept customer bookings '+host,req('/api/bookings','POST',{},host=host,origin='https://'+host)[0]==404)
    for path in ('/ziyarat/makkah','/ziyarat/madinah','/offers'):
        check('existing customer URL preserved '+path,req(path)[0]==200)
    status,page,headers=req('/drivers/register',host='drivers.visit-hijaz.com');check('driver registration page renders',status==200 and '<form' in page)
    check('portal page noncacheable and nonindexable','no-store' in headers.get('Cache-Control','') and 'noindex' in headers.get('X-Robots-Tag',''))
    check('driver portal cannot serve admin API',req('/api/admin/drivers',host='drivers.visit-hijaz.com',auth=True)[0]==404)
    check('admin portal cannot accept driver registrations',req('/api/driver-registrations','POST',{},host='admin.visit-hijaz.com',origin='https://admin.visit-hijaz.com')[0]==404)
    check('driver list requires administrator key',req('/api/admin/drivers',host='admin.visit-hijaz.com')[0]==401)
    data={'idempotencyKey':str(uuid.uuid4()),'fullName':'TEST Driver Applicant','phone':'+966500000000','serviceZones':['makkah','madinah'],'vehicleType':'sedan','vehicleModel':'TEST vehicle model','consent':True}
    status,saved,_=req('/api/driver-registrations','POST',data,host='drivers.visit-hijaz.com',origin='https://drivers.visit-hijaz.com');check('driver application saved pending review',status==201 and saved['status']=='pending_review')
    check('driver receipt contains no contact data','phone' not in saved and 'fullName' not in saved)
    status,retry,_=req('/api/driver-registrations','POST',data,host='drivers.visit-hijaz.com',origin='https://drivers.visit-hijaz.com');check('driver retry does not duplicate',status==200 and retry['id']==saved['id'])
    changed={**data,'fullName':'TEST Changed'};check('changed registration cannot reuse request key',req('/api/driver-registrations','POST',changed,host='drivers.visit-hijaz.com',origin='https://drivers.visit-hijaz.com')[0]==409)
    check('driver registration rejects unapproved sensitive fields',req('/api/driver-registrations','POST',{**data,'idempotencyKey':str(uuid.uuid4()),'governmentId':'NOT-ALLOWED'},host='drivers.visit-hijaz.com',origin='https://drivers.visit-hijaz.com')[0] in (400,422))
    check('driver registration rejects cross-origin request',req('/api/driver-registrations','POST',data,host='drivers.visit-hijaz.com',origin='https://evil.example')[0]==403)
    status,listing,headers=req('/api/admin/drivers',host='admin.visit-hijaz.com',auth=True);check('admin can see actual saved driver',status==200 and len(listing['drivers'])==1 and listing['drivers'][0]['id']==saved['id'])
    check('private API has safe headers',headers.get('X-Frame-Options')=='DENY' and 'no-store' in headers.get('Cache-Control',''))
    booking={'idempotencyKey':str(uuid.uuid4()),'customerName':'TEST Portal Booking','phone':'+966500000000','zone':'makkah','vehicle':'sedan','stopIds':['nour'],'pickupText':'','departure':{'lat':21.422882,'lng':39.825734},'destination':None,'pickupAt':(datetime.now(timezone.utc)+timedelta(days=2)).isoformat(timespec='seconds'),'notes':'Synthetic test only','promoCode':'','consent':True}
    status,receipt,_=req('/api/bookings','POST',booking,origin='https://visit-hijaz.com');check('main-site booking saving preserved',status==201)
    patch={'departure':{'lat':21.422882,'lng':39.825734},'destination':{'lat':21.45,'lng':39.85},'pickupText':'TEST pickup'}
    status,updated,_=req('/api/admin/bookings/'+receipt['id'],'PATCH',patch,host='admin.visit-hijaz.com',auth=True,origin='https://admin.visit-hijaz.com');check('admin subdomain can persist map route changes',status==200 and updated['booking']['estimatedFare'] is None)
    stop();start()
    status,listing,_=req('/api/admin/drivers',host='admin.visit-hijaz.com',auth=True);check('driver applications survive server restart',status==200 and len(listing['drivers'])==1)
    print('ALL PORTAL INTEGRATION TESTS PASSED',flush=True)
finally:stop();log.close();shutil.rmtree(root)
