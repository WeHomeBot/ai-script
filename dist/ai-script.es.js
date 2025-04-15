var u = Object.defineProperty;
var m = (c, e, t) => e in c ? u(c, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : c[e] = t;
var l = (c, e, t) => (m(c, typeof e != "symbol" ? e + "" : e, t), t);
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
    const i = { [e]: t };
    this.saveCacheToStorage(i);
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
    const t = e.getAttribute("appKey"), i = e.getAttribute("baseUrl"), o = e.getAttribute("model"), r = e.getAttribute("showProcessingOverlay");
    t && (this.config.appKey = t), i && (this.config.baseUrl = i), o && (this.config.model = o), r && (this.config.showProcessingOverlay = r === "true"), this.config.debug && console.log("AIScript initialized from script tag:", {
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
    const i = (o, r = 0) => {
      var p;
      let s = `${" ".repeat(r * 2)}<${o.tagName.toLowerCase()}`;
      if (o.id && (s += ` id="${o.id}"`), o.className && (s += ` class="${o.className}"`), s += ">", o.children.length === 0) {
        const n = (p = o.textContent) == null ? void 0 : p.trim();
        n && (s += ` ${n}`);
      }
      s += `
`;
      for (let n = 0; n < o.children.length; n++)
        s += i(o.children[n], r + 1);
      return s;
    };
    return t += i(e), t;
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
      const r = e.charCodeAt(o);
      t = (t << 5) - t + r, t = t & t;
    }
    let i = (t >>> 0).toString(16);
    for (; i.length < 8; )
      i = "0" + i;
    return i = i.repeat(4), i.slice(0, 32);
  }
  /**
   * 查找并提取AI提示
   */
  findAIPrompts() {
    const e = [];
    return document.querySelectorAll('script[type="ai/prompt"]').forEach((i) => {
      var r;
      const o = (r = i.textContent) == null ? void 0 : r.trim();
      o && e.push(o);
    }), e;
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
  async callAI(e, t) {
    var i, o, r, d;
    try {
      if (!this.config.appKey)
        throw new Error("API Key is required");
      if (this.dispatchAIScriptEvent("ai-script-start", {
        prompt: t,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }), this.config.enableCache) {
        const a = `${this.hashContext(e)}_${t}`, h = this.getCacheItem(a), f = Date.now();
        if (h && f - h.timestamp < (this.config.cacheExpiration || 24 * 60 * 60 * 1e3))
          return this.config.debug && console.log("Using cached AI response for prompt:", t), this.dispatchAIScriptEvent("ai-script-complete", {
            prompt: t,
            success: !0,
            hasCode: !!h.response.code,
            fromCache: !0,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          }), h.response;
      }
      const s = await fetch(`${this.config.baseUrl}/v1/chat/completions`, {
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
      if (!s.ok)
        throw this.dispatchAIScriptEvent("ai-script-complete", {
          prompt: t,
          success: !1,
          error: `API request failed with status ${s.status}`,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }), new Error(`API request failed with status ${s.status}`);
      const n = (d = (r = (o = (i = (await s.json()).choices) == null ? void 0 : i[0]) == null ? void 0 : o.message) == null ? void 0 : r.content) == null ? void 0 : d.trim();
      if (this.dispatchAIScriptEvent("ai-script-complete", {
        prompt: t,
        success: !0,
        hasCode: !!n,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }), this.config.enableCache) {
        const a = `${this.hashContext(e)}_${t}`;
        this.setCacheItem(a, {
          response: { code: n },
          timestamp: Date.now()
        }), this.config.debug && console.log("Cached AI response with key:", a);
      }
      return { code: n };
    } catch (s) {
      return console.error("AI API call failed:", s), this.dispatchAIScriptEvent("ai-script-complete", {
        prompt: t,
        success: !1,
        error: s instanceof Error ? s.message : String(s),
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }), { error: s instanceof Error ? s.message : String(s) };
    }
  }
  /**
   * 执行生成的代码
   */
  executeCode(e) {
    try {
      const t = document.createElement("script");
      t.textContent = e, document.head.appendChild(t), this.config.debug && console.log("Executed AI-generated code:", e);
    } catch (t) {
      console.error("Failed to execute AI-generated code:", t);
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
    const e = this.showProcessingOverlay(), t = this.getDOMContext(), i = this.findAIPrompts();
    if (i.length === 0) {
      this.config.debug && console.log("No AI prompts found on the page");
      return;
    }
    for (const o of i) {
      const r = await this.callAI(t, o);
      r.code ? this.executeCode(r.code) : r.error && this.config.debug && console.error("AI code generation failed:", r.error);
    }
    e && e.remove();
  }
}
if (typeof window < "u") {
  const c = new y();
  window.addEventListener("DOMContentLoaded", async () => {
    try {
      await c.init();
    } catch (e) {
      console.error("AIScript initialization failed:", e);
    }
  });
}
export {
  y as AIScript
};
