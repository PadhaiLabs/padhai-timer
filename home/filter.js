/* Automatic filter for community posts and nicknames.
   Blocks bad words (English, Hinglish, Hindi), phone numbers, emails, links and social handles.
   The Firestore rules repeat the most important checks, so they can't be skipped. */
(function(){
  // Found anywhere in the text (after removing spaces and symbols).
  var PART = ["fuck","fuk","fck","phuck","shit","bitch","bastard","asshole","cunt","slut","whore","porn","nude","nudes",
    "nigger","nigga","faggot","retard","motherfucker","dickhead","blowjob","handjob","boobs","pussy",
    "madarchod","maderchod","madharchod","bhenchod","behenchod","bhenchood","benchod","bhanchod","chutiya","chutia","chootiya","chtiya","chutiye",
    "gandu","gaandu","gaand","randi","bhosd","bhosad","lauda","lavda","lawda","lodu","jhaant","chudai","chudwa","raand","harami","haramzada",
    "kuttikamina","betichod",
    "मादरचोद","माँदरचोद","भेनचोद","बहनचोद","भैनचोद","चूतिया","चुतिया","गांडू","गाँडू","गांड","गाँड","रंडी","भोसड़ी","भोसडी","भोसड़ा","लौड़ा","लौडा","लवड़ा","लंड","हरामी","हरामज़ादा","चुदाई","झाँट","बेटीचोद"];
  // Only blocked as a whole word (they appear inside normal words otherwise).
  var WORD = ["dick","rape","ass","tits","cum","mc","bc","bsdk","kys","lund","chut","sex","sexy","horny","boob"];
  var LEET = {"0":"o","1":"i","3":"e","4":"a","5":"s","7":"t","8":"b","@":"a","$":"s","!":"i"};
  function words(s){ return s.toLowerCase().replace(/[*._\-]/g, "").replace(/[0-9@$!]/g, function(c){ return LEET[c]; }).split(/[^a-z\u0900-\u097f]+/); }
  // "sexual reproduction" is NEET biology, so "sex" only counts as a whole word.
  function blocked(text){
    var t = String(text || "");
    if (/(https?:|www\.|\b[a-z0-9-]+\.(com|in|net|org|ly|me|io|xyz|co|app|link|gg|tk)\b|t\.me|wa\.me|bit\.ly)/i.test(t)) return "link";
    if (/[a-z0-9._-]+@[a-z0-9-]+\.[a-z]/i.test(t)) return "email";
    if (/(^|\s)@[a-z0-9_.]{3,}/i.test(t)) return "handle";
    if (/\b(insta|instagram|snapchat|snap id|telegram|whatsapp me|dm me|ig id)\b/i.test(t)) return "handle";
    if (t.replace(/[\s\-().+]/g, "").match(/\d{8,}/)) return "phone";
    // Check word by word (so "class hit" is fine), and also glue spaced letters back ("f u c k").
    var ws = words(t), glued = [], run = "";
    ws.forEach(function(w){ if (w.length === 1) run += w; else { if (run.length > 2) glued.push(run); run = ""; } });
    if (run.length > 2) glued.push(run);
    var all = ws.concat(glued);
    for (var k = 0; k < all.length; k++) if (WORD.indexOf(all[k]) !== -1) return "word";
    all = all.concat(all.map(function(w){ return w.replace(/(.)\1+/g, "$1"); }));  // "fuuuck" -> "fuck"
    for (var j = 0; j < all.length; j++){
      var w = all[j]; if (!w) continue;
      for (var i = 0; i < PART.length; i++) if (w.indexOf(PART[i]) !== -1) return "word";
    }
    return "";
  }
  window.PadhaiFilter = { blocked: blocked };
})();
