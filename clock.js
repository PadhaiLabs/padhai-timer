/* Fixes wrong phone/PC clocks.
   Many devices have the wrong date or time. The study hall groups people by "today (IST)",
   so a wrong clock would put someone in a different day and nobody would see them.
   This asks the web server for the real time once and corrects Date for the whole app. */
(function(){
  if (!/^https?:$/.test(location.protocol)) return;          // file:// has no server time
  var off = 0;
  try {
    var x = new XMLHttpRequest();
    x.open("HEAD", location.pathname + "?t=" + Math.random(), false);  // quick, synchronous, before the app starts
    var t0 = Date.now(); x.send(null); var t1 = Date.now();
    var srv = Date.parse(x.getResponseHeader("Date") || "");
    if (!isNaN(srv)) off = srv + 500 - (t0 + t1) / 2;         // Date header is rounded down to the second
  } catch (e) {}
  if (Math.abs(off) < 60000) return;                           // clock is fine (within 1 minute)

  var RealDate = Date;
  function FixedDate(a, b, c, d, e, f, g) {
    var n = arguments.length;
    if (!(this instanceof FixedDate)) return new RealDate(RealDate.now() + off).toString();
    if (n === 0) return new RealDate(RealDate.now() + off);
    if (n === 1) return new RealDate(a);
    return new RealDate(a, b, c === undefined ? 1 : c, d || 0, e || 0, f || 0, g || 0);
  }
  FixedDate.prototype = RealDate.prototype;
  FixedDate.now = function(){ return RealDate.now() + off; };
  FixedDate.parse = RealDate.parse;
  FixedDate.UTC = RealDate.UTC;
  window.Date = FixedDate;
  window.PADHAI_CLOCK_OFFSET = off;
})();
