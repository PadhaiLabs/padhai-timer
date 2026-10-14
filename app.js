/* Padhai Timer — app logic.
   Works in two modes:
   - demo: window.PADHAI_FIREBASE is null. Everything is saved on this device only.
   - live: Firebase is configured. Anonymous login starts automatically, Google login is optional,
           study logs sync to Firestore and the study hall / groups are shared. */
(function(){
"use strict";
const $ = s => document.querySelector(s);
const FB_VER = "10.12.2";
const CHECK_EVERY = 90 * 60 * 1000;   // ask "still studying?" every 90 minutes
const CHECK_GRACE = 5 * 60 * 1000;    // 5 minutes to answer
const DAY_CAP = 16 * 3600;            // the hall never shows more than 16 hours a day
const MAX_GROUPS = 5;

/* ---------- exams ---------- */
const EXAMS = {
  neet:  {label:"NEET UG",        subj:["Physics","Chemistry","Botany","Zoology"]},
  jee:   {label:"JEE Main / Adv", subj:["Physics","Chemistry","Maths"]},
  upsc:  {label:"UPSC CSE",       subj:["GS","CSAT","Optional","Current Affairs","Answer Writing"]},
  ssc:   {label:"SSC CGL",        subj:["Quant","Reasoning","English","GA"]},
  bank:  {label:"Bank PO",        subj:["Quant","Reasoning","English","GA"]},
  ca:    {label:"CA",             subj:["Accounts","Law","Tax","Audit"]},
  board: {label:"Boards 10/12",   subj:["Maths","Science","English","SST"]}
};

/* ---------- time helpers ---------- */
const pad = n => String(n).padStart(2,"0");
const dayKey = d => d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const startOfDay = d => new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime();
const nextDay = d => new Date(d.getFullYear(),d.getMonth(),d.getDate()+1).getTime();
let istFmt = null;
try { istFmt = new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}); } catch(e) {}
const istDay = () => istFmt ? istFmt.format(new Date()) : dayKey(new Date());
const fmtHMS = s => { s = Math.max(0, Math.floor(s)); return pad(Math.floor(s/3600))+":"+pad(Math.floor(s%3600/60))+":"+pad(s%60); };

/* ---------- state ---------- */
const KEY = "padhai.v2";
function detectLang(){
  const l = (navigator.language||"en").toLowerCase();
  for (const [code] of LANGS) if (l.startsWith(code)) return code;
  return "en";
}
function sampleLog(){
  const log = {}, subj = EXAMS.neet.subj, now = new Date(), hours = [6.2, 7.5, 5.1, 8.3, 6.8, 4.4];
  for (let i = 6; i >= 1; i--){
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate()-i);
    const o = {t:0, s:{}, b:{}};
    let slot = 36, left = hours[6-i]*3600, k = i % 4;
    while (left > 0 && slot < 140){
      const run = 6 + ((slot + i) % 7);
      for (let r = 0; r < run && left > 0; r++){ const s = subj[k%4]; o.b[slot] = s; o.t += 600; o.s[s] = (o.s[s]||0)+600; left -= 600; slot++; }
      slot += 2 + (slot % 3); k++;
    }
    log[dayKey(d)] = o;
  }
  return log;
}
function freshState(sample){
  return {v:2, lang:detectLang(), exam:"neet", nick:"", examDate:"", last:null, running:null,
          log: sample ? sampleLog() : {}, sample:!!sample, groups:[], activeGroup:null, tab:"group",
          consent:false, guideHidden:false, updated:0};
}
function loadLocal(){ try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : null; } catch(e){ return null; } }
function saveLocal(){ try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){} }
let S = Object.assign(freshState(false), loadLocal() || {});
// The old sample week is no longer used. Remove it for anyone who still has it.
if (S.sample){ S.log = {}; S.sample = false; }
if (!EXAMS[S.exam]) S.exam = "neet";
if (!T[S.lang]) S.lang = "en";
if (!Array.isArray(S.groups)) S.groups = [];

const L = () => T[S.lang];
const subjName = s => (SUBJ_T[s] && SUBJ_T[s][S.lang]) || s;
const subjects = () => EXAMS[S.exam].subj;
const colorOf = s => { const i = subjects().indexOf(s); return "var(--s"+(i<0?5:i)+")"; };
const getDay = k => S.log[k] || {t:0, s:{}, b:{}};
const dayW = k => (S.log[k] = S.log[k] || {t:0, s:{}, b:{}});

