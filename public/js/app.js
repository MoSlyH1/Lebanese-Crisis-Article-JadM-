/* مرصد — frontend logic (vanilla JS) */
(function () {
  'use strict';

  /* ---------- View counter ----------
     Count one view per browser per 6 hours so a refresh doesn't inflate it,
     then keep the displayed number in sync with the server. */
  var countEl = document.getElementById('viewCount');

  function renderCount(n) {
    if (!countEl || typeof n !== 'number') return;
    // Arabic-Indic digits with thousands separators, to match the article.
    countEl.textContent = n.toLocaleString('ar-EG');
  }

  function registerView() {
    var KEY = 'mv_last_view';
    var SIX_HOURS = 6 * 60 * 60 * 1000;
    var last = 0;
    try { last = parseInt(localStorage.getItem(KEY), 10) || 0; } catch (e) {}
    var fresh = Date.now() - last > SIX_HOURS;

    if (fresh) {
      fetch('/api/view', { method: 'POST' })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          renderCount(d.views);
          try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {}
        })
        .catch(showCachedCount);
    } else {
      showCachedCount();
    }
  }

  function showCachedCount() {
    fetch('/api/stats')
      .then(function (r) { return r.json(); })
      .then(function (d) { renderCount(d.views); })
      .catch(function () { if (countEl) countEl.textContent = '—'; });
  }

  registerView();

  /* ---------- Timeline spine: highlight the section in view ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.spine a'));
  if (links.length && 'IntersectionObserver' in window) {
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('data-target')] = a; });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          links.forEach(function (a) { a.classList.remove('is-active'); });
          var active = byId[entry.target.id];
          if (active) active.classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    links.forEach(function (a) {
      var sec = document.getElementById(a.getAttribute('data-target'));
      if (sec) observer.observe(sec);
    });
  }

  /* ---------- Newsletter signup ---------- */
  var btn = document.getElementById('subscribeBtn');
  var input = document.getElementById('emailInput');
  var msg = document.getElementById('subMsg');

  function setMsg(text, isError) {
    if (!msg) return;
    msg.textContent = text;
    msg.classList.toggle('error', !!isError);
  }

  if (btn && input) {
    var submit = function () {
      var email = (input.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setMsg('من فضلك أدخل بريداً إلكترونياً صحيحاً.', true);
        return;
      }
      btn.disabled = true;
      setMsg('جارٍ الاشتراك…', false);
      fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email }),
      })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          if (res.ok) {
            setMsg('تم الاشتراك. شكراً لك!', false);
            input.value = '';
          } else {
            setMsg('تعذّر الاشتراك. حاول مرة أخرى.', true);
          }
        })
        .catch(function () { setMsg('تعذّر الاتصال بالخادم.', true); })
        .finally(function () { btn.disabled = false; });
    };

    btn.addEventListener('click', submit);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submit();
    });
  }
})();
