# AI-Script

提供可以在浏览器中运行的 AI 脚本。

## 使用方法

### 在浏览器中直接使用

```html
  <script src="https://cdn.jsdelivr.net/npm/@bearbobo/ai-script@latest/dist/ai-script.umd.js" appKey="sk-262**********62b" baseUrl="https://api.deepseek.com" model="deepseek-chat"></script>
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
  <script src="https://cdn.jsdelivr.net/npm/@bearbobo/ai-script@latest/dist/ai-script.umd.js" appKey="sk-262**********62b" baseUrl="https://api.deepseek.com" model="deepseek-chat"></script>
</head>
<body>
  <h1>AI-Script Demo</h1>
  
  <div class="demo-container">
    <h2>Try it out</h2>
    <p>Press button to add count: <span>0</span> clicks</p>
    
    <button>Click me</button>
  </div>

  <script type="ai/prompt">
    每次点击按钮，点击次数加1
  </script>
</body>
</html>
```

## 开发

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

这将启动开发服务器，您可以在浏览器中访问 `http://localhost:8080` 查看示例页面。

### 构建库

```bash
pnpm build
```

这将在 `dist` 目录下生成以下文件：
- `ai-script.es.js` - ES模块格式
- `ai-script.umd.js` - UMD格式
- TypeScript类型定义文件

### 运行测试

```bash
pnpm test
```

## 使用 `for` 属性定位DOM元素

AI-Script支持使用`for`属性定位特定DOM元素。这允许AI只关注特定元素及其子节点，而不是处理整个页面结构。

### 使用方法

```html
<script type="ai/prompt" for="element-id">
  仅为这个特定元素实现功能
</script>
```

您也可以在动态创建script元素时设置`for`属性：

```javascript
const scriptElement = document.createElement('script');
scriptElement.type = 'ai/prompt';
scriptElement.textContent = promptText;
scriptElement.setAttribute('for', 'target-element-id');
document.body.appendChild(scriptElement);
```

### 优势

- **提升性能**：AI只处理DOM的相关部分
- **更好的上下文**：为AI提供更集中的上下文以理解任务
- **模块化设计**：允许不同的AI脚本针对页面的不同部分

## 缓存机制

AI-Script 内置了缓存功能，可以显著提高性能并减少API调用次数。当相同的提示在相同的页面上下文中被多次使用时，缓存机制会直接返回之前的结果，而不是重新调用API。

### 缓存配置

您可以通过以下方式配置缓存功能：

```html
<script 
  src="https://cdn.jsdelivr.net/npm/@bearbobo/ai-script@latest/dist/ai-script.umd.js" 
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
  src="https://cdn.jsdelivr.net/npm/@bearbobo/ai-script@latest/dist/ai-script.umd.js" 
  appKey="your-api-key" 
  debug="true">
</script>
```

启用调试模式后，控制台将显示缓存命中、缓存存储和缓存清理等相关信息。

## 许可证

MIT