function addInterval(start, end, subj){
  let t = start;
  while (t < end){
    const d = new Date(t), k = dayKey(d), stop = Math.min(end, nextDay(d));
    const o = dayW(k), sec = (stop - t)/1000;
    o.t += sec; o.s[subj] = (o.s[subj]||0) + sec;
    let x = t;
    while (x < stop){
      const xd = new Date(x);
      o.b[xd.getHours()*6 + Math.floor(xd.getMinutes()/10)] = subj;
      x = new Date(xd.getFullYear(),xd.getMonth(),xd.getDate(),xd.getHours(),Math.floor(xd.getMinutes()/10)*10+10).getTime();
    }
    t = stop;
  }
}
function liveToday(){
  const base = getDay(dayKey(new Date())).t;
  if (!S.running) return base;
  return base + Math.max(0, Date.now() - Math.max(S.running.since, startOfDay(new Date())))/1000;
}
function liveSubj(s){
  const base = getDay(dayKey(new Date())).s[s] || 0;
  if (!S.running || S.running.subj !== s) return base;
  return base + Math.max(0, Date.now() - Math.max(S.running.since, startOfDay(new Date())))/1000;
}
function prune(){
  const cutoff = dayKey(new Date(Date.now() - 120*864e5));
  for (const k of Object.keys(S.log)) if (k < cutoff) delete S.log[k];
}

/* ---------- nickname filter ---------- */
const BAD = ["fuck","shit","bitch","madarchod","bhenchod","behenchod","chutiya","chutia","gandu","randi","bsdk","bhosd","lauda","lavda","porn","sexy","nigga","admin","official","padhaitimer","moderator"];
const nickOk = n => { const x = n.toLowerCase().replace(/[\s._\-]/g,""); return n.trim().length > 0 && !BAD.some(b => x.includes(b)); };
const defaultNick = () => "Aspirant-" + (B.uid ? B.uid.slice(-4).toUpperCase() : "you");

