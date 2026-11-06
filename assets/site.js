(function () {
  'use strict';

  var root = document.documentElement;
  var key = 'jiushengsi-theme';
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var toggle = document.querySelector('[data-theme-toggle]');
  var meta = document.querySelector('meta[name="theme-color"]');
  var liveRegion = document.querySelector('[data-theme-status]');
  var explicitChoice = false;
  var themeTimer = null;
  var copyTimer = null;

  function storedTheme() {
    try {
      var value = localStorage.getItem(key);
      return value === 'light' || value === 'dark' ? value : null;
    } catch (error) {
      return null;
    }
  }

  function applyTheme(theme, options) {
    var settings = options || {};
    var isDark = theme === 'dark';
    root.dataset.theme = isDark ? 'dark' : 'light';
    if (meta) meta.setAttribute('content', isDark ? '#0e0e0d' : '#ffffff');
    if (toggle) {
      var action = isDark ? '切换到亮色主题' : '切换到暗色主题';
      toggle.setAttribute('aria-label', action);
      toggle.setAttribute('title', action);
    }
    if (settings.store) {
      try {
        localStorage.setItem(key, isDark ? 'dark' : 'light');
        explicitChoice = true;
      } catch (error) {
        explicitChoice = true;
      }
    }
    if (settings.announce && liveRegion) {
      liveRegion.textContent = isDark ? '已切换到暗色主题' : '已切换到亮色主题';
    }
    var reduceMotion = window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;
    if (!settings.silent && !reduceMotion) {
      root.classList.add('theme-transition');
      window.clearTimeout(themeTimer);
      themeTimer = window.setTimeout(function () {
        root.classList.remove('theme-transition');
      }, 360);
    }
  }

  explicitChoice = Boolean(storedTheme());
  applyTheme(root.dataset.theme === 'dark' ? 'dark' : 'light', { silent: true });

  if (toggle) {
    toggle.addEventListener('click', function () {
      applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', {
        store: true,
        announce: true
      });
    });
  }

  function followSystem(event) {
    if (!explicitChoice) {
      applyTheme(event.matches ? 'dark' : 'light', { silent: true });
    }
  }

  if (media) {
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', followSystem);
    } else if (typeof media.addListener === 'function') {
      media.addListener(followSystem);
    }
  }

  window.addEventListener('storage', function (event) {
    if (event.key !== key) return;
    if (event.newValue === 'light' || event.newValue === 'dark') {
      explicitChoice = true;
      applyTheme(event.newValue, { silent: true });
    }
  });

  function legacyCopy(text) {
    var previousFocus = document.activeElement;
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    textarea.style.fontSize = '16px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    var copied = false;
    try {
      textarea.focus({ preventScroll: true });
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);
      copied = document.execCommand('copy');
    } finally {
      document.body.removeChild(textarea);
      if (previousFocus && typeof previousFocus.focus === 'function') {
        previousFocus.focus({ preventScroll: true });
      }
    }
    if (!copied) throw new Error('Copy command failed');
  }

  function markCopy(button, ok) {
    var label = button.querySelector('.copy-label');
    var panel = button.closest('.contact-panel');
    var status = panel ? panel.querySelector('[data-copy-status]') : null;
    if (label) label.textContent = ok ? '已复制' : '复制失败';
    if (status) {
      status.textContent = ok ? '邮箱已复制到剪贴板' : '复制失败，请手动选择邮箱地址。';
    }
    window.clearTimeout(copyTimer);
    copyTimer = window.setTimeout(function () {
      if (label) label.textContent = '复制邮箱';
      if (status) status.textContent = '';
    }, ok ? 2400 : 3200);
  }

  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || typeof target.closest !== 'function') return;
    var button = target.closest('[data-copy-email]');
    if (!button) return;
    var email = button.getAttribute('data-copy-email') || '';
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(email).then(
        function () {
          markCopy(button, true);
        },
        function () {
          try {
            legacyCopy(email);
            markCopy(button, true);
          } catch (error) {
            markCopy(button, false);
          }
        }
      );
    } else {
      try {
        legacyCopy(email);
        markCopy(button, true);
      } catch (error) {
        markCopy(button, false);
      }
    }
  });

  function initPostIndex() {
    var panel = document.querySelector('[data-post-index]');
    if (!panel || typeof window.fetch !== 'function') return;

    var list = panel.querySelector('[data-index-posts]');
    var label = panel.querySelector('[data-index-label]');
    var status = panel.querySelector('[data-index-status]');
    var allLink = panel.querySelector('[data-index-all]');
    var allLabel = panel.querySelector('[data-index-all-label]');
    var tags = Array.prototype.slice.call(panel.querySelectorAll('[data-post-tag]'));
    var currentSlug = panel.getAttribute('data-current-slug') || '';
    var requestId = 0;

    function tagKey(value) {
      return String(value || '').trim().toLocaleLowerCase('zh-CN');
    }

    function setActive(tag) {
      var activeKey = tagKey(tag);
      tags.forEach(function (link) {
        var isActive = Boolean(activeKey) && tagKey(link.getAttribute('data-post-tag')) === activeKey;
        link.classList.toggle('is-active', isActive);
        if (isActive) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    }

    function makePostItem(post) {
      var li = document.createElement('li');
      var link = document.createElement('a');
      var title = document.createElement('span');
      var meta = document.createElement('span');
      var metaParts = [];
      link.className = 'post-index__post';
      link.href = '/post/' + encodeURIComponent(post.slug || '');
      title.className = 'post-index__post-title';
      title.textContent = post.title || '无标题';
      meta.className = 'post-index__post-meta';
      if (post.date) metaParts.push(post.date);
      if (post.reading) metaParts.push(post.reading + ' 分钟');
      meta.textContent = metaParts.join(' · ');
      link.appendChild(title);
      if (meta.textContent) link.appendChild(meta);
      li.appendChild(link);
      return li;
    }

    function render(data) {
      var items = Array.isArray(data.posts) ? data.posts : [];
      var activeTag = data.tag || '';
      if (!list) return;
      while (list.firstChild) list.removeChild(list.firstChild);
      if (items.length) {
        var fragment = document.createDocumentFragment();
        items.forEach(function (post) {
          fragment.appendChild(makePostItem(post));
        });
        list.appendChild(fragment);
      } else {
        var empty = document.createElement('li');
        empty.className = 'post-index__empty';
        empty.textContent = activeTag ? '这个标签下暂时没有其他文章。' : '还没有其他文章。';
        list.appendChild(empty);
      }
      if (label) label.textContent = activeTag ? activeTag + ' · 相关文章' : '最近文章';
      if (status) {
        status.textContent = Number(data.total) > 0 ? data.total + ' 篇文章' : '暂无文章';
      }
      if (allLink && allLabel) {
        allLabel.textContent = activeTag ? '查看「' + activeTag + '」的全部文章' : '浏览全部标签';
        allLink.href = activeTag ? '/tag/' + encodeURIComponent(activeTag) : '/tags';
      }
      setActive(activeTag);
    }

    function load(tag, fallbackUrl) {
      var current = ++requestId;
      var url = '/api/tag-posts?exclude=' + encodeURIComponent(currentSlug);
      if (tag) url += '&tag=' + encodeURIComponent(tag);
      setActive(tag);
      panel.classList.add('is-loading');
      panel.setAttribute('aria-busy', 'true');
      if (status) status.textContent = '加载中…';
      fetch(url, {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin'
      })
        .then(function (response) {
          if (!response.ok) throw new Error('Index request failed');
          return response.json();
        })
        .then(function (data) {
          if (current !== requestId) return;
          render(data);
        })
        .catch(function () {
          if (current !== requestId) return;
          if (status) status.textContent = '加载失败，正在打开标签页…';
          if (fallbackUrl) window.location.assign(fallbackUrl);
        })
        .finally(function () {
          if (current !== requestId) return;
          panel.classList.remove('is-loading');
          panel.removeAttribute('aria-busy');
        });
    }

    tags.forEach(function (link) {
      link.addEventListener('click', function (event) {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        var tag = link.getAttribute('data-post-tag') || '';
        var fallback = link.getAttribute('href') || '/tags';
        event.preventDefault();
        load(tag, fallback);
      });
    });
  }

  initPostIndex();
})();
