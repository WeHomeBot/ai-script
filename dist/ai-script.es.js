var u = Object.defineProperty;
var m = (r, e, t) => e in r ? u(r, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : r[e] = t;
var l = (r, e, t) => (m(r, typeof e != "symbol" ? e + "" : e, t), t);
class S {
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
    const t = e.getAttribute("appKey"), o = e.getAttribute("baseUrl"), i = e.getAttribute("model");
    t && (this.config.appKey = t), o && (this.config.baseUrl = o), i && (this.config.model = i), this.config.debug && console.log("AIScript initialized from script tag:", {
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
      let c = `${" ".repeat(s * 2)}<${i.tagName.toLowerCase()}`;
      if (i.id && (c += ` id="${i.id}"`), i.className && (c += ` class="${i.className}"`), c += ">", i.children.length === 0) {
        const n = (p = i.textContent) == null ? void 0 : p.trim();
        n && (c += ` ${n}`);
      }
      c += `
`;
      for (let n = 0; n < i.children.length; n++)
        c += o(i.children[n], s + 1);
      return c;
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
      const c = await fetch(`${this.config.baseUrl}/v1/chat/completions`, {
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
      if (!c.ok)
        throw this.dispatchAIScriptEvent("ai-script-complete", {
          prompt: t,
          success: !1,
          error: `API request failed with status ${c.status}`,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }), new Error(`API request failed with status ${c.status}`);
      const n = (d = (s = (i = (o = (await c.json()).choices) == null ? void 0 : o[0]) == null ? void 0 : i.message) == null ? void 0 : s.content) == null ? void 0 : d.trim();
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
    } catch (c) {
      return console.error("AI API call failed:", c), this.dispatchAIScriptEvent("ai-script-complete", {
        prompt: t,
        success: !1,
        error: c instanceof Error ? c.message : String(c),
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }), { error: c instanceof Error ? c.message : String(c) };
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
  /**
   * 初始化并运行AI脚本
   */
  async init() {
    if (this.initialized)
      return;
    this.initialized = !0;
    const e = this.getDOMContext(), t = this.findAIPrompts();
    if (t.length === 0) {
      this.config.debug && console.log("No AI prompts found on the page");
      return;
    }
    for (const o of t) {
      const i = await this.callAI(e, o);
      i.code ? this.executeCode(i.code) : i.error && this.config.debug && console.error("AI code generation failed:", i.error);
    }
  }
}
if (typeof window < "u") {
  const r = new S();
  window.addEventListener("DOMContentLoaded", () => {
    r.init().catch((e) => {
      console.error("AIScript initialization failed:", e);
    });
  });
}
export {
  S as AIScript
};
