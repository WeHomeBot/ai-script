/**
 * 核心功能模块
 */

/**
 * AIScript配置接口
 */
export interface AIScriptConfig {
  /**
   * API密钥
   */
  appKey: string;
  
  /**
   * API基础URL
   */
  baseUrl: string;
  
  /**
   * 使用的模型名称
   */
  model: string;
  
  /**
   * 是否启用调试模式
   */
  debug?: boolean;

  /**
   * 是否启用缓存功能
   */
  enableCache?: boolean;

  /**
   * 缓存过期时间（毫秒）
   */
  cacheExpiration?: number;

  /**
   * 是否显示处理中的浮层
   */
  showProcessingOverlay?: boolean;
  
  /**
   * 是否监听DOM变化以处理动态添加的AI提示脚本
   */
  observeDOMChanges?: boolean;
}

/**
 * AI响应接口
 */
interface AIResponse {
  code?: string;
  error?: string;
}

/**
 * 缓存项接口
 */
interface CacheItem {
  response: AIResponse;
  timestamp: number;
}

/**
 * 缓存存储接口
 */
interface CacheStorage {
  [key: string]: CacheItem;
}

/**
 * AI-Script主类
 */
export class AIScript {
  private config: AIScriptConfig;
  private initialized: boolean = false;
  private readonly CACHE_KEY = 'ai-script-cache';
  private observer: MutationObserver | null = null;

  /**
   * 从localStorage获取缓存数据
   * @returns 缓存存储对象
   */
  private getCacheFromStorage(): CacheStorage {
    try {
      const cacheData = localStorage.getItem(this.CACHE_KEY);
      return cacheData ? JSON.parse(cacheData) : {};
    } catch (error) {
      if (this.config.debug) {
        console.error('Failed to get cache from localStorage:', error);
      }
      return {};
    }
  }

