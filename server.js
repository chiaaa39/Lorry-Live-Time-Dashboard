
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
// Render 会通过环境变量自动注入 PORT，本地测试默认使用 3000
const PORT = process.env.PORT || 3000;

// 跨域与静态文件服务
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// 首页路由映射
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});