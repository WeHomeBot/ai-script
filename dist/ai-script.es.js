var m = Object.defineProperty;
var b = (a, e, t) => e in a ? m(a, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : a[e] = t;
var g = (a, e, t) => (b(a, typeof e != "symbol" ? e + "" : e, t), t);
class v {
  /**
   * 创建一个新的AIScript实例
   * @param config 配置选项
   */
  constructor(e = {}) {
    g(this, "config");
    g(this, "initialized", !1);
    g(this, "CACHE_KEY", "ai-script-cache");
    g(this, "observer", null);
    this.config = {
      appKey: "",
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-chat",
      debug: !1,
      enableCache: !0,
      cacheExpiration: 30 * 24 * 60 * 60 * 1e3,
      // 默认缓存30天
      showProcessingOverlay: !0,
      observeDOMChanges: !0,
      // 默认启用DOM变化监听
      ...e
    }, this.initFromScriptTag(), this.config.enableCache && this.cleanExpiredCache();
  }
  /**
   * 从localStorage获取缓存数据
   * @returns 缓存存储对象
   */
  getCacheFromStorage() {
    try {
      const e = localStorage.getItem(this.CACHE_KEY);
      return e ? JSON.parse(e) : {};
    } catch (e) {
      return this.config.debug && console.error("Failed to get cache from localStorage:", e), {};
    }
  }
  /**
   * 将缓存数据保存到localStorage
   * @param cacheData 缓存存储对象
   */
  saveCacheToStorage(e) {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(e)), this.config.debug && console.log("Cache saved to localStorage");
    } catch (t) {
      this.config.debug && console.error("Failed to save cache to localStorage:", t);
    }
  }
  /**
   * 从缓存中获取项
   * @param key 缓存键
   * @returns 缓存项或undefined
   */
  getCacheItem(e) {
    return this.getCacheFromStorage()[e];
  }
  /**
   * 设置缓存项
   * @param key 缓存键
   * @param item 缓存项
   */
  setCacheItem(e, t) {
    const i = this.getCacheFromStorage();
    i[e] = t, this.saveCacheToStorage(i);
  }
  /**
   * 清理过期的缓存项
   */
  cleanExpiredCache() {
    const e = this.getCacheFromStorage(), t = Date.now();
    let i = !1;
    for (const o in e)
      t - e[o].timestamp > (this.config.cacheExpiration || 24 * 60 * 60 * 1e3) && (delete e[o], i = !0);
    i && (this.saveCacheToStorage(e), this.config.debug && console.log("Expired cache items cleaned"));
  }
  /**
   * 从script标签初始化配置
   */
  initFromScriptTag() {
    const e = document.currentScript;
    if (!e)
      return;
    const t = e.getAttribute("appKey"), i = e.getAttribute("baseUrl"), o = e.getAttribute("model"), s = e.getAttribute("showProcessingOverlay"), r = e.getAttribute("observeDOMChanges");
    t && (this.config.appKey = t), i && (this.config.baseUrl = i), o && (this.config.model = o), s && (this.config.showProcessingOverlay = s === "true"), r && (this.config.observeDOMChanges = r === "true"), this.config.debug && console.log("AIScript initialized from script tag:", {
      appKey: this.config.appKey,
      baseUrl: this.config.baseUrl,
      model: this.config.model
    });
  }
  /**
   * 获取当前页面的DOM结构作为上下文
   * @param elementId 可选的DOM元素ID，如果提供，则只获取该元素及其子节点
   */
  getDOMContext(e) {
    let t, i;
    if (e) {
      const r = document.getElementById(e);
      r ? (t = r, i = `DOM structure for element with id="${e}":
`) : (t = document.body, i = `Warning: Element with id="${e}" not found. Using full page structure:
`, this.config.debug && console.warn(`Element with id="${e}" not found, using body instead.`));
    } else
      t = document.body, i = `Current page structure:
`;
    let o = i;
    const s = (r, c = 0) => {
      var d;
      let l = `${" ".repeat(c * 2)}<${r.tagName.toLowerCase()}`;
      if (r.id && (l += ` id="${r.id}"`), r.className && (l += ` class="${r.className}"`), l += ">", r.children.length === 0) {
        const h = (d = r.textContent) == null ? void 0 : d.trim();
        h && (l += ` ${h}`);
      }
      l += `
`;
      for (let h = 0; h < r.children.length; h++)
        l += s(r.children[h], c + 1);
      return l;
    };
    return o += s(t), o;
  }
  /**
   * 对DOM上下文进行哈希处理，生成32位字符串作为缓存键
   * @param context DOM上下文字符串
   * @returns 32位哈希字符串
   */
  hashContext(e) {
    let t = 0;
    if (e.length === 0)
      return "00000000000000000000000000000000";
    for (let o = 0; o < e.length; o++) {
      const s = e.charCodeAt(o);
      t = (t << 5) - t + s, t = t & t;
    }
    let i = (t >>> 0).toString(16);
    for (; i.length < 8; )
      i = "0" + i;
    return i = i.repeat(4), i.slice(0, 32);
  }
  /**
   * 查找并提取AI提示元素
   * @returns AI提示脚本元素列表
   */
  findAIPrompts() {
    return document.querySelectorAll('script[type="ai/prompt"]');
  }
  /**
   * 创建并派发AI脚本处理事件
   * @param eventName 事件名称
   * @param detail 事件详情
   */
  dispatchAIScriptEvent(e, t) {
    const i = new CustomEvent(e, {
      bubbles: !0,
      cancelable: !0,
      detail: t
    });
    document.dispatchEvent(i), this.config.debug && console.log(`AIScript event dispatched: ${e}`, t);
  }
  /**
   * 调用AI API获取代码
   */
  async callAI(e, t, i = !1) {
    var o, s, r, c;
    try {
      if (!this.config.appKey)
        throw new Error("API Key is required");
      if (this.dispatchAIScriptEvent("ai-script-start", {
        prompt: t,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }), this.config.enableCache && !i) {
        const p = `${this.hashContext(e)}_${t}`, f = this.getCacheItem(p), u = Date.now();
        if (f && u - f.timestamp < (this.config.cacheExpiration || 24 * 60 * 60 * 1e3))
          return this.config.debug && console.log("Using cached AI response for prompt:", t), this.dispatchAIScriptEvent("ai-script-complete", {
            prompt: t,
            success: !0,
            hasCode: !!f.response.code,
            fromCache: !0,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          }), f.response;
      }
      const n = await fetch(`${this.config.baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.appKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: "system",
              content: "You are a JavaScript expert. Generate only executable JavaScript code without explanations. The code should implement the functionality described in the user prompt, considering the current page structure. Follow coding conventions; function names and object property names must use valid English naming."
            },
            {
              role: "user",
              content: `${e}

Prompt: ${t}

Generate JavaScript code to implement this functionality. Return ONLY the code without any explanations or markdown. DO wrap the code to an IIFE block and **DO NOT** wrap the code inside a DOMContentLoaded event listener!`
            }
          ]
        })
      });
      if (!n.ok)
        throw this.dispatchAIScriptEvent("ai-script-complete", {
          prompt: t,
          success: !1,
          error: `API request failed with status ${n.status}`,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }), new Error(`API request failed with status ${n.status}`);
      const d = (c = (r = (s = (o = (await n.json()).choices) == null ? void 0 : o[0]) == null ? void 0 : s.message) == null ? void 0 : r.content) == null ? void 0 : c.trim();
      if (this.dispatchAIScriptEvent("ai-script-complete", {
        prompt: t,
        success: !0,
        hasCode: !!d,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }), this.config.enableCache && !i) {
        const p = `${this.hashContext(e)}_${t}`;
        this.setCacheItem(p, {
          response: { code: d },
          timestamp: Date.now()
        }), this.config.debug && console.log("Cached AI response with key:", p);
      }
      return { code: d };
    } catch (n) {
      return console.error("AI API call failed:", n), this.dispatchAIScriptEvent("ai-script-complete", {
        prompt: t,
        success: !1,
        error: n instanceof Error ? n.message : String(n),
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }), { error: n instanceof Error ? n.message : String(n) };
    }
  }
  /**
   * 清除特定提示的缓存
   * @param context 上下文
   * @param prompt 提示
   */
  clearPromptCache(e, t) {
    if (!this.config.enableCache)
      return;
    const o = `${this.hashContext(e)}_${t}`, s = this.getCacheFromStorage();
    s[o] && (delete s[o], this.saveCacheToStorage(s), this.config.debug && console.log("Cleared cache for prompt:", t));
  }
  /**
   * 执行生成的代码
   * 如果代码包含Markdown代码块标记(```javascript和```)，会自动移除这些标记
   * 如果执行出错，会清除相关缓存
   */
  executeCode(e, t, i) {
    try {
      let o = e;
      o = o.replace(/^```(javascript|js)\s*\n/i, ""), o = o.replace(/\n```\s*$/i, "");
      const s = document.createElement("script");
      s.textContent = o, document.head.appendChild(s), this.config.debug && console.log("Executed AI-generated code:", o);
    } catch (o) {
      console.error("Failed to execute AI-generated code:", o), t && i && (this.clearPromptCache(t, i), this.config.debug && console.log("Cleared cache due to code execution error"));
    }
  }
  showProcessingOverlay() {
    let e;
    if (this.config.showProcessingOverlay) {
      const t = document.body;
      if (!t)
        return;
      e = document.createElement("div"), e.id = "ai-script-overlay-container", e.innerHTML = `
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
      `, t.appendChild(e);
    }
    return e;
  }
  /**
   * 初始化并运行AI脚本
   */
  /**
   * 处理单个AI提示脚本
   * @param promptElement 提示脚本元素
   * @param skipCache 是否跳过缓存
   */
  async processPromptElement(e, t = !1) {
    var n;
    const i = (n = e.textContent) == null ? void 0 : n.trim();
    if (!i)
      return;
    const o = this.showProcessingOverlay(), s = e instanceof HTMLElement ? e.getAttribute("for") : null, r = this.getDOMContext(s || void 0), c = await this.callAI(r, i, t);
    c.code ? this.executeCode(c.code, r, i) : c.error && this.config.debug && console.error("AI code generation failed:", c.error), o && o.remove();
  }
  /**
   * 设置DOM变化观察器
   */
  setupDOMObserver() {
    if (!this.config.observeDOMChanges || !window.MutationObserver)
      return;
    this.observer = new MutationObserver((t) => {
      for (const i of t)
        i.type === "childList" && i.addedNodes.length > 0 && i.addedNodes.forEach((o) => {
          if (o.nodeType === Node.ELEMENT_NODE) {
            const s = o;
            s.nodeName === "SCRIPT" && s.getAttribute("type") === "ai/prompt" ? this.processPromptElement(s, !0) : s.querySelectorAll('script[type="ai/prompt"]').forEach((c) => {
              this.processPromptElement(c, !0);
            });
          }
        });
    });
    const e = { childList: !0, subtree: !0 };
    this.observer.observe(document, e), this.config.debug && console.log("DOM observer setup complete");
  }
  /**
   * 停止DOM变化观察
   */
  stopDOMObserver() {
    this.observer && (this.observer.disconnect(), this.observer = null, this.config.debug && console.log("DOM observer stopped"));
  }
  async init() {
    var i;
    if (this.initialized)
      return;
    this.initialized = !0;
    const e = this.showProcessingOverlay(), t = this.findAIPrompts();
    if (t.length === 0)
      this.config.debug && console.log("No AI prompts found on the page");
    else
      for (const o of t) {
        const s = (i = o.textContent) == null ? void 0 : i.trim();
        if (!s)
          continue;
        const r = o instanceof HTMLElement ? o.getAttribute("for") : null, c = this.getDOMContext(r || void 0), n = await this.callAI(c, s);
        n.code ? this.executeCode(n.code, c, s) : n.error && this.config.debug && console.error("AI code generation failed:", n.error);
      }
    this.setupDOMObserver(), e && e.remove();
  }
}
if (typeof window < "u") {
  const a = new v();
  window.addEventListener("DOMContentLoaded", async () => {
    try {
      await a.init();
    } catch (e) {
      console.error("AIScript initialization failed:", e);
    }
  }), window.AIScriptInstance = a;
}
export {
  v as AIScript
};
