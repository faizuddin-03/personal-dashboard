"""Firefox 36 step of the `ts` harness (EAINT-12253, 21.10.2026; contract cr/EAINT-12253/02-plan/ff36-bridge-contract.md).

Playwright cannot drive Firefox 36, so src/fixtures/ff36-step.ts (`ts.ff36.run`) writes a plan and runs
    <FF36_PY> -I bridge.py <plan.json>
which drives the REAL Firefox 36.0.4 with Selenium 2.53.6 (legacy FirefoxDriver), records the Firefox WINDOW only
(ffmpeg gdigrab hwnd=, never the desktop) from before login to after the last step, and writes <plan.result>:
    {"ok": bool, "video": path, "userAgent": str, "error": str|None, "steps": [{do, ok, state?, text?, url, shot?, error?}]}
Credentials come ONLY from env (the plan names the variables). Injected JS is ES5 (Firefox 36: no arrow functions,
no innerText). The browser reminder (#eauto-browser-reminder) is read, never closed, except by `reminderButton`.
Card / thumbprint steps are never done BY THE BRIDGE (Java applet). Since 22.10.2026 a `manual` step lets a PERSON do one
on this window (real MyKad + reader, DERMALOG MyBioID): the bridge shows a banner, waits, and presses nothing meanwhile.
"""
import json, os, re, subprocess, sys, time, traceback
from datetime import datetime

sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # -I ignores PYTHONIOENCODING

FFMPEG = os.environ.get("FFMPEG") or os.path.expandvars(
    r"%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.0.2-full_build\bin\ffmpeg.exe")
FIREFOX = os.environ.get("FF36_FIREFOX") or r"C:\Program Files (x86)\Mozilla Firefox\firefox.exe"

JS_STATE = """
var el=document.getElementById('eauto-browser-reminder');
function t(e){return e?(e.textContent||'').replace(/\\s+/g,' ').trim():'';}
var vis=!!(el && (el.offsetWidth||el.offsetHeight) && getComputedStyle(el).display!=='none');
return {inDom: !!el, display: el ? getComputedStyle(el).display : null, visible: vis,
        title: el ? t(el.querySelector('.ebr-title')) : null, text: el ? t(el) : null, url: location.href};
"""

# Read-only description of the reminder for the layout / wording checks (EAINT-12253 UI_TS1 / UI_TS2): computed styles,
# boxes and structure of div#eauto-browser-reminder. ES5 only. Returns null when the markup is not in the page.
JS_INSPECT = """
var el=document.getElementById('eauto-browser-reminder'); if(!el) return null;
function t(e){return e?(e.textContent||'').replace(/\\s+/g,' ').replace(/^\\s+|\\s+$/g,''):'';}
function cs(e,props){if(!e)return null;var c=getComputedStyle(e),o={};for(var i=0;i<props.length;i++){o[props[i]]=c.getPropertyValue(props[i]);}return o;}
function box(e){if(!e)return null;var r=e.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};}
var pop=el.querySelector('.ebr-popup'), head=el.querySelector('.ebr-head'), title=el.querySelector('.ebr-title'), body=el.querySelector('.ebr-body');
var kids=body?body.children:[], order=[], en=[], zh=[], hrAt=-1;
for(var i=0;i<kids.length;i++){var k=kids[i], tag=k.tagName.toLowerCase(), cls=k.className||'';
  if(tag==='hr'){hrAt=order.length; order.push('hr');}
  else if(tag==='p'){var strong=[];var ss=k.querySelectorAll('strong,b');for(var j=0;j<ss.length;j++){strong.push({text:t(ss[j]),weight:getComputedStyle(ss[j]).fontWeight});}
    var item={text:t(k),zh:/ebr-zh/.test(cls),strong:strong,style:cs(k,['text-align','color','font-size','font-weight'])};
    order.push(item.zh?'zh':'en'); (item.zh?zh:en).push(item);}
  else order.push(tag+(cls?'.'+cls.replace(/\\s+/g,'.'):''));}
var btns=[], bs=el.querySelectorAll('.ebr-actions button');
for(var b=0;b<bs.length;b++){btns.push({id:bs[b].id,text:t(bs[b]),box:box(bs[b]),style:cs(bs[b],['background-color','color','border-top-color','border-top-width','border-top-style','border-radius','font-weight'])});}
var bg=el.querySelector('svg.ebr-bg'), bgInfo=null;
if(bg){var rects=bg.querySelectorAll('rect'), circles=bg.querySelectorAll('circle'), stops=bg.querySelectorAll('stop'), rs=[], cc=[], st=[];
  for(var a=0;a<rects.length;a++){rs.push({x:rects[a].getAttribute('x'),y:rects[a].getAttribute('y'),w:rects[a].getAttribute('width'),h:rects[a].getAttribute('height'),fill:rects[a].getAttribute('fill')});}
  for(var c2=0;c2<circles.length;c2++){var cp=circles[c2].parentNode;cc.push({cx:circles[c2].getAttribute('cx'),cy:circles[c2].getAttribute('cy'),r:circles[c2].getAttribute('r'),fill:circles[c2].getAttribute('fill'),stroke:circles[c2].getAttribute('stroke')||(cp&&cp.getAttribute?cp.getAttribute('stroke'):null),inPattern:!!(cp&&cp.tagName&&cp.tagName.toLowerCase()==='pattern')});}
  for(var d=0;d<stops.length;d++){st.push(stops[d].getAttribute('stop-color'));}
  bgInfo={viewBox:bg.getAttribute('viewBox'),box:box(bg),rects:rs,circles:cc,stops:st};}
var actions=el.querySelector('.ebr-actions');
/* Where the title's own contents are drawn (its icons + text, union of their boxes), so its alignment can be measured
   whatever the CSS does it with (text-align, flex, margins). Whitespace-only text nodes are skipped. */
var tc=null;
if(title){var L=1e9,R=-1e9,T=1e9,B=-1e9,nn=title.childNodes;
  for(var q=0;q<nn.length;q++){var nd=nn[q],r2=null;
    if(nd.nodeType===1){r2=nd.getBoundingClientRect();}
    else if(nd.nodeType===3&&/[^\\s]/.test(nd.nodeValue||'')&&document.createRange){var rg=document.createRange();rg.selectNodeContents(nd);r2=rg.getBoundingClientRect();}
    if(r2&&(r2.width||r2.height)){if(r2.left<L)L=r2.left;if(r2.right>R)R=r2.right;if(r2.top<T)T=r2.top;if(r2.bottom>B)B=r2.bottom;}}
  if(R>L)tc={left:L,right:R,top:T,bottom:B,width:R-L};}
return {
  titleContentBox:tc, headBox:box(head),
  titleBoxStyle:cs(title,['display','justify-content','margin-left','border-left-width','padding-left','padding-right']),
  headBoxStyle:cs(head,['display','justify-content','border-left-width','border-right-width','padding-left','padding-right']),
  visible: !!(el.offsetWidth||el.offsetHeight) && getComputedStyle(el).display!=='none',
  window:{innerWidth:window.innerWidth,innerHeight:window.innerHeight,scrollWidth:document.documentElement.scrollWidth,bodyScrollWidth:document.body?document.body.scrollWidth:null},
  title:t(title), titleStyle:cs(title,['text-align','font-weight','color','font-size']), titleBox:box(title),
  headImgs: head?head.querySelectorAll('img').length:null, headWarnIcons: head?head.querySelectorAll('svg.ebr-warn').length:null,
  headStyle:cs(head,['background-image','background-color','border-bottom-width','border-bottom-style','border-bottom-color','text-align']),
  popupStyle:cs(pop,['border-top-color','border-top-width','border-top-style','border-top-left-radius','box-shadow','background-color']), popupBox:box(pop),
  closeButton: !!el.querySelector('#ebrCloseBtn'),
  order:order, hrAt:hrAt, en:en, zh:zh, hrStyle:cs(el.querySelector('hr.ebr-rule'),['border-top-color','border-top-width','border-top-style']),
  actionsStyle:cs(actions,['justify-content','flex-wrap','display','text-align']), actionsBox:box(actions), actionsIsLastInBody: !!(body && actions && body.lastElementChild===actions),
  buttons:btns, background:bgInfo
};
"""

JS_BANNER = """
var b=document.createElement('div'); b.className='qa-ff36-mark'; b.textContent=arguments[0];
var s=b.style; s.position='fixed'; s.left='0'; s.right='0'; s.bottom='0'; s.background='#172B4D'; s.color='#fff';
s.font='bold 13px Arial'; s.padding='4px 10px'; s.zIndex='2147483647'; s.pointerEvents='none';
(document.body||document.documentElement).appendChild(b);
"""
JS_UNBANNER = "var m=document.querySelectorAll('.qa-ff36-mark');for(var i=0;i<m.length;i++){m[i].parentNode.removeChild(m[i]);}"

