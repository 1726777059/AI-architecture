# V3: 毛玻璃质感 + GitHub API 直接保存

## 设计决策

- **视觉风格**: 毛玻璃暗色 (Glassmorphism Dark)
- **背景**: 深色渐变 `#0f0c29 → #302b63 → #24243e`
- **卡片**: `rgba(255,255,255,0.04)` + `backdrop-filter: blur(20px)` + 半透明边框
- **顶部强调条**: 每列使用类别色的渐变 (purple/amber/emerald/pink gradient)
- **标签丸**: 半透明背景 + 类别色文字
- **布局**: 4 列 Grid 竖排（不变）

## 功能变更

### GitHub API 直存
- Token 输入框（存 localStorage，不暴露于代码）
- 新增/编辑/删除直接通过 GitHub Contents API 提交
- 需要 base64 编解码 + SHA 追踪
- 操作反馈：loading → success toast / error

### API 调用
- `GET /repos/{owner}/{repo}/contents/data/catalog.json` → 获取 SHA
- `PUT /repos/{owner}/{repo}/contents/data/catalog.json` → 提交更新
- 提交信息：`update: add/edit/delete {entry_name}`

## 修改文件

| 文件 | 变更 |
|------|------|
| `css/style.css` | 全量重写：暗色主题、玻璃卡片、渐变 |
| `js/app.js` | 添加 GitHub API 模块、Token 管理、保存逻辑 |
| `index.html` | 添加 Token 配置区、toast 提示 |
| `data/catalog.json` | 不变 |

## 验证

1. 页面加载 → 深色渐变 + 玻璃卡片显示
2. 输入 Token → 点保存 → toast 提示"已提交"
3. 刷新 → 新条目出现在页面
4. 编辑 → 修改 → 保存 → 刷新验证
5. 删除 → 确认 → 页面更新
