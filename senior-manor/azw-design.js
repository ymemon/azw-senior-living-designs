/* The Manor: upscale and calm design's script: fixed. */
window.azwSite={"tz":"America\/Phoenix","offset":-420};

/* /wp-content/themes/azw-base/assets/base.js */
/* AZWebCorp Base: tiny progressive enhancements, no dependencies. */
(function () {
  'use strict';
  // Sticky header shadow once the page scrolls.
  var header = document.querySelector('.azw-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    // Expose the live header height so sticky sub-bars can sit right under it.
    // A top bar (.sx-topbar / .azw-topbar) scrolls away: the header sticks at minus its height, so nothing resizes.
    var setH = function () {
      var tb = header.querySelector('.sx-topbar, .azw-topbar'), tbh = tb ? tb.offsetHeight : 0;
      if (tb) header.style.top = (-tbh) + 'px';
      document.documentElement.style.setProperty('--azw-header-h', (header.getBoundingClientRect().height - tbh) + 'px');
    };
    setH();
    if ('ResizeObserver' in window) new ResizeObserver(setH).observe(header); else window.addEventListener('resize', setH);
  }
  // Preview sites: the contact form explains it isn't connected yet instead of sending.
  document.querySelectorAll('.azw-form[data-demo="1"]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = form.querySelector('.azw-form-demo-note');
      if (note) note.hidden = false;
    });
  });
  // Jump bars (.azw-jump): highlight the link for the section in view and keep it visible in the bar.
  document.querySelectorAll('.azw-jump').forEach(function (bar) {
    var links = Array.prototype.slice.call(bar.querySelectorAll('a[href^="#"]'));
    if (!links.length || !('IntersectionObserver' in window)) return;
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var jo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('is-active'); });
        var a = byId[en.target.id];
        if (a) { a.classList.add('is-active'); bar.scrollTo({ left: a.offsetLeft - bar.clientWidth / 2 + a.clientWidth / 2, behavior: 'smooth' }); }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) { var t = document.getElementById(id); if (t) jo.observe(t); });
  });
  // Sliders (.azw-slider > .azw-slides > .azw-slide): prev/next, dots, optional autoplay paused on hover/focus.
  document.querySelectorAll('.azw-slider').forEach(function (sl) {
    var slides = sl.querySelectorAll('.azw-slide'), dots = sl.querySelectorAll('.azw-slider-dots button');
    if (slides.length < 2) return;
    var cur = 0, timer = null, wait = parseInt(sl.getAttribute('data-autoplay') || '0', 10);
    var show = function (n) {
      cur = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) { s.classList.toggle('is-active', i === cur); s.setAttribute('aria-hidden', i === cur ? 'false' : 'true'); });
      dots.forEach(function (d, i) { d.classList.toggle('is-active', i === cur); });
    };
    var prev = sl.querySelector('.azw-slider-prev'), next = sl.querySelector('.azw-slider-next');
    if (prev) prev.addEventListener('click', function () { show(cur - 1); });
    if (next) next.addEventListener('click', function () { show(cur + 1); });
    dots.forEach(function (d, i) { d.addEventListener('click', function () { show(i); }); });
    var start = function () { if (wait && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) { stop(); timer = setInterval(function () { show(cur + 1); }, wait); } };
    var stop = function () { if (timer) { clearInterval(timer); timer = null; } };
    sl.addEventListener('mouseenter', stop); sl.addEventListener('mouseleave', start);
    sl.addEventListener('focusin', stop); sl.addEventListener('focusout', start);
    start();
  });
  // ---------- online booking (.azw-book) ----------
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var ymd = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  var toMin = function (s) { var p = String(s).split(':'); return parseInt(p[0], 10) * 60 + parseInt(p[1] || '0', 10); };
  var fmtT = function (m) { var h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? 'pm' : 'am'; return ((h + 11) % 12 + 1) + (mm ? ':' + pad(mm) : '') + ap; };
  // "Now" on the business's clock, as a Date whose own fields (getDate, getHours...) read that
  // time: a visitor in another time zone is offered the same days and times the server accepts.
  var siteNow = function (cfg) {
    var now = new Date();
    try {
      if (cfg.tz && (cfg.tz === 'UTC' || cfg.tz.indexOf('/') !== -1)) {
        var p = {};
        new Intl.DateTimeFormat('en-US', { timeZone: cfg.tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' })
          .formatToParts(now).forEach(function (x) { p[x.type] = parseInt(x.value, 10); });
        if (p.year && p.month && p.day) return new Date(p.year, p.month - 1, p.day, p.hour % 24, p.minute);
      }
    } catch (e) {}
    if (typeof cfg.offset === 'number') return new Date(now.getTime() + (cfg.offset + now.getTimezoneOffset()) * 60000);
    return now;
  };
  // Hosts and CDNs often cache a page for longer than a form token lives, so the booking and contact
  // forms ask for a fresh token when the page loads (and again if the server says it has expired).
  var freshNonce = function (form) {
    var field = form.querySelector('[name="azw_nonce"]'), act = form.querySelector('[name="action"]');
    // getAttribute, not form.action: the hidden input named "action" shadows that property.
    var target = form.getAttribute('action') || '';
    if (!field || !act || !window.fetch || !target) return;
    var url = target.replace(/admin-post\.php.*$/, 'admin-ajax.php');
    if (url === target) return;
    fetch(url + '?action=azw_nonce&for=' + encodeURIComponent(act.value) + '&_=' + Date.now(), { credentials: 'same-origin', cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (j && j.ok && j.nonce) field.value = j.nonce; })
      .catch(function () { /* keep the token the page came with */ });
  };
  // Asked for when the visitor first touches the form (focus, tap or typing), not on every page view:
  // that request can't be cached, and most visitors never use the form. Demo forms send nothing, so
  // they never ask.
  document.querySelectorAll('form.azw-book, form.azw-form').forEach(function (form) {
    if (form.getAttribute('data-demo') === '1' || /"demo"\s*:\s*true/.test(form.getAttribute('data-cfg') || '')) return;
    var asked = false;
    var once = function () {
      if (asked) return;
      asked = true;
      ['focusin', 'pointerdown', 'input'].forEach(function (ev) { form.removeEventListener(ev, once, true); });
      freshNonce(form);
    };
    ['focusin', 'pointerdown', 'input'].forEach(function (ev) { form.addEventListener(ev, once, true); });
  });
  document.querySelectorAll('.azw-book').forEach(function (form) {
    var cfg = {}; try { cfg = JSON.parse(form.getAttribute('data-cfg') || '{}'); } catch (e) {}
    if (!Array.isArray(cfg.booked)) cfg.booked = [];
    var steps = form.querySelectorAll('.sx-book-step'), marks = form.querySelectorAll('.sx-book-steps li');
    var next = form.querySelector('.sx-book-next'), back = form.querySelector('.sx-book-back'), submit = form.querySelector('.sx-book-submit');
    var datesEl = form.querySelector('.sx-book-dates'), timesEl = form.querySelector('.sx-book-times'), err = form.querySelector('.sx-book-err');
    var done = form.querySelector('.sx-book-done'), nav = form.querySelector('.sx-book-nav');
    var fDate = form.querySelector('[name="azw_date"]'), fTime = form.querySelector('[name="azw_time"]');
    var cur = 1, days = [];
    var svc = function () { var r = form.querySelector('[name="azw_service"]:checked'); return r ? r.value : ''; };
    var valid = function () {
      if (cur === 1) return !!svc() && (cfg.mode !== 'ride' || form.getAttribute('data-trip') === 'ok');
      if (cur === 2) return !!(fDate.value && fTime.value);
      return ['azw_name', 'azw_phone', 'azw_email'].every(function (n) { var el = form.querySelector('[name="' + n + '"]'); return el && el.checkValidity() && el.value.trim(); });
    };
    var sync = function () { next.disabled = !valid(); submit.disabled = !valid(); };
    var label = function () {
      var d = days.filter(function (x) { return x.v === fDate.value; })[0];
      // A ride form (ride.js) describes its own trip, e.g. "Rolls-Royce Phantom · 18.4 mi · est. $155".
      return (form.getAttribute('data-label') || svc()) + (d ? ' · ' + d.long : '') + (fTime.value ? ' at ' + fmtT(toMin(fTime.value)) : '');
    };
    var show = function (n) {
      cur = n;
      steps.forEach(function (s) { s.classList.toggle('is-on', +s.getAttribute('data-step') === n); });
      marks.forEach(function (m, i) { m.classList.toggle('is-on', i < n); m.classList.toggle('is-cur', i === n - 1); });
      back.hidden = n === 1; next.hidden = n === 3; submit.hidden = n !== 3; err.hidden = true;
      form.querySelectorAll('.sx-book-summary').forEach(function (p) { p.textContent = label(); });
      sync();
    };
    var renderTimes = function () {
      timesEl.innerHTML = ''; fTime.value = '';
      var d = days.filter(function (x) { return x.v === fDate.value; })[0];
      if (!d) return;
      var now = siteNow(cfg), isToday = d.v === ymd(now), nowM = now.getHours() * 60 + now.getMinutes() + 60, any = false;
      for (var m = toMin(d.h[0]); m <= toMin(d.h[1]) - (cfg.mode === 'table' ? 0 : cfg.step); m += cfg.step) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'sx-chip-btn'; b.textContent = fmtT(m); b.setAttribute('data-v', Math.floor(m / 60) + ':' + pad(m % 60));
        var value = Math.floor(m / 60) + ':' + pad(m % 60);
        var booked = Array.isArray(cfg.booked) && cfg.booked.indexOf(d.v + ' ' + value) !== -1;
        if ((isToday && m < nowM) || booked) { b.disabled = true; b.title = 'Unavailable'; } else any = true;
        timesEl.appendChild(b);
      }
      if (!any) timesEl.innerHTML = '<p class="sx-book-hint">Fully booked. Please choose another day.</p>';
    };
    var renderDates = function () {
      datesEl.innerHTML = ''; days = [];
      var d = siteNow(cfg); d.setHours(0, 0, 0, 0);
      for (var i = 0; days.length < cfg.days && i < 90; i++) {
        var h = cfg.hours ? cfg.hours[d.getDay()] : null;
        if (h) {
          var o = { v: ymd(d), h: h, long: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) };
          days.push(o);
          var b = document.createElement('button');
          b.type = 'button'; b.className = 'sx-date'; b.setAttribute('data-v', o.v);
          b.innerHTML = '<small>' + d.toLocaleDateString('en-US', { weekday: 'short' }) + '</small><strong>' + d.getDate() + '</strong><small>' + d.toLocaleDateString('en-US', { month: 'short' }) + '</small>';
          datesEl.appendChild(b);
        }
        d.setDate(d.getDate() + 1);
      }
    };
    datesEl.addEventListener('click', function (e) {
      var b = e.target.closest('.sx-date'); if (!b) return;
      datesEl.querySelectorAll('.sx-date').forEach(function (x) { x.classList.toggle('is-sel', x === b); });
      fDate.value = b.getAttribute('data-v'); renderTimes(); sync();
    });
    timesEl.addEventListener('click', function (e) {
      var b = e.target.closest('.sx-chip-btn'); if (!b || b.disabled) return;
      timesEl.querySelectorAll('.sx-chip-btn').forEach(function (x) { x.classList.toggle('is-sel', x === b); });
      fTime.value = b.getAttribute('data-v'); sync();
    });
    form.addEventListener('change', function (e) { if (e.target.name === 'azw_service' && fDate.value) renderTimes(); sync(); });
    form.addEventListener('input', sync);
    form.addEventListener('azw:ride', sync); // ride.js: the trip (and so step 1) changed
    if (cfg.mode === 'ride') {
      // ride.js owns step 1 of a ride form. If it never ran (its script or the map library did not load),
      // the form could not go past step 1 and nothing would say why, so the visitor is told how to book.
      var rideMissing = function () {
        setTimeout(function () {
          if (form.getAttribute('data-ride-ready') === '1') return;
          var p = form.querySelector('.sx-ride-noscript'); if (p) p.hidden = false;
          var m = form.querySelector('.sx-ride-mapwrap'); if (m) m.hidden = true;
        }, 1500);
      };
      if (document.readyState === 'complete') rideMissing(); else window.addEventListener('load', rideMissing);
    }
    next.addEventListener('click', function () { if (valid()) show(cur + 1); });
    back.addEventListener('click', function () { show(cur - 1); });
    var finish = function (note) {
      steps.forEach(function (s) { s.classList.remove('is-on'); });
      nav.hidden = true; form.querySelector('.sx-book-steps').hidden = true;
      done.querySelector('.sx-book-summary').textContent = label();
      done.querySelector('.sx-book-done-note').textContent = note;
      done.hidden = false;
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // Enter in an earlier step's text field (e.g. a ride's pick-up) moves on; it never books.
      if (cur !== 3) { if (valid()) show(cur + 1); return; }
      if (!valid()) return;
      var email = form.querySelector('[name="azw_email"]').value;
      if (cfg.demo) { finish('Demo preview: no booking was made. On your live site this saves to your Bookings and emails a confirmation to ' + email + '.'); return; }
      submit.disabled = true; submit.classList.add('is-busy');
      fetch(cfg.url, { method: 'POST', body: new FormData(form), credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          var slot = fDate.value + ' ' + fTime.value;
          // Booked (by this visitor or, just now, by someone else): that time is no longer offered.
          // Rides share a fleet (the server lets several start at the same time), so a ride booked by
          // this visitor leaves the time open for "Make another booking".
          if (j && (j.taken || (j.ok && cfg.mode !== 'ride')) && cfg.booked.indexOf(slot) === -1) cfg.booked.push(slot);
          if (j && j.ok) { finish('A confirmation is on its way to ' + email + '.'); return; }
          var e = new Error(j && j.error); e.taken = !!(j && j.taken); e.fromServer = !!(j && j.error); throw e;
        })
        .catch(function (x) {
          if (x && x.taken) { show(2); renderTimes(); sync(); }
          // Only a message the server wrote is shown; a dropped connection or an unreadable reply ("Failed to
          // fetch", "Unexpected token <") gets the plain wording instead of the browser's own text.
          err.textContent = (x && x.fromServer && x.message) || 'Something went wrong. Please try again, or call us to book.'; err.hidden = false; submit.disabled = false;
          if (x && x.fromServer && /session expired/i.test(x.message || '')) { freshNonce(form); err.textContent = 'Your session had expired. We have refreshed it, so please press the button again.'; }
        })
        .then(function () { submit.classList.remove('is-busy'); });
    });
    form.querySelector('.sx-book-again').addEventListener('click', function () {
      form.reset(); fDate.value = ''; fTime.value = ''; timesEl.innerHTML = ''; renderDates();
      done.hidden = true; nav.hidden = false; form.querySelector('.sx-book-steps').hidden = false; show(1);
    });
    renderDates(); show(1);
  });

  // ---------- tabs / filters ----------
  // Menu category tabs (.azw-tabs[data-target]): show groups whose data-key matches.
  document.querySelectorAll('.azw-tabs[data-target]').forEach(function (bar) {
    var scope = bar.parentElement, sel = bar.getAttribute('data-target');
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      bar.querySelectorAll('button').forEach(function (x) { x.classList.toggle('is-active', x === b); x.setAttribute('aria-selected', x === b); });
      var f = b.getAttribute('data-filter');
      scope.querySelectorAll(sel).forEach(function (g) { g.hidden = f !== '*' && g.getAttribute('data-key') !== f; g.classList.add('is-visible'); });
      var wrap = scope.querySelector('.sx-menu'); if (wrap) wrap.classList.toggle('is-single', f !== '*');
    });
  });
  // Listing filters (.azw-filter): status, min beds, max price, sort.
  document.querySelectorAll('.azw-filter').forEach(function (f) {
    var scope = f.parentElement, cards = Array.prototype.slice.call(scope.querySelectorAll(f.getAttribute('data-target')));
    var grid = cards.length ? cards[0].parentElement : null, count = f.querySelector('.sx-filter-count strong'), empty = scope.querySelector('.sx-filter-empty');
    var run = function () {
      var tag = f.tag.value, beds = +f.beds.value, max = +f.price.value, sort = f.sort.value, n = 0;
      cards.forEach(function (c) {
        var ok = (!tag || c.getAttribute('data-tag') === tag) && (+c.getAttribute('data-beds') >= beds) && (!max || +c.getAttribute('data-price') <= max);
        c.hidden = !ok; c.classList.add('is-visible'); if (ok) n++;
      });
      var order = cards.slice();
      if (sort) order.sort(function (a, b) { return (sort === 'asc' ? 1 : -1) * (a.getAttribute('data-price') - b.getAttribute('data-price')); });
      if (grid) order.forEach(function (c) { grid.appendChild(c); });
      if (count) count.textContent = n;
      if (empty) empty.hidden = n > 0;
    };
    f.addEventListener('change', run); f.addEventListener('submit', function (e) { e.preventDefault(); });
  });
  // Class timetable (.azw-sched): day tabs (today first), class-type filter.
  document.querySelectorAll('.azw-sched').forEach(function (s) {
    var tabs = s.querySelectorAll('.sx-sched-days button'), lists = s.querySelectorAll('.sx-sched-list'), type = '*';
    var pick = function (b) {
      tabs.forEach(function (x) { x.classList.toggle('is-active', x === b); x.setAttribute('aria-selected', x === b); });
      lists.forEach(function (l) { l.hidden = l.getAttribute('data-day') !== b.getAttribute('data-day'); });
    };
    var applyType = function () { s.querySelectorAll('.sx-class').forEach(function (c) { c.hidden = type !== '*' && c.getAttribute('data-type') !== type; }); };
    tabs.forEach(function (b) { b.addEventListener('click', function () { pick(b); }); });
    s.querySelectorAll('.sx-sched-types button').forEach(function (b) {
      b.addEventListener('click', function () { s.querySelectorAll('.sx-sched-types button').forEach(function (x) { x.classList.toggle('is-active', x === b); }); type = b.getAttribute('data-type'); applyType(); });
    });
    // Today on the business's clock, not the visitor's: the section's own data-tz / data-offset, or the
    // site-wide window.azwSite (printed on every page, for timetables stored before data-tz existed).
    var site = window.azwSite || {};
    var now = siteNow({ tz: s.getAttribute('data-tz') || site.tz || '', offset: s.hasAttribute('data-offset') ? +s.getAttribute('data-offset') : site.offset });
    var dow = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];
    var today = s.querySelector('.sx-sched-days button[data-dow="' + dow + '"]');
    if (today) { today.insertAdjacentHTML('beforeend', ' <em>Today</em>'); pick(today); }
  });
  // Payment calculator (.azw-calc).
  document.querySelectorAll('.azw-calc').forEach(function (f) {
    var money = function (v) { return '$' + Math.round(v).toLocaleString('en-US'); };
    var out = function (k, v) { var el = f.querySelector('[data-out="' + k + '"]'); if (el) el.textContent = v; };
    var lab = function (k, v) { var el = f.querySelector('output[data-for="' + k + '"]'); if (el) el.textContent = v; };
    var run = function () {
      var price = +f.price.value, down = +f.down.value, rate = +f.rate.value / 1200, yrs = +(f.querySelector('[name="years"]:checked') || { value: 30 }).value, n = yrs * 12;
      var loan = price * (1 - down / 100), pi = rate ? loan * rate / (1 - Math.pow(1 + rate, -n)) : loan / n;
      var tax = price * (+f.tax.value / 100) / 12, ins = +f.ins.value / 12;
      lab('price', money(price)); lab('down', down + '% · ' + money(price * down / 100)); lab('rate', (+f.rate.value).toFixed(2) + '%');
      out('total', money(pi + tax + ins)); out('pi', money(pi)); out('tax', money(tax)); out('ins', money(ins)); out('loan', money(loan));
      f.querySelectorAll('input[type="range"]').forEach(function (r) { r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min) * 100) + '%'); });
    };
    f.addEventListener('input', run); f.addEventListener('submit', function (e) { e.preventDefault(); }); run();
  });
  // Store: AJAX add to cart on the product grid, with a toast and live header count.
  var toast = function (html) {
    var t = document.querySelector('.azw-toast');
    if (!t) { t = document.createElement('div'); t.className = 'azw-toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.innerHTML = html; t.classList.add('is-on'); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('is-on'); }, 4000);
  };
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.azw-add'); if (!b) return;
    e.preventDefault();
    var fd = new FormData(); fd.append('product_id', b.getAttribute('data-product')); fd.append('quantity', '1');
    var root = (document.querySelector('link[rel="https://api.w.org/"]') || {}).href;
    var home = root ? root.replace(/wp-json\/?$/, '') : '/';
    b.classList.add('is-busy'); b.disabled = true;
    fetch(home + '?wc-ajax=add_to_cart', { method: 'POST', body: fd, credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || j.error) throw new Error();
        if (j.fragments) Object.keys(j.fragments).forEach(function (sel) { document.querySelectorAll(sel).forEach(function (el) { el.outerHTML = j.fragments[sel]; }); });
        var cart = document.querySelector('.sx-cart');
        if (cart) { cart.classList.remove('is-bump'); void cart.offsetWidth; cart.classList.add('is-bump'); }
        var name = (b.closest('.sx-prod') || {}).querySelector ? b.closest('.sx-prod').querySelector('h3').textContent : 'Item';
        b.textContent = 'Added ✓';
        toast('<strong>' + name.replace(/</g, '&lt;') + '</strong> added to your cart <a href="' + (cart ? cart.href : home + 'cart/') + '">View cart</a>');
      })
      .catch(function () { toast('Could not add that item. Please try again.'); })
      .then(function () { b.classList.remove('is-busy'); b.disabled = false; });
  });

  // ---------- wow layer ----------
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Hero headline: word-by-word rise (text nodes only, keeps any inline markup).
  if (!still) {
    var h = document.querySelector('.sx-hero-title, .azw-hero .azw-hero-title');
    if (h && !h.classList.contains('azw-split')) {
      var n = 0;
      var walk = function (node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (c) {
          if (c.nodeType === 3) {
            var frag = document.createDocumentFragment();
            c.textContent.split(/(\s+)/).forEach(function (w) {
              if (!w) return;
              if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
              var o = document.createElement('span'), i = document.createElement('span');
              o.className = 'azw-w'; i.textContent = w; i.style.setProperty('--i', n++); o.appendChild(i); frag.appendChild(o);
            });
            c.parentNode.replaceChild(frag, c);
          } else if (c.nodeType === 1 && c.tagName !== 'BR') walk(c);
        });
      };
      h.setAttribute('aria-label', h.textContent.trim()); walk(h); h.classList.add('azw-split');
      // Words on the first rendered line get .azw-l1 (::first-line can't reach inline-block words).
      var mark = function () {
        var ws = h.querySelectorAll('.azw-w'), top = ws.length ? ws[0].offsetTop : 0;
        ws.forEach(function (w) { w.classList.toggle('azw-l1', w.offsetTop === top); });
      };
      mark(); window.addEventListener('resize', mark);
    }
  }
  // Cards: 3D tilt with a cursor spotlight (fine pointers only).
  if (!still && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.sx-card, .sx-ic, .sx-plan, .sx-list, .sx-ov, .sx-why-item, .sx-member, .sx-quote').forEach(function (el) {
      el.classList.add('azw-tilt');
      var max = el.matches('.sx-plan, .sx-quote, .sx-why-item') ? 4 : 6;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--ry', ((x - .5) * max * 2).toFixed(2) + 'deg');
        el.style.setProperty('--rx', ((.5 - y) * max * 2).toFixed(2) + 'deg');
        el.style.setProperty('--mx', (x * 100).toFixed(1) + '%'); el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        el.classList.add('is-tilting');
      });
      el.addEventListener('pointerleave', function () { el.classList.remove('is-tilting'); el.style.removeProperty('--rx'); el.style.removeProperty('--ry'); });
    });
  }
  // Mobile action bar: appears once the hero is scrolled past, hides near the footer.
  var mbar = document.querySelector('.azw-mbar');
  if (mbar) {
    var foot = document.querySelector('.sx-footer, footer');
    var onMbar = function () {
      var past = window.scrollY > window.innerHeight * 0.6;
      var nearFoot = foot && foot.getBoundingClientRect().top < window.innerHeight - 40;
      mbar.classList.toggle('is-on', past && !nearFoot);
    };
    window.addEventListener('scroll', onMbar, { passive: true }); onMbar();
  }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canObserve = 'IntersectionObserver' in window;
  // Count-up for stats: animates the leading number of [data-count] ("6,400", "18+", "4.9★").
  var counters = document.querySelectorAll('[data-count]');
  var runCount = function (el) {
    var txt = el.textContent, m = txt.match(/^(\D*)([\d.,]+)(.*)$/);
    if (!m) return;
    var raw = m[2].replace(/,/g, ''), target = parseFloat(raw), dec = (raw.split('.')[1] || '').length, comma = m[2].indexOf(',') > -1;
    if (!isFinite(target)) return;
    var t0 = null, dur = 1400;
    var fmt = function (v) { var s = v.toFixed(dec); return comma ? Number(s).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : s; };
    var step = function (ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = m[1] + fmt(target * e) + m[3];
      if (p < 1) requestAnimationFrame(step); else el.textContent = txt;
    };
    requestAnimationFrame(step);
  };
  if (counters.length && canObserve && !reduced) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { runCount(en.target); co.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { co.observe(el); });
  }
  // Reveal-on-scroll for elements marked .azw-reveal, staggered within a group (respects reduced motion).
  var items = document.querySelectorAll('.azw-reveal');
  if (!items.length) return;
  if (!canObserve || reduced) {
    items.forEach(function (el) { el.classList.remove('is-pending'); el.classList.add('is-visible'); });
    return;
  }
  items.forEach(function (el) {
    var sibs = el.parentElement ? Array.prototype.filter.call(el.parentElement.children, function (c) { return c.classList.contains('azw-reveal'); }) : [];
    var i = sibs.indexOf(el);
    if (i > 0) el.style.transitionDelay = Math.min(i, 6) * 90 + 'ms';
  });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.remove('is-pending'); en.target.classList.add('is-visible'); io.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  items.forEach(function (el) { el.classList.add('is-pending'); io.observe(el); });
})();

