(function(a,n){typeof exports=="object"&&typeof module<"u"?n(exports):typeof define=="function"&&define.amd?define(["exports"],n):(a=typeof globalThis<"u"?globalThis:a||self,n(a.AIScript={}))})(this,function(a){"use strict";var b=Object.defineProperty;var v=(a,n,h)=>n in a?b(a,n,{enumerable:!0,configurable:!0,writable:!0,value:h}):a[n]=h;var f=(a,n,h)=>(v(a,typeof n!="symbol"?n+"":n,h),h);class n{constructor(e={}){f(this,"config");f(this,"initialized",!1);f(this,"CACHE_KEY","ai-script-cache");f(this,"observer",null);f(this,"processingOverlayCount",0);this.config={appKey:"",baseUrl:"https://api.deepseek.com",model:"deepseek-chat",debug:!1,enableCache:!0,cacheExpiration:30*24*60*60*1e3,showProcessingOverlay:!0,observeDOMChanges:!0,...e},this.initFromScriptTag(),this.config.enableCache&&this.cleanExpiredCache()}getCacheFromStorage(){try{const e=localStorage.getItem(this.CACHE_KEY);return e?JSON.parse(e):{}}catch(e){return this.config.debug&&console.error("Failed to get cache from localStorage:",e),{}}}saveCacheToStorage(e){try{localStorage.setItem(this.CACHE_KEY,JSON.stringify(e)),this.config.debug&&console.log("Cache saved to localStorage")}catch(t){this.config.debug&&console.error("Failed to save cache to localStorage:",t)}}getCacheItem(e){return this.getCacheFromStorage()[e]}setCacheItem(e,t){const i=this.getCacheFromStorage();i[e]=t,this.saveCacheToStorage(i)}cleanExpiredCache(){const e=this.getCacheFromStorage(),t=Date.now();let i=!1;for(const o in e)t-e[o].timestamp>(this.config.cacheExpiration||24*60*60*1e3)&&(delete e[o],i=!0);i&&(this.saveCacheToStorage(e),this.config.debug&&console.log("Expired cache items cleaned"))}initFromScriptTag(){const e=document.currentScript;if(!e)return;const t=e.getAttribute("appKey"),i=e.getAttribute("baseUrl"),o=e.getAttribute("model"),s=e.getAttribute("showProcessingOverlay"),r=e.getAttribute("observeDOMChanges");t&&(this.config.appKey=t),i&&(this.config.baseUrl=i),o&&(this.config.model=o),s&&(this.config.showProcessingOverlay=s==="true"),r&&(this.config.observeDOMChanges=r==="true"),this.config.debug&&console.log("AIScript initialized from script tag:",{appKey:this.config.appKey,baseUrl:this.config.baseUrl,model:this.config.model})}getDOMContext(e){let t,i;if(e){const r=document.getElementById(e);r?(t=r,i=`DOM structure for element with id="${e}":
`):(t=document.body,i=`Warning: Element with id="${e}" not found. Using full page structure:
`,this.config.debug&&console.warn(`Element with id="${e}" not found, using body instead.`))}else t=document.body,i=`Current page structure:
`;let o=i;const s=(r,l=0)=>{var p;let d=`${" ".repeat(l*2)}<${r.tagName.toLowerCase()}`;if(r.id&&(d+=` id="${r.id}"`),r.className&&(d+=` class="${r.className}"`),d+=">",r.children.length===0){const g=(p=r.textContent)==null?void 0:p.trim();g&&(d+=` ${g}`)}d+=`
`;for(let g=0;g<r.children.length;g++)d+=s(r.children[g],l+1);return d};return o+=s(t),o}hashContext(e){let t=0;if(e.length===0)return"00000000000000000000000000000000";for(let o=0;o<e.length;o++){const s=e.charCodeAt(o);t=(t<<5)-t+s,t=t&t}let i=(t>>>0).toString(16);for(;i.length<8;)i="0"+i;return i=i.repeat(4),i.slice(0,32)}findAIPrompts(){return document.querySelectorAll('script[type="ai/prompt"]')}dispatchAIScriptEvent(e,t){const i=new CustomEvent(e,{bubbles:!0,cancelable:!0,detail:t});document.dispatchEvent(i),this.config.debug&&console.log(`AIScript event dispatched: ${e}`,t)}async callAI(e,t,i=!1){var o,s,r,l;try{if(!this.config.appKey)throw new Error("API Key is required");if(this.dispatchAIScriptEvent("ai-script-start",{prompt:t,timestamp:new Date().toISOString()}),this.config.enableCache&&!i){const u=`${this.hashContext(e)}_${t}`,m=this.getCacheItem(u),y=Date.now();if(m&&y-m.timestamp<(this.config.cacheExpiration||24*60*60*1e3))return this.config.debug&&console.log("Using cached AI response for prompt:",t),this.dispatchAIScriptEvent("ai-script-complete",{prompt:t,success:!0,hasCode:!!m.response.code,fromCache:!0,timestamp:new Date().toISOString()}),m.response}const c=await fetch(`${this.config.baseUrl}/v1/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${this.config.appKey}`},body:JSON.stringify({model:this.config.model,messages:[{role:"system",content:"You are a JavaScript expert. Generate only executable JavaScript code without explanations. The code should implement the functionality described in the user prompt, considering the current page structure. Follow coding conventions; function names and object property names must use valid English naming."},{role:"user",content:`${e}

Prompt: ${t}

Generate JavaScript code to implement this functionality. Return ONLY the code without any explanations or markdown. DO wrap the code to an IIFE block and **DO NOT** wrap the code inside a DOMContentLoaded event listener!`}]})});if(!c.ok)throw this.dispatchAIScriptEvent("ai-script-complete",{prompt:t,success:!1,error:`API request failed with status ${c.status}`,timestamp:new Date().toISOString()}),new Error(`API request failed with status ${c.status}`);const p=(l=(r=(s=(o=(await c.json()).choices)==null?void 0:o[0])==null?void 0:s.message)==null?void 0:r.content)==null?void 0:l.trim();if(this.dispatchAIScriptEvent("ai-script-complete",{prompt:t,success:!0,hasCode:!!p,timestamp:new Date().toISOString()}),this.config.enableCache&&!i){const u=`${this.hashContext(e)}_${t}`;this.setCacheItem(u,{response:{code:p},timestamp:Date.now()}),this.config.debug&&console.log("Cached AI response with key:",u)}return{code:p}}catch(c){return console.error("AI API call failed:",c),this.dispatchAIScriptEvent("ai-script-complete",{prompt:t,success:!1,error:c instanceof Error?c.message:String(c),timestamp:new Date().toISOString()}),{error:c instanceof Error?c.message:String(c)}}}clearPromptCache(e,t){if(!this.config.enableCache)return;const o=`${this.hashContext(e)}_${t}`,s=this.getCacheFromStorage();s[o]&&(delete s[o],this.saveCacheToStorage(s),this.config.debug&&console.log("Cleared cache for prompt:",t))}executeCode(e,t,i){try{let o=e;o=o.replace(/^```(javascript|js)\s*\n/i,""),o=o.replace(/\n```\s*$/i,"");const s=document.createElement("script");s.textContent=o,document.head.appendChild(s),this.config.debug&&console.log("Executed AI-generated code:",o)}catch(o){console.error("Failed to execute AI-generated code:",o),t&&i&&(this.clearPromptCache(t,i),this.config.debug&&console.log("Cleared cache due to code execution error"))}}hideProcessingOverlay(){if(this.config.showProcessingOverlay&&(this.processingOverlayCount--,this.processingOverlayCount<=0)){const e=document.getElementById("ai-script-overlay-container");e&&e.remove()}}showProcessingOverlay(){let e;if(this.config.showProcessingOverlay){if(this.processingOverlayCount++,this.processingOverlayCount>1)return;const t=document.body;if(!t)return;e=document.createElement("div"),e.id="ai-script-overlay-container",e.innerHTML=`
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
      `,t.appendChild(e)}}async processPromptElement(e,t=!1){var o;const i=(o=e.textContent)==null?void 0:o.trim();if(i){this.showProcessingOverlay();try{const s=e instanceof HTMLElement?e.getAttribute("for"):null,r=this.getDOMContext(s||void 0),l=await this.callAI(r,i,t);l.code?this.executeCode(l.code,r,i):l.error&&this.config.debug&&console.error("AI code generation failed:",l.error)}catch(s){console.error("Error processing AI prompt:",s)}this.hideProcessingOverlay()}}setupDOMObserver(){if(!this.config.observeDOMChanges||!window.MutationObserver)return;this.observer=new MutationObserver(t=>{for(const i of t)i.type==="childList"&&i.addedNodes.length>0&&i.addedNodes.forEach(o=>{if(o.nodeType===Node.ELEMENT_NODE){const s=o;s.nodeName==="SCRIPT"&&s.getAttribute("type")==="ai/prompt"?this.processPromptElement(s,!0):s.querySelectorAll('script[type="ai/prompt"]').forEach(l=>{this.processPromptElement(l,!0)})}})});const e={childList:!0,subtree:!0};this.observer.observe(document,e),this.config.debug&&console.log("DOM observer setup complete")}stopDOMObserver(){this.observer&&(this.observer.disconnect(),this.observer=null,this.config.debug&&console.log("DOM observer stopped"))}async init(){if(this.initialized)return;this.initialized=!0;const e=this.findAIPrompts();if(e.length===0)this.config.debug&&console.log("No AI prompts found on the page");else{const t=Array.from(e).map(i=>this.processPromptElement(i));await Promise.all(t)}this.setupDOMObserver()}}if(typeof window<"u"){const h=new n;window.addEventListener("DOMContentLoaded",async()=>{try{await h.init()}catch(e){console.error("AIScript initialization failed:",e)}}),window.AIScriptInstance=h}a.AIScript=n,Object.defineProperty(a,Symbol.toStringTag,{value:"Module"})});
