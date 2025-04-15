(function(l,a){typeof exports=="object"&&typeof module<"u"?a(exports):typeof define=="function"&&define.amd?define(["exports"],a):(l=typeof globalThis<"u"?globalThis:l||self,a(l.AIScript={}))})(this,function(l){"use strict";var v=Object.defineProperty;var y=(l,a,h)=>a in l?v(l,a,{enumerable:!0,configurable:!0,writable:!0,value:h}):l[a]=h;var f=(l,a,h)=>(y(l,typeof a!="symbol"?a+"":a,h),h);class a{constructor(e={}){f(this,"config");f(this,"initialized",!1);f(this,"CACHE_KEY","ai-script-cache");f(this,"observer",null);this.config={appKey:"",baseUrl:"https://api.deepseek.com",model:"deepseek-chat",debug:!1,enableCache:!0,cacheExpiration:30*24*60*60*1e3,showProcessingOverlay:!0,observeDOMChanges:!0,...e},this.initFromScriptTag(),this.config.enableCache&&this.cleanExpiredCache()}getCacheFromStorage(){try{const e=localStorage.getItem(this.CACHE_KEY);return e?JSON.parse(e):{}}catch(e){return this.config.debug&&console.error("Failed to get cache from localStorage:",e),{}}}saveCacheToStorage(e){try{localStorage.setItem(this.CACHE_KEY,JSON.stringify(e)),this.config.debug&&console.log("Cache saved to localStorage")}catch(t){this.config.debug&&console.error("Failed to save cache to localStorage:",t)}}getCacheItem(e){return this.getCacheFromStorage()[e]}setCacheItem(e,t){const i=this.getCacheFromStorage();i[e]=t,this.saveCacheToStorage(i)}cleanExpiredCache(){const e=this.getCacheFromStorage(),t=Date.now();let i=!1;for(const o in e)t-e[o].timestamp>(this.config.cacheExpiration||24*60*60*1e3)&&(delete e[o],i=!0);i&&(this.saveCacheToStorage(e),this.config.debug&&console.log("Expired cache items cleaned"))}initFromScriptTag(){const e=document.currentScript;if(!e)return;const t=e.getAttribute("appKey"),i=e.getAttribute("baseUrl"),o=e.getAttribute("model"),s=e.getAttribute("showProcessingOverlay"),n=e.getAttribute("observeDOMChanges");t&&(this.config.appKey=t),i&&(this.config.baseUrl=i),o&&(this.config.model=o),s&&(this.config.showProcessingOverlay=s==="true"),n&&(this.config.observeDOMChanges=n==="true"),this.config.debug&&console.log("AIScript initialized from script tag:",{appKey:this.config.appKey,baseUrl:this.config.baseUrl,model:this.config.model})}getDOMContext(e){let t,i;if(e){const n=document.getElementById(e);n?(t=n,i=`DOM structure for element with id="${e}":
`):(t=document.body,i=`Warning: Element with id="${e}" not found. Using full page structure:
`,this.config.debug&&console.warn(`Element with id="${e}" not found, using body instead.`))}else t=document.body,i=`Current page structure:
`;let o=i;const s=(n,c=0)=>{var p;let d=`${" ".repeat(c*2)}<${n.tagName.toLowerCase()}`;if(n.id&&(d+=` id="${n.id}"`),n.className&&(d+=` class="${n.className}"`),d+=">",n.children.length===0){const g=(p=n.textContent)==null?void 0:p.trim();g&&(d+=` ${g}`)}d+=`
`;for(let g=0;g<n.children.length;g++)d+=s(n.children[g],c+1);return d};return o+=s(t),o}hashContext(e){let t=0;if(e.length===0)return"00000000000000000000000000000000";for(let o=0;o<e.length;o++){const s=e.charCodeAt(o);t=(t<<5)-t+s,t=t&t}let i=(t>>>0).toString(16);for(;i.length<8;)i="0"+i;return i=i.repeat(4),i.slice(0,32)}findAIPrompts(){return document.querySelectorAll('script[type="ai/prompt"]')}dispatchAIScriptEvent(e,t){const i=new CustomEvent(e,{bubbles:!0,cancelable:!0,detail:t});document.dispatchEvent(i),this.config.debug&&console.log(`AIScript event dispatched: ${e}`,t)}async callAI(e,t,i=!1){var o,s,n,c;try{if(!this.config.appKey)throw new Error("API Key is required");if(this.dispatchAIScriptEvent("ai-script-start",{prompt:t,timestamp:new Date().toISOString()}),this.config.enableCache&&!i){const u=`${this.hashContext(e)}_${t}`,m=this.getCacheItem(u),b=Date.now();if(m&&b-m.timestamp<(this.config.cacheExpiration||24*60*60*1e3))return this.config.debug&&console.log("Using cached AI response for prompt:",t),this.dispatchAIScriptEvent("ai-script-complete",{prompt:t,success:!0,hasCode:!!m.response.code,fromCache:!0,timestamp:new Date().toISOString()}),m.response}const r=await fetch(`${this.config.baseUrl}/v1/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${this.config.appKey}`},body:JSON.stringify({model:this.config.model,messages:[{role:"system",content:"You are a JavaScript expert. Generate only executable JavaScript code without explanations. The code should implement the functionality described in the user prompt, considering the current page structure. Follow coding conventions; function names and object property names must use valid English naming."},{role:"user",content:`${e}

Prompt: ${t}

Generate JavaScript code to implement this functionality. Return ONLY the code without any explanations or markdown. DO wrap the code to an IIFE block and **DO NOT** wrap the code inside a DOMContentLoaded event listener!`}]})});if(!r.ok)throw this.dispatchAIScriptEvent("ai-script-complete",{prompt:t,success:!1,error:`API request failed with status ${r.status}`,timestamp:new Date().toISOString()}),new Error(`API request failed with status ${r.status}`);const p=(c=(n=(s=(o=(await r.json()).choices)==null?void 0:o[0])==null?void 0:s.message)==null?void 0:n.content)==null?void 0:c.trim();if(this.dispatchAIScriptEvent("ai-script-complete",{prompt:t,success:!0,hasCode:!!p,timestamp:new Date().toISOString()}),this.config.enableCache&&!i){const u=`${this.hashContext(e)}_${t}`;this.setCacheItem(u,{response:{code:p},timestamp:Date.now()}),this.config.debug&&console.log("Cached AI response with key:",u)}return{code:p}}catch(r){return console.error("AI API call failed:",r),this.dispatchAIScriptEvent("ai-script-complete",{prompt:t,success:!1,error:r instanceof Error?r.message:String(r),timestamp:new Date().toISOString()}),{error:r instanceof Error?r.message:String(r)}}}clearPromptCache(e,t){if(!this.config.enableCache)return;const o=`${this.hashContext(e)}_${t}`,s=this.getCacheFromStorage();s[o]&&(delete s[o],this.saveCacheToStorage(s),this.config.debug&&console.log("Cleared cache for prompt:",t))}executeCode(e,t,i){try{let o=e;o=o.replace(/^```(javascript|js)\s*\n/i,""),o=o.replace(/\n```\s*$/i,"");const s=document.createElement("script");s.textContent=o,document.head.appendChild(s),this.config.debug&&console.log("Executed AI-generated code:",o)}catch(o){console.error("Failed to execute AI-generated code:",o),t&&i&&(this.clearPromptCache(t,i),this.config.debug&&console.log("Cleared cache due to code execution error"))}}showProcessingOverlay(){let e;if(this.config.showProcessingOverlay){const t=document.body;if(!t)return;e=document.createElement("div"),e.id="ai-script-overlay-container",e.innerHTML=`
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
      `,t.appendChild(e)}return e}async processPromptElement(e,t=!1){var r;const i=(r=e.textContent)==null?void 0:r.trim();if(!i)return;const o=this.showProcessingOverlay(),s=e instanceof HTMLElement?e.getAttribute("for"):null,n=this.getDOMContext(s||void 0),c=await this.callAI(n,i,t);c.code?this.executeCode(c.code,n,i):c.error&&this.config.debug&&console.error("AI code generation failed:",c.error),o&&o.remove()}setupDOMObserver(){if(!this.config.observeDOMChanges||!window.MutationObserver)return;this.observer=new MutationObserver(t=>{for(const i of t)i.type==="childList"&&i.addedNodes.length>0&&i.addedNodes.forEach(o=>{if(o.nodeType===Node.ELEMENT_NODE){const s=o;s.nodeName==="SCRIPT"&&s.getAttribute("type")==="ai/prompt"?this.processPromptElement(s,!0):s.querySelectorAll('script[type="ai/prompt"]').forEach(c=>{this.processPromptElement(c,!0)})}})});const e={childList:!0,subtree:!0};this.observer.observe(document,e),this.config.debug&&console.log("DOM observer setup complete")}stopDOMObserver(){this.observer&&(this.observer.disconnect(),this.observer=null,this.config.debug&&console.log("DOM observer stopped"))}async init(){var i;if(this.initialized)return;this.initialized=!0;const e=this.showProcessingOverlay(),t=this.findAIPrompts();if(t.length===0)this.config.debug&&console.log("No AI prompts found on the page");else for(const o of t){const s=(i=o.textContent)==null?void 0:i.trim();if(!s)continue;const n=o instanceof HTMLElement?o.getAttribute("for"):null,c=this.getDOMContext(n||void 0),r=await this.callAI(c,s);r.code?this.executeCode(r.code,c,s):r.error&&this.config.debug&&console.error("AI code generation failed:",r.error)}this.setupDOMObserver(),e&&e.remove()}}if(typeof window<"u"){const h=new a;window.addEventListener("DOMContentLoaded",async()=>{try{await h.init()}catch(e){console.error("AIScript initialization failed:",e)}}),window.AIScriptInstance=h}l.AIScript=a,Object.defineProperty(l,Symbol.toStringTag,{value:"Module"})});
