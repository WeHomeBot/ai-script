var u = Object.defineProperty;
var m = (a, e, t) => e in a ? u(a, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : a[e] = t;
var l = (a, e, t) => (m(a, typeof e != "symbol" ? e + "" : e, t), t);
class y {
  /**
   * 创建一个新的AIScript实例
   * @param config 配置选项
   */
  constructor(e = {}) {
    l(this, "config");
    l(this, "initialized", !1);
    l(this, "CACHE_KEY", "ai-script-cache");
    this.config = {
      appKey: "",
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-chat",
      debug: !1,
      enableCache: !0,
      cacheExpiration: 30 * 24 * 60 * 60 * 1e3,
      // 默认缓存30天
      showProcessingOverlay: !0,
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
    const o = { [e]: t };
    this.saveCacheToStorage(o);
  }
  /**
   * 清理过期的缓存项
   */
  cleanExpiredCache() {
    const e = this.getCacheFromStorage(), t = Date.now();
    let o = !1;
    for (const i in e)
      t - e[i].timestamp > (this.config.cacheExpiration || 24 * 60 * 60 * 1e3) && (delete e[i], o = !0);
    o && (this.saveCacheToStorage(e), this.config.debug && console.log("Expired cache items cleaned"));
  }
  /**
   * 从script标签初始化配置
   */
  initFromScriptTag() {
    const e = document.currentScript;
    if (!e)
      return;
    const t = e.getAttribute("appKey"), o = e.getAttribute("baseUrl"), i = e.getAttribute("model"), s = e.getAttribute("showProcessingOverlay");
    t && (this.config.appKey = t), o && (this.config.baseUrl = o), i && (this.config.model = i), s && (this.config.showProcessingOverlay = s === "true"), this.config.debug && console.log("AIScript initialized from script tag:", {
      appKey: this.config.appKey,
      baseUrl: this.config.baseUrl,
      model: this.config.model
    });
  }
  /**
   * 获取当前页面的DOM结构作为上下文
   */
  getDOMContext() {
    const e = document.body;
    let t = `Current page structure:
`;
    const o = (i, s = 0) => {
      var p;
      let r = `${" ".repeat(s * 2)}<${i.tagName.toLowerCase()}`;
      if (i.id && (r += ` id="${i.id}"`), i.className && (r += ` class="${i.className}"`), r += ">", i.children.length === 0) {
        const c = (p = i.textContent) == null ? void 0 : p.trim();
        c && (r += ` ${c}`);
      }
      r += `
`;
      for (let c = 0; c < i.children.length; c++)
        r += o(i.children[c], s + 1);
      return r;
    };
    return t += o(e), t;
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
    for (let i = 0; i < e.length; i++) {
      const s = e.charCodeAt(i);
      t = (t << 5) - t + s, t = t & t;
    }
    let o = (t >>> 0).toString(16);
    for (; o.length < 8; )
      o = "0" + o;
    return o = o.repeat(4), o.slice(0, 32);
  }
  /**
   * 查找并提取AI提示
   */
  findAIPrompts() {
    const e = [];
    return document.querySelectorAll('script[type="ai/prompt"]').forEach((o) => {
      var s;
      const i = (s = o.textContent) == null ? void 0 : s.trim();
      i && e.push(i);
    }), e;
  }
  /**
   * 创建并派发AI脚本处理事件
   * @param eventName 事件名称
   * @param detail 事件详情
   */
  dispatchAIScriptEvent(e, t) {
    const o = new CustomEvent(e, {
      bubbles: !0,
      cancelable: !0,
      detail: t
    });
    document.dispatchEvent(o), this.config.debug && console.log(`AIScript event dispatched: ${e}`, t);
  }
  /**
   * 调用AI API获取代码
   */
  async callAI(e, t) {
    var o, i, s, d;
    try {
      if (!this.config.appKey)
        throw new Error("API Key is required");
      if (this.dispatchAIScriptEvent("ai-script-start", {
        prompt: t,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }), this.config.enableCache) {
        const n = `${this.hashContext(e)}_${t}`, h = this.getCacheItem(n), f = Date.now();
        if (h && f - h.timestamp < (this.config.cacheExpiration || 24 * 60 * 60 * 1e3))
          return this.config.debug && console.log("Using cached AI response for prompt:", t), this.dispatchAIScriptEvent("ai-script-complete", {
            prompt: t,
            success: !0,
            hasCode: !!h.response.code,
            fromCache: !0,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          }), h.response;
      }
      const r = await fetch(`${this.config.baseUrl}/v1/chat/completions`, {
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
              content: "You are a JavaScript expert. Generate only executable JavaScript code without explanations. The code should implement the functionality described in the user prompt, considering the current page structure."
            },
            {
              role: "user",
              content: `${e}

Prompt: ${t}

Generate JavaScript code to implement this functionality. Return ONLY the code without any explanations or markdown.`
            }
          ]
        })
      });
      if (!r.ok)
        throw this.dispatchAIScriptEvent("ai-script-complete", {
          prompt: t,
          success: !1,
          error: `API request failed with status ${r.status}`,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }), new Error(`API request failed with status ${r.status}`);
      const c = (d = (s = (i = (o = (await r.json()).choices) == null ? void 0 : o[0]) == null ? void 0 : i.message) == null ? void 0 : s.content) == null ? void 0 : d.trim();
      if (this.dispatchAIScriptEvent("ai-script-complete", {
        prompt: t,
        success: !0,
        hasCode: !!c,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }), this.config.enableCache) {
        const n = `${this.hashContext(e)}_${t}`;
        this.setCacheItem(n, {
          response: { code: c },
          timestamp: Date.now()
        }), this.config.debug && console.log("Cached AI response with key:", n);
      }
      return { code: c };
    } catch (r) {
      return console.error("AI API call failed:", r), this.dispatchAIScriptEvent("ai-script-complete", {
        prompt: t,
        success: !1,
        error: r instanceof Error ? r.message : String(r),
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }), { error: r instanceof Error ? r.message : String(r) };
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
    const i = `${this.hashContext(e)}_${t}`, s = this.getCacheFromStorage();
    s[i] && (delete s[i], this.saveCacheToStorage(s), this.config.debug && console.log("Cleared cache for prompt:", t));
  }
  /**
   * 执行生成的代码
   * 如果代码包含Markdown代码块标记(```javascript和```)，会自动移除这些标记
   * 如果执行出错，会清除相关缓存
   */
  executeCode(e, t, o) {
    try {
      let i = e;
      i = i.replace(/^```(javascript|js)\s*\n/i, ""), i = i.replace(/\n```\s*$/i, "");
      const s = document.createElement("script");
      s.textContent = i, document.head.appendChild(s), this.config.debug && console.log("Executed AI-generated code:", i);
    } catch (i) {
      console.error("Failed to execute AI-generated code:", i), t && o && (this.clearPromptCache(t, o), this.config.debug && console.log("Cleared cache due to code execution error"));
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
  async init() {
    if (this.initialized)
      return;
    this.initialized = !0;
    const e = this.showProcessingOverlay(), t = this.getDOMContext(), o = this.findAIPrompts();
    if (o.length === 0) {
      this.config.debug && console.log("No AI prompts found on the page");
      return;
    }
    for (const i of o) {
      const s = await this.callAI(t, i);
      s.code ? this.executeCode(s.code, t, i) : s.error && this.config.debug && console.error("AI code generation failed:", s.error);
    }
    e && e.remove();
  }
}
if (typeof window < "u") {
  const a = new y();
  window.addEventListener("DOMContentLoaded", async () => {
    try {
      await a.init();
    } catch (e) {
      console.error("AIScript initialization failed:", e);
    }
  });
}
export {
  y as AIScript
};