# Clicks (21.10.2026, EAINT-12253 FF_TS8 / BEH_TS3): Selenium 2.53 scrolls an element only just into view, which left
# SELECT LONPAC under the insurance page's sticky bottom bar ("Other element would receive the click: <div class=
# "action-row">") and Download Report half below the window (the click reached nothing). So before a click the element is
# scrolled to the MIDDLE of the window (ES5: Firefox 36 has no scrollIntoView({block:'center'})), and the point at its
# centre is checked to be the element itself (or inside it).
JS_CENTRE = """
var e=arguments[0]; var r=e.getBoundingClientRect();
window.scrollBy(0, r.top - (window.innerHeight - r.height)/2);
"""
JS_HIT = """
var e=arguments[0]; var r=e.getBoundingClientRect();
var x=r.left+r.width/2, y=r.top+r.height/2;
var inWin=(x>=0 && y>=0 && x<window.innerWidth && y<window.innerHeight);
var h=inWin?document.elementFromPoint(x,y):null;
function d(n){if(!n)return inWin?'nothing':'nothing (the centre is outside the window)';
  var s=n.tagName.toLowerCase(); if(n.id)s+='#'+n.id;
  var c=(typeof n.className==='string')?n.className.replace(/^\\s+|\\s+$/g,''):''; if(c)s+='.'+c.split(/\\s+/).join('.');
  return s.slice(0,120);}
return {hit: !!h && (h===e || e.contains(h)), by: d(h), x: Math.round(x), y: Math.round(y),
        top: Math.round(r.top), bottom: Math.round(r.bottom), innerHeight: window.innerHeight};
"""

# An `optional` click whose target is already on is not pressed (21.10.2026, EAINT-12253 FF_TS8 r4: "Individual" on the
# Create Free Quote form was already selected). True when the element is a checked radio / checkbox, is labelled
# checked by aria / class, is a <label for=> of a checked one, or holds / follows / sits in a label with exactly one
# checked radio / checkbox. ES5 (Firefox 36).
JS_SELECTED = """
var e=arguments[0];
function on(i){return !!(i && (i.checked || i.getAttribute('aria-checked')==='true'));}
function box(i){return i && i.tagName && /^input$/i.test(i.tagName) && /^(radio|checkbox)$/i.test(i.type||'');}
if(box(e)) return on(e);
if(e.getAttribute('aria-checked')==='true'||e.getAttribute('aria-pressed')==='true'||e.getAttribute('aria-selected')==='true') return true;
var c=(typeof e.className==='string')?e.className:''; if(/(^|\\s)(active|selected|checked)(\\s|$)/.test(c)) return true;
var f=e.getAttribute('for'); if(f){var t=document.getElementById(f); if(box(t)) return on(t);}
var ins=e.querySelectorAll('input[type=radio],input[type=checkbox]'); if(ins.length===1) return on(ins[0]);
var p=e.previousElementSibling; if(box(p)) return on(p);
var par=e.parentNode; if(par && par.tagName && /^label$/i.test(par.tagName)){var pi=par.querySelectorAll('input[type=radio],input[type=checkbox]'); if(pi.length===1) return on(pi[0]);}
return false;
"""
# 22.10.2026 (EAINT-12253 FF_TS6 / BEH_TS6, `manual`): the banner that tells the PERSON at the reader what to do now,
# at the top of the page, above everything, letting clicks through except on its own button. Shown again after every
# page load (a new page has none). arguments[0] = the instruction (+ seconds left), arguments[1] = the button label ("" =
# no button). Returns true once that button was pressed on this page. ES5 (Firefox 36).
JS_MANUAL = """
var id='qa-ff36-manual', b=document.getElementById(id);
if(!b){b=document.createElement('div'); b.id=id; var s=b.style;
  s.position='fixed'; s.left='0'; s.right='0'; s.top='0'; s.zIndex='2147483647'; s.background='#FFD400'; s.color='#000';
  s.font='bold 20px Arial'; s.padding='10px 16px'; s.textAlign='center'; s.borderBottom='5px solid #D00000'; s.pointerEvents='none';
  var t=document.createElement('div'); t.id=id+'-t'; b.appendChild(t);
  if(arguments[1]){var k=document.createElement('button'); k.type='button'; k.id=id+'-ready'; k.textContent=arguments[1];
    k.style.pointerEvents='auto'; k.style.marginTop='6px'; k.style.font='bold 16px Arial'; k.style.padding='4px 14px';
    k.onclick=function(){window.__qaManualReady=true; k.textContent='OK - continuing'; return false;}; b.appendChild(k);}
  (document.body||document.documentElement).appendChild(b);}
document.getElementById(id+'-t').textContent=arguments[0];
return window.__qaManualReady===true;
"""
JS_UNMANUAL = "var b=document.getElementById('qa-ff36-manual');if(b){b.parentNode.removeChild(b);}window.__qaManualReady=false;"

# 22.10.2026 (BEH_TS8 / BEH_TS6, see the actions added at the end of Bridge). ES5 (Firefox 36).
JS_BLOCKED = ("var b=document.querySelectorAll('.blockUI');for(var i=0;i<b.length;i++){var e=b[i];"
              "if((e.offsetWidth||e.offsetHeight)&&getComputedStyle(e).display!=='none')return true;}return false;")
# Pixels drawn on a canvas; arguments[1] = true: skip near-white ones (a page painted on white). -1 = unreadable.
JS_INK = """
var c=arguments[0], light=arguments[1], d;
try { d=c.getContext('2d').getImageData(0,0,c.width,c.height).data; } catch(err) { return -1; }
var n=0; for(var i=0;i<d.length;i+=4){ if(d[i+3]>0 && !(light && d[i]>240 && d[i+1]>240 && d[i+2]>240)) n++; }
return n;
"""
# One signature stroke as the page's own mouse events (clientX / clientY from the canvas box).
JS_STROKE = """
var c=arguments[0], r=c.getBoundingClientRect(), w=r.width, h=r.height;
function ev(t,x,y){var e=document.createEvent('MouseEvents');
  e.initMouseEvent(t,true,true,window,0,0,0,Math.round(r.left+x),Math.round(r.top+y),false,false,false,false,0,null);c.dispatchEvent(e);}
ev('mousedown',w*0.15,h*0.6);
for(var i=1;i<=14;i++){ev('mousemove',w*(0.15+i*0.05),h*(0.6-0.25*Math.sin(i/2)));}
ev('mouseup',w*0.85,h*0.5);
return true;
"""
STALE_RETRIES = 3     # a click whose element went stale is found again and retried this many times
STALE_PAUSE_S = 0.7   # pause before each retry (the form finishing its re-render)

# Press a button of the visible jQuery UI dialog (last one on top): accept -> confirm-dialog-btn / Yes / OK / Confirm,
# dismiss -> cancel-dialog-btn / No / Cancel. Returns [dialog text, button text] or null.
JS_JQ_DIALOG = """
var accept=arguments[0]; var ds=document.querySelectorAll('.ui-dialog');
for(var i=ds.length-1;i>=0;i--){var e=ds[i]; if(!(e.offsetWidth||e.offsetHeight))continue;
  var txt=(e.textContent||'').replace(/\\s+/g,' ').trim().slice(0,300);
  var b=e.querySelector(accept?'button.confirm-dialog-btn':'button.cancel-dialog-btn');
  if(b && (b.offsetWidth||b.offsetHeight)){b.click(); return [txt,(b.textContent||'').trim()];}
  var re=accept?/^(Yes|OK|Confirm|Proceed)\\b/i:/^(No|Cancel|Close)\\b/i; var bs=e.querySelectorAll('button');
  for(var j=0;j<bs.length;j++){if((bs[j].offsetWidth||bs[j].offsetHeight) && re.test((bs[j].textContent||'').trim())){bs[j].click(); return [txt,(bs[j].textContent||'').trim()];}}}
return null;
"""

LISTINGS = {
    "stms": "view/ucd/stms/enquiry/main.do",
    "estm": "view/ucd/estm/enquiry/main.do",
    "apt": "view/ucd/apt/enquiry/",
    "insurance": "view/ucd/insurance/enquiry/home.do",
    "jomcheck": "view/ucd/jomcheck/enquiry/view.do",
    "dereg": "view/aatf/dereg/enquiry/main.do",
    "precheck": "view/aatf/dereg/precheck/enquiry/main.do",
    "bmk": "view/ucd/bmk/enquiry/",  # main.do returns 404 on staging /uat1/ (probe p08, 22.10.2026)
    "servicehub": "view/ucd/service-hub/listing.do",
}
VEHICLE_FIELDS = "#vehicleNo, #vehicleRegNo, input[name=vehicleNo], input[name=vehicleRegNo]"
REF_FIELDS = "#transactionNo, #transactionId, #txnNo, #refNo, input[name=transactionNo], input[name=refNo]"


class StepError(Exception):
    pass


