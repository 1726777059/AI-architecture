/* ============================================================
   app.js V3 — 毛玻璃暗色 + GitHub API 直存
   ============================================================ */

(function () {
  'use strict';

  // --- GitHub 配置 ---
  const GH_OWNER = '1726777059';
  const GH_REPO = 'AI-architecture';
  const GH_PATH = 'data/catalog.json';
  const GH_API = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${GH_PATH}`;

  // --- 状态 ---
  let catalog = null;
  let filterText = '';
  let activeTag = null;
  let editingId = null;
  let token = '';

  const COLORS = {
    'prompt-templates':   '#818cf8',
    'harness-mechanisms': '#f59e0b',
    'mcp-servers':        '#10b981',
    'skills':             '#ec4899',
  };

  // --- DOM ---
  const $ = id => document.getElementById(id);
  const mainContent = $('mainContent');
  const searchInput = $('searchInput');

  // ============================================================
  // Toast
  // ============================================================
  function toast(msg, type) {
    const t = document.createElement('div');
    t.className = `toast toast--${type || 'info'}`;
    t.textContent = msg;
    $('toastContainer').appendChild(t);
    setTimeout(() => t.remove(), 3500);
  }

  // ============================================================
  // Token 管理
  // ============================================================
  function loadToken() {
    token = localStorage.getItem('gh_token') || '';
    if (token) {
      $('githubToken').value = token.substring(0, 4) + '...' + token.slice(-4);
      $('tokenStatus').textContent = '🟢 已配置';
      $('clearTokenBtn').hidden = false;
    }
  }

  function saveToken() {
    const val = $('githubToken').value.trim();
    if (!val) return;
    token = val;
    localStorage.setItem('gh_token', token);
    $('githubToken').value = token.substring(0, 4) + '...' + token.slice(-4);
    $('tokenStatus').textContent = '🟢 已配置';
    $('clearTokenBtn').hidden = false;
    toast('Token 已保存（仅存本地浏览器）', 'success');
  }

  function clearToken() {
    token = '';
    localStorage.removeItem('gh_token');
    $('githubToken').value = '';
    $('tokenStatus').textContent = '⚪ 未配置';
    $('clearTokenBtn').hidden = true;
    toast('Token 已清除', 'info');
  }

  // ============================================================
  // GitHub API
  // ============================================================
  async function ghGet() {
    const resp = await fetch(GH_API, {
      headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json' },
      cache: 'no-store',
    });
    if (!resp.ok) throw new Error(`GET ${resp.status}`);
    const data = await resp.json();
    return { sha: data.sha, content: JSON.parse(atob(data.content)) };
  }

  async function ghPut(content, message) {
    // 先获取最新 SHA
    const { sha } = await ghGet();
    const body = {
      message,
      content: btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2) + '\n'))),
      sha,
    };
    const resp = await fetch(GH_API, {
      method: 'PUT',
      headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!resp.ok) throw new Error(`PUT ${resp.status}`);
    return resp.json();
  }

  function ensureToken() {
    if (!token) {
      toast('请先在底部配置 GitHub Token', 'error');
      $('settingsRow').scrollIntoView({ behavior: 'smooth' });
      return false;
    }
    return true;
  }

  // ============================================================
  // 数据加载
  // ============================================================
  async function fetchCatalog() {
    try {
      const resp = await fetch('data/catalog.json?' + Date.now());
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      catalog = await resp.json();
      return true;
    } catch (err) {
      console.error('Failed to load catalog:', err);
      return false;
    }
  }

  // ============================================================
  // 搜索 / 过滤
  // ============================================================
  function filterEntries(entries) {
    let f = entries;
    if (filterText) {
      const q = filterText.toLowerCase();
      f = f.filter(e => e.name.toLowerCase().includes(q) || e.description.toLowerCase().includes(q) || (e.tags || []).some(t => t.toLowerCase().includes(q)));
    }
    if (activeTag) {
      f = f.filter(e => (e.tags || []).some(t => t.toLowerCase() === activeTag.toLowerCase()));
    }
    return f;
  }

  // ============================================================
  // 渲染：卡片
  // ============================================================
  function renderEntryCard(entry, catColor) {
    const card = document.createElement('article');
    card.className = 'card';

    const accent = document.createElement('div');
    accent.className = 'card__accent';
    const gradColors = {
      'prompt-templates': 'linear-gradient(135deg, #818cf8, #6366f1)',
      'harness-mechanisms': 'linear-gradient(135deg, #fbbf24, #f59e0b)',
      'mcp-servers': 'linear-gradient(135deg, #34d399, #10b981)',
      'skills': 'linear-gradient(135deg, #f472b6, #ec4899)',
    };
    accent.style.background = gradColors[entry.category] || catColor;
    card.appendChild(accent);

    if (entry.tags && entry.tags.length) {
      const tr = document.createElement('div');
      tr.className = 'card__tags';
      entry.tags.forEach(tag => {
        const p = document.createElement('button');
        p.className = 'card__tag';
        p.textContent = tag;
        p.style.background = hexToRgba(catColor, 0.15);
        p.style.color = catColor;
        p.addEventListener('click', (e) => {
          e.stopPropagation();
          activeTag = activeTag === tag ? null : tag;
          searchInput.value = activeTag ? '#' + activeTag : '';
          filterText = '';
          renderAll();
        });
        tr.appendChild(p);
      });
      card.appendChild(tr);
    }

    const nm = document.createElement('h3');
    nm.className = 'card__name';
    nm.textContent = entry.name;
    card.appendChild(nm);

    const desc = document.createElement('p');
    desc.className = 'card__desc';
    desc.textContent = entry.description;
    card.appendChild(desc);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'card__actions';
    const editBtn = document.createElement('button');
    editBtn.className = 'card__action-btn card__action-btn--edit';
    editBtn.textContent = '✏️';
    editBtn.title = '编辑';
    editBtn.addEventListener('click', (e) => { e.stopPropagation(); editEntry(entry); });
    actions.appendChild(editBtn);
    const delBtn = document.createElement('button');
    delBtn.className = 'card__action-btn card__action-btn--delete';
    delBtn.textContent = '🗑️';
    delBtn.title = '删除';
    delBtn.addEventListener('click', (e) => { e.stopPropagation(); deleteEntry(entry); });
    actions.appendChild(delBtn);
    card.appendChild(actions);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'card__footer';
    if (entry.url) {
      const link = document.createElement('a');
      link.className = 'card__link';
      link.href = entry.url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = '🔗';
      link.title = entry.url;
      footer.appendChild(link);
    }
    if (entry.added) {
      const d = document.createElement('span');
      d.className = 'card__date';
      d.textContent = entry.added;
      footer.appendChild(d);
    }
    card.appendChild(footer);

    return card;
  }

  // ============================================================
  // 渲染：全部
  // ============================================================
  function renderAllSections() {
    mainContent.querySelectorAll('.category-section, .no-results').forEach(el => el.remove());
    const all = filterEntries(catalog.entries || []);
    let any = false;

    (catalog.categories || []).forEach(cat => {
      const entries = all.filter(e => e.category === cat.id);
      const catColor = cat.color || COLORS[cat.id] || '#6b7280';

      const section = document.createElement('section');
      section.className = 'category-section';
      section.id = 'section-' + cat.id;

      const hdr = document.createElement('div');
      hdr.className = 'category-section__header';
      hdr.style.borderBottomColor = catColor;
      hdr.innerHTML = `<span class="category-section__icon">${cat.icon||''}</span><span class="category-section__name">${cat.name}</span><span class="category-section__count">${entries.length} 条</span>`;
      section.appendChild(hdr);

      if (cat.description) {
        const d = document.createElement('p');
        d.className = 'category-section__desc';
        d.textContent = cat.description;
        section.appendChild(d);
      }

      const grid = document.createElement('div');
      grid.className = 'card-grid';
      if (entries.length) {
        entries.forEach(e => grid.appendChild(renderEntryCard(e, catColor)));
        any = true;
      } else if (!filterText && !activeTag) {
        const empty = document.createElement('div');
        empty.className = 'category-section--empty';
        empty.textContent = '✨ 暂无条目，期待你的发现';
        grid.appendChild(empty);
      }
      section.appendChild(grid);
      mainContent.appendChild(section);
    });

    if (!any && (filterText || activeTag)) {
      const nr = document.createElement('div');
      nr.className = 'no-results';
      nr.textContent = '没有匹配的条目';
      mainContent.appendChild(nr);
    }
  }

  function renderAll() { renderAllSections(); }

  // ============================================================
  // 编辑 / 删除
  // ============================================================
  function editEntry(entry) {
    editingId = entry.id;
    $('formCategory').value = entry.category;
    $('formName').value = entry.name;
    $('formDesc').value = entry.description;
    $('formUrl').value = entry.url || '';
    $('formTags').value = (entry.tags || []).join(', ');
    $('formMode').textContent = '✏️ 编辑模式';
    $('formMode').className = 'entry-form__mode-indicator entry-form__mode-indicator--edit';
    $('cancelEditBtn').hidden = false;
    $('submitBtn').textContent = '💾 更新并提交';
    $('saveHint').textContent = '';
    $('addEntrySection').open = true;
    $('entryForm').scrollIntoView({ behavior: 'smooth' });
  }

  function resetForm() {
    editingId = null;
    $('entryForm').reset();
    $('formMode').textContent = '➕ 新增模式';
    $('formMode').className = 'entry-form__mode-indicator entry-form__mode-indicator--add';
    $('cancelEditBtn').hidden = true;
    $('submitBtn').textContent = '💾 保存到 GitHub';
    $('saveHint').textContent = '';
  }

  async function deleteEntry(entry) {
    if (!ensureToken()) return;

    const overlay = document.createElement('div');
    overlay.className = 'delete-dialog-overlay';
    const dlg = document.createElement('div');
    dlg.className = 'delete-dialog';
    dlg.innerHTML = `
      <h3 class="delete-dialog__title">🗑️ 删除「${entry.name}」</h3>
      <p class="delete-dialog__msg">确认后将直接通过 GitHub API 删除此条目并提交。</p>
      <div class="delete-dialog__actions">
        <button class="delete-dialog__btn delete-dialog__btn--cancel">取消</button>
        <button class="delete-dialog__btn delete-dialog__btn--delete" id="confirmDelBtn">确认删除</button>
      </div>`;
    overlay.appendChild(dlg);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    dlg.querySelector('.delete-dialog__btn--cancel').addEventListener('click', () => overlay.remove());

    dlg.querySelector('#confirmDelBtn').addEventListener('click', async () => {
      overlay.remove();
      try {
        const content = JSON.parse(JSON.stringify(catalog));
        content.entries = content.entries.filter(e => e.id !== entry.id);
        content.meta.lastUpdated = new Date().toISOString().slice(0, 10);
        $('saveHint').textContent = '⏳ 提交中...';
        await ghPut(content, `delete: ${entry.name}`);
        toast(`已删除「${entry.name}」`, 'success');
        await fetchCatalog();
        renderAll();
        updateMeta();
      } catch (err) {
        toast('删除失败: ' + err.message, 'error');
      }
      $('saveHint').textContent = '';
    });

    document.body.appendChild(overlay);
  }

  function escapeHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ============================================================
  // 表单提交 → GitHub API
  // ============================================================
  async function handleFormSubmit(e) {
    e.preventDefault();

    const category = $('formCategory').value;
    const name = $('formName').value.trim();
    const desc = $('formDesc').value.trim();
    const url = $('formUrl').value.trim() || null;
    const rawTags = $('formTags').value.trim();
    if (!category || !name || !desc) return;

    if (!ensureToken()) return;

    try {
      // 从 GitHub 拉最新数据
      const { content } = await ghGet();
      catalog = content;

      let entry;
      if (editingId) {
        const idx = content.entries.findIndex(e => e.id === editingId);
        if (idx < 0) throw new Error('条目不存在');
        entry = { ...content.entries[idx], category, name, description: desc };
        if (url) entry.url = url; else delete entry.url;
        if (rawTags) entry.tags = rawTags.split(',').map(t => t.trim()).filter(Boolean); else delete entry.tags;
        entry.added = entry.added || new Date().toISOString().slice(0, 10);
        content.entries[idx] = entry;
      } else {
        const prefixes = { 'prompt-templates':'pt','harness-mechanisms':'hm','mcp-servers':'mcp','skills':'sk' };
        const prefix = prefixes[category] || 'xx';
        const num = content.entries.filter(e => e.category === category).length;
        entry = { id: `${prefix}-${String(num+1).padStart(3,'0')}`, category, name, description: desc };
        if (url) entry.url = url;
        if (rawTags) entry.tags = rawTags.split(',').map(t => t.trim()).filter(Boolean);
        entry.added = new Date().toISOString().slice(0, 10);
        content.entries.push(entry);
      }

      content.meta.lastUpdated = new Date().toISOString().slice(0, 10);
      $('saveHint').textContent = '⏳ 提交中...';

      await ghPut(content, editingId ? `update: ${name}` : `add: ${name}`);

      toast(editingId ? `已更新「${name}」` : `已添加「${name}」`, 'success');
      resetForm();
      await fetchCatalog();
      renderAll();
      updateMeta();
    } catch (err) {
      toast('保存失败: ' + err.message, 'error');
    }
    $('saveHint').textContent = '';
  }

  // ============================================================
  // Meta
  // ============================================================
  function updateMeta() {
    if (catalog && catalog.meta) {
      $('lastUpdated').textContent = catalog.meta.lastUpdated || '--';
    }
  }

  // ============================================================
  // Helpers
  // ============================================================
  function hexToRgba(hex, a) {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${a})`;
  }

  // ============================================================
  // Events
  // ============================================================
  function bindEvents() {
    // Token
    $('saveTokenBtn').addEventListener('click', saveToken);
    $('clearTokenBtn').addEventListener('click', clearToken);

    // Search
    let timer;
    searchInput.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const raw = searchInput.value.trim();
        if (raw.startsWith('#')) { activeTag = raw.slice(1); filterText = ''; }
        else { filterText = raw; activeTag = null; }
        renderAll();
      }, 200);
    });

    // Form
    $('entryForm').addEventListener('submit', handleFormSubmit);
    $('cancelEditBtn').addEventListener('click', resetForm);

    // Fill category dropdown
    const catSel = $('formCategory');
    (catalog.categories || []).forEach(c => {
      const o = document.createElement('option');
      o.value = c.id;
      o.textContent = c.name;
      catSel.appendChild(o);
    });
  }

  // ============================================================
  // Init
  // ============================================================
  async function init() {
    loadToken();
    const ok = await fetchCatalog();
    if (!ok) {
      $('loadingState').hidden = true;
      $('errorState').hidden = false;
      return;
    }
    $('loadingState').hidden = true;
    $('errorState').hidden = true;
    updateMeta();
    renderAll();
    bindEvents();
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
