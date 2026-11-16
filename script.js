const dishes = new Map(menuGroups.flatMap(group => group.dishes).map(dish => [dish.id, dish]));
const basket = new Map();
const compared = new Set();
const compareButtons = new Map();
const currency = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });

const menuSections = document.querySelector("#menu-sections");
const dishTemplate = document.querySelector("#dish-template");
const basketRowTemplate = document.querySelector("#basket-row-template");
const basketItems = document.querySelector("#basket-items");
const comparison = document.querySelector("#comparison");
const reviewOrder = document.querySelector("#review-order");
const checkout = document.querySelector("#checkout");
const checkoutHeading = document.querySelector("#checkout-heading");
const checkoutReview = document.querySelector("#checkout-review");
const confirmOrder = document.querySelector("#confirm-order");
const closeCheckout = document.querySelector("#close-checkout");
const orderConfirmation = document.querySelector("#order-confirmation");
const status = document.querySelector("#status");

function money(pence) {
  return currency.format(pence / 100);
}

function announce(message) {
  status.textContent = message;
}

function renderMenu() {
  for (const group of menuGroups) {
    const section = document.createElement("section");
    const heading = document.createElement("h2");
    section.id = group.id;
    heading.textContent = group.name;
    heading.id = group.id + "-heading";
    section.setAttribute("aria-labelledby", heading.id);
    section.append(heading);

    for (const dish of group.dishes) {
      const card = dishTemplate.content.cloneNode(true);
      card.querySelector("h3").textContent = dish.name;
      card.querySelector(".price").textContent = money(dish.price);
      card.querySelector(".description").textContent = dish.description;
      card.querySelector(".ingredients").textContent = dish.ingredients;
      card.querySelector(".flavour").textContent = dish.flavour;
      card.querySelector(".allergens").textContent = dish.allergens;

      const add = card.querySelector(".add");
      add.setAttribute("aria-label", "Add " + dish.name + " to basket");
      add.addEventListener("click", () => changeQuantity(dish.id, 1));

      const compare = card.querySelector(".compare");
      compare.setAttribute("aria-label", "Compare " + dish.name);
      compare.addEventListener("click", () => toggleComparison(dish.id));
      compareButtons.set(dish.id, compare);
      section.append(card);
    }

    menuSections.append(section);
  }
}

function basketTotal() {
  let total = 0;
  for (const [id, quantity] of basket) {
    total += dishes.get(id).price * quantity;
  }
  return total;
}

function changeQuantity(id, change) {
  const quantity = (basket.get(id) ?? 0) + change;
  if (quantity > 0) {
    basket.set(id, quantity);
  } else {
    basket.delete(id);
  }
  renderBasket();
  const name = dishes.get(id).name;
  const update = quantity > 0 ? name + ": " + quantity + " in basket." : name + " removed.";
  announce(update + " Total " + money(basketTotal()) + ".");
}

function renderBasket() {
  const active = document.activeElement;
  const restoreKey = active.closest("#basket-items") ? active.dataset.focusKey : undefined;
  const restoreIndex = Array.from(basketItems.querySelectorAll("button")).indexOf(active);
  const rows = document.createDocumentFragment();
  let count = 0;

  for (const [id, quantity] of basket) {
    const dish = dishes.get(id);
    const row = basketRowTemplate.content.cloneNode(true);
    row.querySelector(".basket-name").textContent = dish.name;
    row.querySelector(".basket-subtotal").textContent = money(dish.price * quantity);
    row.querySelector(".quantity").textContent = quantity;

    const actions = [
      [".decrease", "Decrease quantity of ", -1],
      [".increase", "Increase quantity of ", 1],
      [".remove", "Remove ", -quantity]
    ];
    for (const [selector, label, change] of actions) {
      const button = row.querySelector(selector);
      button.dataset.focusKey = id + selector;
      button.setAttribute("aria-label", label + dish.name);
      button.addEventListener("click", () => changeQuantity(id, change));
    }
    rows.append(row);
    count += quantity;
  }

  basketItems.replaceChildren(rows);
  document.querySelector("#basket-count").textContent = "(" + count + ")";
  document.querySelector("#tool-basket-count").textContent = "(" + count + ")";
  document.querySelector("#basket-empty").hidden = count > 0;
  document.querySelector("#basket-total").textContent = money(basketTotal());
  reviewOrder.disabled = count === 0;

  if (restoreKey) {
    const buttons = Array.from(basketItems.querySelectorAll("button"));
    const target = buttons.find(button => button.dataset.focusKey === restoreKey)
      ?? buttons[Math.min(restoreIndex, buttons.length - 1)]
      ?? document.querySelector("#basket-heading");
    target.focus();
  }
}

