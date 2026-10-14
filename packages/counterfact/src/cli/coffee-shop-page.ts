import { CoffeeShopProgress } from "./coffee-shop-progress.js";

export function coffeeShopPage(projectPath: string): string {
  const path = JSON.stringify(projectPath).replace(/</gu, "\\u003c");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Counterfact Coffee · Guided example</title>
<style>
:root{font-family:system-ui,-apple-system,sans-serif;color:#30251f;background:#f6f3ed;font-size:16px}*{box-sizing:border-box}body{margin:0}button{font:inherit;cursor:pointer;border:0;border-radius:8px;padding:11px 16px;background:#325848;color:white;font-weight:650}button:disabled{background:#e8e3dc;color:#786f64;cursor:not-allowed}button.secondary{background:#ece8df;color:#30251f}button:focus-visible,a:focus-visible{outline:3px solid #ba7738;outline-offset:3px}a{color:#325848}.layout{display:grid;grid-template-columns:minmax(310px,380px) 1fr;min-height:100vh}.guide{padding:36px 30px;background:#fff;border-right:1px solid #ddd7ce}.eyebrow{font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:#74634f}h1{font-family:Georgia,serif;font-size:36px;margin:8px 0 10px}h2{font-size:25px;line-height:1.2}h3{margin:0 0 8px}p{line-height:1.6}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f5f3ef;padding:14px;border-radius:8px;font-size:13px;line-height:1.5}.path{font-size:12px;overflow-wrap:anywhere;color:#6b6054}.shop{padding:36px;max-width:1100px;width:100%;margin:auto}.shop-head{display:flex;justify-content:space-between;gap:20px;align-items:center}.demo{font-size:13px;color:#766b60}.products{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin:28px 0}.card{background:#fff;border:1px solid #e2dcd3;border-radius:14px;padding:20px;display:flex;flex-direction:column}.bag{height:145px;display:grid;place-items:center;margin-bottom:20px;background:#efe3cb;border-radius:8px}.bag.dark-roast{background:#ddd5cb}.bag.decaf{background:#dbe8dc}.bag-label{background:#fffdf6;border:1px solid #ddd;padding:22px 14px;text-align:center;box-shadow:5px 5px 0 #0001;font-family:Georgia,serif;font-size:22px}.card p{font-size:14px;flex:1;color:#716454}.stock{font-size:13px;margin:10px 0}.price{font-weight:700}.cart{background:white;border:1px solid #e2dcd3;border-radius:14px;padding:24px}.cart-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #eee}.cart-row button{padding:5px 10px}.cart-footer{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-top:22px}.notice{padding:16px;background:#e5efe8;border-radius:8px;margin:18px 0}.error{background:#fff0e9;color:#8c381e}.guide-footer{margin-top:35px;border-top:1px solid #eee;padding-top:18px;font-size:13px}.controls{display:flex;gap:8px;flex-wrap:wrap;margin-top:20px}.controls button{font-size:13px}#guide-status:empty{display:none}@media(max-width:1000px){.products{grid-template-columns:1fr}.bag{height:90px}.shop{padding:24px}.bag-label{padding:10px 16px}}@media(max-width:680px){.layout{grid-template-columns:1fr}.guide{border-right:0;border-bottom:1px solid #ddd}.shop-head{align-items:start;flex-direction:column}}
</style></head><body><main class="layout">
<aside class="guide" aria-label="Walkthrough instructions"><div class="eyebrow">Counterfact · Learn by doing</div><div id="lesson"></div><p id="guide-status" role="status" aria-live="polite"></p><div class="controls"><button id="continue" hidden>Continue</button><button id="back" class="secondary" hidden>Back</button><button id="repeat" class="secondary">Repeat instructions</button><button id="skip" class="secondary">Skip lesson</button></div><div class="guide-footer">Your example project<p class="path" id="project-path"></p><button id="copy-path" class="secondary">Copy project path</button><p>Keep Counterfact running in your terminal. Use your own editor for changes.</p></div></aside>
<section class="shop" aria-label="Coffee shop"><header class="shop-head"><div><div class="eyebrow">Small batch · Big comfort</div><h1>Counterfact Coffee</h1><div class="demo">A local demo shop. No payments or real orders.</div></div><button id="refresh" class="secondary">Refresh products</button></header><div id="shop-notice" role="status" aria-live="polite"></div><div id="products" class="products"></div><section class="cart" aria-label="Shopping cart"><h2>Your cart</h2><div id="cart"></div><div class="cart-footer"><strong id="total"></strong><button id="checkout" disabled>Place order</button></div></section></section>
</main><script>
const projectPath = ${path};
${CoffeeShopProgress.toString()}
const progress = new CoffeeShopProgress();
const $ = (id) => document.getElementById(id);
const money = (cents) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents / 100);
let products = [], cart = {}, busy = false;
function element(tag,text,className){const node=document.createElement(tag);node.textContent=text;if(className)node.className=className;return node;}
function notice(text,error=false){$('shop-notice').replaceChildren(element('p',text,'notice'+(error?' error':'')));}
function renderProducts(){
  $('products').replaceChildren();
  for(const product of products){
    const card=element('article','', 'card');card.dataset.productId=product.id;
    const bag=element('div','','bag '+product.id);bag.append(element('div',product.name,'bag-label'));card.append(bag,element('h3',product.name),element('p',product.description),element('div',money(product.price)+' / 250g','price'));
    card.append(element('div',product.stock>0?product.stock+' bags available':'Sold out','stock'));
    const add=element('button','Add to cart');add.disabled=product.stock<=0||((cart[product.id]||0)>=product.stock);add.onclick=()=>{cart[product.id]=(cart[product.id]||0)+1;$('shop-notice').replaceChildren();renderProducts();renderCart();onCart();};card.append(add);$('products').append(card);
  }
}
function renderCart(){
  $('cart').replaceChildren();let total=0;
  for(const [id,quantity] of Object.entries(cart)){
    const product=products.find(p=>p.id===id);if(!product)continue;total+=product.price*quantity;
    const row=element('div','','cart-row');row.append(element('span',product.name+' × '+quantity));const remove=element('button','Remove','secondary');remove.onclick=()=>{delete cart[id];renderProducts();renderCart();};row.append(remove);$('cart').append(row);
  }
  if(!Object.keys(cart).length)$('cart').append(element('p','Your cart is empty. Choose a coffee above.'));
  $('total').textContent=money(total);$('checkout').disabled=busy||!Object.keys(cart).length;
}
async function refreshProducts(){
  $('refresh').disabled=true;
  try{const response=await fetch('/products');if(!response.ok)throw Error('Could not load products');const next=await response.json();if(!Array.isArray(next)||next.some(p=>!Number.isInteger(p.stock)||p.stock<0))throw Error('Invalid product response');products=next;renderProducts();renderCart();onProducts();}
  catch(error){notice('We couldn’t load the products. Check Counterfact, then click Refresh products to try again.',true);$('guide-status').textContent='The product request failed. Check your edit and save the file, then refresh again.';}
  finally{$('refresh').disabled=false;}
}
async function placeOrder(){
  if(busy||!Object.keys(cart).length)return;busy=true;renderCart();const items=Object.entries(cart).map(([productId,quantity])=>({productId,quantity}));
  try{const response=await fetch('/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items})});const result=await response.json();if(!response.ok){notice(response.status===409?result.error:'We couldn’t place your order. Your cart is kept—please try again.',true);$('checkout').textContent='Try again';onOrder(false,items,response.status);return;}if(response.status!==201||!Number.isInteger(result.orderId))throw Error('Invalid order confirmation');cart={};notice('Thanks! Demo order #'+result.orderId+' is confirmed.');$('checkout').textContent='Place order';renderProducts();onOrder(true,items,response.status);}
  catch(error){notice('We couldn’t place your order. Your cart is kept—please try again.',true);$('checkout').textContent='Try again';$('guide-status').textContent='The order request could not be completed. Check Counterfact and retry.';}
  finally{busy=false;renderCart();}
}
const lessons = [
  ['Your local coffee shop is running','First, make a purchase. Then change the API and see how the shop responds. Keep Counterfact running in your terminal.'],
  ['Buy a bag of House Blend','Add House Blend to your cart, then click Place order. No payment is needed.'],
  ['Put Decaf back in stock','Decaf is sold out. Open routes/products.ts in your editor. Change its starting stock from 0 to 5, save, then click Refresh products.','const decafStock = 0;','const decafStock = 5;','routes/products.ts'],
  ['Buy the coffee you made available','Add Decaf to the cart and place an order. Your API change made this purchase possible.'],
  ['Try an order failure','Add a coffee to your cart. Open routes/orders.ts, change ordersAvailable to false, and save. Then click Place order.','const ordersAvailable = true;','const ordersAvailable = false;','routes/orders.ts'],
  ['Restore ordering and retry','In the same file, restore ordersAvailable to true and save. Click Try again. Your cart is still there.','const ordersAvailable = false;','const ordersAvailable = true;','routes/orders.ts'],
  ['Shouldn’t there be fewer bags left?','Buy one bag of Dark Roast, then click Refresh products. The starter order handler accepts purchases but doesn’t subtract stock yet.'],
  ['Make an order update inventory','Products read shared context. Open routes/_.context.ts to see inventory, then open routes/orders.ts. Add these lines at the INVENTORY LESSON comment, save, buy one Dark Roast, and refresh products.','', 'for (const item of items) {\\n  $.context.inventory[item.productId] -= item.quantity;\\n}', 'routes/orders.ts'],
  ['Watch Dark Roast sell out','Add the remaining Dark Roast bags to your cart and place an order. Then refresh products. Its Add to cart button should become disabled.'],
  ['Restock through the REPL','Switch to the terminal where Counterfact is running. At the ⬣> prompt, inspect the inventory, then put five bags back in stock. Return here and refresh products.','context.inventory["dark-roast"]','context.inventory["dark-roast"] = 5'],
  ['Buy from the updated inventory','Buy one Dark Roast, then refresh products. You should see four bags remaining. The REPL and order handler changed the same context.'],
  ['You changed a shopping workflow','You made a product available, tested failure and recovery, updated context in a handler, and restocked it through the REPL. The app and Counterfact are still running. Keep experimenting.'],
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
function showLesson(){
  const lesson=lessons[progress.step];$('lesson').replaceChildren(element('div','Step '+Math.min(progress.step+1,12)+' of 12','eyebrow'),element('h2',lesson[0]),element('p',lesson[1]));
  if(lesson[4]){
    $('lesson').append(element('p',projectPath+'/'+lesson[4],'path'));
    const copy=element('button','Copy file path','secondary');copy.onclick=()=>copyPath(projectPath+'/'+lesson[4],copy);$('lesson').append(copy);
  }
  if(lesson[2])$('lesson').append(element('p',progress.step===9?'Read the current quantity:':'Find:'),element('pre',lesson[2]));
  if(lesson[3])$('lesson').append(element('p',progress.step===9?'Then update it:':progress.step===7?'Add:':'Change to:'),element('pre',lesson[3]));
  if(progress.step===11){$('lesson').append(element('p','To restart this project, run:'),element('pre','npx counterfact "'+projectPath+'/openapi.json" "'+projectPath+'"'));const link=element('a','Continue learning');link.href='https://counterfact.dev/docs/first-10-minutes/';$('lesson').append(link);}
  $('guide-status').textContent=progress.done?successes[progress.step]:'';
  $('continue').hidden=!(progress.done||progress.step===0);$('continue').textContent=progress.step===0?'Start shopping':'Continue';$('back').hidden=progress.step===0;$('skip').hidden=progress.step===11;$('repeat').hidden=progress.step===11;
}
function checkProgress(){if(progress.done)showLesson();}
function onCart(){if(progress.step===1&&cart['house-blend'])$('guide-status').textContent='Your cart is ready. Click Place order.';if(progress.step===3&&cart.decaf)$('guide-status').textContent='Decaf is in your cart. Click Place order.';}
function onProducts(){
  progress.products(Object.fromEntries(products.map(product=>[product.id,product.stock])));checkProgress();
  if(!progress.done&&progress.step===2)$('guide-status').textContent='Decaf is still unavailable. Check the displayed file, save your change, then refresh again.';
  if(!progress.done&&progress.step===7&&progress.lastOrder)$('guide-status').textContent='The inventory has not decreased as expected. Check that your new lines are in the successful-order section, save, buy another bag, and refresh.';
}
function onOrder(success,items,status){
  progress.order(success,items,products.find(product=>product.id==='dark-roast')?.stock||0,status);checkProgress();
  if(success&&[6,7,8,10].includes(progress.step)&&!progress.done)$('guide-status').textContent='The order went through. Now click Refresh products to see the inventory.';
  if(success&&progress.step===4)$('guide-status').textContent='This order succeeded. Save ordersAvailable = false, add another coffee, and try again.';
}
$('refresh').onclick=refreshProducts;$('checkout').onclick=placeOrder;$('repeat').onclick=showLesson;
$('continue').onclick=()=>{progress.next();showLesson();};$('back').onclick=()=>{progress.back();showLesson();};$('skip').onclick=()=>{progress.skip();showLesson();};
async function copyPath(path,button){try{await navigator.clipboard.writeText(path);button.textContent='Copied';}catch{$('guide-status').textContent='Select and copy the path shown in the instructions.';}}
$('copy-path').onclick=()=>copyPath(projectPath,$('copy-path'));
$('project-path').textContent=projectPath;showLesson();renderCart();refreshProducts();
</script></body></html>`;
}
