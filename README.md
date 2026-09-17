# 今天吃什么呀？ ♡ — Version 1

这一版只做一件事：**建议今天吃什么**。

暂时不加入真实餐厅、地图、外卖、订位等功能。

## 文件

- `index.html` — 页面结构
- `style.css` — 极简 Apricot / Pink / Stardust 视觉
- `script.js` — 食物选择、心情、动画、历史记录，以及未来 AI 接口位置

## AI

这一版的「晓明 AI」暂时是本地规则版，不需要 API。

之后如果要接真正的 AI，建议：

`GitHub Pages → Cloudflare Worker → Gemini`

API key 不要直接放进 `script.js`。

## GitHub Pages

把三个源码文件放在 repository 根目录：

`Settings → Pages → Deploy from a branch → main → /root`