/* ---------- backend ---------- */
const queue = fn => { let busy = false, again = false;
  return async function run(){ if (busy){ again = true; return; } busy = true; try { await fn(); } catch(e){ console.warn(e); } busy = false; if (again){ again = false; run(); } };
};
const B = {
  mode: window.PADHAI_FIREBASE ? "live" : "demo",
  ready: false, uid: null, email: null, anon: true,
  fb: null, auth: null, db: null, hallDocs: [], unsub: null, groupNames: {},

  async start(){
    if (this.mode === "demo"){ this.ready = true; afterReady(); return; }
    try {
      const base = "https://www.gstatic.com/firebasejs/"+FB_VER+"/";
      const [app, auth, fs] = await Promise.all([import(base+"firebase-app.js"), import(base+"firebase-auth.js"), import(base+"firebase-firestore.js")]);
      this.fb = {app, auth, fs};
      const a = app.getApps().length ? app.getApp() : app.initializeApp(window.PADHAI_FIREBASE);
      this.auth = auth.getAuth(a); this.db = fs.getFirestore(a);
      try { await auth.getRedirectResult(this.auth); } catch(e){ if (e && e.code === "auth/credential-already-in-use") await this.switchToGoogle(e); }
      auth.onAuthStateChanged(this.auth, async user => {
        if (!user){ try { await auth.signInAnonymously(this.auth); } catch(e){ console.warn(e); this.mode = "demo"; this.ready = true; afterReady(); } return; }
        this.uid = user.uid; this.email = user.email || null; this.anon = user.isAnonymous;
        await this.loadUser();
        this.ready = true; afterReady();
      });
    } catch(e){
      console.warn("Firebase failed to load, using demo mode", e);
      this.mode = "demo"; this.ready = true; afterReady();
    }
  },
  async loadUser(){
    const {doc, getDoc} = this.fb.fs;
    try {
      const snap = await getDoc(doc(this.db, "users", this.uid));
      if (snap.exists()){
        const d = snap.data();
        if (S.sample || (d.updated||0) > (S.updated||0)){
          S = Object.assign({}, S, d, {lang:S.lang, consent:true, sample:false, guideHidden:S.guideHidden, tab:S.tab});
          if (!Array.isArray(S.groups)) S.groups = [];
          saveLocal();
        }
      } else if (!S.sample) this.saveUser();
    } catch(e){ console.warn(e); }
  },
  saveUser: null, pushHall: null,
  subscribe(){
    if (this.unsub){ this.unsub(); this.unsub = null; }
    this.hallDocs = [];
    if (this.mode !== "live" || !this.uid) { renderHall(); return; }
    const {collection, query, where, limit, onSnapshot} = this.fb.fs;
    let q;
    if (S.tab === "group"){
      if (!S.activeGroup){ renderHall(); return; }
      q = query(collection(this.db, "hall"), where("groups", "array-contains", S.activeGroup), limit(100));
    } else {
      q = query(collection(this.db, "hall"), where("exam", "==", S.exam), where("day", "==", istDay()), limit(200));
    }
    this.unsub = onSnapshot(q, snap => { this.hallDocs = snap.docs.map(d => Object.assign({id:d.id}, d.data())); renderHall(); },
                                 err => { console.warn(err); this.hallDocs = []; renderHall(); });
  },
  async getGroup(code){
    if (this.mode === "demo"){ const g = demoGroups()[code]; return g ? {code, name:g} : null; }
    const {doc, getDoc} = this.fb.fs;
    const snap = await getDoc(doc(this.db, "groups", code));
    return snap.exists() ? {code, name: String(snap.data().name || code)} : null;
  },
  async createGroup(name){
    const abc = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    for (let tries = 0; tries < 5; tries++){
      let code = ""; for (let i = 0; i < 6; i++) code += abc[Math.floor(Math.random()*abc.length)];
      if (this.mode === "demo"){ const g = demoGroups(); if (g[code]) continue; g[code] = name; saveDemoGroups(g); return {code, name}; }
      const {doc, setDoc, serverTimestamp} = this.fb.fs;
      try { await setDoc(doc(this.db, "groups", code), {name, createdBy:this.uid, createdAt: serverTimestamp()}); return {code, name}; }
      catch(e){ if (tries === 4) throw e; }   // code taken (rules refuse overwriting), try another
    }
  },
  async google(){
    if (this.mode !== "live") return;
    const {GoogleAuthProvider, linkWithPopup, linkWithRedirect} = this.fb.auth;
    const p = new GoogleAuthProvider();
    try { await linkWithPopup(this.auth.currentUser, p); await this.auth.currentUser.reload(); this.email = this.auth.currentUser.email; this.anon = false; renderAccount(); toast(L().savedAs(this.email || "Google")); }
    catch(e){
      if (e.code === "auth/credential-already-in-use") await this.switchToGoogle(e);
      else if (e.code === "auth/popup-blocked" || e.code === "auth/operation-not-supported-in-this-environment") await linkWithRedirect(this.auth.currentUser, p);
      else if (e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request") toast(e.message || String(e));
    }
  },
  async switchToGoogle(e){   // this Google account already has a log: open it
    const {GoogleAuthProvider, signInWithCredential} = this.fb.auth;
    const cred = GoogleAuthProvider.credentialFromError(e);
    if (cred) await signInWithCredential(this.auth, cred);
  },
  async signOut(){ if (this.mode === "live"){ await this.fb.auth.signOut(this.auth); } },
  async eraseRemote(){
    if (this.mode !== "live" || !this.uid) return;
    const {doc, deleteDoc} = this.fb.fs;
    try { await deleteDoc(doc(this.db, "hall", this.uid)); await deleteDoc(doc(this.db, "users", this.uid)); } catch(e){ console.warn(e); }
  }
};
B.saveUser = queue(async () => {
  if (B.mode !== "live" || !B.uid || S.sample || !S.consent) return;
  const {doc, setDoc} = B.fb.fs;
  await setDoc(doc(B.db, "users", B.uid), {v:2, exam:S.exam, nick:S.nick, examDate:S.examDate, last:S.last,
    running:S.running, log:S.log, groups:S.groups, activeGroup:S.activeGroup, updated:S.updated});
});
B.pushHall = queue(async () => {
  if (B.mode !== "live" || !B.uid || !S.consent) return;
  const {doc, setDoc} = B.fb.fs;
  await setDoc(doc(B.db, "hall", B.uid), {
    nick: (nickOk(S.nick) ? S.nick : defaultNick()).slice(0,24), exam: S.exam, day: istDay(),
    base: Math.min(DAY_CAP, Math.round(S.sample ? 0 : getDay(dayKey(new Date())).t)), studying: !!S.running,
    subject: S.running ? S.running.subj : null, since: S.running ? S.running.since : null, at: Date.now(),
    groups: S.groups.map(g => g.code).slice(0, MAX_GROUPS)
  });
});
function demoGroups(){ try { return JSON.parse(localStorage.getItem("padhai.demoGroups")) || {}; } catch(e){ return {}; } }
function saveDemoGroups(g){ try { localStorage.setItem("padhai.demoGroups", JSON.stringify(g)); } catch(e){} }

/* ---------- actions ---------- */
let wake = null;
function wakeOn(){ try { navigator.wakeLock && navigator.wakeLock.request("screen").then(w => wake = w).catch(()=>{}); } catch(e){} }
function wakeOff(){ try { wake && wake.release(); } catch(e){} wake = null; }
function persist(){ S.updated = Date.now(); prune(); saveLocal(); B.saveUser(); }
function clearSample(){ if (S.sample){ S.log = {}; S.sample = false; } }
function commit(end){
  if (!S.running) return;
  addInterval(S.running.since, Math.max(S.running.since, end || Date.now()), S.running.subj);
  S.running = null;
}
function start(subj){
  clearSample();
  if (S.running) commit();
  const now = Date.now();
  S.running = {subj, since: now, check: now}; S.last = subj;
  persist(); B.pushHall(); wakeOn(); renderAll();
}
function pause(end){
  if (!S.running) return;
  commit(end); persist(); B.pushHall(); wakeOff(); hideCheck(); renderAll();
}

/* ---------- still studying check ---------- */
function checkTick(){
  if (!S.running){ hideCheck(); return; }
  const now = Date.now(), last = S.running.check || S.running.since;
  if (now - last >= CHECK_EVERY + CHECK_GRACE){ pause(last + CHECK_EVERY); toast(L().autoPaused, 6000); return; }
  if (now - last >= CHECK_EVERY){
    const left = Math.max(0, last + CHECK_EVERY + CHECK_GRACE - now) / 1000;
    $("#checkCount").textContent = Math.floor(left/60) + ":" + pad(Math.floor(left%60));
    if ($("#checkModal").hidden){ $("#checkModal").hidden = false; $("#checkYes").focus(); }
  }
}
function hideCheck(){ $("#checkModal").hidden = true; }
$("#checkYes").addEventListener("click", () => {
  if (S.running){
    // Save the time so far and carry on, so others see the full time and a fresh "since".
    const now = Date.now(), subj = S.running.subj;
    addInterval(S.running.since, now, subj);
    S.running = {subj, since: now, check: now};
    persist(); B.pushHall(); renderAll();
  }
  hideCheck();
});

/* ---------- rendering ---------- */
function el(tag, cls, text){ const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
const ICON_PLAY = '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.5v9l7.5-4.5z" fill="currentColor"/></svg>';
const ICON_PAUSE = '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="1.5" width="3" height="9" rx="1" fill="currentColor"/><rect x="7" y="1.5" width="3" height="9" rx="1" fill="currentColor"/></svg>';
let toastTimer = null;
function toast(msg, ms){ const t = $("#toast"); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => t.hidden = true, ms || 3000); }

function buildStatic(){
  document.documentElement.lang = S.lang;
  const t = L(), set = (id, v) => { $(id).textContent = v; };
  set("#tagline", t.tagline); set("#todayLabel", t.today); set("#hallTitle", t.hall);
  set("#planTitle", t.plan); set("#planSub", t.planSub); set("#weekTitle", t.week); set("#weekSub", t.weekSub);
  set("#setTitle", t.settings); set("#examDateLabel", t.examDate); set("#resetLabel", t.reset); set("#resetBtn", t.resetBtn);
  set("#nickLabel", t.nick); set("#nickSave", t.save); set("#footer", t.footer);
  set("#sampleText", t.sampleText); set("#clearSample", t.clearSample);
  set("#guideTitle", t.guideTitle); set("#guideHide", t.guideHide); set("#guideOpen", t.guideShow);
  set("#tabGroup", t.tabGroup); set("#tabAll", t.tabAll(EXAMS[S.exam].label));
  set("#groupNone", t.groupNone); set("#createBtn", t.createGroup); set("#joinBtn", t.joinGroup);
  set("#shareWA", t.shareWA); set("#copyCode", t.copyCode); set("#leaveGroup", t.leave); set("#addGroup", t.addGroup);
  $("#groupName").placeholder = t.groupNamePh; $("#joinCode").placeholder = t.codePh;
  set("#privacyLink", t.privacy); set("#termsLink", t.terms); set("#cPrivacy", t.privacy); set("#cTerms", t.terms);
  set("#consentTitle", t.consentTitle); set("#consentText", t.consentText); set("#consentAgeText", t.consentAge); set("#consentAgree", t.consentAgree);
  set("#checkTitle", t.checkTitle); set("#checkText", t.checkText); set("#checkYes", t.checkYes);
  set("#inviteYes", t.yesJoin); set("#inviteNo", t.notNow); set("#installBtn", t.install);
  set("#accountLabel", t.account); set("#accountNote", t.accountNote); set("#demoNote", t.demo);
  $("#demoNote").hidden = B.mode !== "demo";
  const ls = $("#lang");
  if (!ls.options.length) for (const [code, name] of LANGS){ const o = el("option", null, name); o.value = code; ls.appendChild(o); }
  ls.value = S.lang;
  const sel = $("#exam");
  if (!sel.options.length) for (const [k,v] of Object.entries(EXAMS)){ const o = el("option", null, v.label); o.value = k; sel.appendChild(o); }
  sel.value = S.exam;
  $("#examDate").value = S.examDate || "";
  if (document.activeElement !== $("#nick")) $("#nick").value = S.nick || "";
  $("#nick").placeholder = defaultNick();
  $("#guide").hidden = false; $("#guideOpen").hidden = true;  // the guide lives in the "How to use" tab now
  const st = $("#steps"); st.textContent = "";
  t.steps.forEach((x, i) => { const li = el("li"), d = el("div"); li.appendChild(el("span","num",String(i+1))); d.append(el("h3",null,x[0]), el("p",null,x[1])); li.appendChild(d); st.appendChild(li); });
  renderAccount();
}
function renderAccount(){
  const t = L();
  $("#accountBox").hidden = B.mode !== "live";
  $("#googleBtn").hidden = !B.anon; $("#googleBtn").textContent = t.saveGoogle;
  $("#signOutBtn").hidden = B.anon; $("#signOutBtn").textContent = t.signOut;
  $("#accountNote").textContent = B.anon ? t.accountNote : t.savedAs(B.email || "Google");
}
function buildSubjects(){
  const ul = $("#subjects"); ul.textContent = "";
  subjects().forEach((s, i) => {
    const li = el("li"), b = el("button", "subj"); b.type = "button"; b.dataset.s = s;
    const dot = el("span", "dot"); dot.style.background = "var(--s"+i+")";
    b.append(dot, el("span","name",subjName(s)), el("span","t","00:00:00"), el("span","ic"));
    b.addEventListener("click", () => { if (S.running && S.running.subj === s) pause(); else start(s); });
    li.appendChild(b); ul.appendChild(li);
  });
}
function renderTimer(){
  const t = L(), run = !!S.running;
  const clock = $("#clock"); clock.textContent = fmtHMS(liveToday()); clock.classList.toggle("running", run);
  const now = $("#nowLine"); now.textContent = "";
  if (run) now.append(el("span","pulse"), el("span", null, t.studying(subjName(S.running.subj))));
  else now.textContent = S.last ? t.resting : t.pick;
  const mb = $("#mainBtn");
  mb.innerHTML = (run ? ICON_PAUSE : ICON_PLAY) + "<span></span>";
  mb.lastChild.textContent = run ? t.pause : (S.last && subjects().includes(S.last) ? t.start + " · " + subjName(S.last) : t.start);
  mb.classList.toggle("on", run);
  document.querySelectorAll(".subj").forEach(b => {
    const s = b.dataset.s, active = run && S.running.subj === s;
    b.classList.toggle("active", active);
    b.querySelector(".t").textContent = fmtHMS(liveSubj(s));
    b.querySelector(".ic").innerHTML = active ? ICON_PAUSE : ICON_PLAY;
    b.setAttribute("aria-label", subjName(s) + " " + (active ? t.pause : t.start));
  });
}
function renderChips(){
  const t = L(), ex = EXAMS[S.exam].label, dd = $("#ddayChip");
  if (S.examDate){
    const [y,m,d] = S.examDate.split("-").map(Number);
    dd.textContent = t.dday(Math.round((new Date(y,m-1,d) - startOfDay(new Date()))/864e5), ex);
  } else dd.textContent = t.setDate;
  let n = 0, d = new Date();
  const val = x => dayKey(x) === dayKey(new Date()) ? liveToday() : getDay(dayKey(x)).t;
  if (val(d) < 600) d = new Date(d.getFullYear(), d.getMonth(), d.getDate()-1);
  while (val(d) >= 600 && n < 400){ n++; d = new Date(d.getFullYear(), d.getMonth(), d.getDate()-1); }
  $("#streakChip").textContent = t.streak(n);
  $("#sampleBanner").hidden = !S.sample;
}

const SAMPLE_PEERS = [
  ["Aarav · Kota", 5.6, 1], ["Ishita · Patna", 4.9, 1], ["Rohan · Delhi", 4.1, 0], ["Meera · Hyderabad", 3.7, 1],
  ["Kabir · Jaipur", 3.2, 0], ["Ananya · Pune", 2.6, 1], ["Vikram · Lucknow", 1.9, 0]
];
const pageStart = Date.now();
let showGroupForms = false;
function hallRows(){
  const now = Date.now(), today = istDay(), subs = subjects();
  let rows = [];
  if (B.mode === "live"){
    rows = B.hallDocs.filter(d => d.day === today && d.id !== B.uid && (S.tab === "group" || d.exam === S.exam)).map(d => {
      let secs = Math.min(DAY_CAP, Number(d.base) || 0);
      if (d.studying && d.since) secs += Math.min(CHECK_EVERY + CHECK_GRACE, Math.max(0, now - Number(d.since))) / 1000;
      // Someone who closed the app while the timer ran never answered "Still studying?" — show them as on a break.
      const stale = !!d.studying && (!d.since || now - Number(d.since) > CHECK_EVERY + CHECK_GRACE);
      return {name: String(d.nick || "Aspirant").slice(0,24), secs: Math.min(DAY_CAP, secs), on: !!d.studying && !stale, subj: d.subject, sample:false, me:false};
    });
  } else {
    const peers = S.tab === "group" ? SAMPLE_PEERS.slice(0, 3) : SAMPLE_PEERS;
    rows = peers.map(([name, h, on], i) => ({name, secs: h*3600 + (on ? (now - pageStart)/1000 : 0), on: !!on, subj: subs[i % subs.length], sample:true, me:false}));
  }
  rows.push({name: nickOk(S.nick) ? S.nick : defaultNick(), secs: S.sample ? 0 : Math.min(DAY_CAP, liveToday()), on: !!S.running, subj: S.running ? S.running.subj : null, sample:false, me:true});
  rows.sort((a,b) => b.secs - a.secs);
  return rows.slice(0, 50);
}
function renderGroupUI(){
  const t = L(), has = S.groups.length > 0, inGroupTab = S.tab === "group";
  $("#tabGroup").setAttribute("aria-selected", String(inGroupTab)); $("#tabAll").setAttribute("aria-selected", String(!inGroupTab));
  $("#groupPanel").hidden = !inGroupTab;
  $("#groupBar").hidden = !has;
  $("#groupEmpty").hidden = has && !showGroupForms;
  const sel = $("#groupSel"); sel.textContent = "";
  S.groups.forEach(g => { const o = el("option", null, g.name); o.value = g.code; sel.appendChild(o); });
  if (S.activeGroup) sel.value = S.activeGroup;
  $("#groupCode").textContent = S.activeGroup || "";
  $("#addGroup").hidden = S.groups.length >= MAX_GROUPS;
}
function renderHall(){
  const t = L(), ex = EXAMS[S.exam].label;
  renderGroupUI();
  $("#hallSub").textContent = t.hallSub(ex);
  try { $("#istClock").textContent = "IST " + new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",hour:"2-digit",minute:"2-digit"}).format(new Date()); } catch(e){}
  const noGroup = S.tab === "group" && !S.activeGroup;
  $("#liveWrap").hidden = noGroup; $("#hallList").hidden = noGroup; $("#hallNote").hidden = noGroup;
  if (noGroup) return;
  const rows = hallRows();
  $("#liveCount").textContent = t.live(rows.filter(r => r.on).length);
  const ol = $("#hallList"); ol.textContent = "";
  rows.forEach((r, i) => {
    const li = el("li", "row" + (i === 0 && r.secs > 0 ? " top1" : "") + (r.me ? " me" : ""));
    li.appendChild(el("span","rank", String(i+1)));
    const who = el("div","who"), n = el("div","n");
    n.appendChild(el("span", null, r.name));
    if (r.me) n.appendChild(el("span","pill you", t.you));
    if (r.sample) n.appendChild(el("span","pill", t.sample));
    const st = el("div","st"); st.appendChild(el("span","sd"+(r.on?" on":"")));
    st.appendChild(el("span", null, r.on && r.subj ? t.studying(subjName(r.subj)) : t.resting));
    who.append(n, st); li.appendChild(who);
    li.appendChild(el("span","t", fmtHMS(r.secs)));
    ol.appendChild(li);
  });
  const onlyMe = B.mode === "live" && rows.length === 1 && rows[0].secs < 60;
  $("#hallNote").textContent = B.mode === "demo" ? t.hallNoteSample : (onlyMe ? t.hallEmpty : t.hallNoteLive);
}
function renderPlanner(){
  const box = $("#planner"); box.textContent = "";
  const b = Object.assign({}, getDay(dayKey(new Date())).b), now = new Date();
  if (S.running){
    let x = Math.max(S.running.since, startOfDay(now));
    while (x <= now.getTime()){ const xd = new Date(x); b[xd.getHours()*6 + Math.floor(xd.getMinutes()/10)] = S.running.subj; x += 600000; }
    b[now.getHours()*6 + Math.floor(now.getMinutes()/10)] = S.running.subj;
  }
  const nowSlot = now.getHours()*6 + Math.floor(now.getMinutes()/10);
  for (let r = 0; r < 24; r++){
    const hour = (r + 5) % 24;
    box.appendChild(el("span","h", pad(hour)));
    for (let c = 0; c < 6; c++){
      const slot = hour*6 + c, cell = el("span","cell" + (slot === nowSlot ? " now" : ""));
      if (b[slot]) cell.style.background = colorOf(b[slot]);
      box.appendChild(cell);
    }
  }
  const lg = $("#legend"); lg.textContent = "";
  subjects().forEach((s,i) => { const sp = el("span"), ii = el("i"); ii.style.background = "var(--s"+i+")"; sp.append(ii, document.createTextNode(subjName(s))); lg.appendChild(sp); });
}
function renderWeek(){
  const t = L(), box = $("#weekChart"), days = [], now = new Date();
  for (let i = 6; i >= 0; i--){
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate()-i);
    days.push({d, h: (i === 0 && !S.sample ? liveToday() : getDay(dayKey(d)).t)/3600, today: i === 0});
  }
  const maxH = Math.max(...days.map(x => x.h));
  if (maxH < 0.01){ box.textContent = ""; box.appendChild(el("p","empty", t.weekEmpty)); return; }
  const top = Math.max(2, Math.ceil(maxH/2)*2), W = 640, H = 230, padL = 36, padB = 30, padT = 22, cw = (W - padL - 8)/7;
  let wd; try { wd = new Intl.DateTimeFormat(LOCALE[S.lang], {weekday:"short"}); } catch(e){ wd = {format: d => ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()]}; }
  const y = h => padT + (H - padT - padB) * (1 - h/top);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  let svg = '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(t.weekSub)+'">';
  const step = top <= 6 ? 2 : top <= 12 ? 4 : 6;
  for (let g = 0; g <= top; g += step){
    svg += '<line class="gl" x1="'+padL+'" x2="'+(W-4)+'" y1="'+y(g)+'" y2="'+y(g)+'"/><text class="axis" x="'+(padL-8)+'" y="'+(y(g)+4)+'" text-anchor="end">'+g+'</text>';
  }
  days.forEach((x, i) => {
    const bx = padL + i*cw + cw*0.2, bw = cw*0.6, by = y(x.h), bh = Math.max(0, y(0) - by);
    svg += '<rect class="bar'+(x.today?' today':'')+'" x="'+bx.toFixed(1)+'" y="'+by.toFixed(1)+'" width="'+bw.toFixed(1)+'" height="'+bh.toFixed(1)+'" rx="5"/>';
    if (x.h >= 0.05) svg += '<text class="val" x="'+(bx+bw/2).toFixed(1)+'" y="'+(by-6).toFixed(1)+'" text-anchor="middle">'+x.h.toFixed(1)+'</text>';
    svg += '<text class="axis" x="'+(bx+bw/2).toFixed(1)+'" y="'+(H-10)+'" text-anchor="middle">'+esc(wd.format(x.d))+'</text>';
  });
  box.innerHTML = svg + '</svg>';
}
function buildAll(){ buildStatic(); buildSubjects(); renderAll(); }
function renderAll(){ renderTimer(); renderChips(); renderHall(); renderPlanner(); renderWeek(); }