class Bridge:
    def __init__(self, plan):
        self.plan = plan
        self.root = plan["root"].rstrip("/") + "/"
        self.inst = plan.get("instance") or ""
        self.label = plan.get("label") or ""
        self.driver = None
        self.rec = None
        self.hwnd = None
        self.pid = None
        self.saved = {}
        self.log_path = plan.get("log")

    # ---------------------------------------------------------------- log
    def log(self, **kw):
        kw = dict({"at": datetime.now().astimezone().isoformat(timespec="seconds")}, **kw)
        line = json.dumps(kw, ensure_ascii=False)
        print("FF36 " + line[:3000], flush=True)
        if self.log_path:
            with open(self.log_path, "a", encoding="utf-8") as f:
                f.write(line + "\n")

    # ---------------------------------------------------------------- browser + window recorder
    def start(self):
        from selenium import webdriver
        from selenium.webdriver.firefox.firefox_binary import FirefoxBinary
        from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
        # "ignore": a command sent while a native dialog is open raises and LEAVES the dialog open, instead of the driver's
        # default "dismiss" silently cancelling it (cr-triage 12253_FF_TS11, 21.10.2026).
        caps = dict(DesiredCapabilities.FIREFOX, unexpectedAlertBehaviour="ignore")
        self.driver = webdriver.Firefox(firefox_binary=FirefoxBinary(FIREFOX), timeout=60, firefox_profile=self.download_profile(),
                                        capabilities=caps)
        self.driver.maximize_window()
        time.sleep(1)
        pid = self.driver.binary.process.pid
        self.pid = pid
        self.hwnd, title = ff_window(pid)
        if not self.hwnd:
            raise RuntimeError("Firefox 36 window not found for pid %s" % pid)
        video = self.plan["video"]
        self.rec = subprocess.Popen([FFMPEG, "-y", "-loglevel", "error", "-f", "gdigrab", "-framerate", "10", "-i", "hwnd=%d" % self.hwnd,
                                     "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", "-vcodec", "libx264", "-pix_fmt", "yuv420p", "-preset", "ultrafast", video],
                                    stdin=subprocess.PIPE)
        time.sleep(2)
        if self.rec.poll() is not None:
            raise RuntimeError("ffmpeg window capture did not start (hwnd=%d, title %r)" % (self.hwnd, title))
        self.log(step="recorder", capture="Firefox 36 window only (gdigrab hwnd)", hwnd=self.hwnd, title=title, firefoxPid=pid, video=video)
        self.driver.get("about:")
        time.sleep(1)
        ua = self.driver.execute_script("return navigator.userAgent")
        self.log(step="browser", userAgent=ua)
        return ua

    def download_profile(self):
        """Only when the plan has `downloadDir` (added 21.10.2026, EAINT-12253 Download Report): a profile that saves PDFs /
        files into that folder without Firefox's own Save dialog (a separate window Selenium cannot answer), as
        cr/EAINT-12253/03-spec/after/ex6_jomcheck_ff36.py did. None = Selenium's default profile, as before.
        `javaPlugin` (22.10.2026, EAINT-12253 manual reader runs): the Java plugin set to "always activate"
        (plugin.state.java = 2) in this throwaway profile, so the MyKad applet loads without Firefox's click-to-play bar.
        Java's own "run this application?" prompt is still the person's to answer."""
        ddir = self.plan.get("downloadDir")
        java = self.plan.get("javaPlugin")
        if not ddir and not java:
            return None
        from selenium import webdriver
        prof = webdriver.FirefoxProfile()
        if java:
            prof.set_preference("plugin.state.java", 2)
        if not ddir:
            return prof
        os.makedirs(ddir, exist_ok=True)
        prof.set_preference("browser.download.folderList", 2)
        prof.set_preference("browser.download.dir", ddir)
        prof.set_preference("browser.download.useDownloadDir", True)
        prof.set_preference("browser.download.manager.showWhenStarting", False)
        # 21.10.2026 (BEH_TS3): a type not in this list makes Firefox 36 open its own "What should Firefox do with this
        # file?" window, which Selenium cannot see and the window video does not record. pdfjs off, so a PDF served inline
        # is saved too instead of being shown in the tab.
        prof.set_preference("browser.helperApps.neverAsk.saveToDisk", ",".join([
            "application/pdf", "application/x-pdf", "text/pdf", "application/octet-stream", "binary/octet-stream",
            "application/download", "application/x-download", "application/force-download", "application/unknown",
            "application/vnd.ms-excel"]))
        prof.set_preference("pdfjs.disabled", True)
        return prof

    def stop(self):
        try:
            if self.driver is not None:
                self.driver.quit()
        except Exception:
            pass
        time.sleep(1)
        if self.rec is not None:
            try:
                self.rec.communicate(input=b"q", timeout=60)
            except Exception:
                self.rec.kill()

    # ---------------------------------------------------------------- page helpers
    def alert_text(self):
        from selenium.common.exceptions import NoAlertPresentException
        try:
            return self.driver.switch_to.alert.text
        except NoAlertPresentException:
            return None

    def url(self):
        """The current address, or "" while a NATIVE browser dialog is open. The dialog is asked first: any other command
        while one is open makes Selenium 2.53's FirefoxDriver DISMISS it (its unexpectedAlertBehaviour default "dismiss",
        command-processor.js); that is how guard() after the Next click cancelled Dereg Step 5's "Sure to submit this
        payment to DEREGISTER?" before `confirm` could answer it (cr-triage 12253_FF_TS11, 21.10.2026)."""
        if self.alert_text() is not None:
            return ""
        try:
            return self.driver.current_url
        except Exception:
            return ""

    def state(self):
        return self.driver.execute_script(JS_STATE)

    def wait_for(self, fn, secs, step=0.5):
        t0 = time.time()
        while time.time() - t0 < secs:
            try:
                v = fn()
                if v:
                    return v
            except Exception:
                pass
            time.sleep(step)
        return None

    def visible(self, css):
        return [e for e in self.driver.find_elements_by_css_selector(css) if e.is_displayed()]

    def click(self, el):
        """Click a found element as a person would (see JS_CENTRE): scroll it to the middle of the window, wait 0.3 s, check
        the point at its centre is the element (or inside it). Hit -> native click. Covered -> click by script and SAY SO.
        A native click refused with "Other element would receive the click" is retried once the same way; refused again
        -> click by script, said so. Returns (note, position): note is "" for a plain native click, else the words for
        the step text; position = the last centre check {hit, by, x, y, top, bottom, innerHeight}."""
        from selenium.common.exceptions import WebDriverException
        note = ""
        pos = {}
        for attempt in (1, 2):
            try:
                self.driver.execute_script(JS_CENTRE, el)
            except Exception:
                pass
            time.sleep(0.3)
            try:
                pos = self.driver.execute_script(JS_HIT, el) or {}
            except Exception:
                pos = {}
            if pos and not pos.get("hit"):
                self.driver.execute_script("arguments[0].click();", el)
                return note + "clicked by script: covered by %s at (%s,%s)" % (pos.get("by"), pos.get("x"), pos.get("y")), pos
            try:
                el.click()
                return note, pos
            except WebDriverException as e:
                msg = str(e).split("\n")[0][:200]
                if "Other element would receive the click" not in msg:
                    raise
                if attempt == 2:
                    self.driver.execute_script("arguments[0].click();", el)
                    return note + "clicked by script: the native click was refused twice (%s)" % msg, pos
                note = "native click refused once (%s), scrolled and retried; " % msg
                time.sleep(0.5)
        return note, pos

    def shot(self, path, what):
        """The page with a bottom banner (when, where, TS). With a native dialog open: one frame of the Firefox window."""
        if self.alert_text() is not None:
            subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-f", "gdigrab", "-i", "hwnd=%d" % self.hwnd, "-frames:v", "1", path], timeout=30)
            return path
        u = self.url()
        banner = "%s MYT · staging/%s · Firefox 36 · %s · %s · %s" % (
            datetime.now().strftime("%d/%m/%Y, %H:%M:%S"), self.inst, re.sub(r"^https?://[^/]+", "", u), self.label, what)
        try:
            self.driver.execute_script(JS_BANNER, banner[:220])
            time.sleep(1.2)  # held on screen so the window video shows it too
        except Exception:
            pass
        self.driver.save_screenshot(path)
        try:
            self.driver.execute_script(JS_UNBANNER)
        except Exception:
            pass
        return path

    def guard(self):
        u = self.url()
        if self.inst and u.startswith("http") and ("/%s/" % self.inst) not in u and "/doc/" not in u:
            raise StepError("wrong instance: URL is not /%s/: %s" % (self.inst, u))

    def close_home_popups(self):
        """Homepage only: the 12180 announcement, the LKM campaign, a jQuery UI dialog — by their own close.
        Never touches #eauto-browser-reminder (not a .ui-dialog)."""
        closed = []
        for _ in range(6):
            what = self.driver.execute_script(
                "var c=document.querySelector('button[aria-label=\"Close announcement\"]');if(c&&(c.offsetWidth||c.offsetHeight)){c.click();return 'announcement (12180)';}"
                "c=document.querySelector('#dialog-lkm-refund .close-btn');if(c&&(c.offsetWidth||c.offsetHeight)){c.click();return 'lkm-campaign';}"
                "var ds=document.querySelectorAll('.ui-dialog');for(var i=ds.length-1;i>=0;i--){var e=ds[i];if(e.offsetWidth||e.offsetHeight){var x=e.querySelector('.ui-dialog-titlebar-close');if(x){x.click();return 'ui-dialog '+(e.textContent||'').replace(/\\s+/g,' ').slice(0,80);}}}return null;")
            if not what:
                break
            closed.append(what)
            time.sleep(1.5)
        return closed

    # ---------------------------------------------------------------- steps
    def do_login(self, s, out):
        user, pw = os.environ.get(s["userEnv"]), os.environ.get(s["passEnv"])
        if not user or not pw:
            raise StepError("credentials for %s not in env (%s / %s)" % (s.get("persona"), s["userEnv"], s["passEnv"]))
        d = self.driver
        try:
            d.delete_all_cookies()
        except Exception:
            pass
        d.get(self.root + "public/login/")
        time.sleep(3)
        self.guard()
        d.find_element_by_css_selector("#form-username").send_keys(user)
        d.find_element_by_css_selector("#form-password").send_keys(pw)
        d.find_element_by_css_selector("button.to-login").click()
        if s.get("firstLogin"):
            # 22.10.2026 (EAINT-12253, AzfarCo6): a new main user lands on Account Activation (/public/activation/) or the
            # first-login password page (/public/password/) instead of home (lane probes s05 / s15, p04 STEP=login). Either
            # is reported (found = false), not a failure; a `manual` step / the spec takes it from there.
            def landed():
                u = self.url()
                if "/public/activation/" in u:
                    return "Account Activation"
                if "/public/password/" in u:
                    return "the first-login password page"
                return "home" if d.find_elements_by_link_text("Logout") else None
            where = self.wait_for(landed, 90)
            if not where:
                raise StepError("not signed in as %s: %s" % (s.get("persona"), self.url()))
            out["found"] = where == "home"
            if where != "home":
                time.sleep(4)
                out["text"] = "%s: landed on %s, not home (%s)" % (s.get("persona"), where, self.url())
                return
        elif not self.wait_for(lambda: d.find_elements_by_link_text("Logout"), 90):
            raise StepError("not signed in as %s: %s" % (s.get("persona"), self.url()))
        time.sleep(4)
        if s.get("keepPopups"):
            out["text"] = "signed in as %s; home pop-ups left open" % s.get("persona")
            return
        out["text"] = "signed in as %s; home pop-ups closed: %s" % (s.get("persona"), ", ".join(self.close_home_popups()) or "none")

    def do_closeHomePopups(self, s, out):
        """The home page's own pop-ups (12180 announcement, LKM campaign, AATF ANNOUNCEMENT), each by its own close."""
        out["text"] = "closed: %s" % (", ".join(self.close_home_popups()) or "none")

    def do_goto(self, s, out):
        """Open root + `path`, or (`saved`) the address an earlier `saveUrl` step kept under that key (21.10.2026,
        EAINT-12253: the paid APT's own payment page, whose id is only known once the plan has reached it)."""
        if s.get("saved"):
            u = self.saved.get(s["saved"])
            if not u:
                raise StepError("no address saved under %r (saveUrl must run first)" % s["saved"])
            self.driver.get(u)
            out["text"] = "opened the saved address: " + u
        else:
            self.driver.get(self.root + s["path"].lstrip("/"))
        time.sleep(3)

    def do_saveUrl(self, s, out):
        """Keep the current address under `key` for a later `goto` with `saved` (read-only)."""
        u = self.url()
        if not u:
            raise StepError("no address to save (a native dialog is open?)")
        self.saved[s["key"]] = u
        out["text"] = u

    def _listing_row(self, s, out):
        """Open the listing (s.path or LISTINGS[s.listing]), search by vehicle (else by ref when the listing has such a
        field), return the innermost table row that carries s.ref."""
        d = self.driver
        d.get(self.root + (s.get("path") or LISTINGS[s["listing"]]))
        time.sleep(3)
        ref, veh = s["ref"], s.get("vehicle")
        fields = self.visible(VEHICLE_FIELDS) if veh else self.visible(REF_FIELDS)
        if fields:
            fields[0].clear()
            fields[0].send_keys(veh or ref)
            btn = self.visible("#to-search, #searchBtn")
            if btn:
                btn[0].click()
            else:
                self.driver.execute_script(
                    "var cs=document.querySelectorAll('button,input[type=button],input[type=submit],a');for(var i=0;i<cs.length;i++){var c=cs[i];"
                    "if((c.offsetWidth||c.offsetHeight)&&/^search$/i.test(((c.value||'')+(c.textContent||'')).trim())){c.click();return;}}")
            time.sleep(5)
        rows = [r for r in d.find_elements_by_css_selector("tr") if ref in r.text and not r.find_elements_by_css_selector("tr")]
        if not rows:
            raise StepError("no listing row for %s on %s" % (ref, self.url()))
        out["text"] = re.sub(r"\s+", " ", rows[-1].text)[:300]
        return rows[-1]

    def do_row(self, s, out):
        """Read-only: the listing row for s.ref (found as resubmit finds it); nothing is clicked. soft: a missing row is
        found = false, not a failure."""
        try:
            self._listing_row(s, out)
            out["found"] = True
        except StepError as e:
            if not s.get("soft"):
                raise
            out["found"] = False
            out["text"] = "NOT FOUND: %s" % e

    def do_resubmit(self, s, out):
        d = self.driver
        row = self._listing_row(s, out)
        links = [e for e in row.find_elements_by_xpath(".//*[normalize-space(text())='Resubmit']") if e.is_displayed()]
        if not links:
            raise StepError("row %s has no Resubmit: %s" % (s["ref"], out["text"]))
        before = self.url()
        links[0].click()
        # Resubmit may ask first: a native confirm (accepted) or a jQuery confirm (its confirm button: Yes / OK, never a verb).
        t0 = time.time()
        while time.time() - t0 < 60:
            al = self.alert_text()
            if al is not None:
                out["text"] += " | native dialog accepted: " + al
                d.switch_to.alert.accept()
                time.sleep(1)
                continue
            if self.url() != before:
                break
            try:
                r = self.driver.execute_script(JS_JQ_DIALOG, True)
            except Exception:
                r = None
            if r:
                out["text"] += " | dialog: %s -> %s" % (r[0][:160], r[1])
                time.sleep(1)
            time.sleep(0.5)
        if self.url() == before:
            raise StepError("Resubmit did not leave the listing")
        time.sleep(3)

    def _clickable(self, s):
        els = self.visible(s["css"])
        if s.get("text") is not None:
            want = re.sub(r"\s+", " ", s["text"]).strip()
            els = [e for e in els if re.sub(r"\s+", " ", e.text or e.get_attribute("value") or "").strip() == want]
        if s.get("enabledOnly"):
            els = [e for e in els if e.is_enabled() and not e.get_attribute("disabled")]
        return els

    def _already_selected(self, el):
        """True when the found element is (or labels) a radio / checkbox that is already on, or says so by aria / class."""
        return bool(self.driver.execute_script(JS_SELECTED, el))

    def do_click(self, s, out):
        """First visible element matching css (and `text`, exact after whitespace collapse; `enabledOnly`). With `next`:
        when nothing matches, press `next` (e.g. a calendar's next-month arrow) and look again, up to `tries` times.

        Stale elements (21.10.2026, EAINT-12253 FF_TS8 r4 step 5: the Create Free Quote form re-rendered between finding
        "Individual" and clicking it, StaleElementReferenceException): the element is found again and the click retried,
        up to STALE_RETRIES times with a short pause. A stale element was never clicked, so the retry cannot press twice.
        `optional: true`: a target that is already selected / checked is not pressed, and one still stale after the
        retries is skipped; both are said in the step text ("skipped (stale/already selected): ..."), never a failure.
        Without `optional` a target still stale after the retries fails the step."""
        from selenium.common.exceptions import StaleElementReferenceException
        desc = "%s%s" % (s["css"], (" with text %r" % s["text"]) if s.get("text") is not None else "")
        tries = 0
        stale = 0
        while True:
            try:
                els = self._clickable(s)
                while not els and s.get("next") and tries < s.get("tries", 3):
                    nx = self.visible(s["next"])
                    if not nx:
                        break
                    self.click(nx[0])
                    tries += 1
                    time.sleep(2)
                    els = self._clickable(s)
                again = (" (found again after %d stale element(s))" % stale) if stale else ""
                if not els and s.get("optional"):
                    out["text"] = "nothing to press (optional): %s%s" % (desc, again)
                    return
                if not els:
                    raise StepError("nothing visible matches %s%s" % (desc, again))
                label = re.sub(r"\s+", " ", els[0].text or els[0].get_attribute("value") or "").strip()
                if s.get("optional") and self._already_selected(els[0]):
                    out["text"] = "skipped (stale/already selected): %r is already selected, not pressed (optional)%s" % (label[:120], again)
                    return
                text = "%s%s%s" % (label[:120], (" (after %d x %s)" % (tries, s["next"])) if tries else "", again)
                out["text"] = text or None  # set before the click, so a failed click still names what it tried
                how, _ = self.click(els[0])
                break
            except StaleElementReferenceException as e:
                stale += 1
                if stale > STALE_RETRIES:
                    msg = str(e).split("\n")[0][:200]
                    if s.get("optional"):
                        out["text"] = "skipped (stale/already selected): %s was replaced on the page %d times while pressing it (%s); not pressed (optional)" % (desc, stale, msg)
                        return
                    raise StepError("%s was replaced on the page %d times while pressing it (%s)" % (desc, stale, msg))
                time.sleep(STALE_PAUSE_S)
        if how:
            out["text"] = ("%s | %s" % (text, how)) if text else how
        time.sleep(1)
        dlg = self.alert_text()
        if dlg is not None:  # asked as a dialog command only, so the dialog stays open for the next step
            out["text"] = "%s | browser dialog opened: %s" % (out.get("text") or "", dlg)

    def do_fill(self, s, out):
        els = self.visible(s["css"])
        if not els:
            raise StepError("no visible field %s" % s["css"])
        el, want = els[0], s["value"]
        el.clear()
        el.send_keys(want)
        # 21.10.2026 (EAINT-12253 FF_TS13/16, FF_TS12): in Firefox 36 the typed value did not always
        # stick: #qty read "11" after typing "1" over "1" (RM9,350.00 paid), and the pre-check's
        # #vehicleRegNo saved "000133" for "ON000133". Read it back; if it differs, set it by script
        # with the events the page listens to, and fail the step if it still differs.
        got = el.get_attribute("value")
        if got != want:
            self.driver.execute_script(
                "var e=arguments[0]; e.value=arguments[1];"
                "['input','keyup','change','blur'].forEach(function(t){"
                "var ev=document.createEvent('HTMLEvents'); ev.initEvent(t,true,false); e.dispatchEvent(ev);});",
                el, want)
            got2 = el.get_attribute("value")
            if got2 != want:
                raise StepError("%s reads %r after typing %r (then %r by script)" % (s["css"], got, want, got2))
            out["text"] = "%s = %s (typed value read %r, set by script)" % (s["css"], want, got)
            return
        out["text"] = "%s = %s" % (s["css"], want)

    def do_select(self, s, out):
        """Choose an option of a visible <select> by its value."""
        from selenium.webdriver.support.ui import Select
        els = self.visible(s["css"])
        if not els:
            raise StepError("no visible select %s" % s["css"])
        Select(els[0]).select_by_value(s["value"])
        time.sleep(1)
        out["text"] = "%s = %s" % (s["css"], s["value"])

    def do_check(self, s, out):
        """Set a checkbox to s.on (clicks only when it differs); text = its state before -> after. soft: no failure, found = reached."""
        els = self.visible(s["css"])
        if not els:
            raise StepError("no visible checkbox %s" % s["css"])
        before = els[0].is_selected()
        if before != bool(s["on"]):
            els[0].click()
            time.sleep(1.5)
        after = els[0].is_selected()
        out["text"] = "%s: %s -> %s" % (s["css"], "ticked" if before else "unticked", "ticked" if after else "unticked")
        out["found"] = after == bool(s["on"])
        if after != bool(s["on"]) and not s.get("soft"):
            raise StepError("%s did not become %s" % (s["css"], "ticked" if s["on"] else "unticked"))

    def do_read(self, s, out):
        """Read-only: the visible text of css (all matches joined), or the page text from the marker `from` (`chars` long)."""
        if s.get("css"):
            out["text"] = " | ".join(re.sub(r"\s+", " ", e.text).strip() for e in self.visible(s["css"]))[: s.get("chars", 1500)]
            out["found"] = bool(out["text"])
        else:
            body = self.driver.find_element_by_tag_name("body").text
            i = body.find(s["from"]) if s.get("from") else 0
            out["text"] = re.sub(r"\s+", " ", body[i:i + s.get("chars", 600)]).strip() if i >= 0 else ""
            out["found"] = i >= 0

    def do_inspect(self, s, out):
        """Read-only: the reminder's computed styles / boxes / structure as JSON (JS_INSPECT)."""
        out["text"] = json.dumps(self.driver.execute_script(JS_INSPECT), ensure_ascii=False)

    def do_resize(self, s, out):
        """Resize the Firefox window (the window video keeps recording the same window)."""
        self.driver.set_window_size(int(s["width"]), int(s.get("height", 900)))
        time.sleep(2)
        out["text"] = "window %sx%s, page innerWidth %s" % (s["width"], s.get("height", 900), self.driver.execute_script("return window.innerWidth"))

    def do_confirm(self, s, out):
        accept = s.get("accept", True)
        secs = s.get("timeoutS", 15)
        t0 = time.time()
        while time.time() - t0 < secs:
            al = self.alert_text()
            if al is not None:
                if s.get("shot"):
                    out["shot"] = self.shot(s["shot"], "native confirm: " + al[:80])
                (self.driver.switch_to.alert.accept if accept else self.driver.switch_to.alert.dismiss)()
                out["text"] = "native: %s -> %s" % (al, "OK" if accept else "Cancel")
                time.sleep(1)
                return
            try:
                if s.get("shot") and self.driver.execute_script("var ds=document.querySelectorAll('.ui-dialog');for(var i=0;i<ds.length;i++){if(ds[i].offsetWidth||ds[i].offsetHeight)return true;}return false;"):
                    out["shot"] = self.shot(s["shot"], "confirm dialog")
                    s = dict(s, shot=None)
                r = self.driver.execute_script(JS_JQ_DIALOG, bool(accept))
            except Exception:
                r = None
            if r:
                out["text"] = "jQuery: %s -> %s" % (r[0], r[1])
                time.sleep(1)
                return
            time.sleep(0.4)
        # soft (23.10.2026, EAINT-12253 FF_TS4 wholesale Pay Now: whether a confirm comes is not known in advance)
        if s.get("soft"):
            out["found"] = False
            out["text"] = "no confirm (native or jQuery dialog) within %ss" % secs
            return
        raise StepError("no confirm (native or jQuery dialog) within %ss" % secs)

    def do_waitFor(self, s, out):
        """Wait for css (with text) and/or for the address to match `url` (a regex). soft: never fails, `found` = true/false.
        `exact`: the element's whole label (text, else its value; whitespace collapsed) must equal `text`, not just contain it
        (21.10.2026, EAINT-12253: eSTM Step 6 "Done" is a plain div on /uat1/)."""
        css, text, url_re, exact = s.get("css"), s.get("text"), s.get("url"), s.get("exact")
        want = re.sub(r"\s+", " ", text).strip() if text else text

        def found():
            if url_re and not re.search(url_re, self.url()):
                return None
            if not css:
                return True
            for e in self.visible(css):
                if not text:
                    return e
                if exact:
                    if re.sub(r"\s+", " ", e.text or e.get_attribute("value") or "").strip() == want:
                        return e
                elif text in e.text:
                    return e
            return None
        # A native alert during the wait (e.g. while paying) is recorded and accepted.
        alerts = []
        t0 = time.time()
        secs = s.get("timeoutS", 90)
        el = None
        while time.time() - t0 < secs:
            al = self.alert_text()
            if al is not None:
                alerts.append(al)
                self.driver.switch_to.alert.accept()
                continue
            try:
                el = found()
            except Exception:
                el = None
            if el:
                break
            time.sleep(0.4)
        out["found"] = bool(el)
        if not el:
            msg = "%s%s%s not shown within %ss%s" % (css or "", (" with %r" % text) if text else "", (" at url /%s/" % url_re) if url_re else "", secs,
                                                    (" (alerts accepted: %s)" % alerts) if alerts else "")
            if s.get("soft"):
                out["text"] = "NOT FOUND: " + msg
                return
            raise StepError(msg)
        out["text"] = (re.sub(r"\s+", " ", el.text)[:300] if el is not True else self.url()) + ((" | alerts accepted: %s" % alerts) if alerts else "")

    def do_reminder(self, s, out):
        want = s.get("expect", "shown") == "shown"
        self.wait_for(lambda: self.state()["visible"] == want, s.get("waitS", 10), 0.25)
        st = self.state()
        out["state"] = "shown" if st["visible"] else "absent"
        out["text"] = ("%s | %s" % (st["title"] or "", st["text"] or "")) if st["visible"] else (
            "not shown (markup in page: %s, display %s)" % ("yes" if st["inDom"] else "no", st["display"] or "-"))

    def do_reminderButton(self, s, out):
        css = {"continue": "#ebrContinueBtn", "guide": "#ebrGuideBtn", "close": "#ebrCloseBtn"}[s["which"]]
        d = self.driver
        handles = d.window_handles
        els = self.visible(css)
        if not els and s.get("ifShown"):
            out["text"] = "reminder not shown: nothing pressed"
            out["state"] = "absent"
            return
        if not els:
            raise StepError("reminder button %s (%s) not visible" % (s["which"], css))
        els[0].click()
        time.sleep(2)
        new = [h for h in d.window_handles if h not in handles]
        if new:  # View User Guide opens a tab: note its address, close it, back to the page
            main = d.current_window_handle
            d.switch_to.window(new[0])
            time.sleep(2)
            out["text"] = "opened a new tab: " + self.url()
            if s.get("tabShot"):
                out["tabShot"] = self.shot(s["tabShot"], "the new tab View User Guide opened")
            d.close()
            d.switch_to.window(main)
        st = self.state()
        out["state"] = "shown" if st["visible"] else "absent"

    def do_refresh(self, s, out):
        self.driver.refresh()
        al = self.wait_for(self.alert_text, 3)
        if al:
            out["text"] = "resend dialog dismissed (no resend): " + al
            self.driver.switch_to.alert.dismiss()
        time.sleep(3)

    def window_frame(self, path, what, hwnd=None):
        """One frame of a Firefox WINDOW (tab bar + address bar + page), with the TS banner on the page. `hwnd`: another
        top-level window of this Firefox (e.g. the one View User Guide opened); default the first window."""
        try:
            self.driver.execute_script(JS_BANNER, ("%s MYT · staging/%s · Firefox 36 · %s · %s" % (
                datetime.now().strftime("%d/%m/%Y, %H:%M:%S"), self.inst, self.label, what))[:220])
            time.sleep(1.2)
        except Exception:
            pass
        subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-f", "gdigrab", "-i", "hwnd=%d" % (hwnd or self.hwnd), "-frames:v", "1", path], timeout=30)
        try:
            self.driver.execute_script(JS_UNBANNER)
        except Exception:
            pass
        return path

    def do_guideTab(self, s, out):
        """Press the reminder's View User Guide (#ebrGuideBtn) and STAY on what it opens: `shot` = one frame of the Firefox
        WINDOW that shows it (tab bar, address bar and page); text = "url | title | tabs N | page text". Then switch back to
        the first tab / window WITHOUT closing the new one (added 21.10.2026, EAINT-12253 BEH_TS3).

        21.10.2026 late (cr-evidence, BEH_TS3 run 16:43): the frame was taken of the FIRST window, which still showed the
        JomCheck tab, and the video (first window only) never showed the guide. Selenium's FirefoxDriver profile opens
        such links in a new top-level WINDOW, so now: the new window of this Firefox is found (EnumWindows by pid), brought
        to the front and maximised, its frame taken (`shot`), and it is recorded on its own for a few seconds
        (`tabVideo` = <video>-guide-tab.mp4, next to the main video). `tabWindow` says which it was: "new window" or "new
        tab in the same window" (then the first window's frame, as before). Back on the first window, it is brought to the
        front again and `state` = the reminder there."""
        d = self.driver
        main = d.current_window_handle
        handles = list(d.window_handles)
        hw_before = set(h for h, _ in ff_windows(self.pid))
        els = self.visible("#ebrGuideBtn")
        if not els:
            raise StepError("View User Guide (#ebrGuideBtn) not visible")
        els[0].click()
        new = self.wait_for(lambda: [h for h in d.window_handles if h not in handles], 20)
        if not new:
            out["text"] = "no new tab | %s | tabs %d" % (self.url(), len(d.window_handles))
            if s.get("shot"):
                out["shot"] = self.window_frame(s["shot"], "View User Guide: no new tab")
            return
        d.switch_to.window(new[0])
        self.wait_for(lambda: self.url() not in ("", "about:blank"), 30)
        new_hw = self.wait_for(lambda: [h for h, _ in ff_windows(self.pid) if h not in hw_before], 10) or []
        target = new_hw[0] if new_hw else self.hwnd
        kind = "new window" if new_hw else "new tab in the same window"
        rec2, tab_video = None, None
        if new_hw:
            try:
                d.maximize_window()
            except Exception:
                pass
            to_front(target)
            tab_video = re.sub(r"\.mp4$", "", self.plan["video"]) + "-guide-tab.mp4"
            try:
                rec2 = subprocess.Popen([FFMPEG, "-y", "-loglevel", "error", "-f", "gdigrab", "-framerate", "10", "-i", "hwnd=%d" % target,
                                         "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", "-vcodec", "libx264", "-pix_fmt", "yuv420p", "-preset", "ultrafast",
                                         tab_video], stdin=subprocess.PIPE)
            except Exception:
                rec2 = None
        time.sleep(3)
        try:
            body = re.sub(r"\s+", " ", d.find_element_by_tag_name("body").text)[:400]
        except Exception:
            body = ""
        out["text"] = "%s | %s | tabs %d | %s" % (self.url(), d.title, len(d.window_handles), body)
        out["tabWindow"] = "%s (hwnd %s; first window %s)" % (kind, target, self.hwnd)
        if s.get("shot"):
            out["shot"] = self.window_frame(s["shot"], "View User Guide, %s: %s" % (kind, re.sub(r"^https?://[^/]+", "", self.url())), hwnd=target)
        time.sleep(2)
        if rec2 is not None:
            try:
                rec2.communicate(input=b"q", timeout=30)
            except Exception:
                rec2.kill()
            if tab_video and os.path.exists(tab_video) and os.path.getsize(tab_video):
                out["tabVideo"] = tab_video
        d.switch_to.window(main)
        if new_hw:
            to_front(self.hwnd)
        time.sleep(1.5)
        st = self.state()
        out["state"] = "shown" if st["visible"] else "absent"

    def do_clickObserve(self, s, out):
        """Click css (first visible) and report what it did within waitS (default 30): a new tab (its address; `shot` taken
        ON that tab, then it is closed), the address changing, a native dialog (accepted), and files new in the plan's
        downloadDir. text = JSON {newTab, url, navigated, alert, files, partial, click}; found = anything happened (added
        21.10.2026, EAINT-12253 Download Report).
        21.10.2026 pm (BEH_TS3): the click goes through click() (middle of the window, centre check); `click` records where
        the element was and what was at its centre, and whether the click was native or by script. A download counts only
        when FINISHED: Firefox writes <name>.part while it downloads (and may create <name> empty beside it), so a file
        with its .part still there is not counted; .part files seen are listed in `partial` (a download that started), and
        the wait is stretched to 2 x waitS once one is seen. `files` are finished downloads only."""
        d = self.driver
        ddir = self.plan.get("downloadDir")
        before_files = set(os.listdir(ddir)) if ddir and os.path.isdir(ddir) else set()
        handles = list(d.window_handles)
        before = self.url()
        els = self.visible(s["css"])
        if not els:
            raise StepError("nothing visible matches %s" % s["css"])
        how, pos = self.click(els[0])
        res = {"newTab": None, "url": None, "navigated": None, "alert": None, "files": [], "partial": [],
               "click": dict(pos or {}, how=how or "native click")}
        t0 = time.time()
        secs = s.get("waitS", 30)
        while time.time() - t0 < (secs * 2 if res["partial"] else secs):
            al = self.alert_text()
            if al is not None:
                res["alert"] = al
                d.switch_to.alert.accept()
            new = [h for h in d.window_handles if h not in handles]
            if new:
                res["newTab"] = True
                break
            if ddir and os.path.isdir(ddir):
                now = [f for f in os.listdir(ddir) if f not in before_files]
                part = [f for f in now if f.endswith(".part")]
                for f in part:
                    if f not in res["partial"]:
                        res["partial"].append(f)
                got = [f for f in now if not f.endswith(".part") and (f + ".part") not in now]
                if got:
                    res["files"] = [{"name": f, "bytes": os.path.getsize(os.path.join(ddir, f))} for f in got]
                    break
            if self.url() not in (before, ""):
                res["navigated"] = self.url()
                break
            time.sleep(0.5)
        if res["partial"] and not res["files"] and ddir and os.path.isdir(ddir):
            still = [f for f in os.listdir(ddir) if f.endswith(".part") and f not in before_files]
            res["partial"] = [{"name": f, "bytes": os.path.getsize(os.path.join(ddir, f))} for f in still] or res["partial"]
            res["note"] = "a download started (.part) but did not finish within %ss" % (secs * 2) if still else \
                "a .part file was seen and is gone, but no finished file appeared within %ss" % (secs * 2)
        if res["newTab"]:
            main = d.current_window_handle
            d.switch_to.window([h for h in d.window_handles if h not in handles][0])
            self.wait_for(lambda: self.url() not in ("", "about:blank"), 20)
            time.sleep(3)
            res["url"] = self.url()
            if s.get("shot"):
                out["shot"] = self.window_frame(s["shot"], "opened by %s: %s" % (s["css"], res["url"][:80]))
            d.close()
            d.switch_to.window(main)
            time.sleep(1)
        out["text"] = json.dumps(res, ensure_ascii=False)
        out["found"] = bool(res["newTab"] or res["navigated"] or res["files"] or res["alert"])

    def do_jsClick(self, s, out):
        """Find css (first VISIBLE match, optional `text` = its whole label) and click it in ONE script run, so a control
        the page keeps re-rendering cannot go stale between finding and clicking (added 23.10.2026, EAINT-12253 FF_TS4:
        the wholesale STMS screen 5 `div#to-payment` "STMS Payment" was replaced 4 times under a native click). Says
        what it pressed; a dialog it opens is left for the next step (as `click`)."""
        js = ("var es=document.querySelectorAll(arguments[0]),want=arguments[1];"
              "for(var i=0;i<es.length;i++){var e=es[i];if(!(e.offsetWidth||e.offsetHeight))continue;"
              "var t=(e.textContent||e.value||'').replace(/\\s+/g,' ').replace(/^\\s+|\\s+$/g,'');"
              "if(want&&t!==want)continue;e.click();return t||e.id||e.tagName;}return null;")
        got = self.driver.execute_script(js, s["css"], s.get("text"))
        if not got:
            raise StepError("nothing visible matches %s%s" % (s["css"], (" with text %r" % s["text"]) if s.get("text") else ""))
        out["text"] = "pressed by script: %s" % got
        time.sleep(1)
        dlg = self.alert_text()
        if dlg is not None:
            out["text"] += " | browser dialog opened: %s" % dlg

    def do_shot(self, s, out):
        pass

    # ---------------------------------------------------------------- added 22.10.2026 (EAINT-12253 probe 2210/p03, Q14)
    # The reminder's raw state (incl. the markup's computed display) and a key press (Esc) sent as a person would type it.

    def do_reminderRaw(self, s, out):
        """Read-only: the reminder's state as JSON {inDom, display, visible, title, url} in text; state shown | absent."""
        st = self.state()
        out["state"] = "shown" if st["visible"] else "absent"
        out["text"] = json.dumps({k: st.get(k) for k in ("inDom", "display", "visible", "title")}, ensure_ascii=False)

    def do_key(self, s, out):
        """Press a key ("escape") on the focused element (the page body when nothing has focus), via Selenium send_keys,
        wait `waitS` (2), then read the reminder: state shown | absent, text = what had focus + the raw state JSON."""
        from selenium.webdriver.common.keys import Keys
        key = {"escape": Keys.ESCAPE}[s["key"]]
        d = self.driver
        if s.get("ifShown") and not self.state()["visible"]:
            out["state"] = "absent"
            out["text"] = "reminder not shown: nothing pressed"
            return
        try:
            el = d.switch_to.active_element
        except Exception:
            el = None
        if el is None:
            el = d.find_element_by_tag_name("body")
        try:
            who = d.execute_script("var e=arguments[0];return e.tagName.toLowerCase()+(e.id?'#'+e.id:'');", el)
        except Exception:
            who = "?"
        el.send_keys(key)
        time.sleep(s.get("waitS", 2))
        st = self.state()
        out["state"] = "shown" if st["visible"] else "absent"
        out["text"] = "%s pressed on %s | %s" % (s["key"], who, json.dumps({k: st.get(k) for k in ("inDom", "display", "visible")}))

    # ---------------------------------------------------------------- added 22.10.2026 (cr-author, EAINT-12253 BEH_TS8 / BEH_TS6)
    # Upload, choose by label, draw a signature, read a canvas, wait for the page's "Working..." box, gate on a text.
    # Written for the STMS Step 5 LKM Refund pop-up in Firefox 36 (its markup: the page script of the add-on and the
    # pop-up's data-entry script, saved from /preprod1/ 06-12.10.2026 in cr/EAINT-12022/04-explore/lkm-guideline/ and the
    # SIT trace automation/.artifacts/tr-sit-VKR1559; ids as LkmRefundPage, which ran end to end on /preprod1/ 07.10).
    # None of these has run in Firefox 36 yet.

    def wait_idle(self, secs=90):
        """Seconds until no .blockUI box ("Working...") is shown, or None when it is still up after `secs`. A native
        dialog ends the wait at once (it is the next step's to answer; no page command is sent while it is open)."""
        t0 = time.time()
        while time.time() - t0 < secs:
            if self.alert_text() is not None:
                return round(time.time() - t0, 1)
            try:
                if not self.driver.execute_script(JS_BLOCKED):
                    return round(time.time() - t0, 1)
            except Exception:
                pass
            time.sleep(0.5)
        return None

    def do_idle(self, s, out):
        """Wait (timeoutS, default 90) until the page's "Working..." box (.blockUI) is gone. soft: never fails, found = gone."""
        secs = s.get("timeoutS", 90)
        w = self.wait_idle(secs)
        out["found"] = w is not None
        out["text"] = ("idle after %ss" % w) if w is not None else "the Working... box is still up after %ss" % secs
        if w is None and not s.get("soft"):
            raise StepError(out["text"])

    def do_upload(self, s, out):
        """Give `path` (an absolute path on this PC) to the file input `css` (first match, shown or not). A file input the
        page hides behind its own "Browse File..." button is shown by script for the upload only, then its style is put
        back, and the step text says so. `label` = the element the page writes the chosen file name into: when it did not
        change, one `change` event is sent by script (said in the text). Then waits for the page to be idle.
        `optional`: no such input on the page is not a failure (found = false)."""
        d = self.driver
        fpath = s["path"]
        if not os.path.isfile(fpath):
            raise StepError("file to upload not found on this PC: %s" % fpath)
        els = d.find_elements_by_css_selector(s["css"])
        if not els:
            if s.get("optional"):
                out["found"] = False
                out["text"] = "no %s on this page: nothing uploaded (optional)" % s["css"]
                return
            raise StepError("no file input %s" % s["css"])
        el = els[0]

        def label_text():
            if not s.get("label"):
                return None
            ls = d.find_elements_by_css_selector(s["label"])
            return re.sub(r"\s+", " ", ls[0].text or "").strip() if ls else None
        before = label_text()
        shown_by_script, old = False, None
        if not el.is_displayed():
            old = d.execute_script(
                "var e=arguments[0], o=e.getAttribute('style');"
                "e.setAttribute('style','display:block !important;visibility:visible !important;opacity:1 !important;"
                "width:240px !important;height:24px !important;position:relative !important;');return o;", el)
            shown_by_script = True
            time.sleep(0.3)
        try:
            el.send_keys(fpath)
        finally:
            if shown_by_script:
                d.execute_script("var e=arguments[0];if(arguments[1]===null){e.removeAttribute('style');}else{e.setAttribute('style',arguments[1]);}", el, old)
        time.sleep(1)
        n = d.execute_script("var e=arguments[0];return e.files?e.files.length:(e.value?1:0);", el)
        if not n:
            raise StepError("%s holds no file after the upload of %s" % (s["css"], os.path.basename(fpath)))
        sent = ""
        after = label_text()
        if s.get("label") and after == before:
            d.execute_script("var e=arguments[0],ev=document.createEvent('HTMLEvents');ev.initEvent('change',true,false);e.dispatchEvent(ev);", el)
            time.sleep(1)
            after = label_text()
            sent = "; one change event sent by script (the file name label had not changed)"
        w = self.wait_idle(s.get("timeoutS", 90))
        out["found"] = True
        out["text"] = "%s <- %s (%d bytes)%s%s; label now: %s%s" % (
            s["css"], os.path.basename(fpath), os.path.getsize(fpath),
            "; the input is hidden on the page (own Browse File... button): shown by script for the upload, then hidden again" if shown_by_script else "",
            sent, after if after is not None else "-", "" if w is not None else "; the Working... box was still up after the wait")

    def do_choose(self, s, out):
        """Choose an option of a visible <select> by its LABEL or its position. `text`: the option whose label equals it,
        else contains it, else is contained in it (case, spacing and punctuation ignored; never the empty placeholder).
        `index`: 1 = the first option that has a value. `onlyIfEmpty`: a select whose chosen value is already non-empty is
        left as it is (text says so). Waits up to timeoutS (15) for the select and for options beyond the placeholder
        (lists filled by AJAX, e.g. the PTJ branches after the state). text = the label chosen (value)."""
        from selenium.webdriver.support.ui import Select
        secs = s.get("timeoutS", 15)
        if not self.wait_for(lambda: self.visible(s["css"]), secs):
            raise StepError("no visible select %s" % s["css"])

        def opts():
            sel = Select(self.visible(s["css"])[0])
            return sel, [(o.get_attribute("value") or "", re.sub(r"\s+", " ", o.text or "").strip()) for o in sel.options]
        sel, os_ = opts()
        cur = sel.first_selected_option if os_ else None
        cur_v = (cur.get_attribute("value") or "") if cur is not None else ""
        if s.get("onlyIfEmpty") and cur_v:
            out["found"] = True
            out["text"] = "%s kept as it was: %s (%s)" % (s["css"], re.sub(r"\s+", " ", cur.text or "").strip(), cur_v)
            return
        self.wait_for(lambda: len([v for v, _ in opts()[1] if v]) > 0, secs)
        sel, os_ = opts()
        pick = None
        if s.get("text") is not None:
            norm = lambda x: re.sub(r"[^A-Z0-9]+", " ", (x or "").upper()).strip()
            want = norm(s["text"])
            for test in (lambda t: t == want, lambda t: want in t, lambda t: len(t) >= 4 and t in want):
                pick = next((i for i, (v, t) in enumerate(os_) if v and test(norm(t))), None)
                if pick is not None:
                    break
        else:
            real = [i for i, (v, _) in enumerate(os_) if v]
            k = int(s.get("index", 1))
            pick = real[k - 1] if 0 < k <= len(real) else None
        if pick is None:
            raise StepError("no option of %s matches %r (options: %s)" % (
                s["css"], s.get("text", s.get("index")), "; ".join(t for _, t in os_)[:400]))
        sel.select_by_index(pick)
        time.sleep(1.5)
        out["found"] = True
        out["text"] = "%s = %s (%s)" % (s["css"], os_[pick][1], os_[pick][0])

    def ink(self, canvas, light):
        """Pixels drawn on a canvas: alpha > 0 (light=False: a transparent pad) or not near-white (light=True: a page
        painted on white). -1 when the canvas cannot be read."""
        return self.driver.execute_script(JS_INK, canvas, bool(light))

    def do_sign(self, s, out):
        """Draw a signature on the canvas `css` and read its pixels back. One stroke of 15 points with the mouse
        (Selenium actions: press, 14 moves, release); when the pad is still blank, the same stroke as the page's own
        mouse events (mousedown / mousemove / mouseup, sent by script; the LKM pad listens to exactly these); up to 3
        tries. found = more than minInk (200) pixels inked; fewer fails the step. text = ink + how it was drawn."""
        import math
        from selenium.webdriver.common.action_chains import ActionChains
        d = self.driver
        els = self.wait_for(lambda: self.visible(s["css"]), s.get("timeoutS", 30))
        if not els:
            raise StepError("no visible canvas %s" % s["css"])
        c = els[0]
        try:
            d.execute_script(JS_CENTRE, c)
        except Exception:
            pass
        time.sleep(0.6)
        need = s.get("minInk", 200)
        ink, how = 0, []
        for _ in range(3):
            w, h = c.size["width"], c.size["height"]
            pts = [(int(w * (0.15 + i * 0.05)), int(h * (0.6 - 0.25 * math.sin(i / 2.0)))) for i in range(15)]
            try:
                a = ActionChains(d).move_to_element_with_offset(c, pts[0][0], pts[0][1]).click_and_hold()
                for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
                    a = a.move_by_offset(x1 - x0, y1 - y0)
                a.release().perform()
                how.append("mouse stroke (Selenium actions)")
            except Exception as e:
                how.append("mouse stroke refused (%s)" % str(e).split("\n")[0][:120])
            time.sleep(0.8)
            ink = self.ink(c, False)
            if ink > need:
                break
            d.execute_script(JS_STROKE, c)
            how.append("the same stroke as mouse events sent by script")
            time.sleep(0.8)
            ink = self.ink(c, False)
            if ink > need:
                break
            time.sleep(2)
        out["found"] = ink > need
        out["text"] = "%s: %s inked pixels after %s" % (s["css"], ink, ", then ".join(how))
        if ink <= need:
            raise StepError(out["text"])

    def do_canvasInk(self, s, out):
        """Read-only: every visible canvas matching css, its size and how many of its pixels are drawn (not near-white,
        not transparent; -1 = unreadable). Waits up to waitS (20) for one with more than minInk (500). text = JSON
        [{w, h, ink}], found = one has more than minInk."""
        need = s.get("minInk", 500)

        def read():
            return [dict(zip(("w", "h", "ink"), self.driver.execute_script(
                "var c=arguments[0];return [c.width,c.height];", c) + [self.ink(c, True)])) for c in self.visible(s["css"])]
        res = []
        t0 = time.time()
        while True:
            try:
                res = read()
            except Exception:
                res = []
            if any(r["ink"] > need for r in res) or time.time() - t0 > s.get("waitS", 20):
                break
            time.sleep(1)
        out["text"] = json.dumps(res)
        out["found"] = any(r["ink"] > need for r in res)

    def do_gate(self, s, out):
        """Wait (timeoutS, 30) until the visible text of css (all matches joined) is non-empty and matches `match` and does
        not match `noMatch` (regex sources). Not reached: the step fails, so the plan stops there (soft: found = false).
        text = the text read last."""
        last = {"t": ""}

        def ok():
            t = " | ".join(re.sub(r"\s+", " ", e.text or "").strip() for e in self.visible(s["css"]))
            last["t"] = t
            good = bool(t) and (not s.get("match") or re.search(s["match"], t)) and (not s.get("noMatch") or not re.search(s["noMatch"], t))
            return t if good else None
        t = self.wait_for(ok, s.get("timeoutS", 30))
        out["found"] = bool(t)
        out["text"] = t or last["t"]
        if not t and not s.get("soft"):
            raise StepError("%s reads %r: not %s%s within %ss" % (s["css"], last["t"][:200], ("/%s/" % s["match"]) if s.get("match") else "",
                                                              (" and not /%s/" % s["noMatch"]) if s.get("noMatch") else "", s.get("timeoutS", 30)))

    # ---- added 22.10.2026 (EAINT-12253 FF_TS6 / BEH_TS6): a step done BY A PERSON on this window (real MyKad +
    # thumbprint on the Java applet, which no emulator can feed). The bridge presses nothing on the page meanwhile.
    def do_manual(self, s, out):
        """Show `banner` at the top of the page (JS_MANUAL; shown again after every page load, with the seconds left), beep,
        bring the Firefox window to the front, and wait up to timeoutS (300) until `until` holds ({url, css, text} as in
        waitFor; `url` is searched from the start, so "^(?!.*/x/)" means "no longer on /x/") or the person presses the
        banner's own button (`ready` = its label; none when empty). A native dialog that comes up meanwhile is LEFT for the
        person (listed in text); nothing is sent to the page while it is open. The reminder is read about once a second
        all through the wait: state = "shown" if it was displayed at any moment, else "absent" (text says how many reads).
        `shotBefore`: a screenshot as the wait starts, before the banner. Not done in time: the step fails (soft: found
        false). The banner is removed before the step's own `shot`."""
        out["urlBefore"] = self.url()
        if s.get("shotBefore"):
            out["shotBefore"] = self.shot(s["shotBefore"], "before the person's step")
        until = s.get("until") or {}
        url_re, css, text = until.get("url"), until.get("css"), until.get("text")
        banner, ready = s.get("banner") or "Your turn", s.get("ready") or ""
        secs = s.get("timeoutS", 300)
        try:
            self.driver.execute_script(JS_UNMANUAL)  # a Ready pressed for an EARLIER manual step on this page does not count
        except Exception:
            pass
        to_front(self.hwnd)
        beep()
        self.log(step="manual-start", banner=banner, until=until, timeoutS=secs, url=self.url())

        def met():
            if url_re and not re.search(url_re, self.url()):
                return False
            if css:
                return any((not text) or (text in (e.text or "")) for e in self.visible(css))
            return bool(url_re)
        t0 = time.time()
        how, reads, seen, dialogs, beat = None, 0, [], [], 0
        while time.time() - t0 < secs:
            if self.alert_text() is not None:
                al = self.alert_text()
                if al and al not in dialogs:
                    dialogs.append(al)
                time.sleep(1)
                continue
            try:
                if met():
                    how = "the page moved on"
                    break
            except Exception:
                pass
            left = int(secs - (time.time() - t0))
            try:
                if self.driver.execute_script(JS_MANUAL, "%s   [%d:%02d left]" % (banner, left // 60, left % 60), ready):
                    how = "the banner's [%s] was pressed" % ready
                    break
            except Exception:
                pass
            try:
                st = self.state()
                reads += 1
                if st.get("visible"):
                    seen.append(re.sub(r"^https?://[^/]+", "", st.get("url") or ""))
            except Exception:
                pass
            if time.time() - t0 - beat >= 30:
                beat = time.time() - t0
                self.log(step="manual-wait", waitedS=round(beat), url=self.url(), reminderSeen=len(seen))
            time.sleep(1)
        waited = round(time.time() - t0)
        if self.alert_text() is None:
            try:
                self.driver.execute_script(JS_UNMANUAL)
            except Exception:
                pass
        out["found"] = how is not None
        out["state"] = "shown" if seen else "absent"
        where = sorted(set(seen))
        out["text"] = "%s after %ss; reminder %s during the wait (read %d times)%s; now on %s" % (
            ("done: %s" % how) if how else "NOT done", waited,
            ("DISPLAYED at %s" % ", ".join(where)) if seen else "never displayed", reads,
            ("; browser dialogs seen: %s" % " || ".join(d[:160] for d in dialogs)) if dialogs else "",
            re.sub(r"^https?://[^/]+", "", self.url()))
        if not how and not s.get("soft"):
            raise StepError("the person's step was not done within %ss (%s): %s" % (secs, banner[:120], out["text"]))

    # ---------------------------------------------------------------- run
    def run(self):
        result = {"ok": False, "video": self.plan["video"], "userAgent": None, "error": None, "steps": []}
        try:
            result["userAgent"] = self.start()
        except Exception as e:
            result["error"] = "start: %s" % e
            self.log(step="start-failed", error=traceback.format_exc())
            self.stop()
            return result
        failed = False
        try:
            for i, s in enumerate(self.plan["steps"]):
                out = {"do": s["do"], "ok": False, "url": ""}
                result["steps"].append(out)
                if failed:
                    out["error"] = "not run (an earlier step failed)"
                    continue
                try:
                    getattr(self, "do_" + s["do"])(s, out)
                    self.guard()
                    if s.get("shot") and not out.get("shot"):
                        what = "%s%s" % (s["do"], (": " + out["state"]) if out.get("state") else "")
                        out["shot"] = self.shot(s["shot"], what)
                    out["ok"] = True
                except Exception as e:
                    failed = True
                    out["error"] = "%s: %s" % (type(e).__name__, str(e).split("\n")[0][:400])
                    try:
                        out["shot"] = self.shot(self.plan["failShot"], "step %d %s failed" % (i + 1, s["do"]))
                    except Exception:
                        pass
                dlg = self.alert_text()
                if dlg is not None:
                    out["dialog"] = dlg  # a native browser dialog is open after this step (left for the next step)
                out["url"] = self.url()
                self.log(step=i + 1, **out)
            result["ok"] = not failed
        finally:
            self.stop()
        return result


def ff_window(pid):
    """(hwnd, title) of the visible top-level window of the Firefox process this driver started."""
    found = ff_windows(pid)
    return found[0] if found else (None, None)


def beep():
    """Best effort: two short tones, so the person at the reader hears that it is their turn (22.10.2026, `manual`)."""
    try:
        import winsound
        for f in (880, 1175):
            winsound.Beep(f, 250)
    except Exception:
        pass


def to_front(hwnd):
    """Best effort: restore a top-level window and bring it to the front (21.10.2026, guideTab)."""
    try:
        import ctypes
        user32 = ctypes.windll.user32
        user32.ShowWindow(hwnd, 5)  # SW_SHOW (SW_RESTORE would un-maximise it)
        user32.BringWindowToTop(hwnd)
        user32.SetForegroundWindow(hwnd)
        time.sleep(0.8)
    except Exception:
        pass


def ff_windows(pid):
    """[(hwnd, title)] of every visible, titled top-level window of the Firefox process `pid`, in Z order (front first)."""
    import ctypes
    from ctypes import wintypes
    user32 = ctypes.windll.user32
    found = []

    @ctypes.WINFUNCTYPE(ctypes.c_bool, wintypes.HWND, wintypes.LPARAM)
    def cb(h, _):
        p = wintypes.DWORD()
        user32.GetWindowThreadProcessId(h, ctypes.byref(p))
        n = user32.GetWindowTextLengthW(h)
        if p.value == pid and n and user32.IsWindowVisible(h):
            b = ctypes.create_unicode_buffer(n + 1)
            user32.GetWindowTextW(h, b, n + 1)
            found.append((h, b.value))
        return True
    user32.EnumWindows(cb, 0)
    return found


if __name__ == "__main__":
    plan = json.load(open(sys.argv[1], encoding="utf-8"))
    res = Bridge(plan).run()
    v = res["video"]
    res["videoBytes"] = os.path.getsize(v) if os.path.exists(v) else 0
    with open(plan["result"], "w", encoding="utf-8") as f:
        json.dump(res, f, ensure_ascii=False, indent=2)
    sys.exit(0 if res["ok"] else 1)
