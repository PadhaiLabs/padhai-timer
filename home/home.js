/* Homepage: language switch, where-visitors-came-from tag, contact form. */
(function(){
var PT = window.PT || {}, nodes = document.querySelectorAll("[data-t]"), EN = {};
nodes.forEach(function(n){ var k = n.getAttribute("data-t"); if (!(k in EN)) EN[k] = n.textContent; });
var lang = "en";
function tr(k){ return (PT[lang] && PT[lang][k]) || EN[k] || k; }
function apply(l){
  lang = PT[l] ? l : "en";
  nodes.forEach(function(n){ n.textContent = tr(n.getAttribute("data-t")); });
  document.documentElement.lang = lang;
  try { localStorage.setItem("padhai.homeLang", lang); } catch(e){}
}
var sel = document.getElementById("lang"), saved = null, qs = new URLSearchParams(location.search);
try { saved = localStorage.getItem("padhai.homeLang"); } catch(e){}
var appState = null; try { appState = JSON.parse(localStorage.getItem("padhai.v2") || "null"); } catch(e){}
var first = qs.get("lang") || saved || (appState && PT[appState.lang] ? appState.lang : null) || ((navigator.language || "").slice(0,2) === "hi" ? "hi" : "en");
apply(first); if (sel){ sel.value = lang; sel.addEventListener("change", function(){ apply(sel.value); }); }

// ?src=reddit etc. Remember where the visitor first came from (this tab only).
try { if (qs.get("src") && !sessionStorage.getItem("padhai.src")) sessionStorage.setItem("padhai.src", qs.get("src").slice(0,40)); } catch(e){}

var FB = "https://www.gstatic.com/firebasejs/10.12.2/";
var dbp = null;
function db(){
  if (dbp) return dbp;
  dbp = (async function(){
    var cfg = window.PADHAI_FIREBASE;
    if (!cfg) return null;                       // demo mode (no Firebase settings)
    var appm = await import(FB + "firebase-app.js"), authm = await import(FB + "firebase-auth.js"), fsm = await import(FB + "firebase-firestore.js");
    var app = appm.getApps().length ? appm.getApp() : appm.initializeApp(cfg);
    var auth = authm.getAuth(app);
    await new Promise(function(r){ var u = authm.onAuthStateChanged(auth, function(){ u(); r(); }); });
    if (!auth.currentUser) await authm.signInAnonymously(auth);
    return { fs: fsm, db: fsm.getFirestore(app), uid: auth.currentUser.uid };
  })();
  dbp.catch(function(){ dbp = null; });
  return dbp;
}
function srcTag(){ try { return sessionStorage.getItem("padhai.src") || ""; } catch(e){ return ""; } }

// ---------- suggestions form ----------
var form = document.getElementById("cform");
if (!form) return;
var status = document.getElementById("cStatus"), btn = document.getElementById("cSend");
function say(msg, bad){ status.textContent = msg; status.className = "status" + (bad ? " bad" : ""); }
function val(name){ var c = form.querySelector('input[name="' + name + '"]:checked'); return c ? c.value : ""; }
var again = document.getElementById("cAgain");
if (again) again.addEventListener("click", function(){ document.getElementById("cDone").hidden = true; form.hidden = false; document.getElementById("cMsg").focus(); });
form.addEventListener("submit", async function(e){
  e.preventDefault();
  var msg = document.getElementById("cMsg").value.trim();
  if (!msg){ say(tr("errEmpty"), true); document.getElementById("cMsg").focus(); return; }
  btn.disabled = true; say(tr("sending"));
  var src = srcTag();
  try {
    var f = await db();
    var doc = { role: val("role"), topic: val("topic"), message: msg.slice(0,2000), lang: lang, src: src };
    if (!f){ say("Demo mode: not saved (no Firebase settings)", true); btn.disabled = false; return; }
    doc.uid = f.uid; doc.at = f.fs.serverTimestamp();
    await f.fs.addDoc(f.fs.collection(f.db, "inquiries"), doc);
    form.hidden = true; document.getElementById("cDone").hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.getElementById("cMsg").value = ""; btn.disabled = false; say("");
  } catch(err){
    var code = (err && (err.code || err.message)) || "unknown";
    say(tr("errFail") + " (" + code + ")", true); btn.disabled = false;
  }
});
})();

/* Install button on the website: same as in the app (install-sheet.js).
   Computer -> QR code to open on the phone. Android -> browser's install box. iPhone -> the guide page. */
(function(){
  if ("serviceWorker" in navigator && location.protocol === "https:"){
    navigator.serviceWorker.register("../sw.js", {scope: "../"}).catch(function(){});
  }
  document.addEventListener("click", function(e){
    var a = e.target.closest && e.target.closest('a[href$="install.html"]');
    if (!a || !window.PadhaiInstall) return;
    if (PadhaiInstall.install()) e.preventDefault();   // otherwise the link opens the guide page
  });
})();
