(function(n,c){typeof exports=="object"&&typeof module<"u"?c(exports):typeof define=="function"&&define.amd?define(["exports"],c):(n=typeof globalThis<"u"?globalThis:n||self,c(n.AIScript={}))})(this,function(n){"use strict";var y=Object.defineProperty;var b=(n,c,h)=>c in n?y(n,c,{enumerable:!0,configurable:!0,writable:!0,value:h}):n[c]=h;var p=(n,c,h)=>(b(n,typeof c!="symbol"?c+"":c,h),h);class c{constructor(e={}){p(this,"config");p(this,"initialized",!1);p(this,"CACHE_KEY","ai-script-cache");this.config={appKey:"",baseUrl:"https://api.deepseek.com",model:"deepseek-chat",debug:!1,enableCache:!0,cacheExpiration:30*24*60*60*1e3,showProcessingOverlay:!0,...e},this.initFromScriptTag(),this.config.enableCache&&this.cleanExpiredCache()}getCacheFromStorage(){try{const e=localStorage.getItem(this.CACHE_KEY);return e?JSON.parse(e):{}}catch(e){return this.config.debug&&console.error("Failed to get cache from localStorage:",e),{}}}saveCacheToStorage(e){try{localStorage.setItem(this.CACHE_KEY,JSON.stringify(e)),this.config.debug&&console.log("Cache saved to localStorage")}catch(t){this.config.debug&&console.error("Failed to save cache to localStorage:",t)}}getCacheItem(e){return this.getCacheFromStorage()[e]}setCacheItem(e,t){const o={[e]:t};this.saveCacheToStorage(o)}cleanExpiredCache(){const e=this.getCacheFromStorage(),t=Date.now();let o=!1;for(const i in e)t-e[i].timestamp>(this.config.cacheExpiration||24*60*60*1e3)&&(delete e[i],o=!0);o&&(this.saveCacheToStorage(e),this.config.debug&&console.log("Expired cache items cleaned"))}initFromScriptTag(){const e=document.currentScript;if(!e)return;const t=e.getAttribute("appKey"),o=e.getAttribute("baseUrl"),i=e.getAttribute("model"),s=e.getAttribute("showProcessingOverlay");t&&(this.config.appKey=t),o&&(this.config.baseUrl=o),i&&(this.config.model=i),s&&(this.config.showProcessingOverlay=s==="true"),this.config.debug&&console.log("AIScript initialized from script tag:",{appKey:this.config.appKey,baseUrl:this.config.baseUrl,model:this.config.model})}getDOMContext(){const e=document.body;let t=`Current page structure:
`;const o=(i,s=0)=>{var f;let r=`${" ".repeat(s*2)}<${i.tagName.toLowerCase()}`;if(i.id&&(r+=` id="${i.id}"`),i.className&&(r+=` class="${i.className}"`),r+=">",i.children.length===0){const a=(f=i.textContent)==null?void 0:f.trim();a&&(r+=` ${a}`)}r+=`
`;for(let a=0;a<i.children.length;a++)r+=o(i.children[a],s+1);return r};return t+=o(e),t}hashContext(e){let t=0;if(e.length===0)return"00000000000000000000000000000000";for(let i=0;i<e.length;i++){const s=e.charCodeAt(i);t=(t<<5)-t+s,t=t&t}let o=(t>>>0).toString(16);for(;o.length<8;)o="0"+o;return o=o.repeat(4),o.slice(0,32)}findAIPrompts(){const e=[];return document.querySelectorAll('script[type="ai/prompt"]').forEach(o=>{var s;const i=(s=o.textContent)==null?void 0:s.trim();i&&e.push(i)}),e}dispatchAIScriptEvent(e,t){const o=new CustomEvent(e,{bubbles:!0,cancelable:!0,detail:t});document.dispatchEvent(o),this.config.debug&&console.log(`AIScript event dispatched: ${e}`,t)}async callAI(e,t){var o,i,s,g;try{if(!this.config.appKey)throw new Error("API Key is required");if(this.dispatchAIScriptEvent("ai-script-start",{prompt:t,timestamp:new Date().toISOString()}),this.config.enableCache){const l=`${this.hashContext(e)}_${t}`,d=this.getCacheItem(l),m=Date.now();if(d&&m-d.timestamp<(this.config.cacheExpiration||24*60*60*1e3))return this.config.debug&&console.log("Using cached AI response for prompt:",t),this.dispatchAIScriptEvent("ai-script-complete",{prompt:t,success:!0,hasCode:!!d.response.code,fromCache:!0,timestamp:new Date().toISOString()}),d.response}const r=await fetch(`${this.config.baseUrl}/v1/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${this.config.appKey}`},body:JSON.stringify({model:this.config.model,messages:[{role:"system",content:"You are a JavaScript expert. Generate only executable JavaScript code without explanations. The code should implement the functionality described in the user prompt, considering the current page structure."},{role:"user",content:`${e}

Prompt: ${t}

Generate JavaScript code to implement this functionality. Return ONLY the code without any explanations or markdown.`}]})});if(!r.ok)throw this.dispatchAIScriptEvent("ai-script-complete",{prompt:t,success:!1,error:`API request failed with status ${r.status}`,timestamp:new Date().toISOString()}),new Error(`API request failed with status ${r.status}`);const a=(g=(s=(i=(o=(await r.json()).choices)==null?void 0:o[0])==null?void 0:i.message)==null?void 0:s.content)==null?void 0:g.trim();if(this.dispatchAIScriptEvent("ai-script-complete",{prompt:t,success:!0,hasCode:!!a,timestamp:new Date().toISOString()}),this.config.enableCache){const l=`${this.hashContext(e)}_${t}`;this.setCacheItem(l,{response:{code:a},timestamp:Date.now()}),this.config.debug&&console.log("Cached AI response with key:",l)}return{code:a}}catch(r){return console.error("AI API call failed:",r),this.dispatchAIScriptEvent("ai-script-complete",{prompt:t,success:!1,error:r instanceof Error?r.message:String(r),timestamp:new Date().toISOString()}),{error:r instanceof Error?r.message:String(r)}}}clearPromptCache(e,t){if(!this.config.enableCache)return;const i=`${this.hashContext(e)}_${t}`,s=this.getCacheFromStorage();s[i]&&(delete s[i],this.saveCacheToStorage(s),this.config.debug&&console.log("Cleared cache for prompt:",t))}executeCode(e,t,o){try{let i=e;i=i.replace(/^```(javascript|js)\s*\n/i,""),i=i.replace(/\n```\s*$/i,"");const s=document.createElement("script");s.textContent=i,document.head.appendChild(s),this.config.debug&&console.log("Executed AI-generated code:",i)}catch(i){console.error("Failed to execute AI-generated code:",i),t&&o&&(this.clearPromptCache(t,o),this.config.debug&&console.log("Cleared cache due to code execution error"))}}showProcessingOverlay(){let e;if(this.config.showProcessingOverlay){const t=document.body;if(!t)return;e=document.createElement("div"),e.id="ai-script-overlay-container",e.innerHTML=`
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
      `,t.appendChild(e)}return e}async init(){if(this.initialized)return;this.initialized=!0;const e=this.showProcessingOverlay(),t=this.getDOMContext(),o=this.findAIPrompts();if(o.length===0){this.config.debug&&console.log("No AI prompts found on the page");return}for(const i of o){const s=await this.callAI(t,i);s.code?this.executeCode(s.code,t,i):s.error&&this.config.debug&&console.error("AI code generation failed:",s.error)}e&&e.remove()}}if(typeof window<"u"){const h=new c;window.addEventListener("DOMContentLoaded",async()=>{try{await h.init()}catch(e){console.error("AIScript initialization failed:",e)}})}n.AIScript=c,Object.defineProperty(n,Symbol.toStringTag,{value:"Module"})});
