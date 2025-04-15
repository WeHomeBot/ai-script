(function(c,r){typeof exports=="object"&&typeof module<"u"?r(exports):typeof define=="function"&&define.amd?define(["exports"],r):(c=typeof globalThis<"u"?globalThis:c||self,r(c.AIScript={}))})(this,function(c){"use strict";var y=Object.defineProperty;var b=(c,r,h)=>r in c?y(c,r,{enumerable:!0,configurable:!0,writable:!0,value:h}):c[r]=h;var p=(c,r,h)=>(b(c,typeof r!="symbol"?r+"":r,h),h);class r{constructor(e={}){p(this,"config");p(this,"initialized",!1);p(this,"CACHE_KEY","ai-script-cache");this.config={appKey:"",baseUrl:"https://api.deepseek.com",model:"deepseek-chat",debug:!1,enableCache:!0,cacheExpiration:30*24*60*60*1e3,showProcessingOverlay:!0,...e},this.initFromScriptTag(),this.config.enableCache&&this.cleanExpiredCache()}getCacheFromStorage(){try{const e=localStorage.getItem(this.CACHE_KEY);return e?JSON.parse(e):{}}catch(e){return this.config.debug&&console.error("Failed to get cache from localStorage:",e),{}}}saveCacheToStorage(e){try{localStorage.setItem(this.CACHE_KEY,JSON.stringify(e)),this.config.debug&&console.log("Cache saved to localStorage")}catch(t){this.config.debug&&console.error("Failed to save cache to localStorage:",t)}}getCacheItem(e){return this.getCacheFromStorage()[e]}setCacheItem(e,t){const i={[e]:t};this.saveCacheToStorage(i)}cleanExpiredCache(){const e=this.getCacheFromStorage(),t=Date.now();let i=!1;for(const o in e)t-e[o].timestamp>(this.config.cacheExpiration||24*60*60*1e3)&&(delete e[o],i=!0);i&&(this.saveCacheToStorage(e),this.config.debug&&console.log("Expired cache items cleaned"))}initFromScriptTag(){const e=document.currentScript;if(!e)return;const t=e.getAttribute("appKey"),i=e.getAttribute("baseUrl"),o=e.getAttribute("model"),n=e.getAttribute("showProcessingOverlay");t&&(this.config.appKey=t),i&&(this.config.baseUrl=i),o&&(this.config.model=o),n&&(this.config.showProcessingOverlay=n==="true"),this.config.debug&&console.log("AIScript initialized from script tag:",{appKey:this.config.appKey,baseUrl:this.config.baseUrl,model:this.config.model})}getDOMContext(){const e=document.body;let t=`Current page structure:
`;const i=(o,n=0)=>{var f;let s=`${" ".repeat(n*2)}<${o.tagName.toLowerCase()}`;if(o.id&&(s+=` id="${o.id}"`),o.className&&(s+=` class="${o.className}"`),s+=">",o.children.length===0){const a=(f=o.textContent)==null?void 0:f.trim();a&&(s+=` ${a}`)}s+=`
`;for(let a=0;a<o.children.length;a++)s+=i(o.children[a],n+1);return s};return t+=i(e),t}hashContext(e){let t=0;if(e.length===0)return"00000000000000000000000000000000";for(let o=0;o<e.length;o++){const n=e.charCodeAt(o);t=(t<<5)-t+n,t=t&t}let i=(t>>>0).toString(16);for(;i.length<8;)i="0"+i;return i=i.repeat(4),i.slice(0,32)}findAIPrompts(){const e=[];return document.querySelectorAll('script[type="ai/prompt"]').forEach(i=>{var n;const o=(n=i.textContent)==null?void 0:n.trim();o&&e.push(o)}),e}dispatchAIScriptEvent(e,t){const i=new CustomEvent(e,{bubbles:!0,cancelable:!0,detail:t});document.dispatchEvent(i),this.config.debug&&console.log(`AIScript event dispatched: ${e}`,t)}async callAI(e,t){var i,o,n,g;try{if(!this.config.appKey)throw new Error("API Key is required");if(this.dispatchAIScriptEvent("ai-script-start",{prompt:t,timestamp:new Date().toISOString()}),this.config.enableCache){const l=`${this.hashContext(e)}_${t}`,d=this.getCacheItem(l),m=Date.now();if(d&&m-d.timestamp<(this.config.cacheExpiration||24*60*60*1e3))return this.config.debug&&console.log("Using cached AI response for prompt:",t),this.dispatchAIScriptEvent("ai-script-complete",{prompt:t,success:!0,hasCode:!!d.response.code,fromCache:!0,timestamp:new Date().toISOString()}),d.response}const s=await fetch(`${this.config.baseUrl}/v1/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${this.config.appKey}`},body:JSON.stringify({model:this.config.model,messages:[{role:"system",content:"You are a JavaScript expert. Generate only executable JavaScript code without explanations. The code should implement the functionality described in the user prompt, considering the current page structure."},{role:"user",content:`${e}

Prompt: ${t}

Generate JavaScript code to implement this functionality. Return ONLY the code without any explanations or markdown.`}]})});if(!s.ok)throw this.dispatchAIScriptEvent("ai-script-complete",{prompt:t,success:!1,error:`API request failed with status ${s.status}`,timestamp:new Date().toISOString()}),new Error(`API request failed with status ${s.status}`);const a=(g=(n=(o=(i=(await s.json()).choices)==null?void 0:i[0])==null?void 0:o.message)==null?void 0:n.content)==null?void 0:g.trim();if(this.dispatchAIScriptEvent("ai-script-complete",{prompt:t,success:!0,hasCode:!!a,timestamp:new Date().toISOString()}),this.config.enableCache){const l=`${this.hashContext(e)}_${t}`;this.setCacheItem(l,{response:{code:a},timestamp:Date.now()}),this.config.debug&&console.log("Cached AI response with key:",l)}return{code:a}}catch(s){return console.error("AI API call failed:",s),this.dispatchAIScriptEvent("ai-script-complete",{prompt:t,success:!1,error:s instanceof Error?s.message:String(s),timestamp:new Date().toISOString()}),{error:s instanceof Error?s.message:String(s)}}}executeCode(e){try{const t=document.createElement("script");t.textContent=e,document.head.appendChild(t),this.config.debug&&console.log("Executed AI-generated code:",e)}catch(t){console.error("Failed to execute AI-generated code:",t)}}showProcessingOverlay(){let e;if(this.config.showProcessingOverlay){const t=document.body;if(!t)return;e=document.createElement("div"),e.id="ai-script-overlay-container",e.innerHTML=`
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
      `,t.appendChild(e)}return e}async init(){if(this.initialized)return;this.initialized=!0;const e=this.showProcessingOverlay(),t=this.getDOMContext(),i=this.findAIPrompts();if(i.length===0){this.config.debug&&console.log("No AI prompts found on the page");return}for(const o of i){const n=await this.callAI(t,o);n.code?this.executeCode(n.code):n.error&&this.config.debug&&console.error("AI code generation failed:",n.error)}e&&e.remove()}}if(typeof window<"u"){const h=new r;window.addEventListener("DOMContentLoaded",async()=>{try{await h.init()}catch(e){console.error("AIScript initialization failed:",e)}})}c.AIScript=r,Object.defineProperty(c,Symbol.toStringTag,{value:"Module"})});
