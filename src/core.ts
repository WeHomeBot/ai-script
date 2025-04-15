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
    // const cacheData = this.getCacheFromStorage();
    const cacheData = {[key]: item};
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
    
    if (appKey) this.config.appKey = appKey;
    if (baseUrl) this.config.baseUrl = baseUrl;
    if (model) this.config.model = model;
    
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
   */
  private getDOMContext(): string {
    // 简化的DOM结构描述
    const body = document.body;
    let context = 'Current page structure:\n';
    
    // 递归函数来描述DOM结构
    const describeElement = (element: Element, depth: number = 0): string => {
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
    
    context += describeElement(body);
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
   * 查找并提取AI提示
   */
  private findAIPrompts(): string[] {
    const prompts: string[] = [];
    const promptElements = document.querySelectorAll('script[type="ai/prompt"]');
    
    promptElements.forEach(element => {
      const content = element.textContent?.trim();
      if (content) prompts.push(content);
    });
    
    return prompts;
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
  private async callAI(context: string, prompt: string): Promise<AIResponse> {
    try {
      if (!this.config.appKey) {
        throw new Error('API Key is required');
      }
      
      // 派发处理开始事件
      this.dispatchAIScriptEvent('ai-script-start', {
        prompt,
        timestamp: new Date().toISOString()
      });
      
      // 如果启用了缓存，检查是否有有效的缓存结果
      if (this.config.enableCache) {
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
              content: 'You are a JavaScript expert. Generate only executable JavaScript code without explanations. The code should implement the functionality described in the user prompt, considering the current page structure.'
            },
            {
              role: 'user',
              content: `${context}\n\nPrompt: ${prompt}\n\nGenerate JavaScript code to implement this functionality. Return ONLY the code without any explanations or markdown.`
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
      
      // 如果启用了缓存，将结果存入缓存
      if (this.config.enableCache) {
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
   * 执行生成的代码
   */
  private executeCode(code: string): void {
    try {
      // 创建一个新的script元素并执行代码
      const scriptElement = document.createElement('script');
      scriptElement.textContent = code;
      document.head.appendChild(scriptElement);
      
      if (this.config.debug) {
        console.log('Executed AI-generated code:', code);
      }
    } catch (error) {
      console.error('Failed to execute AI-generated code:', error);
    }
  }

  /**
   * 初始化并运行AI脚本
   */
  async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    
    // 获取DOM上下文
    const context = this.getDOMContext();
    
    // 查找AI提示
    const prompts = this.findAIPrompts();
    
    if (prompts.length === 0) {
      if (this.config.debug) {
        console.log('No AI prompts found on the page');
      }
      return;
    }
    
    // 处理每个提示
    for (const prompt of prompts) {
      // 调用AI获取代码
      const response = await this.callAI(context, prompt);
      
      if (response.code) {
        // 执行生成的代码
        this.executeCode(response.code);
      } else if (response.error && this.config.debug) {
        console.error('AI code generation failed:', response.error);
      }
    }
  }
}

// 当脚本加载完成后自动初始化
if (typeof window !== 'undefined') {
  const aiScript = new AIScript();
  window.addEventListener('DOMContentLoaded', () => {
    aiScript.init().catch(error => {
      console.error('AIScript initialization failed:', error);
    });
  });
}