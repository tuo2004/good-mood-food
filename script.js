// Edit these entries to change the sample menu.
const dishes = [
  { name: "Lemon Chicken Rice", price: "£8.50", ingredients: "Chicken, rice, lemon and parsley." },
  { name: "Tomato and Basil Pasta", price: "£7.50", ingredients: "Pasta, tomatoes, basil and olive oil." },
  { name: "Roasted Vegetable Bowl", price: "£7.00", ingredients: "Chickpeas, peppers, courgettes and rice." }
];

const menu = document.querySelector("#menu");
const template = document.querySelector("#dish-template");

for (const dish of dishes) {
  const card = template.content.cloneNode(true);
  card.querySelector("h3").textContent = dish.name;
  card.querySelector(".price").textContent = dish.price;
  card.querySelector(".ingredients").textContent = dish.ingredients;
  menu.append(card);
}