  /**
   * 将缓存数据保存到localStorage
   * @param cacheData 缓存存储对象
   */
  private saveCacheToStorage(cacheData: CacheStorage): void {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
      if (this.config.debug) {
        console.log('Cache saved to localStorage');
      }
    } catch (error) {
      if (this.config.debug) {
        console.error('Failed to save cache to localStorage:', error);
      }
    }
  }

  /**
   * 从缓存中获取项
   * @param key 缓存键
   * @returns 缓存项或undefined
   */
  private getCacheItem(key: string): CacheItem | undefined {
    const cacheData = this.getCacheFromStorage();
    return cacheData[key];
  }

  /**
   * 设置缓存项
   * @param key 缓存键
   * @param item 缓存项
   */
  private setCacheItem(key: string, item: CacheItem): void {
    const cacheData = this.getCacheFromStorage();
    cacheData[key] = item;
    this.saveCacheToStorage(cacheData);
  }

  /**
   * 清理过期的缓存项
   */
  private cleanExpiredCache(): void {
    const cacheData = this.getCacheFromStorage();
    const now = Date.now();
    let hasChanges = false;

    for (const key in cacheData) {
      if (now - cacheData[key].timestamp > (this.config.cacheExpiration || 24 * 60 * 60 * 1000)) {
        delete cacheData[key];
        hasChanges = true;
      }
    }

    if (hasChanges) {
      this.saveCacheToStorage(cacheData);
      if (this.config.debug) {
        console.log('Expired cache items cleaned');
      }
    }
  }

  /**
   * 创建一个新的AIScript实例
   * @param config 配置选项
   */
  constructor(config: Partial<AIScriptConfig> = {}) {
    // 默认配置
    this.config = {
      appKey: '',
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-chat',
      debug: false,
      enableCache: true,
      cacheExpiration: 30 * 24 * 60 * 60 * 1000, // 默认缓存30天
      showProcessingOverlay: true,
      observeDOMChanges: true, // 默认启用DOM变化监听
      ...config
    };
    // 从script标签初始化配置
    this.initFromScriptTag();
    
    // 清理过期缓存
    if (this.config.enableCache) {
      this.cleanExpiredCache();
    }
  }

  /**
   * 从script标签初始化配置
   */
  private initFromScriptTag(): void {
    const scriptTag = document.currentScript as HTMLScriptElement;
    if (!scriptTag) return;
    
    // 从script标签读取配置
    const appKey = scriptTag.getAttribute('appKey');
    const baseUrl = scriptTag.getAttribute('baseUrl');
    const model = scriptTag.getAttribute('model');
    const showProcessingOverlay = scriptTag.getAttribute('showProcessingOverlay');
    const observeDOMChanges = scriptTag.getAttribute('observeDOMChanges');
    
    if (appKey) this.config.appKey = appKey;
    if (baseUrl) this.config.baseUrl = baseUrl;
    if (model) this.config.model = model;
    if (showProcessingOverlay) this.config.showProcessingOverlay = showProcessingOverlay === 'true';
    if (observeDOMChanges) this.config.observeDOMChanges = observeDOMChanges === 'true';
    
    if (this.config.debug) {
      console.log('AIScript initialized from script tag:', {
        appKey: this.config.appKey,
        baseUrl: this.config.baseUrl,
        model: this.config.model
      });
    }
  }

  /**
   * 获取当前页面的DOM结构作为上下文
   * @param elementId 可选的DOM元素ID，如果提供，则只获取该元素及其子节点
   */
  private getDOMContext(elementId?: string): string {
    // 简化的DOM结构描述
    let rootElement: Element;
    let contextPrefix: string;
    
    if (elementId) {
      // 如果提供了elementId，则获取指定元素
      const targetElement = document.getElementById(elementId);
      if (targetElement) {
        rootElement = targetElement;
        contextPrefix = `DOM structure for element with id="${elementId}":\n`;
      } else {
        // 如果找不到指定元素，则使用body并记录警告
        rootElement = document.body;
        contextPrefix = `Warning: Element with id="${elementId}" not found. Using full page structure:\n`;
        if (this.config.debug) {
          console.warn(`Element with id="${elementId}" not found, using body instead.`);
        }
      }
    } else {
      // 如果没有提供elementId，则使用body
      rootElement = document.body;
      contextPrefix = 'Current page structure:\n';
    }
    
    let context = contextPrefix;
    
    // 递归函数来描述DOM结构
    const describeElement = (element: Element, depth: number = 0): string => {
      // 过滤掉script标签，不将其添加到DOM结构描述中
      // if (element.tagName.toLowerCase() === 'script') {
      //   return '';
      // }
      
      const indent = ' '.repeat(depth * 2);
      let description = `${indent}<${element.tagName.toLowerCase()}`;
      
      // 添加重要属性
      if (element.id) description += ` id="${element.id}"`;
      if (element.className) description += ` class="${element.className}"`;
      
      description += '>';
      
      // 如果是简单元素，添加文本内容
      if (element.children.length === 0) {
        const text = element.textContent?.trim();
        if (text) description += ` ${text}`;
      }
      
      description += '\n';
      
      // 递归处理子元素
      for (let i = 0; i < element.children.length; i++) {
        description += describeElement(element.children[i], depth + 1);
      }
      
      return description;
    };
    
    context += describeElement(rootElement);
    return context;
  }
  
  /**
   * 对DOM上下文进行哈希处理，生成32位字符串作为缓存键
   * @param context DOM上下文字符串
   * @returns 32位哈希字符串
   */
  private hashContext(context: string): string {
    // 简化版的哈希算法，生成32位字符串
    let hash = 0;
    
    // 如果字符串为空，返回0的哈希值
    if (context.length === 0) return '00000000000000000000000000000000';
    
    // 遍历字符串中的每个字符
    for (let i = 0; i < context.length; i++) {
      const char = context.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    
    // 转换为16进制字符串并确保长度为32位
    let hashStr = (hash >>> 0).toString(16);
    while (hashStr.length < 8) {
      hashStr = '0' + hashStr;
    }
    
    // 重复哈希字符串以达到32位长度
    hashStr = hashStr.repeat(4);
    return hashStr.slice(0, 32);
  }

  /**
   * 查找并提取AI提示元素
   * @returns AI提示脚本元素列表
   */
  private findAIPrompts(): NodeListOf<Element> {
    return document.querySelectorAll('script[type="ai/prompt"]');
  }

  /**
   * 创建并派发AI脚本处理事件
   * @param eventName 事件名称
   * @param detail 事件详情
   */
  private dispatchAIScriptEvent(eventName: string, detail: Record<string, any>): void {
    const event = new CustomEvent(eventName, {
      bubbles: true,
      cancelable: true,
      detail
    });
    
    document.dispatchEvent(event);
    
    if (this.config.debug) {
      console.log(`AIScript event dispatched: ${eventName}`, detail);
    }
  }

  /**
   * 调用AI API获取代码
   */
  private async callAI(context: string, prompt: string, skipCache: boolean = false): Promise<AIResponse> {
    try {
      if (!this.config.appKey) {
        throw new Error('API Key is required');
      }
      
      // 派发处理开始事件
      this.dispatchAIScriptEvent('ai-script-start', {
        prompt,
        timestamp: new Date().toISOString()
      });
      
      // 如果启用了缓存且不跳过缓存，检查是否有有效的缓存结果
      if (this.config.enableCache && !skipCache) {
        // 生成缓存键（上下文哈希 + 提示）
        const contextHash = this.hashContext(context);
        const cacheKey = `${contextHash}_${prompt}`;
        
        // 检查缓存
        const cachedItem = this.getCacheItem(cacheKey);
        const now = Date.now();
        
        // 如果缓存存在且未过期，触发完成事件并返回缓存结果
        if (cachedItem && (now - cachedItem.timestamp < (this.config.cacheExpiration || 24 * 60 * 60 * 1000))) {
          if (this.config.debug) {
            console.log('Using cached AI response for prompt:', prompt);
          }
          
          // 派发处理完成事件（缓存命中）
          this.dispatchAIScriptEvent('ai-script-complete', {
            prompt,
            success: true,
            hasCode: !!cachedItem.response.code,
            fromCache: true,
            timestamp: new Date().toISOString()
          });
          
          return cachedItem.response;
        }
      }
      
      const response = await fetch(`${this.config.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.appKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: 'You are a JavaScript expert. Generate only executable JavaScript code without explanations. The code should implement the functionality described in the user prompt, considering the current page structure. Follow coding conventions; function names and object property names must use valid English naming.'
            },
            {
              role: 'user',
              content: `${context}\n\nPrompt: ${prompt}\n\nGenerate JavaScript code to implement this functionality. Return ONLY the code without any explanations or markdown. DO wrap the code to an IIFE block and **DO NOT** wrap the code inside a DOMContentLoaded event listener!`
            }
          ]
        })
      });
      
      if (!response.ok) {
        // 派发处理完成事件（失败）
        this.dispatchAIScriptEvent('ai-script-complete', {
          prompt,
          success: false,
          error: `API request failed with status ${response.status}`,
          timestamp: new Date().toISOString()
        });
        
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      const code = data.choices?.[0]?.message?.content?.trim();
      
      // 派发处理完成事件（成功）
      this.dispatchAIScriptEvent('ai-script-complete', {
        prompt,
        success: true,
        hasCode: !!code,
        timestamp: new Date().toISOString()
      });
      
      // 如果启用了缓存且不跳过缓存，将结果存入缓存
      if (this.config.enableCache && !skipCache) {
        const contextHash = this.hashContext(context);
        const cacheKey = `${contextHash}_${prompt}`;
        this.setCacheItem(cacheKey, {
          response: { code },
          timestamp: Date.now()
        });
        
        if (this.config.debug) {
          console.log('Cached AI response with key:', cacheKey);
        }
      }
      
      return { code };
    } catch (error) {
      console.error('AI API call failed:', error);
      
      // 确保在发生异常时也派发完成事件
      this.dispatchAIScriptEvent('ai-script-complete', {
        prompt,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
      
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * 清除特定提示的缓存
   * @param context 上下文
   * @param prompt 提示
   */
  private clearPromptCache(context: string, prompt: string): void {
    if (!this.config.enableCache) return;
    
    const contextHash = this.hashContext(context);
    const cacheKey = `${contextHash}_${prompt}`;
    
    const cacheData = this.getCacheFromStorage();
    if (cacheData[cacheKey]) {
      delete cacheData[cacheKey];
      this.saveCacheToStorage(cacheData);
      
      if (this.config.debug) {
        console.log('Cleared cache for prompt:', prompt);
      }
    }
  }

  /**
   * 执行生成的代码
   * 如果代码包含Markdown代码块标记(```javascript和```)，会自动移除这些标记
   * 如果执行出错，会清除相关缓存
   */
  private executeCode(code: string, context?: string, prompt?: string): void {
    try {
      // 检查并移除Markdown代码块标记
      let cleanCode = code;
      
      // 移除开头的```javascript或```js标记
      cleanCode = cleanCode.replace(/^```(javascript|js)\s*\n/i, '');
      
      // 移除结尾的```标记
      cleanCode = cleanCode.replace(/\n```\s*$/i, '');
      
      // 创建一个新的script元素并执行代码
      const scriptElement = document.createElement('script');
      scriptElement.textContent = cleanCode;
      document.head.appendChild(scriptElement);
      
      if (this.config.debug) {
        console.log('Executed AI-generated code:', cleanCode);
      }
    } catch (error) {
      console.error('Failed to execute AI-generated code:', error);
      
      // 如果执行出错且提供了上下文和提示，清除相关缓存
      if (context && prompt) {
        this.clearPromptCache(context, prompt);
        if (this.config.debug) {
          console.log('Cleared cache due to code execution error');
        }
      }
    }
  }

  private showProcessingOverlay(): HTMLElement | null | undefined  {
    let el;
    if (this.config.showProcessingOverlay) {
      const body = document.body;
      if (!body) return;
      // 初始化AI脚本
      el = document.createElement('div');
      el.id="ai-script-overlay-container";
      el.innerHTML = `
<style>
  /* AI处理浮层样式 */
  #ai-script-overlay-container .ai-processing-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s, visibility 0.3s;
  }
  #ai-script-overlay-container .ai-processing-overlay.active {
    opacity: 1;
    visibility: visible;
  }
  #ai-script-overlay-container .ai-processing-content {
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    text-align: center;
    max-width: 80%;
  }
  #ai-script-overlay-container .ai-processing-spinner {
    display: inline-block;
    width: 30px;
    height: 30px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #4CAF50;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 10px;
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>
<div class="ai-processing-overlay active">
  <div class="ai-processing-content">
    <div class="ai-processing-spinner"></div>
    <p>AI is processing, please wait...</p>
  </div>
</div>
      `
      body.appendChild(el);
    }
    return el;
  }

  /**
   * 初始化并运行AI脚本
   */
  /**
   * 处理单个AI提示脚本
   * @param promptElement 提示脚本元素
   * @param skipCache 是否跳过缓存
   */
  private async processPromptElement(promptElement: Element, skipCache: boolean = false): Promise<void> {
    const content = promptElement.textContent?.trim();
    if (!content) return;
    
    // 显示处理中的浮层
    const el = this.showProcessingOverlay();
    
    // 获取for属性，如果存在，则只获取指定DOM元素的上下文
    const forElementId = promptElement instanceof HTMLElement ? promptElement.getAttribute('for') : null;
    
    // 获取DOM上下文，如果有for属性，则传递给getDOMContext
    const context = this.getDOMContext(forElementId || undefined);
    
    // 调用AI获取代码
    const response = await this.callAI(context, content, skipCache);
    
    if (response.code) {
      // 执行生成的代码，传递context和prompt以便在出错时清除缓存
      this.executeCode(response.code, context, content);
    } else if (response.error && this.config.debug) {
      console.error('AI code generation failed:', response.error);
    }
    
    // 移除处理中的浮层
    el && el.remove();
  }
  
  /**
   * 设置DOM变化观察器
   */
  private setupDOMObserver(): void {
    if (!this.config.observeDOMChanges || !window.MutationObserver) return;
    
    // 创建一个观察器实例
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        // 检查是否有新节点添加
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // 遍历添加的节点
          mutation.addedNodes.forEach((node) => {
            // 检查是否是元素节点
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              
              // 检查是否是AI提示脚本
              if (element.nodeName === 'SCRIPT' && element.getAttribute('type') === 'ai/prompt') {
                // 处理新添加的AI提示脚本，跳过缓存
                this.processPromptElement(element, true);
              } else {
                // 检查子元素中是否有AI提示脚本
                const promptElements = element.querySelectorAll('script[type="ai/prompt"]');
                promptElements.forEach((promptElement) => {
                  // 处理新添加的AI提示脚本，跳过缓存
                  this.processPromptElement(promptElement, true);
                });
              }
            }
          });
        }
      }
    });
    
    // 配置观察选项
    const config = { childList: true, subtree: true };
    
    // 开始观察文档
    this.observer.observe(document, config);
    
    if (this.config.debug) {
      console.log('DOM observer setup complete');
    }
  }
  
  /**
   * 停止DOM变化观察
   */
  private stopDOMObserver(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
      
      if (this.config.debug) {
        console.log('DOM observer stopped');
      }
    }
  }
  
  async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    const el = this.showProcessingOverlay();
    
    // 查找AI提示
    const promptElements = this.findAIPrompts();
    
    if (promptElements.length === 0) {
      if (this.config.debug) {
        console.log('No AI prompts found on the page');
      }
    } else {
      // 处理每个提示元素
      for (const promptElement of promptElements) {
        const content = promptElement.textContent?.trim();
        if (!content) continue;
        
        // 获取for属性，如果存在，则只获取指定DOM元素的上下文
        const forElementId = promptElement instanceof HTMLElement ? promptElement.getAttribute('for') : null;
        
        // 获取DOM上下文，如果有for属性，则传递给getDOMContext
        const context = this.getDOMContext(forElementId || undefined);
        
        // 调用AI获取代码
        const response = await this.callAI(context, content);
        
        if (response.code) {
          // 执行生成的代码，传递context和prompt以便在出错时清除缓存
          this.executeCode(response.code, context, content);
        } else if (response.error && this.config.debug) {
          console.error('AI code generation failed:', response.error);
        }
      }
    }
    
    // 设置DOM变化观察器
    this.setupDOMObserver();

    el && el.remove();
  }
}

// 当脚本加载完成后自动初始化
if (typeof window !== 'undefined') {
  const aiScript = new AIScript();
  window.addEventListener('DOMContentLoaded', async () => {
    try {
      await aiScript.init();
    } catch (error) {
      console.error('AIScript initialization failed:', error);
    }
  });
  
  // 暴露AIScript实例到全局，方便调试和手动控制
  (window as any).AIScriptInstance = aiScript;
}