/* Hero reel: the top-of-page hero / page-header photo moves through further photos, each with a slow drift.
   A hero that carries data-reel (see azw_hero_reel() in functions.php) names its own photos, each with a
   caption that links to what it shows, and gets a progress bar the visitor can click, hover to pause, or
   swipe; data-fx picks the design's transition. Without data-reel it crossfades through data-slides, or
   through photos borrowed from further down the page. Lazy (the next photo is decoded before it shows),
   pauses off-screen and in a hidden tab, skipped for reduced motion and Save-Data. */
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var cn = navigator.connection; if (cn && (cn.saveData || /2g/.test(cn.effectiveType || ''))) return;
  var SEL = '.sx-hero-bg .azw-photo, .sx-hero-media .azw-photo, .sx-ph-bg .azw-photo, .sx-ph-media .azw-photo, .azw-hero-bg, .azw-hero-media, .azw-noir-media, .azw-ph-media';
  var host = [].slice.call(document.querySelectorAll(SEL)).filter(function (h) { return h.querySelector('img') && h.getBoundingClientRect().top + scrollY < innerHeight * 1.6; })[0];
  if (!host) return;
  var first = host.querySelector('img');
  var wrap = host.closest('[data-reel]'), reel = null;
  if (wrap) { try { reel = JSON.parse(wrap.getAttribute('data-reel')); } catch (e) { reel = null; } }
  if (!reel || !reel.slides || !reel.slides.length) reel = null;
  var base = function (u) { return /images\.(unsplash|pexels)\.com\//.test(u || '') ? u.split('?')[0] : ''; };
  var sized = function (b, w) { return b + (/images\.pexels\.com/.test(b) ? '?auto=compress&cs=tinysrgb&w=' : '?auto=format&fit=crop&q=78&w=') + w; };
  var seen = {}; seen[base(first.getAttribute('src'))] = 1;
  var pool = [];
  var add = function (u, m) { var b = base(u); if (b && !seen[b]) { seen[b] = 1; pool.push({ b: b, label: (m && m.label) || '', note: (m && m.note) || '', url: (m && m.url) || '' }); } };
  if (reel) reel.slides.forEach(function (s) { add(s.img, s); });
  if (!pool.length) (host.getAttribute('data-slides') || '').split(/\s+/).forEach(function (u) { add(u); });
  var named = pool.length > 0;
  if (!pool.length) [].forEach.call(document.querySelectorAll('main img[src*="images.unsplash.com"], .wp-site-blocks img[src*="images.unsplash.com"]'), function (im) {
    if (!host.contains(im) && !im.closest('.sx-avatar, .sx-member-photo, header, footer')) add(im.getAttribute('src'));
  });
  pool = pool.slice(0, named ? 8 : 3);
  if (!pool.length) return;
  if (!named) reel = null;
  var meta = [(reel && reel.first) || {}].concat(pool);
  var sizes = first.getAttribute('sizes') || '100vw';
  var set = function (b) { return [640, 960, 1280, 1600, 2200].map(function (w) { return sized(b, w) + ' ' + w + 'w'; }).join(', '); };
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
  host.classList.add('azw-shows');
  if (reel && wrap.getAttribute('data-fx')) host.setAttribute('data-fx', wrap.getAttribute('data-fx'));
  var gap = parseInt((wrap || host).getAttribute('data-gap'), 10) || (reel ? 5600 : 6500);
  var origCls = first.className;
  var slides = [first], dead = {}, i = 0, timer = 0, live = true, busy = false, paused = false, started = false;

  // Caption and progress bar (only for a hero that names its own photos).
  var ui = null, cap = null, ticks = [];
  if (reel) {
    var slot = (host.closest('section') || document).querySelector('.azw-reel-slot') || wrap;
    if (slot === wrap && getComputedStyle(wrap).position === 'static') wrap.style.position = 'relative';
    ui = document.createElement('div'); ui.className = 'azw-reel-ui'; ui.style.setProperty('--azw-reel-t', gap + 'ms');
    cap = document.createElement('a'); cap.className = 'azw-reel-cap'; cap.hidden = true;
    var bar = document.createElement('div'); bar.className = 'azw-reel-ticks'; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'Hero photos');
    meta.forEach(function (m, k) {
      var b = document.createElement('button'); b.type = 'button';
      b.setAttribute('aria-label', 'Photo ' + (k + 1) + (m.label ? ': ' + m.label : ''));
      b.appendChild(document.createElement('i'));
      b.addEventListener('click', function () { jump(k); });
      bar.appendChild(b); ticks.push(b);
    });
    // The bar is the clock: when the lit segment has filled, the next photo comes in.
    bar.addEventListener('animationend', function (e) { if (e.animationName === 'azw-reel-fill') next(); });
    ui.appendChild(cap); ui.appendChild(bar); slot.appendChild(ui);
    var hold = function (on) { paused = on; ui.classList.toggle('is-paused', on); };
    [slot === wrap ? wrap : ui].forEach(function (el) {
      el.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hold(true); });
      el.addEventListener('pointerleave', function () { hold(false); });
    });
    ui.addEventListener('focusin', function () { hold(true); }); ui.addEventListener('focusout', function () { hold(false); });
    // Swipe sideways on the photo to move through the reel.
    var sx = null;
    wrap.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    wrap.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 44) jump(after(i, dx < 0 ? 1 : -1));
    }, { passive: true });
  }
  var paint = function (k) {
    if (!ui) return;
    ticks.forEach(function (t, n) { t.classList.remove('is-run'); t.classList.toggle('is-on', n === k); t.classList.toggle('is-done', n < k); });
    var m = meta[k] || {};
    cap.classList.remove('is-in');
    cap.hidden = !m.label;
    if (!m.label) return;
    cap.textContent = '';
    var n = document.createElement('span'), s = document.createElement('strong');
    n.className = 'azw-reel-n'; n.textContent = (k < 9 ? '0' : '') + (k + 1); s.textContent = m.label;
    cap.appendChild(n); cap.appendChild(s);
    if (m.note) { var sm = document.createElement('small'); sm.textContent = m.note; cap.appendChild(sm); }
    if (m.url) cap.setAttribute('href', m.url); else cap.removeAttribute('href');
    void cap.offsetWidth; cap.classList.add('is-in');
  };

  var drift = function (im) {
    var a = Math.random() * Math.PI * 2;
    im.style.setProperty('--dx', (Math.cos(a) * 2.2).toFixed(2) + '%');
    im.style.setProperty('--dy', (Math.sin(a) * 1.6).toFixed(2) + '%');
  };
  var make = function (p) {
    var im = document.createElement('img');
    im.alt = ''; im.decoding = 'async'; im.className = 'azw-hslide';
    im.setAttribute('sizes', sizes); im.srcset = set(p.b); im.src = sized(p.b, 1280);
    if (origCls) im.className += ' ' + origCls;
    var all = host.querySelectorAll('.azw-hslide'), last = all[all.length - 1];
    host.insertBefore(im, last.nextSibling);
    return im;
  };
  var show = function (nx) {
    var cur = slides[i];
    cur.style.transform = getComputedStyle(cur).transform; cur.style.animation = 'none';
    cur.classList.remove('is-on', 'is-first'); cur.classList.add('is-off');
    nx.style.transform = ''; nx.style.animation = ''; drift(nx);
    nx.classList.remove('is-off'); void nx.offsetWidth; nx.classList.add('is-on');
    host.classList.remove('is-changing'); void host.offsetWidth; host.classList.add('is-changing');
  };
  // The next photo that loaded, going forwards (1) or backwards (-1) from k.
  var after = function (k, dir) {
    var n = meta.length;
    for (var s = 1; s < n; s++) { var j = ((k + dir * s) % n + n) % n; if (!dead[j]) return j; }
    return k;
  };
  var to = function (j) {
    if (busy || j === i || dead[j]) return schedule();
    busy = true;
    var nx = slides[j] || (slides[j] = make(pool[j - 1]));
    var go = function () { show(nx); i = j; busy = false; paint(j); schedule(); };
    var fail = function () {
      // The original (j === 0) is already rendered, so a decode rejection there is harmless: show it anyway.
      if (j === 0) return go();
      busy = false; dead[j] = 1; slides[j] = null;
      if (nx.parentNode) nx.parentNode.removeChild(nx);
      if (ticks[j]) ticks[j].hidden = true;
      schedule();
    };
    (nx.decode ? nx.decode() : Promise.resolve()).then(go, fail);
  };
  var next = function () {
    if (!live || paused || document.hidden) return schedule();
    var j = after(i, 1);
    if (j === i) return;
    to(j);
  };
  var jump = function (k) { if (started) { clearTimeout(timer); to(k); } };
  var schedule = function () {
    clearTimeout(timer);
    if (!ui) { timer = setTimeout(next, gap); return; }
    var t = ticks[i]; t.classList.remove('is-run'); void t.offsetWidth; t.classList.add('is-run');
  };
  if (getComputedStyle(first).position === 'static') first.style.position = 'relative';
  first.classList.add('azw-hslide', 'azw-orig', 'is-on', 'is-first');
  paint(0);
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { live = es[es.length - 1].isIntersecting; }).observe(host);
  // data-hold="ms": keep the opening frame still for that long before the reel's clock starts.
  var start = function () { setTimeout(function () { started = true; schedule(); }, Math.max(1500, parseInt(host.getAttribute('data-hold'), 10) || 0)); };
  document.readyState === 'complete' ? start() : addEventListener('load', start);
})();

