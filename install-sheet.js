/* One install button for the app and the website.
   On a phone: Android/Chrome shows the browser's own "Install" box right away; iPhone etc. go to install.html.
   On a computer: a small window with a QR code. Scan it with the phone camera and the install page opens on the phone.
   (A QR code can't install by itself; the phone still needs one tap, that's how phones keep people safe.) */
(function(){
  var URL_ = "https://padhaitimer.com/install.html?src=qr";
  var T = {
    en:{btn:"📱 Install on phone",title:"Install on your phone",scan:"Point your phone camera at this QR code. The install page opens on your phone.",then:"Android: tap Install once. iPhone: Share → Add to Home Screen.",pc:"Install on this computer instead",close:"Close",go:"Install now",
      a1:"✓ Not an APK file. Your own Chrome or Safari adds it to your home screen. It's an official browser feature, so no Play Store is needed.",a2:"✓ No permissions: no contacts, photos, location or camera.",a3:"✓ Less than 1 MB. Long-press the icon to remove it any time."},
    hi:{btn:"📱 फ़ोन पर इंस्टॉल करें",title:"फ़ोन पर इंस्टॉल करें",scan:"फ़ोन के कैमरे से यह QR स्कैन करें। फ़ोन पर इंस्टॉल पेज खुल जाएगा।",then:"Android: एक बार Install दबाएँ। iPhone: Share → Add to Home Screen.",pc:"इसके बजाय इस कंप्यूटर पर इंस्टॉल करें",close:"बंद करें",go:"अभी इंस्टॉल करें",
      a1:"✓ यह APK फ़ाइल नहीं है। आपका अपना Chrome या Safari इसे होम स्क्रीन पर जोड़ता है। यह ब्राउज़र का आधिकारिक फ़ीचर है, इसलिए Play Store की ज़रूरत नहीं।",a2:"✓ कोई परमिशन नहीं: कॉन्टैक्ट, फ़ोटो, लोकेशन या कैमरा नहीं।",a3:"✓ 1 MB से कम। आइकन दबाकर रखें और कभी भी हटा दें।"},
    bn:{btn:"📱 ফোনে ইনস্টল করো",title:"ফোনে ইনস্টল করো",scan:"ফোনের ক্যামেরা দিয়ে এই QR স্ক্যান করো। ফোনে ইনস্টল পেজ খুলে যাবে।",then:"Android: একবার Install চাপো। iPhone: Share → Add to Home Screen।",pc:"বরং এই কম্পিউটারে ইনস্টল করো",close:"বন্ধ করো",go:"এখনই ইনস্টল করো",
      a1:"✓ এটা APK ফাইল নয়। তোমার নিজের Chrome বা Safari এটা হোম স্ক্রিনে যোগ করে। এটা ব্রাউজারের অফিসিয়াল ফিচার, তাই Play Store লাগে না।",a2:"✓ কোনো পারমিশন লাগে না: কন্ট্যাক্ট, ছবি, লোকেশন বা ক্যামেরা নয়।",a3:"✓ 1 MB-এর কম। আইকন চেপে ধরে যেকোনো সময় মুছে ফেলো।"},
    te:{btn:"📱 ఫోన్‌లో ఇన్‌స్టాల్ చేయండి",title:"ఫోన్‌లో ఇన్‌స్టాల్ చేయండి",scan:"ఫోన్ కెమెరాతో ఈ QR స్కాన్ చేయండి. ఫోన్‌లో ఇన్‌స్టాల్ పేజీ తెరుచుకుంటుంది.",then:"Android: ఒకసారి Install నొక్కండి. iPhone: Share → Add to Home Screen.",pc:"బదులుగా ఈ కంప్యూటర్‌లో ఇన్‌స్టాల్ చేయండి",close:"మూసివేయండి",go:"ఇప్పుడే ఇన్‌స్టాల్ చేయండి",
      a1:"✓ ఇది APK ఫైల్ కాదు. మీ Chrome లేదా Safari దీన్ని హోమ్ స్క్రీన్‌కు జోడిస్తుంది. ఇది బ్రౌజర్ అధికారిక ఫీచర్, కాబట్టి Play Store అవసరం లేదు.",a2:"✓ ఏ అనుమతులూ అడగదు: కాంటాక్ట్స్, ఫోటోలు, లొకేషన్, కెమెరా ఏవీ వాడదు.",a3:"✓ 1 MB కంటే తక్కువ. ఐకాన్‌ను నొక్కి పట్టి ఎప్పుడైనా తీసేయవచ్చు."},
    mr:{btn:"📱 फोनवर इंस्टॉल करा",title:"फोनवर इंस्टॉल करा",scan:"फोनच्या कॅमेऱ्याने हा QR स्कॅन करा. फोनवर इंस्टॉल पेज उघडेल.",then:"Android: एकदा Install दाबा. iPhone: Share → Add to Home Screen.",pc:"त्याऐवजी या कॉम्प्युटरवर इंस्टॉल करा",close:"बंद करा",go:"आत्ता इंस्टॉल करा",
      a1:"✓ ही APK फाइल नाही. तुमचा स्वतःचा Chrome किंवा Safari हे होम स्क्रीनवर जोडतो. हे ब्राउझरचं अधिकृत फीचर आहे, म्हणून Play Store ची गरज नाही.",a2:"✓ कोणतीही परवानगी नाही: कॉन्टॅक्ट, फोटो, लोकेशन किंवा कॅमेरा नाही.",a3:"✓ 1 MB पेक्षा कमी. आयकॉन दाबून धरा आणि कधीही काढून टाका."},
    ta:{btn:"📱 போனில் நிறுவுங்கள்",title:"போனில் நிறுவுங்கள்",scan:"போன் கேமராவால் இந்த QR-ஐ ஸ்கேன் செய்யுங்கள். போனில் நிறுவும் பக்கம் திறக்கும்.",then:"Android: ஒருமுறை Install அழுத்துங்கள். iPhone: Share → Add to Home Screen.",pc:"பதிலாக இந்த கணினியில் நிறுவுங்கள்",close:"மூடு",go:"இப்போதே நிறுவுங்கள்",
      a1:"✓ இது APK கோப்பு அல்ல. உங்கள் Chrome அல்லது Safari இதை முகப்புத் திரையில் சேர்க்கிறது. இது உலாவியின் அதிகாரப்பூர்வ வசதி, அதனால் Play Store தேவையில்லை.",a2:"✓ எந்த அனுமதியும் கேட்காது: தொடர்புகள், புகைப்படங்கள், இருப்பிடம், கேமரா எதையும் பயன்படுத்தாது.",a3:"✓ 1 MB-க்கும் குறைவு. ஐகானை அழுத்திப் பிடித்து எப்போது வேண்டுமானாலும் நீக்கலாம்."},
    ko:{btn:"📱 폰에 설치하기",title:"폰에 설치하기",scan:"폰 카메라로 이 QR을 찍으세요. 폰에서 설치 화면이 열려요.",then:"안드로이드는 [설치하기]를 한 번 누르면 끝. 아이폰은 공유 → 홈 화면에 추가.",pc:"대신 이 컴퓨터에 설치하기",close:"닫기",go:"지금 설치하기",
      a1:"✓ APK 파일이 아니에요. 내 폰의 Chrome이나 Safari가 홈 화면에 붙여 줘요. 브라우저에 원래 있는 공식 기능이라 플레이스토어가 필요 없어요.",a2:"✓ 권한 요구 없음: 연락처, 사진, 위치, 카메라를 안 써요.",a3:"✓ 1MB도 안 돼요. 아이콘을 꾹 눌러 언제든 지울 수 있어요."}
  };
  function t(k){ var l = (document.documentElement.lang || "en").slice(0,2); return (T[l] || T.en)[k]; }
  var ua = navigator.userAgent || "";
  var ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var mobile = ios || /Android|Mobi/i.test(ua);
  var standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  var evt = null, ready = [];
  window.addEventListener("beforeinstallprompt", function(e){ e.preventDefault(); evt = e; ready.forEach(function(f){ f(); }); });
  window.addEventListener("appinstalled", function(){ evt = null; });
  function installHref(){ var s = document.querySelector('script[src*="install-sheet.js"]'); return s ? s.src.replace(/install-sheet\.js.*$/, "install.html") : "install.html"; }

  function prompt(){ var e = evt; evt = null; e.prompt(); }
  var box = null;
  function sheet(mode){
    if (box){ box.remove(); box = null; }
    box = document.createElement("div");
    box.setAttribute("role", "dialog"); box.id = "installSheet"; box.setAttribute("aria-modal", "true");
    box.style.cssText = "position:fixed;inset:0;z-index:9999;background:rgba(10,16,32,.55);display:flex;align-items:center;justify-content:center;padding:16px";
    var c = document.createElement("div");
    c.style.cssText = "background:var(--surface,#fff);color:var(--ink,#14213F);border-radius:18px;max-width:360px;width:100%;padding:22px;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,.25);font:inherit";
    var h = document.createElement("h2"); h.textContent = t("title"); h.style.cssText = "margin:0 0 8px;font-size:1.3rem";
    var p1 = document.createElement("p"); p1.textContent = t("scan"); p1.style.cssText = "margin:0 0 12px";
    var q = document.createElement("div"); q.style.cssText = "display:inline-block;background:#fff;padding:10px;border-radius:12px;margin:0 auto 10px;min-width:200px;min-height:200px";
    var p2 = document.createElement("p"); p2.textContent = t("then"); p2.style.cssText = "margin:0 0 14px;font-size:.9rem;color:var(--ink-2,#4B5878)";
    var row = document.createElement("div"); row.style.cssText = "display:flex;flex-direction:column;gap:8px";
    var bs = "font:inherit;padding:10px 14px;border-radius:999px;border:1px solid var(--rule,#DDE4F0);background:var(--paper,#F3F6FB);color:inherit;cursor:pointer";
    var x = document.createElement("button"); x.type = "button"; x.textContent = t("close"); x.style.cssText = bs + ";font-weight:700";
    x.onclick = close; row.appendChild(x);
    var safe = document.createElement("ul"); safe.style.cssText = "list-style:none;padding:12px;margin:0 0 14px;text-align:left;font-size:.88rem;line-height:1.45;background:var(--paper,#F3F6FB);border-radius:12px;display:grid;gap:6px";
    ["a1","a2","a3"].forEach(function(k){ var li = document.createElement("li"); li.textContent = t(k); safe.appendChild(li); });
    if (mode === "android"){
      p1.remove(); q.remove(); p2.remove();
      var go = document.createElement("button"); go.type = "button"; go.textContent = t("go");
      go.style.cssText = "font:inherit;font-weight:800;font-size:1.05rem;padding:13px 16px;border-radius:999px;border:0;background:#F2A007;color:#14213F;cursor:pointer";
      go.onclick = function(){ close(); if (evt) prompt(); else location.href = installHref(); };
      row.insertBefore(go, x);
      c.append(h, safe, row);
    } else c.append(h, p1, q, p2, safe, row);
    box.appendChild(c);
    box.addEventListener("click", function(e){ if (e.target === box) close(); });
    document.addEventListener("keydown", esc);
    document.body.appendChild(box); x.focus();
    function draw(){ try { var g = qrcode(0, "M"); g.addData(URL_); g.make(); q.innerHTML = g.createSvgTag({cellSize: 5, margin: 2, scalable: true}); q.firstChild.style.width = q.firstChild.style.height = "200px"; }
      catch(e){ q.textContent = URL_; q.style.minHeight = "0"; } }
    if (mode === "android"){}
    else if (window.qrcode) draw();
    else { var s = document.createElement("script"); s.src = installHref().replace("install.html", "qr.js");
      s.onload = draw; s.onerror = function(){ q.textContent = URL_; q.style.minHeight = "0"; }; document.head.appendChild(s); }
  }
  function esc(e){ if (e.key === "Escape") close(); }
  function close(){ if (box){ box.remove(); box = null; } document.removeEventListener("keydown", esc); }

  // What the install button does everywhere.
  function install(){
    if (!mobile){ sheet("qr"); return true; }
    if (evt){ sheet("android"); return true; }
    return false;  // iPhone / in-app browser: caller sends them to install.html
  }
  window.PadhaiInstall = { install: install, sheet: sheet, t: t, desktop: !mobile, standalone: standalone,
    canPrompt: function(){ return !!evt; }, onReady: function(f){ ready.push(f); if (evt) f(); }, href: installHref };
})();
