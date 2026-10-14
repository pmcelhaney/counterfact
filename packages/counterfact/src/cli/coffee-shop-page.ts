export function coffeeShopPage(projectPath: string): string {
  const path = JSON.stringify(projectPath).replace(/</gu, "\\u003c");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Counterfact Coffee · Guided example</title>
<style>
:root{font-family:system-ui,-apple-system,sans-serif;color:#30251f;background:#f6f3ed;font-size:16px}*{box-sizing:border-box}body{margin:0}button{font:inherit;cursor:pointer;border:0;border-radius:8px;padding:11px 16px;background:#325848;color:white;font-weight:650}button:disabled{background:#e8e3dc;color:#786f64;cursor:not-allowed}button.secondary{background:#ece8df;color:#30251f}button:focus-visible,a:focus-visible{outline:3px solid #ba7738;outline-offset:3px}a{color:#325848}.layout{display:grid;grid-template-columns:minmax(310px,380px) 1fr;min-height:100vh}.guide{padding:36px 30px;background:#fff;border-right:1px solid #ddd7ce}.eyebrow{font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:#74634f}h1{font-family:Georgia,serif;font-size:36px;margin:8px 0 10px}h2{font-size:25px;line-height:1.2}h3{margin:0 0 8px}p{line-height:1.6}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f5f3ef;padding:14px;border-radius:8px;font-size:13px;line-height:1.5}.path{font-size:12px;overflow-wrap:anywhere;color:#6b6054}.shop{padding:36px;max-width:1100px;width:100%;margin:auto}.shop-head{display:flex;justify-content:space-between;gap:20px;align-items:center}.demo{font-size:13px;color:#766b60}.products{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;margin:28px 0}.card{background:#fff;border:1px solid #e2dcd3;border-radius:14px;padding:20px;display:flex;flex-direction:column}.bag{height:145px;display:grid;place-items:center;margin-bottom:20px;background:#efe3cb;border-radius:8px}.bag.dark-roast{background:#ddd5cb}.bag.decaf{background:#dbe8dc}.bag-label{background:#fffdf6;border:1px solid #ddd;padding:22px 14px;text-align:center;box-shadow:5px 5px 0 #0001;font-family:Georgia,serif;font-size:22px}.card p{font-size:14px;flex:1;color:#716454}.stock{font-size:13px;margin:10px 0}.price{font-weight:700}.cart{background:white;border:1px solid #e2dcd3;border-radius:14px;padding:24px}.cart-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #eee}.cart-row button{padding:5px 10px}.cart-footer{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-top:22px}.notice{padding:16px;background:#e5efe8;border-radius:8px;margin:18px 0}.error{background:#fff0e9;color:#8c381e}.guide-footer{margin-top:35px;border-top:1px solid #eee;padding-top:18px;font-size:13px}.controls{display:flex;gap:8px;flex-wrap:wrap;margin-top:20px}.controls button{font-size:13px}#guide-status:empty{display:none}@media(max-width:1000px){.products{grid-template-columns:1fr}.bag{height:90px}.shop{padding:24px}.bag-label{padding:10px 16px}}@media(max-width:680px){.layout{grid-template-columns:1fr}.guide{border-right:0;border-bottom:1px solid #ddd}.shop-head{align-items:start;flex-direction:column}}
</style></head><body><main class="layout">
<aside class="guide" aria-label="Walkthrough instructions"><div class="eyebrow">Counterfact · Learn by doing</div><div id="lesson"></div><p id="guide-status" role="status" aria-live="polite"></p><div class="controls"><button id="continue" hidden>Continue</button><button id="repeat" class="secondary">Repeat instructions</button><button id="skip" class="secondary">Skip lesson</button></div><div class="guide-footer">Your example project<p class="path" id="project-path"></p><button id="copy-path" class="secondary">Copy project path</button><p>Keep Counterfact running in your terminal. Use your own editor for changes.</p></div></aside>
<section class="shop" aria-label="Coffee shop"><header class="shop-head"><div><div class="eyebrow">Small batch · Big comfort</div><h1>Counterfact Coffee</h1><div class="demo">A local demo shop. No payments or real orders.</div></div><button id="refresh" class="secondary">Refresh products</button></header><div id="shop-notice" role="status" aria-live="polite"></div><div id="products" class="products"></div><section class="cart" aria-label="Shopping cart"><h2>Your cart</h2><div id="cart"></div><div class="cart-footer"><strong id="total"></strong><button id="checkout" disabled>Place order</button></div></section></section>
</main><script>
const projectPath = ${path};
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
  try{const response=await fetch('/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items})});const result=await response.json();if(!response.ok){notice(response.status===409?result.error:'We couldn’t place your order. Your cart is kept—please try again.',true);$('checkout').textContent='Try again';onOrder(false,items);return;}if(response.status!==201||!Number.isInteger(result.orderId))throw Error('Invalid order confirmation');cart={};notice('Thanks! Demo order #'+result.orderId+' is confirmed.');$('checkout').textContent='Place order';renderProducts();onOrder(true,items);}
  catch(error){notice('We couldn’t place your order. Your cart is kept—please try again.',true);$('checkout').textContent='Try again';$('guide-status').textContent='The order request could not be completed. Check Counterfact and retry.';}
  finally{busy=false;renderCart();}
}
function showLesson(){ $('lesson').replaceChildren(element('h2','Make your first purchase'),element('p','Add one bag of House Blend to your cart, then place an order. These are demo purchases; no payment is needed.')); }
function onCart(){$('guide-status').textContent='Your cart is ready. Click Place order.';}
function onProducts(){}
function onOrder(success){if(success)$('guide-status').textContent='Your first order went through. The shop sent a request to Counterfact and received a successful response.';}
$('refresh').onclick=refreshProducts;$('checkout').onclick=placeOrder;$('repeat').onclick=showLesson;$('skip').onclick=()=>{$('lesson').replaceChildren(element('h2','Keep exploring'),element('p','The shop and API remain running.'))};
$('copy-path').onclick=async()=>{try{await navigator.clipboard.writeText(projectPath);$('copy-path').textContent='Copied';}catch{ $('guide-status').textContent='Select and copy the project path below.';}};
$('project-path').textContent=projectPath;showLesson();renderCart();refreshProducts();
</script></body></html>`;
}