/* The hero's prices card: "Open now · until 7pm" or "Closed · opens Monday 9am", in the business's
   own time zone (window.azwSite.offset, minutes from UTC), from the booking hours {"1":["9:00","19:00"], "0":null}. */
(function () {
  'use strict';
  var card = document.querySelector('.sx-price-card[data-hours]');
  var out = card && card.querySelector('.sx-open-text');
  if (!out) return;
  var hours;
  try { hours = JSON.parse(card.getAttribute('data-hours')); } catch (e) { return; }
  var site = window.azwSite || {};
  var off = typeof site.offset === 'number' ? site.offset : -new Date().getTimezoneOffset();
  var now = new Date(Date.now() + off * 60000); // read with getUTC*: the business's wall clock
  var mins = function (t) { var m = /^(\d{1,2}):(\d{2})$/.exec(String(t || '')); return m ? +m[1] * 60 + +m[2] : null; };
  var say = function (m) { var h = Math.floor(m / 60), mm = m % 60, ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12; return h + (mm ? ':' + (mm < 10 ? '0' : '') + mm : '') + ap; };
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var day = now.getUTCDay(), t = now.getUTCHours() * 60 + now.getUTCMinutes();
  var span = function (d) { var h = hours[String(d)]; if (!h || h.length < 2) return null; var a = mins(h[0]), b = mins(h[1]); return a === null || b === null || b <= a ? null : [a, b]; };
  var today = span(day);
  if (today && t >= today[0] && t < today[1]) {
    card.classList.add('is-open');
    out.textContent = 'Open now · until ' + say(today[1]);
    return;
  }
  if (today && t < today[0]) { out.textContent = 'Closed · opens today at ' + say(today[0]); return; }
  for (var i = 1; i <= 7; i++) {
    var s = span((day + i) % 7);
    if (s) { out.textContent = 'Closed · opens ' + (i === 1 ? 'tomorrow' : DAYS[(day + i) % 7]) + ' at ' + say(s[0]); return; }
  }
})();

/* The menu button on phones and tablets (in place of WordPress's navigation script). */
document.querySelectorAll('.wp-block-navigation').forEach(function (nav) {
  var box = nav.querySelector('.wp-block-navigation__responsive-container');
  var open = nav.querySelector('.wp-block-navigation__responsive-container-open');
  var close = nav.querySelector('.wp-block-navigation__responsive-container-close');
  if (!box || !open) return;
  open.setAttribute('aria-expanded', 'false');
  function set(on) {
    box.classList.toggle('is-menu-open', on);
    box.classList.toggle('has-modal-open', on);
    document.documentElement.classList.toggle('has-modal-open', on);
    if (on) { box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); } else { box.removeAttribute('role'); box.removeAttribute('aria-modal'); }
    open.setAttribute('aria-expanded', on ? 'true' : 'false');
    if (on) { var first = box.querySelector('a, button'); if (first) first.focus(); } else open.focus();
  }
  open.addEventListener('click', function () { set(true); });
  if (close) close.addEventListener('click', function () { set(false); });
  box.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && box.classList.contains('is-menu-open')) set(false); });
});