/* ---------- groups ---------- */
function showErr(id, msg){ const e = $(id); e.textContent = msg || ""; e.hidden = !msg; }
function addGroupToMe(g){
  if (S.groups.some(x => x.code === g.code)){ S.activeGroup = g.code; }
  else { if (S.groups.length >= MAX_GROUPS){ showErr("#groupErr", L().groupFull); return false; } S.groups.push(g); S.activeGroup = g.code; }
  S.tab = "group"; showGroupForms = false; showErr("#groupErr", "");
  persist(); B.pushHall(); B.subscribe(); renderHall(); return true;
}
$("#createForm").addEventListener("submit", async e => {
  e.preventDefault();
  const name = $("#groupName").value.trim().slice(0,40);
  if (!name || !nickOk(name)){ showErr("#groupErr", L().nickBad); return; }
  if (S.groups.length >= MAX_GROUPS){ showErr("#groupErr", L().groupFull); return; }
  try { const g = await B.createGroup(name); $("#groupName").value = ""; addGroupToMe(g); }
  catch(err){ showErr("#groupErr", err.message || String(err)); }
});
$("#joinForm").addEventListener("submit", async e => {
  e.preventDefault();
  const code = $("#joinCode").value.trim().toUpperCase();
  if (code.length !== 6){ showErr("#groupErr", L().joinErr); return; }
  try { const g = await B.getGroup(code); if (!g){ showErr("#groupErr", L().joinErr); return; } $("#joinCode").value = ""; addGroupToMe(g); }
  catch(err){ showErr("#groupErr", L().joinErr); }
});
$("#groupSel").addEventListener("change", e => { S.activeGroup = e.target.value; saveLocal(); B.subscribe(); renderHall(); });
$("#addGroup").addEventListener("click", () => { showGroupForms = !showGroupForms; renderHall(); if (showGroupForms) $("#groupName").focus(); });
$("#leaveGroup").addEventListener("click", () => {
  S.groups = S.groups.filter(g => g.code !== S.activeGroup);
  S.activeGroup = S.groups.length ? S.groups[0].code : null;
  persist(); B.pushHall(); B.subscribe(); renderHall();
});
const inviteUrl = code => location.origin + location.pathname + "?g=" + code;
$("#shareWA").addEventListener("click", () => {
  const g = S.groups.find(x => x.code === S.activeGroup); if (!g) return;
  window.open("https://wa.me/?text=" + encodeURIComponent(L().inviteText(g.name, g.code, inviteUrl(g.code))), "_blank", "noopener");
});
$("#copyCode").addEventListener("click", async () => {
  const g = S.groups.find(x => x.code === S.activeGroup); if (!g) return;
  const text = L().inviteText(g.name, g.code, inviteUrl(g.code));
  try { await navigator.clipboard.writeText(text); toast(L().copied); }
  catch(e){ toast(g.code); }
});
$("#tabGroup").addEventListener("click", () => { S.tab = "group"; saveLocal(); B.subscribe(); renderHall(); });
$("#tabAll").addEventListener("click", () => { S.tab = "all"; saveLocal(); B.subscribe(); renderHall(); });

