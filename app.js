const products = [
  {id:1,name:"Wireless Headphones",category:"Audio",price:1499,emoji:"🎧",tone:"#eeeaff"},
  {id:2,name:"Smart Watch",category:"Wearables",price:2199,emoji:"⌚",tone:"#e8f3ff"},
  {id:3,name:"Everyday Backpack",category:"Accessories",price:999,emoji:"🎒",tone:"#fff0e7"},
  {id:4,name:"Travel Water Bottle",category:"Lifestyle",price:399,emoji:"🧴",tone:"#e7f5ef"},
  {id:5,name:"Bluetooth Speaker",category:"Audio",price:1299,emoji:"🔊",tone:"#fff0f3"},
  {id:6,name:"Desk Lamp",category:"Home",price:799,emoji:"💡",tone:"#fff6dc"},
  {id:7,name:"Running Shoes",category:"Fitness",price:1899,emoji:"👟",tone:"#eaf2ff"},
  {id:8,name:"Sunglasses",category:"Accessories",price:599,emoji:"🕶️",tone:"#f1edff"}
];

const STORAGE_KEY = "shopease-cart-v1";
let cart = loadCart();
const productGrid = document.getElementById("product-grid");
const cartItems = document.getElementById("cart-items");
const toast = document.getElementById("toast");
let toastTimer;

function loadCart(){
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter(item =>
      products.some(product => product.id === item.id) &&
      Number.isInteger(item.quantity) && item.quantity > 0
    ) : [];
  } catch(error) {
    console.warn("Could not read saved cart:", error);
    return [];
  }
}
function saveCart(){
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); }
  catch(error){ showToast("Unable to save cart in this browser."); }
}
function money(amount){ return "₹" + amount.toLocaleString("en-IN"); }

function renderProducts(){
  productGrid.innerHTML = products.map(product => `
    <article class="product-card">
      <div class="product-visual" style="background:${product.tone}" aria-hidden="true">${product.emoji}</div>
      <p class="product-category">${product.category}</p>
      <h3>${product.name}</h3>
      <div class="product-bottom">
        <span class="price">${money(product.price)}</span>
        <button class="add-button" type="button" data-add="${product.id}" aria-label="Add ${product.name} to cart">Add to cart +</button>
      </div>
    </article>`).join("");
}

function renderCart(){
  const count = cart.reduce((sum,item) => sum + item.quantity, 0);
  document.getElementById("cart-count").textContent = count;
  document.getElementById("cart-title-count").textContent = `(${count})`;

  if(cart.length === 0){
    cartItems.innerHTML = `<div class="empty-cart"><span>🛍️</span><h3>Your cart is empty</h3><p>Add a product to see it here.</p></div>`;
  } else {
    cartItems.innerHTML = cart.map(item => {
      const product = products.find(p => p.id === item.id);
      return `<article class="cart-item">
        <div class="cart-thumb" style="background:${product.tone}" aria-hidden="true">${product.emoji}</div>
        <div><h3>${product.name}</h3><p class="muted">${money(product.price)} each · ${money(product.price * item.quantity)}</p></div>
        <div class="cart-actions">
          <div class="qty-control" aria-label="Quantity for ${product.name}">
            <button type="button" data-qty="${product.id}" data-change="-1" aria-label="Decrease quantity">−</button>
            <span>${item.quantity}</span>
            <button type="button" data-qty="${product.id}" data-change="1" aria-label="Increase quantity">+</button>
          </div>
          <button class="remove-button" type="button" data-remove="${product.id}">Remove</button>
        </div>
      </article>`;
    }).join("");
  }

  const subtotal = cart.reduce((sum,item) => {
    const product = products.find(p => p.id === item.id);
    return sum + product.price * item.quantity;
  }, 0);
  const delivery = subtotal === 0 || subtotal >= 2000 ? 0 : 99;
  document.getElementById("subtotal").textContent = money(subtotal);
  document.getElementById("delivery").textContent = delivery === 0 ? "Free" : money(delivery);
  document.getElementById("total").textContent = money(subtotal + delivery);
  document.getElementById("delivery-note").textContent =
    subtotal >= 2000 ? "Your order qualifies for free delivery!" : "Delivery is free on orders of ₹2,000 or more.";
  document.getElementById("checkout").disabled = cart.length === 0;
  document.getElementById("checkout").style.opacity = cart.length === 0 ? ".55" : "1";
}

function addToCart(id){
  const existing = cart.find(item => item.id === id);
  if(existing) existing.quantity += 1;
  else cart.push({id,quantity:1});
  saveCart(); renderCart();
  const product = products.find(p => p.id === id);
  showToast(`${product.name} added to cart.`);
}
function changeQuantity(id,change){
  const item = cart.find(entry => entry.id === id);
  if(!item) return;
  item.quantity += change;
  if(item.quantity <= 0) cart = cart.filter(entry => entry.id !== id);
  saveCart(); renderCart();
}
function removeFromCart(id){
  cart = cart.filter(item => item.id !== id);
  saveCart(); renderCart(); showToast("Product removed from cart.");
}
function showToast(message){
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

productGrid.addEventListener("click", event => {
  const button = event.target.closest("[data-add]");
  if(button) addToCart(Number(button.dataset.add));
});
cartItems.addEventListener("click", event => {
  const qtyButton = event.target.closest("[data-qty]");
  const removeButton = event.target.closest("[data-remove]");
  if(qtyButton) changeQuantity(Number(qtyButton.dataset.qty), Number(qtyButton.dataset.change));
  if(removeButton) removeFromCart(Number(removeButton.dataset.remove));
});
document.getElementById("clear-cart").addEventListener("click", () => {
  cart = []; saveCart(); renderCart(); showToast("Cart cleared.");
});

const dialog = document.getElementById("checkout-dialog");
document.getElementById("checkout").addEventListener("click", () => {
  if(cart.length === 0) return;
  const subtotal = cart.reduce((sum,item) => sum + products.find(p => p.id === item.id).price * item.quantity, 0);
  const delivery = subtotal >= 2000 ? 0 : 99;
  const lines = cart.map(item => {
    const product = products.find(p => p.id === item.id);
    return `<div>${product.name} × ${item.quantity} <strong style="float:right">${money(product.price * item.quantity)}</strong></div>`;
  }).join("");
  document.getElementById("checkout-details").innerHTML =
    `${lines}<hr><div>Subtotal <strong style="float:right">${money(subtotal)}</strong></div><div>Delivery <strong style="float:right">${delivery ? money(delivery) : "Free"}</strong></div><div><strong>Total</strong><strong style="float:right">${money(subtotal + delivery)}</strong></div>`;
  dialog.showModal();
});
document.getElementById("close-dialog").addEventListener("click", () => dialog.close());
document.getElementById("finish-demo").addEventListener("click", () => dialog.close());

renderProducts();
renderCart();
