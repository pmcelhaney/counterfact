import { coffeeShopAction } from "./coffee-shop-action.js";
import { CoffeeShopObservations } from "./coffee-shop-observations.js";
import { CoffeeShopProgress } from "./coffee-shop-progress.js";

import { COUNTERFACT_LOGO } from "./counterfact-logo.js";

import { basename } from "node:path";

export function coffeeShopPage(projectPath: string): string {
  const path = JSON.stringify(projectPath).replace(/</gu, "\\u003c");
  const editorUrl = new URL("vscode://file/");
  const editorPath = projectPath.replace(/\\/gu, "/");
  editorUrl.pathname = `${editorPath.startsWith("/") ? "" : "/"}${editorPath}/`;
  const name = basename(projectPath);
  const restart = JSON.stringify(
    `npx counterfact ./${name}/openapi.json ./${name}`,
  ).replace(/</gu, "\\u003c");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Counterfact Coffee · Guided example</title>
<style>
:root{--paper:#fafafa;--surface:#fff;--ink:#17202a;--muted:#536170;--rule:#dce2e8;--blue:#0869a6;--blue-dark:#04517f;--orange:#f58e00;--orange-dark:#a24b00;--code:#f1f4f6;font-family:system-ui,-apple-system,sans-serif;color:var(--ink);background:var(--paper);font-size:16px}*{box-sizing:border-box}body{margin:0}button,a.editor-link{font:inherit;cursor:pointer;border:0;border-radius:8px;padding:11px 16px;background:var(--blue);color:white;font-weight:650}button:hover:not(:disabled){background:var(--blue-dark)}button.secondary:hover:not(:disabled),a.editor-link:hover{background:#dce9f3}button:disabled{background:#e5eaf0;color:var(--muted);cursor:not-allowed}button.secondary,a.editor-link{background:#edf3f8;color:var(--ink)}button:focus-visible,a:focus-visible{outline:3px solid var(--orange-dark);outline-offset:3px}a{color:var(--blue)}a.editor-link{display:inline-block;text-decoration:none}.brand{margin-bottom:24px}.counterfact-logo{display:block;width:240px;max-width:100%;height:auto;margin-bottom:14px}.layout{display:grid;grid-template-columns:380px minmax(720px,1fr);min-width:1100px;min-height:100vh}.guide{min-width:0;padding:36px 30px;background:#fff;border-right:1px solid var(--rule)}.eyebrow{font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:var(--muted)}h1{font-family:Georgia,serif;font-size:36px;margin:8px 0 10px}h2{font-size:25px;line-height:1.2}h3{margin:0 0 8px}p{line-height:1.6}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:var(--code);padding:14px;border-radius:8px;font-size:13px;line-height:1.5}.path{font-size:12px;overflow-wrap:anywhere;color:var(--muted)}.shop{min-width:0;padding:36px;max-width:1100px;width:100%;margin:auto}.shop-head{display:flex;justify-content:space-between;gap:20px;align-items:center}.demo{font-size:13px;color:var(--muted)}.products{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin:28px 0}.card{background:#fff;border:1px solid var(--rule);border-radius:14px;padding:20px;display:flex;flex-direction:column}.bag{height:145px;display:grid;place-items:center;margin-bottom:20px;background:#e3f0f9;border-radius:8px}.bag.dark-roast{background:#dce7f0}.bag.decaf{background:#fff0d9}.bag-label{background:#fff;border:1px solid var(--rule);padding:22px 14px;text-align:center;box-shadow:5px 5px 0 #0001;font-family:Georgia,serif;font-size:22px}.card p{font-size:14px;flex:1;color:var(--muted)}.stock{font-size:13px;margin:14px 0}.stock div{display:flex;justify-content:space-between;gap:12px;padding:4px 0}.stock dt{color:var(--muted)}.stock dd{margin:0;font-weight:700}.stock-note{font-size:12px;color:var(--muted)}.price{font-weight:700}.effect{margin:24px 0;padding:20px;background:#fff;border:1px solid var(--rule);border-radius:14px}.history-scroll{overflow-x:auto}table{width:100%;border-collapse:collapse;font-size:13px;text-align:left}caption{text-align:left;color:var(--muted);margin-bottom:10px}th,td{padding:10px 8px;border-bottom:1px solid var(--rule)}td button{font-size:12px;padding:6px 10px}.event-detail{margin-top:22px}.guide .effect{padding:16px;background:#f4f8fb}.guide .effect p{font-size:14px}.effect h2{font-size:20px;margin-top:0}.effect p{margin:8px 0}.effect pre{margin-bottom:0}.cart{background:white;border:1px solid var(--rule);border-radius:14px;padding:24px}.cart-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--rule)}.cart-row button{padding:5px 10px}.cart-footer{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-top:22px}.notice{padding:16px;background:#eaf5fb;border-radius:8px;margin:18px 0}.error{background:#fff0e7;color:#8c351c}.experiment-question{padding:12px;border-left:3px solid var(--orange);background:#fff5e5;color:var(--ink)}.code-hint{margin:18px 0}.code-hint summary{cursor:pointer;font-weight:650}.guide-footer{margin-top:35px;border-top:1px solid var(--rule);padding-top:18px;font-size:13px}.controls{display:flex;gap:8px;flex-wrap:wrap;margin-top:20px}.controls button{font-size:13px}#guide-status:empty{display:none}
</style></head><body><main class="layout">
<aside class="guide" aria-label="Walkthrough instructions"><div class="brand">${COUNTERFACT_LOGO}<div class="eyebrow">Learn by doing</div></div><div id="lesson"></div><p id="guide-status" role="status" aria-live="polite"></p><section id="purchase-effect" class="effect" aria-label="Latest purchase effect" aria-live="polite" hidden></section><div class="controls"><button id="continue" hidden>Continue</button><button id="back" class="secondary" hidden>Back</button><button id="skip" class="secondary">Skip lesson</button></div><div class="guide-footer">Your example project<p class="path" id="project-path"></p><button id="copy-path" class="secondary">Copy project path</button> <a id="open-vscode" class="editor-link" href="${editorUrl.href}">Open in VSCode</a><p>Keep Counterfact running in your terminal. Use your own editor for changes.</p></div></aside>
<section class="shop" aria-label="Coffee shop"><header class="shop-head"><div><div class="eyebrow">Small batch · Big comfort</div><h1>Counterfact Coffee</h1><div class="demo">A local demo shop. No payments or real orders.</div></div><button id="refresh" class="secondary">Refresh products</button></header><p id="live-status" class="demo">Connecting to Counterfact…</p><div id="shop-notice" role="status" aria-live="polite"></div><div id="products" class="products"></div><section class="cart" aria-label="Shopping cart"><h2>Your cart</h2><div id="cart"></div><div class="cart-footer"><strong id="total"></strong><button id="checkout" disabled>Place order</button></div></section><section id="history" class="effect" aria-label="Transaction history"></section></section>
</main><script>
const projectPath = ${path};
const restartCommand = ${restart};
let sessionId;
${CoffeeShopProgress.toString()}
${coffeeShopAction.toString()}
${CoffeeShopObservations.toString()}
const observations = new CoffeeShopObservations();
const progress = new CoffeeShopProgress();
const $ = (id) => document.getElementById(id);
const money = (cents) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents / 100);
let products = [], cart = {}, busy = false, manualStages = {}, refreshRequest, selectedEvent, inventoryFresh=false, lastFailure, productError=false;
function element(tag,text,className){const node=document.createElement(tag);node.textContent=text;if(className)node.className=className;return node;}
function notice(text,error=false){$('shop-notice').replaceChildren(element('p',text,'notice'+(error?' error':'')));}
async function requestJson(path,options={}){
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),4000);
  try{const response=await fetch(path,{...options,signal:controller.signal});const result=await response.json();return {response,result};}finally{clearTimeout(timeout);}
}
function validProducts(value){
  const ids=['house-blend','dark-roast','decaf'];return Array.isArray(value)&&value.length===3&&new Set(value.map(p=>p?.id)).size===3&&value.every(p=>p&&ids.includes(p.id)&&typeof p.name==='string'&&typeof p.description==='string'&&Number.isSafeInteger(p.price)&&p.price>=0&&Number.isSafeInteger(p.stock)&&p.stock>=0);
}
function renderOrderFailure(){
  if(!lastFailure)return;const {status,result,items}=lastFailure;let text;
  if(status===undefined)text='Order confirmation unavailable. The request may have been accepted; inspect the latest event and inventory before retrying. Your cart has been kept.';
  else if(status===409){
    const shortages=Array.isArray(result?.shortages)?result.shortages.filter(s=>s&&items.some(i=>i.productId===s.productId)&&Number.isSafeInteger(s.requested)&&s.requested>0&&Number.isSafeInteger(s.available)&&s.available>=0):[];
    text=shortages.length?shortages.map(s=>productName(s.productId)+': your cart requested '+s.requested+'; the order API reported '+s.available+' available.').join(' '):'The API rejected the order because it could not fulfill the cart. Compare the cart with the latest reported inventory.';
    text+=' Your cart has been kept. Reduce its quantity or restock in Counterfact, then try again.';
  }else text=(typeof result?.error==='string'?result.error:'Order rejected (HTTP '+status+').')+' Your cart has been kept; restore ordering and try again.';
  notice(text,true);
}
function stockSnapshot(){return Object.fromEntries(products.map(p=>[p.id,p.stock]));}
function productName(id){return products.find(p=>p.id===id)?.name||id;}
function renderHistory(){
  const target=$('history');target.replaceChildren(element('h2','What happened'));
  if(!observations.events.length){target.append(element('p','Purchases and API inventory changes will appear here.'));return;}
  const table=element('table','');table.append(element('caption','Recent events — newest first'));
  const head=element('thead','');const headings=element('tr','');for(const label of ['Event','Result','Inventory','Details'])headings.append(element('th',label));head.append(headings);table.append(head);
  const body=element('tbody','');
  for(const event of [...observations.events].reverse()){
    const row=element('tr','');const result=event.kind==='inventory'?'Updated':event.status===201?'Accepted':event.status===undefined?'Unknown':'Rejected';
    const changes=observations.comparisons(event).map(c=>productName(c.productId)+' '+(c.before??'?')+' → '+(c.after??'waiting')).join('; ');
    row.append(element('td',event.kind==='order'?'Purchase #'+event.id:'API update #'+event.id),element('td',result),element('td',changes));
    const details=element('td','');const inspect=element('button','Inspect','secondary');inspect.setAttribute('aria-label','Inspect event '+event.id);inspect.onclick=()=>{selectedEvent=event.id;renderHistory();};details.append(inspect);row.append(details);body.append(row);
  }
  table.append(body);const scroll=element('div','','history-scroll');scroll.append(table);target.append(scroll);
  const selected=observations.events.find(e=>e.id===selectedEvent);if(!selected)return;
  const detail=element('section','','event-detail');detail.setAttribute('aria-label','Selected event details');detail.append(element('h3','Event '+selected.id+' · '+new Date(selected.time).toLocaleTimeString()));
  detail.append(element('p',selected.kind==='order'?'Request · POST /orders':'Request · GET /products'));
  if(selected.kind==='order')detail.append(element('pre',JSON.stringify({items:selected.items},null,2)));
  detail.append(element('p',selected.status===undefined?'No valid response received':'Response · HTTP '+selected.status),element('pre',JSON.stringify(selected.response,null,2)||'No response'),element('p','Observed inventory · before → after'),element('pre',JSON.stringify({before:selected.before,after:selected.after||'Awaiting a valid product response'},null,2)));target.append(detail);
}
function renderPurchaseEffect(){
  renderHistory();const target=$('purchase-effect');target.hidden=!observations.latest;if(target.hidden)return;target.replaceChildren(element('h2','What the purchase did'));
  for(const change of observations.comparisons()){
    const name=products.find(p=>p.id===change.productId)?.name||change.productId;
    const outcome=change.accepted?'order accepted':observations.latest.status===undefined?'confirmation unavailable':'order rejected (HTTP '+observations.latest.status+')';
    target.append(element('p','Ordered '+change.quantity+' '+name+' → '+outcome+' → inventory '+(change.before??'unknown')+' → '+(change.after??(inventoryFresh?'waiting for a product response':'unavailable; inventory is not verified'))));
    if(change.accepted&&change.after!==undefined&&change.before!==undefined){
      if(change.before===change.after)target.append(element('p','The order succeeded, but API inventory did not change.'));
      else if(change.after===change.before-change.quantity){target.append(element('p','The product response shows the purchased quantity subtracted.'),element('pre','$.context.inventory[item.productId] -= item.quantity;'+String.fromCharCode(10)+name+': '+change.before+' − '+change.quantity+' = '+change.after));}
      else target.append(element('p','API inventory changed by '+(change.after-change.before)+'. Inspect the handler and context to explain the result.'));
    }
  }
}
function renderProducts(){
  $('products').replaceChildren();
  for(const product of products){
    const card=element('article','', 'card');card.dataset.productId=product.id;
    const bag=element('div','','bag '+product.id);bag.append(element('div',product.name,'bag-label'));card.append(bag,element('h3',product.name),element('p',product.description),element('div',money(product.price)+' / 250g','price'));
    const inCart=cart[product.id]||0;const available=Math.max(0,product.stock-inCart);
    const quantities=element('dl','','stock');quantities.setAttribute('aria-label',product.name+' inventory');
    for(const [label,value] of [[inventoryFresh?'Inventory in Counterfact':'Last known inventory',product.stock],['In your cart',inCart],['Available to add',available]]){const row=element('div','');row.append(element('dt',label),element('dd',String(value)));quantities.append(row);}
    card.append(quantities,element('div',!inventoryFresh?'Latest inventory could not be verified.':product.stock===0?'Sold out':inCart?'Cart quantities do not change API inventory.':'Stock reported by the products API.','stock-note'));
    const add=element('button','Add to cart');add.disabled=busy||!inventoryFresh||available===0;add.onclick=()=>{cart[product.id]=(cart[product.id]||0)+1;lastFailure=undefined;$('shop-notice').replaceChildren();renderProducts();renderCart();onCart();};card.append(add);$('products').append(card);
  }
}
function renderCart(){
  saveProgress();
  $('cart').replaceChildren();let total=0;
  for(const [id,quantity] of Object.entries(cart)){
    const product=products.find(p=>p.id===id);if(!product)continue;total+=product.price*quantity;
    const row=element('div','','cart-row');row.append(element('span',product.name+' × '+quantity));const quantities=element('span');for(const [label,delta] of [['−',-1],['+',1]]){const button=element('button',label,'secondary');button.setAttribute('aria-label',(delta<0?'Decrease ':'Increase ')+product.name+' quantity');button.disabled=busy||(delta>0&&(!inventoryFresh||quantity>=product.stock));button.onclick=()=>{lastFailure=undefined;const next=quantity+delta;if(next===0)delete cart[id];else cart[id]=next;renderProducts();renderCart();onCart();};quantities.append(button);}row.append(quantities);const remove=element('button','Remove','secondary');remove.disabled=busy;remove.onclick=()=>{lastFailure=undefined;delete cart[id];renderProducts();renderCart();onCart();};row.append(remove);$('cart').append(row);
  }
  if(!Object.keys(cart).length)$('cart').append(element('p','Your cart is empty. Choose a coffee above.'));
  $('total').textContent=money(total);$('checkout').disabled=busy||!inventoryFresh||!Object.keys(cart).length;
}
async function refreshProducts({source='manual',credit=true}={}){
  if(refreshRequest)return refreshRequest;
  refreshRequest=(async()=>{
    $('refresh').disabled=true;
    try{
      const {response,result:next}=await requestJson('/products');if(!response.ok||!validProducts(next))throw Error('Invalid product response');
      const recovered=!inventoryFresh;inventoryFresh=true;const changed=JSON.stringify(products)!==JSON.stringify(next);const previous=stockSnapshot();products=next;
      if(source!=='before-order')observations.inventory(stockSnapshot(),next);
      if(changed||recovered||source!=='live'){renderPurchaseEffect();renderProducts();renderCart();if(credit)onProducts();}
      else if(credit){const wasDone=progress.done;progress.products(stockSnapshot());if(wasDone!==progress.done)checkProgress();}
      if(productError){productError=false;$('shop-notice').replaceChildren();if(!progress.done){$('guide-status').textContent='API connection restored. Continue the experiment.';updateAction();}}renderOrderFailure();
      const changes=products.filter(p=>previous[p.id]!==undefined&&previous[p.id]!==p.stock).map(p=>p.name+': '+previous[p.id]+' → '+p.stock);
      $('live-status').textContent=(changes.length?'Product response · '+changes.join(' · '):'Live API updates · last checked '+new Date().toLocaleTimeString())+(source==='after-order'?' · checked after the order':'');
      return true;
    }catch(error){inventoryFresh=false;productError=true;renderProducts();renderCart();renderPurchaseEffect();$('live-status').textContent=products.length?'Last known inventory · the latest products response is unavailable or invalid.':'Inventory unavailable · waiting for a valid products response.';notice('Current inventory could not be verified. Your cart has been kept. Check Counterfact; the shop will reconnect automatically.',true);$('guide-status').textContent='Waiting for a valid products response. Displayed inventory is last known, not current.';return false;}
    finally{$('refresh').disabled=busy;}
  })();
  try{return await refreshRequest;}finally{refreshRequest=undefined;}
}
async function placeOrder(){
  if(busy||!Object.keys(cart).length)return;busy=true;renderProducts();renderCart();
  if(!await refreshProducts({source:'before-order',credit:false})){busy=false;$('refresh').disabled=false;renderProducts();renderCart();return;}
  const items=Object.entries(cart).map(([productId,quantity])=>({productId,quantity}));const before=stockSnapshot();
  try{const {response,result}=await requestJson('/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items})});if(response.ok&&(response.status!==201||!Number.isInteger(result?.orderId)))throw Error('Invalid order confirmation');observations.order(items,response.status,result,before);renderPurchaseEffect();if(!response.ok){lastFailure={status:response.status,result,items};renderOrderFailure();$('checkout').textContent='Try again';onOrder(false,items,response.status);return;}lastFailure=undefined;cart={};notice('Thanks! Demo order #'+result.orderId+' is confirmed.');$('checkout').textContent='Place order';renderProducts();onOrder(true,items,response.status);}
  catch(error){observations.order(items,undefined,{error:'No valid confirmation received'},before);lastFailure={status:undefined,result:undefined,items};renderPurchaseEffect();renderOrderFailure();$('checkout').textContent='Try again';$('guide-status').textContent='The order request could not be completed. Check Counterfact and retry.';}
  finally{await refreshProducts({source:'after-order'});busy=false;$('refresh').disabled=false;renderProducts();renderCart();}
}
const lessons = [
  ['Your local coffee shop is running','Click Start shopping to make a purchase. Then change the API and see how the shop responds. Keep Counterfact running in your terminal.'],
  ['Buy a bag of House Blend','Add House Blend to your cart, then place an order. No payment is needed.'],
  ['Put Decaf back in stock','Decaf is sold out. Open routes/products.ts in your editor. Change its starting stock from 0 to 5, save, and watch the inventory.','const decafStock = 0;','const decafStock = 5;','routes/products.ts'],
  ['Buy the coffee you made available','Add Decaf to the cart and place an order. Your API change made this purchase possible.'],
  ['Try an order failure','Add a coffee to your cart. Open routes/orders.ts, change ordersAvailable to false, and save. Then click Place order.','const ordersAvailable = true;','const ordersAvailable = false;','routes/orders.ts'],
  ['Restore ordering and retry','In the same file, restore ordersAvailable to true and save. Click Try again. Your cart is still there.','const ordersAvailable = false;','const ordersAvailable = true;','routes/orders.ts'],
  ['Does a purchase reduce inventory?','Add one Dark Roast to your cart, place an order, then watch the inventory. Compare the inventory before and after the purchase. Does accepting an order also subtract stock?'],
  ['Make an order update inventory','Products read shared context. Open routes/_.context.ts to see inventory, then open routes/orders.ts. Add these lines at the INVENTORY LESSON comment, save. Add one Dark Roast to your cart, place an order, and watch the inventory.','', 'for (const item of items) {\\n  $.context.inventory[item.productId] -= item.quantity;\\n}', 'routes/orders.ts'],
  ['Watch Dark Roast sell out','Add the remaining Dark Roast bags to your cart and place an order. Then watch the inventory. Watch what happens to the final bag and the Add to cart button.'],
  ['Restock through the REPL','Switch to Counterfact’s terminal. Its ⬣> prompt is the REPL: you can inspect and change the running context. Inspect the inventory with the first command. Restock it with the second command, then return here and watch the inventory.','context.inventory["dark-roast"]','context.inventory["dark-roast"] = 5'],
  ['Buy from the updated inventory','Add one Dark Roast to your cart, place an order, then watch the inventory. Compare the five bags you added through the REPL with the inventory after the purchase. Are the REPL and order handler changing the same object?'],
  ['You changed a shopping workflow','You made a product available, tested failure and recovery, updated context in a handler, and restocked it through the REPL. The app and Counterfact are still running. Keep experimenting.'],
];
const questions = [
  'What can you change about this shop?',
  'What does a successful purchase do?',
  'Can a saved API change make sold-out coffee purchasable?',
  'Does the shop use the API behavior you changed?',
  'What does a shopper experience when ordering fails?',
  'Can the shopper recover without rebuilding the cart?',
  'Does accepting an order also reduce inventory?',
  'Can an order change the inventory shared by the whole shop?',
  'What happens when the final bag is purchased?',
  'Can you change the running inventory without placing an order?',
  'Do the REPL and order handler change the same inventory?',
  'What else can you discover? Try different quantities, a failed order, or a REPL restock.',
];
const successes = {
  1:'Your first order went through. Counterfact returned a successful confirmation.',
  2:'Decaf is available. Your saved change reached the API without a restart.',
  3:'You changed what a shopper could buy.',
  4:'The order failed, and the shop kept your cart so you can retry.',
  5:'The retry worked with the same cart.',
  6:'The stock stayed the same. Next, connect orders to the shared inventory.',
  7:'The order updated context; the product request returned the lower stock.',
  8:'Dark Roast sold out. The shop reacted to inventory reaching zero.',
  9:'Dark Roast is back in stock. The product handler read your updated context.',
  10:'Five bags became four. The REPL and order handler use the same inventory.',
};
function currentAction(){return coffeeShopAction({step:progress.step,done:progress.done,cart,stock:Object.fromEntries(products.map(p=>[p.id,p.stock])),ordered:!!progress.lastOrder,manualStage:manualStages[progress.step]||0,inventoryUpdated:progress.inventoryUpdated});}
function instructionParagraph(text){
  const paragraph=element('p','');paragraph.id='instruction-text';const action=currentAction();const start=action?text.toLowerCase().indexOf(action.text.toLowerCase()):-1;
  if(start<0){paragraph.textContent=text;return paragraph;}
  paragraph.append(element('span',text.slice(0,start)),element('strong',text.slice(start,start+action.text.length)),element('span',text.slice(start+action.text.length)));return paragraph;
}
function updateAction(){
  const paragraph=$('instruction-text');if(paragraph)paragraph.replaceWith(instructionParagraph(paragraph.textContent));
  $('confirm-action')?.remove();const action=currentAction();if(action?.confirm){const button=element('button',action.confirm,'secondary');button.id='confirm-action';button.onclick=()=>{manualStages[progress.step]=(manualStages[progress.step]||0)+1;saveProgress();updateAction();};$('lesson').append(button);}
}
function showLesson(){
  saveProgress();
  const lesson=[...lessons[progress.step]];
  if(progress.step===7&&progress.inventoryUpdated&&!progress.done){lesson[1]='Your order handler already updates inventory. You do not need to add the lines again. Add one Dark Roast to your cart, place an order, and watch the inventory to verify the shared state.';lesson[2]='';lesson[3]='';}$('lesson').replaceChildren(element('div','Step '+Math.min(progress.step+1,12)+' of 12','eyebrow'),element('h2',lesson[0]),element('p',questions[progress.step],'experiment-question'),instructionParagraph(lesson[1]));
  if(lesson[4]||lesson[2]||lesson[3]){
    const hint=element('details','','code-hint');hint.append(element('summary','Show code hint'));
    if(lesson[4]){hint.append(element('p',projectPath+'/'+lesson[4],'path'));const copy=element('button','Copy file path','secondary');copy.onclick=()=>copyPath(projectPath+'/'+lesson[4],copy);hint.append(copy);}
    if(lesson[2])hint.append(element('p',progress.step===9?'Read the current quantity:':'Find:'),element('pre',lesson[2]));
    if(lesson[3])hint.append(element('p',progress.step===9?'Then update it:':progress.step===7?'Add:':'Change to:'),element('pre',lesson[3]));
    $('lesson').append(hint);
  }
  if(progress.step===11){$('lesson').append(element('p','To restart this project, run:'),element('pre',restartCommand));const link=element('a','Continue learning');link.href='https://counterfact.dev/docs/first-10-minutes/';$('lesson').append(link);}
  if(progress.done&&progress.step<11){const next=element('p','');next.append(element('strong','Click Continue'),element('span',' to move to the next lesson.'));$('lesson').append(next);}
  $('guide-status').textContent=progress.done?(progress.step===6&&progress.inventoryUpdated?'Your saved order handler already reduces stock. Continue to verify the shared inventory.':successes[progress.step]):'';
  $('continue').hidden=!(progress.done||progress.step===0);$('continue').textContent=progress.step===0?'Start shopping':'Continue';$('back').hidden=progress.step===0;$('skip').hidden=progress.step===11;updateAction();
}
function checkProgress(){if(progress.done)showLesson();else updateAction();}
function onCart(){updateAction();if(progress.step===1&&cart['house-blend'])$('guide-status').textContent='Your cart is ready. Click Place order.';if(progress.step===3&&cart.decaf)$('guide-status').textContent='Decaf is in your cart. Click Place order.';}
function onProducts(){
  progress.products(Object.fromEntries(products.map(product=>[product.id,product.stock])));checkProgress();
  if(!progress.done&&progress.step===2)$('guide-status').textContent='Decaf is still unavailable. Check the displayed file, save your change, then watch for the product response.';
  if(!progress.done&&[7,8].includes(progress.step)&&progress.lastOrder)$('guide-status').textContent='The inventory has not decreased as expected. Check that your new lines are in the successful-order section, save, buy another bag, and watch its effect.';
}
function onOrder(success,items,status){
  progress.order(success,items,products.find(product=>product.id==='dark-roast')?.stock||0,status);checkProgress();
  if(success&&[6,7,8,10].includes(progress.step)&&!progress.done)$('guide-status').textContent='The order went through. Watching for the product response to show the inventory.';
  if(success&&progress.step===4)$('guide-status').textContent='This order succeeded. Save ordersAvailable = false, add another coffee, and try again.';
}
$('refresh').onclick=()=>refreshProducts();$('checkout').onclick=placeOrder;
$('continue').onclick=()=>{progress.next();showLesson();refreshProducts({source:'lesson'});};$('back').onclick=()=>{progress.back();showLesson();refreshProducts({source:'lesson'});};$('skip').onclick=()=>{progress.skip();showLesson();refreshProducts({source:'lesson'});};
async function copyPath(path,button){try{await navigator.clipboard.writeText(path);button.textContent='Copied';}catch{$('guide-status').textContent='Select and copy the path shown in the instructions.';}}
$('copy-path').onclick=()=>copyPath(projectPath,$('copy-path'));
function saveProgress(){if(!sessionId)return;try{sessionStorage.setItem('counterfact-coffee',JSON.stringify({sessionId,progress,cart,manualStages,history:observations.events}));}catch{}}
async function startWalkthrough(){
  try{
    const {response,result:info}=await requestJson('/tutorial-info');if(!response.ok)throw Error('Project information unavailable');sessionId=info.sessionId;
    const saved=JSON.parse(sessionStorage.getItem('counterfact-coffee')||'null');
    if(saved&&saved.sessionId===sessionId&&saved.progress&&Number.isInteger(saved.progress.step)&&saved.progress.step>=0&&saved.progress.step<=11){
      observations.restore(saved.history);
      if(saved.manualStages&&typeof saved.manualStages==='object')manualStages=Object.fromEntries(Object.entries(saved.manualStages).filter(([step,stage])=>Number.isInteger(Number(step))&&Number(step)>=0&&Number(step)<=11&&Number.isInteger(stage)&&stage>=0&&stage<=4));
      progress.step=saved.progress.step;progress.done=saved.progress.done===true;progress.inventoryUpdated=saved.progress.inventoryUpdated===true;
      if(typeof saved.progress.failedItems==='string')progress.failedItems=saved.progress.failedItems;
      const previous=saved.progress.lastOrder;
      if(previous&&Number.isInteger(previous.stock)&&Array.isArray(previous.items)&&previous.items.every(item=>['house-blend','dark-roast','decaf'].includes(item.productId)&&Number.isSafeInteger(item.quantity)&&item.quantity>0))progress.lastOrder=previous;
      if(saved.cart&&typeof saved.cart==='object')cart=Object.fromEntries(Object.entries(saved.cart).filter(([id,quantity])=>['house-blend','dark-roast','decaf'].includes(id)&&Number.isSafeInteger(quantity)&&quantity>0));
    }
  }catch{ /* A missing or corrupt saved lesson starts a fresh browser lesson. */ }
  showLesson();renderCart();renderPurchaseEffect();await refreshProducts();
}
$('project-path').textContent=projectPath;const walkthroughReady=startWalkthrough();
setInterval(()=>{if(!busy&&!document.hidden)refreshProducts({source:'live'});},1000);
window.addEventListener('focus',()=>{if(!busy)refreshProducts({source:'live'});});
</script></body></html>`;
}