let pendingInvite = null;
async function checkInvite(){
  const m = location.search.match(/[?&]g=([A-Za-z0-9]{6})/);
  if (!m) return;
  try { history.replaceState(null, "", location.pathname); } catch(e){}
  const code = m[1].toUpperCase();
  if (S.groups.some(g => g.code === code)){ S.activeGroup = code; S.tab = "group"; B.subscribe(); renderHall(); return; }
  try { const g = await B.getGroup(code); if (!g) return; pendingInvite = g; $("#inviteTitle").textContent = L().inviteAsk(g.name); $("#inviteModal").hidden = false; } catch(e){}
}
$("#inviteYes").addEventListener("click", () => { $("#inviteModal").hidden = true; if (pendingInvite) addGroupToMe(pendingInvite); pendingInvite = null; });
$("#inviteNo").addEventListener("click", () => { $("#inviteModal").hidden = true; pendingInvite = null; });

/* ---------- other events ---------- */
$("#mainBtn").addEventListener("click", () => { if (S.running) pause(); else start(S.last && subjects().includes(S.last) ? S.last : subjects()[0]); });
$("#exam").addEventListener("change", e => {
  if (S.running) commit();
  S.exam = e.target.value; if (!subjects().includes(S.last)) S.last = null;
  persist(); B.pushHall(); wakeOff(); buildAll(); if (S.tab === "all") B.subscribe();
});
$("#lang").addEventListener("change", e => { S.lang = e.target.value; saveLocal(); buildAll(); });
$("#guideHide").addEventListener("click", () => { S.guideHidden = true; saveLocal(); buildStatic(); $("#guideOpen").focus(); });
$("#guideOpen").addEventListener("click", () => { S.guideHidden = false; saveLocal(); buildStatic(); $("#guide").scrollIntoView({behavior:"smooth", block:"start"}); });
$("#nickForm").addEventListener("submit", e => {
  e.preventDefault();
  const v = $("#nick").value.trim().slice(0,24);
  if (v && !nickOk(v)){ showErr("#nickErr", L().nickBad); return; }
  showErr("#nickErr", ""); S.nick = v; persist(); B.pushHall(); renderHall(); toast(L().save + " ✓");
});
$("#examDate").addEventListener("change", e => { S.examDate = e.target.value; persist(); renderChips(); });
$("#ddayChip").addEventListener("click", () => { $("#settingsCard").scrollIntoView({behavior:"smooth", block:"center"}); setTimeout(() => $("#examDate").focus(), 400); });
$("#clearSample").addEventListener("click", () => { clearSample(); persist(); renderAll(); });
$("#googleBtn").addEventListener("click", () => B.google());
$("#signOutBtn").addEventListener("click", () => B.signOut());
let armed = null;
$("#resetBtn").addEventListener("click", async () => {
  const btn = $("#resetBtn");
  if (!armed){ btn.textContent = L().resetConfirm; armed = setTimeout(() => { armed = null; btn.textContent = L().resetBtn; }, 4000); return; }
  clearTimeout(armed); armed = null;
  wakeOff();
  await B.eraseRemote();
  const keep = {lang:S.lang, exam:S.exam, consent:S.consent, guideHidden:S.guideHidden};
  S = Object.assign(freshState(false), keep); saveLocal(); buildAll(); B.subscribe(); toast(L().erased);
});
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible"){ checkTick(); if (S.running) wakeOn(); } });
window.addEventListener("offline", () => toast(L().offline, 5000));

