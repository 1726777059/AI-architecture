/* ============================================================
   app.js — Vibecoding 资源目录
   数据加载 → 渲染 → 搜索/过滤 → 添加条目表单
   ============================================================ */

(function () {
  'use strict';

  // --- 状态 ---
  let catalog = null;
  let filterText = '';
  let activeTag = null;
  let editingId = null;  // 正在编辑的条目 ID（null = 新增模式）

  // --- 常量：类别颜色映射（兜底） ---
  const DEFAULT_COLORS = {
    'prompt-templates':    '#6366f1',
    'harness-mechanisms':  '#f59e0b',
    'mcp-servers':         '#10b981',
    'skills':              '#ec4899',
  };

  // --- DOM 引用 ---
  const mainContent  = document.getElementById('mainContent');
  const nav          = document.getElementById('categoryNav');
  const searchInput  = document.getElementById('searchInput');
  const loadingState = document.getElementById('loadingState');
  const errorState   = document.getElementById('errorState');

  // ============================================================
  // 数据加载
  // ============================================================
  async function fetchCatalog() {
    try {
      const resp = await fetch('data/catalog.json');
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
    let filtered = entries;

    if (filterText) {
      const q = filterText.toLowerCase();
      filtered = filtered.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        (e.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }

    if (activeTag) {
      filtered = filtered.filter(e =>
        (e.tags || []).some(t => t.toLowerCase() === activeTag.toLowerCase())
      );
    }

    return filtered;
  }

  // ============================================================
  // 渲染：分类导航
  // ============================================================
  function renderCategoryNav() {
    nav.innerHTML = '';
    (catalog.categories || []).forEach(cat => {
      const count = filterEntries(catalog.entries || [])
        .filter(e => e.category === cat.id).length;

      const btn = document.createElement('button');
      btn.className = 'category-nav__link';
      btn.setAttribute('data-category', cat.id);
      btn.innerHTML = `${cat.icon} ${cat.name} <span class="nav-count">(${count})</span>`;
      btn.addEventListener('click', () => {
        document.getElementById('section-' + cat.id)?.scrollIntoView({ behavior: 'smooth' });
      });
      nav.appendChild(btn);
    });
  }

  // ============================================================
  // 渲染：单张卡片
  // ============================================================
  function renderEntryCard(entry, catColor) {
    const card = document.createElement('article');
    card.className = 'card';

    // 顶部强调色条
    const accent = document.createElement('div');
    accent.className = 'card__accent';
    accent.style.backgroundColor = catColor;
    card.appendChild(accent);

    // 标签
    if (entry.tags && entry.tags.length > 0) {
      const tagsRow = document.createElement('div');
      tagsRow.className = 'card__tags';
      entry.tags.forEach(tag => {
        const pill = document.createElement('button');
        pill.className = 'card__tag';
        pill.textContent = tag;
        pill.style.backgroundColor = hexToRgba(catColor, 0.12);
        pill.style.color = catColor;
        pill.addEventListener('click', (e) => {
          e.stopPropagation();
          activeTag = activeTag === tag ? null : tag;
          searchInput.value = activeTag ? '#' + activeTag : '';
          filterText = '';
          renderAll();
        });
        tagsRow.appendChild(pill);
      });
      card.appendChild(tagsRow);
    }

    // 名称
    const nameEl = document.createElement('h3');
    nameEl.className = 'card__name';
    nameEl.textContent = entry.name;
    card.appendChild(nameEl);

    // 描述
    const descEl = document.createElement('p');
    descEl.className = 'card__desc';
    descEl.textContent = entry.description;
    card.appendChild(descEl);

    // 操作按钮（编辑 / 删除）
    const actions = document.createElement('div');
    actions.className = 'card__actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'card__action-btn card__action-btn--edit';
    editBtn.textContent = '✏️ 编辑';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      editEntry(entry);
    });
    actions.appendChild(editBtn);

    const delBtn = document.createElement('button');
    delBtn.className = 'card__action-btn card__action-btn--delete';
    delBtn.textContent = '🗑️ 删除';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showDeleteDialog(entry);
    });
    actions.appendChild(delBtn);

    card.appendChild(actions);

    // 底部：链接 + 日期
    const footer = document.createElement('div');
    footer.className = 'card__footer';

    if (entry.url) {
      const link = document.createElement('a');
      link.className = 'card__link';
      link.href = entry.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = '🔗 链接';
      footer.appendChild(link);
    }

    if (entry.added) {
      const dateEl = document.createElement('span');
      dateEl.className = 'card__date';
      dateEl.textContent = entry.added;
      footer.appendChild(dateEl);
    }

    card.appendChild(footer);
    return card;
  }

  // ============================================================
  // 编辑 / 删除
  // ============================================================
  function editEntry(entry) {
    editingId = entry.id;
    document.getElementById('formCategory').value = entry.category;
    document.getElementById('formName').value = entry.name;
    document.getElementById('formDesc').value = entry.description;
    document.getElementById('formUrl').value = entry.url || '';
    document.getElementById('formTags').value = (entry.tags || []).join(', ');

    // 更新 UI：显示编辑模式
    const modeEl = document.getElementById('formMode');
    modeEl.textContent = '✏️ 编辑模式';
    modeEl.className = 'entry-form__mode-indicator entry-form__mode-indicator--edit';
    document.getElementById('cancelEditBtn').hidden = false;
    document.getElementById('jsonOutput').hidden = true;

    // 展开添加区域并滚动到表单
    document.getElementById('addEntrySection').open = true;
    document.getElementById('entryForm').scrollIntoView({ behavior: 'smooth' });
  }

  function resetForm() {
    editingId = null;
    document.getElementById('entryForm').reset();
    const modeEl = document.getElementById('formMode');
    modeEl.textContent = '➕ 新增模式';
    modeEl.className = 'entry-form__mode-indicator entry-form__mode-indicator--add';
    document.getElementById('cancelEditBtn').hidden = true;
    document.getElementById('jsonOutput').hidden = true;
  }

  function showDeleteDialog(entry) {
    const snippet = JSON.stringify(entry, null, 2) + ',';

    const overlay = document.createElement('div');
    overlay.className = 'delete-dialog-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'delete-dialog';
    dialog.innerHTML = `
      <h3 class="delete-dialog__title">🗑️ 删除「${entry.name}」</h3>
      <p class="delete-dialog__msg">
        由于网站是静态托管，删除操作需要在本地编辑文件。<br>
        <strong>从 <code>data/catalog.json</code> 的 <code>entries</code> 数组中删除以下条目：</strong>
      </p>
      <div class="delete-dialog__json">${escapeHtml(snippet)}</div>
      <div class="delete-dialog__actions">
        <button class="delete-dialog__btn delete-dialog__btn--cancel" id="delCancelBtn">取消</button>
        <button class="delete-dialog__btn delete-dialog__btn--copy" id="delCopyBtn">📋 复制条目内容</button>
      </div>
    `;
    overlay.appendChild(dialog);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
    dialog.querySelector('#delCancelBtn').addEventListener('click', () => overlay.remove());
    dialog.querySelector('#delCopyBtn').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(snippet);
        dialog.querySelector('#delCopyBtn').textContent = '✅ 已复制';
      } catch {
        dialog.querySelector('#delCopyBtn').textContent = '✅ 请手动复制上方内容';
      }
    });

    document.body.appendChild(overlay);
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ============================================================
  // 渲染：全部分类 Section
  // ============================================================
  function renderAllSections() {
    // 清空 main（保留 loading/error 状态元素）
    const existingSections = mainContent.querySelectorAll('.category-section, .no-results');
    existingSections.forEach(el => el.remove());

    const allFiltered = filterEntries(catalog.entries || []);
    let anyVisible = false;

    (catalog.categories || []).forEach(cat => {
      const catEntries = allFiltered.filter(e => e.category === cat.id);
      const catColor = cat.color || DEFAULT_COLORS[cat.id] || '#6b7280';

      const section = document.createElement('section');
      section.className = 'category-section';
      section.id = 'section-' + cat.id;

      // Section 头部
      const header = document.createElement('div');
      header.className = 'category-section__header';
      header.style.borderBottomColor = catColor;
      header.innerHTML = `
        <span class="category-section__icon">${cat.icon || ''}</span>
        <span class="category-section__name">${cat.name}</span>
        <span class="category-section__count">${catEntries.length} 条</span>
      `;
      section.appendChild(header);

      // 描述
      if (cat.description) {
        const desc = document.createElement('p');
        desc.className = 'category-section__desc';
        desc.textContent = cat.description;
        section.appendChild(desc);
      }

      // 卡片网格
      const grid = document.createElement('div');
      grid.className = 'card-grid';

      if (catEntries.length > 0) {
        catEntries.forEach(entry => {
          grid.appendChild(renderEntryCard(entry, catColor));
        });
        anyVisible = true;
      } else if (!filterText && !activeTag) {
        // 该分类无条目（非过滤状态）
        const empty = document.createElement('div');
        empty.className = 'category-section--empty';
        empty.textContent = '暂无条目，期待你的发现 ✨';
        grid.appendChild(empty);
      }

      section.appendChild(grid);
      mainContent.appendChild(section);
    });

    // 无结果
    if (!anyVisible && (filterText || activeTag)) {
      const noRes = document.createElement('div');
      noRes.className = 'no-results';
      noRes.textContent = '没有匹配的条目，试试其他关键词';
      mainContent.appendChild(noRes);
    }
  }

  // ============================================================
  // 渲染：全部（导航 + 内容）
  // ============================================================
  function renderAll() {
    renderCategoryNav();
    renderAllSections();
    highlightNavLink();
  }

  // ============================================================
  // 导航高亮（IntersectionObserver）
  // ============================================================
  let observer;
  function setupNavObserver() {
    if (observer) observer.disconnect();
    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const catId = entry.target.id.replace('section-', '');
        const link = nav.querySelector(`[data-category="${catId}"]`);
        if (link) {
          if (entry.isIntersecting) {
            nav.querySelectorAll('.category-nav__link').forEach(l => {
              l.classList.remove('category-nav__link--active');
              l.style.backgroundColor = '';
            });
            const cat = (catalog.categories || []).find(c => c.id === catId);
            if (cat) {
              link.classList.add('category-nav__link--active');
              link.style.backgroundColor = cat.color || DEFAULT_COLORS[catId];
            }
          }
        }
      });
    }, { rootMargin: '-80px 0px -50% 0px' });

    document.querySelectorAll('.category-section').forEach(s => observer.observe(s));
  }

  function highlightNavLink() {
    // 延迟等 DOM 更新后再重绑 Observer
    setTimeout(setupNavObserver, 50);
  }

  // ============================================================
  // 事件绑定
  // ============================================================
  function bindEvents() {
    // 搜索输入
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const raw = searchInput.value.trim();
        if (raw.startsWith('#')) {
          activeTag = raw.slice(1);
          filterText = '';
        } else {
          filterText = raw;
          activeTag = null;
        }
        renderAll();
      }, 200);
    });

    // 添加条目表单
    setupEntryForm();
  }

  // ============================================================
  // 添加条目表单
  // ============================================================
  function setupEntryForm() {
    // 填充分类下拉
    const formCategory = document.getElementById('formCategory');
    (catalog.categories || []).forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.id;
      opt.textContent = cat.name;
      formCategory.appendChild(opt);
    });

    const form = document.getElementById('entryForm');
    const output = document.getElementById('jsonOutput');
    const snippet = document.getElementById('jsonSnippet');
    const copyBtn = document.getElementById('copyBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');

    // 取消编辑
    cancelBtn.addEventListener('click', () => {
      resetForm();
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const category = formCategory.value;
      const name = document.getElementById('formName').value.trim();
      const desc = document.getElementById('formDesc').value.trim();
      const url = document.getElementById('formUrl').value.trim() || null;
      const rawTags = document.getElementById('formTags').value.trim();

      if (!category || !name || !desc) return;

      let entry;

      if (editingId) {
        // 编辑模式：复用原 ID
        const original = (catalog.entries || []).find(e => e.id === editingId);
        entry = {
          id: editingId,
          category,
          name,
          description: desc,
        };
        if (url) entry.url = url;
        if (rawTags) {
          entry.tags = rawTags.split(',').map(t => t.trim()).filter(Boolean);
        }
        entry.added = (original && original.added) || new Date().toISOString().slice(0, 10);

        snippet.textContent = '/**\n * 在 catalog.json 中找到 id="' + editingId + '" 的条目，\n * 替换为以下内容：\n */\n' + JSON.stringify(entry, null, 2) + ',';
      } else {
        // 新增模式
        const prefixes = {
          'prompt-templates': 'pt',
          'harness-mechanisms': 'hm',
          'mcp-servers': 'mcp',
          'skills': 'sk',
        };
        const prefix = prefixes[category] || 'xx';
        const existing = (catalog.entries || []).filter(e => e.category === category).length;
        const id = `${prefix}-${String(existing + 1).padStart(3, '0')}`;

        entry = { id, category, name, description: desc };
        if (url) entry.url = url;
        if (rawTags) {
          entry.tags = rawTags.split(',').map(t => t.trim()).filter(Boolean);
        }
        entry.added = new Date().toISOString().slice(0, 10);

        snippet.textContent = JSON.stringify(entry, null, 2) + ',';
      }

      output.hidden = false;
      output.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    // 复制按钮
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(snippet.textContent);
        copyBtn.textContent = '✅ 已复制';
        setTimeout(() => { copyBtn.textContent = '📋 复制'; }, 1500);
      } catch {
        const range = document.createRange();
        range.selectNodeContents(snippet);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        copyBtn.textContent = '✅ 已选中';
        setTimeout(() => { copyBtn.textContent = '📋 复制'; }, 1500);
      }
    });
  }

  // ============================================================
  // 更新元信息
  // ============================================================
  function updateMeta() {
    if (catalog.meta) {
      document.getElementById('lastUpdated').textContent =
        catalog.meta.lastUpdated || '--';
    }
  }

  // ============================================================
  // 工具函数
  // ============================================================
  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // ============================================================
  // 初始化
  // ============================================================
  async function init() {
    const ok = await fetchCatalog();
    if (!ok) {
      loadingState.hidden = true;
      errorState.hidden = false;
      return;
    }

    loadingState.hidden = true;
    errorState.hidden = true;
    updateMeta();
    renderAll();
    bindEvents();
  }

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
