# 谐音梗刮刮乐

一款通过模拟真实刮刮乐交互，让用户在刮开的期待感中解锁各类搞笑谐音梗的轻量级解压互动应用。

## 功能特点

- 🎨 真实刮刮卡交互体验
- 🖱️ 支持鼠标和触屏操作
- 🎯 超过60%涂层自动清除
- 🎲 随机抽取下一个谜语
- 📱 响应式设计，支持移动端
- 🎉 完成后弹出提示框

## 项目结构

```
Punny-Scratch/
├── app.py              # Flask后端服务器
├── data/
│   └── riddles.json    # 谜语数据文件
├── templates/
│   └── index.html      # 主页面模板
├── static/
│   ├── css/
│   │   └── style.css   # 样式文件
│   └── js/
│       └── scratch.js  # 刮刮卡交互逻辑
└── README.md           # 项目说明文档
```

## 安装步骤

### 1. 环境要求

- Python 3.7+
- Flask

### 2. 安装依赖

```bash
pip install flask
```

### 3. 运行项目

```bash
python app.py
```

服务器将在 `http://localhost:8723` 启动。

## 使用说明

1. 打开浏览器访问 `http://localhost:8723`
2. 页面中央显示一张刮刮卡，上方显示谜面
3. 使用鼠标拖拽或手指滑动擦除涂层
4. 随着涂层变透明，底部的谐音梗答案逐渐显现
5. 当刮开超过60%时，自动清除剩余涂层并弹出提示框
6. 点击"确认"后，点击"下一张"按钮即可随机加载下一个谜语

## API接口

### 获取随机谜语

```
GET /api/riddle
```

返回示例：
```json
{
  "id": 1,
  "question": "马年最适合去哪旅游？",
  "answer": "马尔代夫（马上出发）",
  "hint": "与马有关的谐音"
}
```

### 获取所有谜语

```
GET /api/all-riddles
```

返回所有谜语列表。

## 自定义谜语

编辑 `data/riddles.json` 文件，可以添加或修改谜语内容：

```json
[
  {
    "id": 1,
    "question": "马年最适合去哪旅游？",
    "answer": "马尔代夫（马上出发）",
    "hint": "与马有关的谐音"
  },
  // 更多谜语...
]
```

## 技术栈

- **后端**: Flask (Python)
- **前端**: HTML5, CSS3, JavaScript
- **画布**: HTML5 Canvas
- **通信**: RESTful API

## 配置选项

在 `app.py` 中可以修改以下配置：

```python
# 服务器端口
app.run(host='0.0.0.0', port=8723, debug=True)
```

在 `static/js/scratch.js` 中可以修改刮开阈值：

```javascript
// 刮开阈值（60%）
this.scratchThreshold = 0.6;
```

## 开发说明

### 本地开发

1. 克隆或下载项目
2. 安装依赖：`pip install flask`
3. 启动服务器：`python app.py`
4. 浏览器访问 `http://localhost:8723`

### 生产部署

对于生产环境，建议使用 Gunicorn 或 uWSGI 等 WSGI 服务器：

```bash
# 安装 Gunicorn
pip install gunicorn

# 启动服务器
gunicorn -w 4 -b 0.0.0.0:8723 app:app
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