/* consent */
$("#consentAge").addEventListener("change", e => { $("#consentAgree").disabled = !e.target.checked; });
$("#consentAgree").addEventListener("click", () => {
  S.consent = true; saveLocal(); $("#consent").hidden = true; B.start();
});

/* install as app */
// Computer: "📱 Install on phone" opens a QR code. Phone: the browser's own install box (or the guide page on iPhone).
const PI = window.PadhaiInstall;
if (PI){
  if (PI.desktop || !PI.standalone) $("#installBtn").hidden = false;
  $("#installBtn").addEventListener("click", () => { if (!PI.install()) location.href = "install.html"; });
}
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")){
  navigator.serviceWorker.register("sw.js").catch(()=>{});
}

/* ---------- start ---------- */
function afterReady(){
  if (!S.activeGroup && S.groups.length) S.activeGroup = S.groups[0].code;
  buildAll(); B.subscribe(); if (S.running) B.pushHall(); checkInvite();
}
let lastSlot = -1;
setInterval(() => {
  renderTimer(); renderHall(); checkTick();
  const n = new Date(), slot = n.getHours()*6 + Math.floor(n.getMinutes()/10);
  if (slot !== lastSlot){ lastSlot = slot; renderPlanner(); renderChips(); renderWeek(); }
}, 1000);

buildAll();
checkTick();
if (S.running) wakeOn();
if (S.consent) B.start(); else $("#consent").hidden = false;
})();
