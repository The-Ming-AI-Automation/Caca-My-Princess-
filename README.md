# 今天吃什么呀？ — Caca × 晓明

这是 Caca 的私人「今天吃什么」网站 V2。

## 这次更新

- 根据 Caca 平时喜欢吃的食物建立默认推荐池
- 不输入任何食物时，晓明会自动从 Caca 的喜好里选择
- 记住 Sushi Zen / Sushi Mentai 的 Tunamayo 偏好
- 记住火锅要麻辣汤底
- 记住 Ayam Gepuk 要 Set A + 生包菜
- 记住 Ramly burger 少酱、可以加葱
- 记住 Indo mee 优先于 Mee Sedap
- 记住手撕包菜要脆脆的
- 记住 FamilyMart Tuna Sandwich / Corn Dog / Chocolate Mochi Bread
- 自动阻止已知不吃的：榴莲、Hashbrown、豆腐、Cucumber/黄瓜、Tomato/番茄
- 仍然保留自定义输入、心情、晓明本地分析、历史记录
- 选好食物后继续出现男朋友照片卡弹窗

## 男朋友照片

如果要显示你的真实照片，把一张照片放进这个文件夹并命名：

`boyfriend.jpg`

最终结构：

```text
index.html
style.css
script.js
README.md
boyfriend.jpg
```

如果没有照片，弹窗会显示爱心占位，不会影响网站运行。

## GitHub Pages

把以上文件直接放在 repository root，然后 GitHub Pages 使用 `main` branch + `/ (root)`。
