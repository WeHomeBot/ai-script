# AI-Script

提供可以在浏览器中运行的 AI 脚本。

## 使用方法

### 在浏览器中直接使用

```html
  <script src="https://cdn.jsdelivr.net/npm/ai-script@latest/dist/ai-script.umd.js" appKey="sk-262**********62b" baseUrl="https://api.deepseek.com" model="deepseek-chat"></script>
```
### 示例

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI-Script Demo</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
    }
    h1 {
      color: #333;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
    }
    .demo-container {
      background-color: #f5f5f5;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    input {
      padding: 8px;
      width: 300px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    button {
      padding: 8px 16px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button:hover {
      background-color: #45a049;
    }
    #result {
      margin-top: 20px;
      padding: 10px;
      background-color: #e9f7ef;
      border-radius: 4px;
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/ai-script@latest/dist/ai-script.umd.js" appKey="sk-262**********62b" baseUrl="https://api.deepseek.com" model="deepseek-chat"></script>
</head>
<body>
  <h1>AI-Script Demo</h1>
  
  <div class="demo-container">
    <h2>Try it out</h2>
    <p>Press button to add count: <span>0</span> clicks</p>
    
    <button>Click me</button>
  </div>

  <script type="ai">
    每次点击按钮，点击次数加1
  </script>
</body>
</html>
```

## 开发

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

这将启动开发服务器，您可以在浏览器中访问 `http://localhost:5173` 查看示例页面。

### 构建库

```bash
npm run build
```

这将在 `dist` 目录下生成以下文件：
- `ai-script.es.js` - ES模块格式
- `ai-script.umd.js` - UMD格式
- TypeScript类型定义文件

### 运行测试

```bash
npm test
```

## 事件与浮层

AI-Script 在处理过程中会派发以下事件：

- `ai-script-start` - AI 开始处理提示时触发
- `ai-script-complete` - AI 完成处理提示时触发

### 处理中浮层

默认情况下，示例页面包含一个处理中浮层，当 AI 开始处理时显示，完成时隐藏。您可以通过以下方式自定义或禁用此功能：

```html
<!-- 浮层HTML结构 -->
<div class="ai-processing-overlay">
  <div class="ai-processing-content">
    <div class="ai-processing-spinner"></div>
    <p>AI正在处理中，请稍候...</p>
  </div>
</div>

<!-- 事件监听器 -->
<script>
  // 获取浮层元素
  const overlay = document.querySelector('.ai-processing-overlay');
  
  // 监听AI处理开始事件
  document.addEventListener('ai-script-start', function(event) {
    // 显示浮层
    overlay.classList.add('active');
    // 可以访问event.detail获取更多信息
    console.log('AI开始处理:', event.detail);
  });
  
  // 监听AI处理完成事件
  document.addEventListener('ai-script-complete', function(event) {
    // 隐藏浮层
    overlay.classList.remove('active');
    // 可以访问event.detail获取更多信息
    console.log('AI处理完成:', event.detail);
  });
</script>
```

### 自定义浮层样式

您可以通过修改CSS来自定义浮层的外观：

```css
/* 修改浮层背景 */
.ai-processing-overlay {
  background-color: rgba(0, 0, 0, 0.7); /* 更深的背景 */
}

/* 修改内容框样式 */
.ai-processing-content {
  background-color: #f0f0f0;
  border-left: 4px solid #4CAF50;
}

/* 修改加载动画颜色 */
.ai-processing-spinner {
  border-top-color: #ff5722; /* 橙色加载指示器 */
}
```

## 缓存机制

AI-Script 内置了缓存功能，可以显著提高性能并减少API调用次数。当相同的提示在相同的页面上下文中被多次使用时，缓存机制会直接返回之前的结果，而不是重新调用API。

### 缓存配置

您可以通过以下方式配置缓存功能：

```html
<script 
  src="https://cdn.jsdelivr.net/npm/ai-script@latest/dist/ai-script.umd.js" 
  appKey="your-api-key" 
  baseUrl="https://api.example.com" 
  model="model-name"
  enableCache="true"
  cacheExpiration="2592000000">
</script>
```

### 配置选项

- `enableCache`: 布尔值，控制是否启用缓存功能，默认为 `true`
- `cacheExpiration`: 缓存过期时间（毫秒），默认为 30 天 (2592000000 毫秒)

### 缓存工作原理

1. 当AI-Script处理提示时，会先计算当前页面DOM结构的哈希值
2. 将DOM哈希与提示内容组合生成唯一的缓存键
3. 检查localStorage中是否存在对应的缓存项且未过期
4. 如果缓存命中，直接使用缓存的结果并触发 `ai-script-complete` 事件
5. 如果缓存未命中，调用API并将结果存入缓存

### 清除缓存

缓存数据存储在浏览器的localStorage中，您可以通过以下方式手动清除缓存：

```javascript
// 清除AI-Script的所有缓存
localStorage.removeItem('ai-script-cache');
```

### 调试缓存

启用调试模式可以在控制台查看缓存相关的日志信息：

```html
<script 
  src="https://cdn.jsdelivr.net/npm/ai-script@latest/dist/ai-script.umd.js" 
  appKey="your-api-key" 
  debug="true">
</script>
```

启用调试模式后，控制台将显示缓存命中、缓存存储和缓存清理等相关信息。

## 许可证

MIT