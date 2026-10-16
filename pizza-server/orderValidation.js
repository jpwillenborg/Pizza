export function validateOrderItems(items, menu) {
  if (!Array.isArray(items) || items.length === 0) {
    return { error: 'Add at least one pizza to the order.' };
  }

  if (items.length > 10) {
    return { error: 'An order cannot contain more than 10 pizzas.' };
  }

  let total = 0;
  const validatedItems = [];

  for (const item of items) {
    if (!item || !Object.hasOwn(menu.basePrices, item.size)) {
      return { error: 'The order contains an invalid pizza size.' };
    }

    if (!Array.isArray(item.toppings) || item.toppings.length > menu.toppings.length) {
      return { error: 'The order contains an invalid topping selection.' };
    }

    const uniqueToppings = new Set(item.toppings);
    if (uniqueToppings.size !== item.toppings.length) {
      return { error: 'Toppings cannot be selected more than once.' };
    }

    const toppingIds = new Set(menu.toppings.map((topping) => topping.id));
    if (item.toppings.some((toppingId) => !toppingIds.has(toppingId))) {
      return { error: 'The order contains an unavailable topping.' };
    }

    const toppingsTotal = item.toppings.reduce((sum, toppingId) => {
      const topping = menu.toppings.find((candidate) => candidate.id === toppingId);
      return sum + topping.price;
    }, 0);
    const verifiedPrice = menu.basePrices[item.size] + toppingsTotal;

    total += verifiedPrice;
    validatedItems.push({ size: item.size, toppings: item.toppings, verifiedPrice });
  }

  return { items: validatedItems, total };
}