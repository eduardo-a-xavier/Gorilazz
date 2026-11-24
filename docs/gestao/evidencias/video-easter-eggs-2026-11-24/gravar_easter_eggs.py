import sys, json
sys.stdout.reconfigure(encoding="utf-8")
from playwright.sync_api import sync_playwright
log=[]
with sync_playwright() as p:
    b=p.chromium.launch(channel='chrome',headless=False,args=['--ignore-gpu-blocklist','--disable-backgrounding-occluded-windows','--disable-renderer-backgrounding','--disable-background-timer-throttling'])
    ctx=b.new_context(viewport={'width':1440,'height':900},record_video_dir='vid',record_video_size={'width':1440,'height':900})
    pg=ctx.new_page()
    err=[]
    pg.on('console',lambda m: err.append(m.text) if m.type=='error' else None)
    pg.on('pageerror',lambda e: err.append(str(e)))
    pg.goto('http://localhost:3000/?perf',wait_until='networkidle',timeout=90000)
    pg.wait_for_timeout(3000)
    pg.add_style_tag(content="#cap{position:fixed;left:50%;bottom:120px;transform:translateX(-50%);z-index:99999;background:rgba(5,15,25,.92);border:2px solid #5fe3ff;color:#fff;font:600 20px/1.3 system-ui;padding:10px 18px;border-radius:12px;max-width:900px;text-align:center;pointer-events:none}")
    def cap(t):
        pg.evaluate("t=>{let e=document.getElementById('cap');if(!e){e=document.createElement('div');e.id='cap';document.body.appendChild(e)}e.textContent=t;e.style.display=t?'block':'none'}",t)
    def put(x,z,h,wait=2600):
        pg.evaluate(f"()=>{{const v=window.__gorilazz.vehicle;v.x={x};v.z={z};v.heading={h};v.speed=0}}"); pg.wait_for_timeout(wait)
    # 1) vitrine do topo com o Murdoc monumental
    put(-120,-60,2.0,1500); cap('Murdoc monumental (20 m) ao fundo: vitrine da página'); pg.wait_for_timeout(4500)
    # entrar no 3D
    pg.evaluate("()=>document.querySelector('.world-shell').scrollIntoView()"); pg.wait_for_timeout(1200)
    pg.mouse.click(720,450); pg.wait_for_timeout(800)
    try: pg.click('text=Começar a dirigir',timeout=3000)
    except Exception: pass
    pg.wait_for_timeout(1200)
    steps=[('Murdoc monumental: Av. Saturnz Barz (silhueta atrás dos prédios)',-57,-144,2.151,4000),
           ('Alce do clipe 19-2000',45,-38,1.57,4000),
           ('Trailer Winnebago do Murdoc (placa M1-N4-STY: licença criativa)',-66,-41,-1.57,4500),
           ('Pôster REJECT FALSE ICONS (Demon Days, 2004-2005)',-92,-110,-1.57,3500),
           ('Pazuzu em muro sombrio',-90,-122,-1.57,3500),
           ('Pôster SAVE US FROM HIM (The Now Now, 2018)',98,-110,1.57,3500),
           ('Aviso dos zumbis do Kong Studios (criação autoral)',-5,-75,3.14,3500)]
    for t,x,z,h,w in steps:
        cap(t); put(x,z,h,w); log.append(t)
    cap('Buzina do Geep: tecla G (som sintetizado, intervalo de 0,8 s)'); pg.wait_for_timeout(1500)
    for _ in range(3):
        pg.keyboard.press('g'); pg.wait_for_timeout(1100)
    cap('Menu [H] Controles com a tecla G · Buzina'); pg.keyboard.press('h'); pg.wait_for_timeout(3500); pg.keyboard.press('Escape'); pg.wait_for_timeout(800)
    cap(''); pg.wait_for_timeout(500)
    path=pg.video.path(); ctx.close(); b.close()
    print(path, err[:5])
