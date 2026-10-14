/* Study chat: one feed shared by the app ("Chat" tab) and the website (/home/community.html).
   Posts appear right away. Bad words, phone numbers and links are blocked (filter.js + Firestore rules),
   a post reported by 3 people is hidden, posts older than 30 days are not shown. Nobody has to moderate by hand.
   Needs: firebase-config.js, home/filter.js, community-text.js (window.PCT). */
(function(){
  var FB = "https://www.gstatic.com/firebasejs/10.12.2/";
  var EXL = {neet:"NEET UG",jee:"JEE",upsc:"UPSC",ssc:"SSC",bank:"Bank",ca:"CA",board:"Boards",other:"Other"};
  function lang(){ return (document.documentElement.lang || "en").slice(0,2); }
  // Words for the "Chat / Study info" split (kept here so the shared text file doesn't need rebuilding).
  var K2 = {
    en:{fAll:"All",fChat:"💬 Talk",fInfo:"📚 Study info",kindQ:"What kind of post?",phInfo:"Share something useful for studying: a good book, a free lecture, a study method…",tagInfo:"📚 Info",rule5:"Study info: only things that help with studying. Self-promotion by coaching centres or paid courses may be removed.",infoEmpty:"No study info yet. Share the first useful tip!"},
    hi:{fAll:"सब",fChat:"💬 गपशप",fInfo:"📚 पढ़ाई की जानकारी",kindQ:"किस तरह की पोस्ट?",phInfo:"पढ़ाई में काम की चीज़ शेयर करें: अच्छी किताब, फ्री लेक्चर, पढ़ने का तरीका…",tagInfo:"📚 जानकारी",rule5:"पढ़ाई की जानकारी में सिर्फ़ काम की बातें। कोचिंग या पेड कोर्स का अपना प्रचार हटाया जा सकता है।",infoEmpty:"अभी कोई जानकारी नहीं। पहली काम की टिप आप शेयर करें!"},
    bn:{fAll:"সব",fChat:"💬 গল্পগুজব",fInfo:"📚 পড়াশোনার তথ্য",kindQ:"কী ধরনের পোস্ট?",phInfo:"পড়াশোনায় কাজে লাগে এমন কিছু শেয়ার করো: ভালো বই, ফ্রি লেকচার, পড়ার কৌশল…",tagInfo:"📚 তথ্য",rule5:"পড়াশোনার তথ্যে শুধু কাজের কথা। কোচিং বা পেইড কোর্সের নিজস্ব প্রচার সরিয়ে দেওয়া হতে পারে।",infoEmpty:"এখনও কোনো তথ্য নেই। প্রথম কাজের টিপটা তুমি দাও!"},
    te:{fAll:"అన్నీ",fChat:"💬 ముచ్చట్లు",fInfo:"📚 చదువు సమాచారం",kindQ:"ఏ రకమైన పోస్ట్?",phInfo:"చదువుకు ఉపయోగపడేది పంచుకోండి: మంచి పుస్తకం, ఉచిత లెక్చర్, చదివే పద్ధతి…",tagInfo:"📚 సమాచారం",rule5:"చదువు సమాచారంలో ఉపయోగపడేవి మాత్రమే. కోచింగ్ లేదా పెయిడ్ కోర్సుల స్వంత ప్రచారం తొలగించబడవచ్చు.",infoEmpty:"ఇంకా సమాచారం లేదు. మొదటి ఉపయోగకరమైన చిట్కా మీరే పంచుకోండి!"},
    mr:{fAll:"सर्व",fChat:"💬 गप्पाटप्पा",fInfo:"📚 अभ्यासाची माहिती",kindQ:"कोणत्या प्रकारची पोस्ट?",phInfo:"अभ्यासाला उपयोगी गोष्ट शेअर करा: चांगलं पुस्तक, मोफत लेक्चर, अभ्यासाची पद्धत…",tagInfo:"📚 माहिती",rule5:"अभ्यासाच्या माहितीत फक्त उपयोगी गोष्टी. कोचिंग किंवा पेड कोर्सची स्वतःची जाहिरात काढली जाऊ शकते.",infoEmpty:"अजून माहिती नाही. पहिली उपयोगी टिप तुम्ही शेअर करा!"},
    ta:{fAll:"எல்லாம்",fChat:"💬 பேச்சு",fInfo:"📚 படிப்பு தகவல்",kindQ:"எந்த வகை பதிவு?",phInfo:"படிப்புக்கு உதவும் ஒன்றைப் பகிருங்கள்: நல்ல புத்தகம், இலவச வகுப்பு, படிக்கும் முறை…",tagInfo:"📚 தகவல்",rule5:"படிப்பு தகவலில் பயனுள்ளவை மட்டும். கோச்சிங் அல்லது கட்டண படிப்புகளின் சுய விளம்பரம் நீக்கப்படலாம்.",infoEmpty:"இன்னும் தகவல் இல்லை. முதல் பயனுள்ள குறிப்பை நீங்களே பகிருங்கள்!"},
    ko:{fAll:"전체",fChat:"💬 수다",fInfo:"📚 정보 공유",kindQ:"어떤 글인가요?",phInfo:"공부에 도움 되는 정보를 나눠 주세요: 좋은 책, 무료 강의, 공부법…",tagInfo:"📚 정보",rule5:"정보 공유에는 공부에 도움 되는 것만 올려 주세요. 학원이나 유료 강의가 직접 올린 홍보 글은 지워질 수 있어요.",infoEmpty:"아직 정보 글이 없어요. 첫 번째 꿀팁을 나눠 주세요!"}
  };
  function tr(k){ if (K2.en[k]) return (K2[lang()] || K2.en)[k] || K2.en[k]; var T = window.PCT || {}; return (T[lang()] && T[lang()][k]) || (T.en && T.en[k]) || k; }
  function el(tag, cls, text){ var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function appState(){ try { return JSON.parse(localStorage.getItem("padhai.v2") || "null") || {}; } catch(e){ return {}; } }

  var conn = null;
  function connect(signIn){
    if (conn) return conn;
    conn = (async function(){
      var cfg = window.PADHAI_FIREBASE; if (!cfg) return null;
      var appm = await import(FB + "firebase-app.js"), authm = await import(FB + "firebase-auth.js"), fs = await import(FB + "firebase-firestore.js");
      var app = appm.getApps().length ? appm.getApp() : appm.initializeApp(cfg);
      var auth = authm.getAuth(app);
      // Wait for a signed-in user. In the app, the timer signs in; on the website we sign in anonymously ourselves.
      await new Promise(function(res){
        var stop = authm.onAuthStateChanged(auth, function(u){
          if (u){ stop(); res(); }
          else if (signIn) authm.signInAnonymously(auth).catch(function(){ stop(); res(); });
        });
      });
      if (!auth.currentUser) throw new Error("not-signed-in");
      return { fs: fs, db: fs.getFirestore(app), uid: auth.currentUser.uid };
    })();
    conn.catch(function(){ conn = null; });
    return conn;
  }

  function mount(root, opts){
    opts = opts || {};
    var EX = Object.keys(EXL);
    root.textContent = "";
    var form = el("form", "card form compose"); form.noValidate = true;
    var two = el("div", "two");
    var lNick = el("label", "field"), sNick = el("span"), nick = el("input"); nick.maxLength = 24; nick.autocomplete = "nickname";
    lNick.append(sNick, nick);
    var lExam = el("label", "field"), sExam = el("span"), exam = el("select");
    EX.forEach(function(v){ var o = el("option", null, EXL[v]); o.value = v; exam.appendChild(o); });
    lExam.append(sExam, exam); two.append(lNick, lExam);
    var kindRow = el("div", "kind-row"), kindQ = el("span", "kind-q"), kChat = el("button", "react on"), kInfo = el("button", "react");
    kChat.type = kInfo.type = "button"; kindRow.append(kindQ, kChat, kInfo);
    var kind = "chat";
    function setKind(k){ kind = k; kChat.classList.toggle("on", k === "chat"); kInfo.classList.toggle("on", k === "info");
      kChat.setAttribute("aria-pressed", k === "chat"); kInfo.setAttribute("aria-pressed", k === "info");
      text.placeholder = tr(k === "info" ? "phInfo" : "pPlaceholder"); }
    kChat.onclick = function(){ setKind("chat"); }; kInfo.onclick = function(){ setKind("info"); };
    var lText = el("label", "field"), text = el("textarea"); text.rows = 3; text.maxLength = 300;
    var cnt = el("small", "count", "0/300"); lText.append(text, cnt);
    var send = el("button", "btn primary"); send.type = "submit";
    var status = el("p", "status"); status.setAttribute("role", "status");
    form.append(two, kindRow, lText, send, status);
    var feedT = el("h2"), feed = el("div", "feed");
    var fRow = el("div", "kind-row filter-row"), show = "all", fBtns = {};
    ["all","chat","info"].forEach(function(k){ var b = el("button", "react" + (k === "all" ? " on" : "")); b.type = "button";
      b.onclick = function(){ show = k; for (var x in fBtns){ fBtns[x].classList.toggle("on", x === k); fBtns[x].setAttribute("aria-pressed", x === k); } draw(); };
      fBtns[k] = b; fRow.appendChild(b); });
    var rules = el("details", "faq rules"), rSum = el("summary"), rUl = el("ul"); rules.append(rSum, rUl);
    var moreBtn = el("button", "btn ghost small more-btn"); moreBtn.type = "button"; moreBtn.hidden = true;
    root.append(form, feedT, fRow, feed, moreBtn, rules);

    function texts(){
      sNick.textContent = tr("pNick"); sExam.textContent = tr("pExam"); text.placeholder = tr(kind === "info" ? "phInfo" : "pPlaceholder");
      kindQ.textContent = tr("kindQ"); kChat.textContent = tr("fChat"); kInfo.textContent = tr("fInfo");
      fBtns.all.textContent = tr("fAll"); fBtns.chat.textContent = tr("fChat"); fBtns.info.textContent = tr("fInfo");
      text.setAttribute("aria-label", tr("pPost"));
      if (!send.disabled) send.textContent = tr("pPost");
      feedT.textContent = tr("feedT"); rSum.textContent = tr("rulesT"); moreBtn.textContent = tr("more");
      rUl.textContent = ""; ["rule1","rule2","rule3","rule4","rule5"].forEach(function(k){ rUl.appendChild(el("li", null, tr(k))); });
      draw();
    }
    new MutationObserver(texts).observe(document.documentElement, {attributes:true, attributeFilter:["lang"]});

    var st = appState(), saved = "";
    try { saved = localStorage.getItem("padhai.comNick") || ""; } catch(e){}
    nick.value = saved || st.nick || "";
    if (st.exam && EXL[st.exam]) exam.value = st.exam;
    text.addEventListener("input", function(){ cnt.textContent = text.value.length + "/300"; });
    function say(m, bad){ status.textContent = m; status.className = "status" + (bad ? " bad" : ""); }

    var posts = null, F = null;
    function ago(ms){
      var s = Math.round((ms - Date.now())/1000), a = Math.abs(s);
      var u = a < 60 ? ["second",s] : a < 3600 ? ["minute",Math.round(s/60)] : a < 86400 ? ["hour",Math.round(s/3600)] : ["day",Math.round(s/86400)];
      try { return new Intl.RelativeTimeFormat(lang(), {numeric:"auto"}).format(u[1], u[0]); } catch(e){ return new Date(ms).toLocaleString(); }
    }
    function draw(){
      feed.textContent = "";
      if (posts === null){ feed.appendChild(el("p", "note", F === false ? tr("offline") : tr("feedLoading"))); return; }
      var shown = posts.filter(function(p){ return (p.reporters || []).length < 3 && !PadhaiFilter.blocked(p.text) && !PadhaiFilter.blocked(p.nick)
        && (show === "all" || (p.kind === "info" ? "info" : "chat") === show); });
      if (!shown.length){ feed.appendChild(el("p", "note", tr(show === "info" ? "infoEmpty" : "feedEmpty"))); return; }
      shown.forEach(function(p){
        var c = el("article", "post-item"), h = el("div", "who");
        h.append(el("b", null, p.nick), el("span", "tag", EXL[p.exam] || p.exam));
        if (p.kind === "info") h.appendChild(el("span", "tag info", tr("tagInfo")));
        h.append( el("small", null, p.at ? ago(p.at.toMillis()) : ""));
        var acts = el("div", "acts"), likes = p.likes || [], liked = likes.indexOf(F.uid) !== -1;
        var lb = el("button", "react" + (liked ? " on" : ""), (liked ? "❤️ " : "🤍 ") + likes.length); lb.type = "button";
        lb.onclick = function(){ F.fs.updateDoc(p.ref, { likes: liked ? F.fs.arrayRemove(F.uid) : F.fs.arrayUnion(F.uid) }).catch(function(){}); };
        acts.appendChild(lb);
        if (p.uid === F.uid){
          var d = el("button", "react", tr("pDelete")); d.type = "button";
          d.onclick = function(){ if (confirm(tr("pDelConfirm"))) F.fs.deleteDoc(p.ref).catch(function(){}); };
          acts.appendChild(d);
        } else {
          var rep = (p.reporters || []).indexOf(F.uid) !== -1;
          var r = el("button", "react", "🚩 " + tr(rep ? "pReported" : "pReport")); r.type = "button"; r.disabled = rep;
          r.onclick = function(){ F.fs.updateDoc(p.ref, { reporters: F.fs.arrayUnion(F.uid) }).catch(function(){}); };
          acts.appendChild(r);
        }
        c.append(h, el("p", null, p.text), acts); feed.appendChild(c);
      });
    }
    texts();

    // Show the newest 30 posts from the last 30 days; "Show older posts" adds 30 more.
    // Fewer posts per visit keeps us inside Firestore's free 50,000 reads a day.
    var PAGE = 30, want = PAGE, unsub = null;
    function listen(){
      if (unsub) unsub();
      var since = F.fs.Timestamp.fromMillis(Date.now() - 30*864e5);
      unsub = F.fs.onSnapshot(F.fs.query(F.fs.collection(F.db, "posts"), F.fs.where("at", ">", since), F.fs.orderBy("at", "desc"), F.fs.limit(want)),
        function(snap){ posts = []; snap.forEach(function(d){ var v = d.data(); v.ref = d.ref; posts.push(v); }); moreBtn.hidden = snap.size < want; draw(); },
        function(){ F = false; posts = null; moreBtn.hidden = true; draw(); });
    }
    moreBtn.onclick = function(){ want += PAGE; moreBtn.hidden = true; listen(); };
    connect(!!opts.signIn).then(function(f){
      if (!f){ F = false; draw(); return; }
      F = f; listen();
    }).catch(function(){ F = false; draw(); });

    form.addEventListener("submit", async function(e){
      e.preventDefault();
      var n = nick.value.trim(), t = text.value.trim();
      if (!t){ say(tr("pEmpty"), true); text.focus(); return; }
      if (!n || PadhaiFilter.blocked(n) || /admin|official|moderator|padhai/i.test(n)){ say(tr("pNickBad"), true); nick.focus(); return; }
      if (PadhaiFilter.blocked(t)){ say(tr("pBlocked"), true); return; }
      var last = 0; try { last = +localStorage.getItem("padhai.lastPost") || 0; } catch(e2){}
      if (Date.now() - last < 30000){ say(tr("pWait"), true); return; }
      send.disabled = true; send.textContent = tr("pPosting"); say("");
      try {
        var f = await connect(!!opts.signIn); if (!f) throw { code: "no-firebase" };
        var b = f.fs.writeBatch(f.db);
        b.set(f.fs.doc(f.db, "posters", f.uid), { last: f.fs.serverTimestamp() });
        b.set(f.fs.doc(f.fs.collection(f.db, "posts")), { nick: n.slice(0,24), exam: exam.value, text: t.slice(0,300),
          uid: f.uid, at: f.fs.serverTimestamp(), likes: [], reporters: [], kind: kind });
        await b.commit();
        try { localStorage.setItem("padhai.comNick", n); localStorage.setItem("padhai.lastPost", String(Date.now())); } catch(e3){}
        text.value = ""; cnt.textContent = "0/300";
        if (show !== "all" && show !== kind) fBtns.all.click();
      } catch(err){
        var code = (err && (err.code || err.message)) || "unknown";
        say((code === "permission-denied" ? tr("pWait") + " / " + tr("pBlocked") : tr("offline")) + " (" + code + ")", true);
      }
      send.disabled = false; send.textContent = tr("pPost");
    });
  }
  window.PadhaiCommunity = { mount: mount };
})();