function toggleComparison(id) {
  const dish = dishes.get(id);
  if (compared.has(id)) {
    compared.delete(id);
    announce(dish.name + " removed from comparison.");
  } else if (compared.size < 2) {
    compared.add(id);
    announce(dish.name + " added to comparison." + (compared.size === 2 ? " Two dishes are ready to compare." : ""));
  } else {
    announce("Remove a dish from the comparison before adding another.");
    showOrderPanel("compare", compareButtons.get(id));
    return;
  }
  renderComparison();

  const card = compareButtons.get(id).closest(".dish");
  const oldLink = card.querySelector(".compare-link");
  oldLink?.remove();
  if (compared.has(id)) {
    const link = document.createElement("a");
    link.className = "compare-link";
    link.href = "#compare";
    link.textContent = "View comparison";
    card.querySelector(".actions").append(link);
  }
}

function renderComparison() {
  document.querySelector("#tool-compare-count").textContent = "(" + compared.size + ")";
  comparison.replaceChildren();
  for (const [id, button] of compareButtons) {
    button.setAttribute("aria-pressed", String(compared.has(id)));
  }

  document.querySelector("#compare-help").textContent = compared.size === 2
    ? "Remove a dish to compare a different one."
    : "Select up to two dishes from the menu.";

  for (const id of compared) {
    const dish = dishes.get(id);
    const card = document.createElement("article");
    const heading = document.createElement("h3");
    heading.textContent = dish.name;
    const facts = document.createElement("dl");
    const entries = [
      ["Price", money(dish.price)],
      ["Flavour", dish.flavour],
      ["Ingredients", dish.ingredients],
      ["Allergens", dish.allergens]
    ];
    for (const [label, value] of entries) {
      const term = document.createElement("dt");
      const description = document.createElement("dd");
      term.textContent = label;
      description.textContent = value;
      facts.append(term, description);
    }

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "text-button";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", "Remove " + dish.name + " from comparison");
    remove.addEventListener("click", () => {
      toggleComparison(id);
      document.querySelector("#compare-heading").focus();
    });
    card.append(heading, facts, remove);
    comparison.append(card);
  }
}

reviewOrder.addEventListener("click", () => {
  const orderItems = document.querySelector("#order-items");
  orderItems.replaceChildren();

  for (const [id, quantity] of basket) {
    const dish = dishes.get(id);
    const item = document.createElement("li");
    item.textContent = quantity + " × " + dish.name + " · " + money(dish.price * quantity);
    orderItems.append(item);
  }
  document.querySelector("#order-total").textContent = money(basketTotal());
  checkoutHeading.textContent = "Review demo order";
  checkoutReview.hidden = false;
  confirmOrder.hidden = false;
  orderConfirmation.hidden = true;
  closeCheckout.textContent = "Back to basket";
  checkout.showModal();
});

confirmOrder.addEventListener("click", () => {
  orderConfirmation.textContent = "Your demo order for " + money(basketTotal()) + " is complete.";
  checkoutHeading.textContent = "Demo order confirmed";
  checkoutReview.hidden = true;
  confirmOrder.hidden = true;
  orderConfirmation.hidden = false;
  closeCheckout.textContent = "Done";
  basket.clear();
  renderBasket();
  closeCheckout.focus();
  announce("Demo order confirmed.");
});

closeCheckout.addEventListener("click", () => checkout.close());
checkout.addEventListener("close", () => {
  (reviewOrder.disabled ? document.querySelector("#basket-heading") : reviewOrder).focus();
});


const orderDrawer = document.querySelector("#order-drawer");
const narrowOrderLayout = window.matchMedia("(max-width: 1060px)");
let drawerPanel;
let drawerTrigger;

function showOrderPanel(id, trigger) {
  const panel = document.getElementById(id);
  const heading = document.getElementById(id + "-heading");
  if (!narrowOrderLayout.matches) {
    heading.focus({ preventScroll: true });
    return;
  }
  if (orderDrawer.open) return;

  drawerPanel = panel;
  drawerTrigger = trigger;
  orderDrawer.setAttribute("aria-labelledby", heading.id);
  orderDrawer.prepend(panel);
  orderDrawer.showModal();
  heading.focus({ preventScroll: true });
}

document.addEventListener("click", event => {
  const trigger = event.target.closest('[data-panel], .compare-link, .header-links a[href="#basket"]');
  if (!trigger) return;
  const isBasketLink = trigger.getAttribute("href") === "#basket";
  if (isBasketLink && !narrowOrderLayout.matches) return;
  event.preventDefault();
  showOrderPanel(isBasketLink ? "basket" : (trigger.dataset.panel ?? "compare"), trigger);
});

function closeOrderPanel() {
  orderDrawer.close();
  document.getElementById(drawerPanel.id + "-rail").append(drawerPanel);
  if (narrowOrderLayout.matches) drawerTrigger?.focus({ preventScroll: true });
  drawerPanel = undefined;
  drawerTrigger = undefined;
}

document.querySelector("#close-drawer").addEventListener("click", closeOrderPanel);
orderDrawer.addEventListener("cancel", event => {
  event.preventDefault();
  closeOrderPanel();
});
narrowOrderLayout.addEventListener("change", () => {
  if (!narrowOrderLayout.matches && orderDrawer.open) closeOrderPanel();
});

renderMenu();
