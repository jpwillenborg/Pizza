import React from 'react';

export default function PizzaDashboard({ menu, size, setSize, selectedToppings, handleToppingToggle, resetToppings, getPizzaPrice, formatCurrency, cart, setCart, handleCheckout, checkoutError, isSubmitting }) {
  const basePricesKeys = menu && menu.basePrices ? Object.keys(menu.basePrices) : [];
  const toppingsList = menu && menu.toppings ? menu.toppings : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-24">
      <div className="col-span-1 flex flex-col gap-6">
        <div>
          <h3 className="m-[0_0_1.25rem_0] text-[1.4rem] font-bold text-white">1. Build Your Pizza</h3>
          <div className="bg-background-surface p-6 rounded-[16px] shadow-flat-card transition-colors duration-250 ease-out hover:bg-background-hover">
            <h4 className="text-[1.05rem] font-bold text-white mb-4 uppercase tracking-wider font-mono">Select Base Size</h4>
            <div className="grid grid-cols-3 gap-3">
              {basePricesKeys.length === 0 ? (
                <p className="text-slateText-muted italic text-sm col-span-3">Loading size parameters...</p>
              ) : (
                basePricesKeys.map((s) => {
                  const isSelected = size === s;
                  const basePrice = menu.basePrices[s];
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSize(s)}
                      className={`flex flex-col items-center justify-center py-1.5 px-3.5 rounded-[12px] cursor-pointer transition-all duration-200 border-0 outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/20 ${
                        isSelected ? 'bg-accent-primary text-background' : 'bg-background text-slateText-muted hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className={`capitalize text-[1.05rem] tracking-wide mb-0 ${isSelected ? 'text-background font-medium' : 'font-medium'}`}>
                        {s}
                      </span>
                      <span className={`text-[1.1rem] font-mono -mt-[4px] ${isSelected ? 'text-background font-medium' : 'text-slateText-muted'}`}>
                        {formatCurrency(basePrice)}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="bg-background-surface p-6 rounded-[16px] shadow-flat-card transition-colors duration-250 ease-out hover:bg-background-hover">
          <h4 className="text-[1.05rem] font-bold text-white mb-4 uppercase tracking-wider font-mono">Select Ingredients</h4>
          <div className="flex flex-col gap-3">
            {toppingsList.length === 0 ? (
              <p className="text-slateText-muted italic text-sm">Loading inventory logs...</p>
            ) : (
              toppingsList.map((t) => {
                const isChecked = selectedToppings.includes(t.id);
                return (
                  <label key={t.id} className={`flex items-center justify-between p-4 border-0 rounded-[12px] cursor-pointer box-border w-full transition-all duration-200 font-medium ${isChecked ? 'bg-background' : 'bg-background hover:bg-white/5'}`}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={() => handleToppingToggle(t.id)} 
                        className="accent-accent-primary w-4 h-4 rounded focus-visible:ring-2 focus-visible:ring-accent-primary/20" 
                      /> 
                      <span className={`text-[1.05rem] ${isChecked ? 'text-accent-primary' : 'text-white'}`}>{t.name}</span>
                      {t.code && <strong className="text-accent-primary text-[0.85rem] font-mono ml-1">[{t.code}]</strong>} 
                    </div>
                    <span className="text-slateText-muted text-[1.1rem] font-mono">+{formatCurrency(t.price)}</span>
                  </label>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-background-surface p-6 rounded-[16px] shadow-flat-card transition-colors duration-250 ease-out hover:bg-background-hover">
          <div className="flex justify-between items-center mb-6">
            <span className="font-semibold text-slateText-muted text-[1.05rem]">Current Build Cost:</span>
            <strong className="text-[1.35rem] text-accent-primary font-bold font-mono">{formatCurrency(getPizzaPrice(size, selectedToppings))}</strong>
          </div>
          <button 
            className="w-full py-4 bg-accent-primary text-background border-0 rounded-[6px] py-[0.55rem] text-[0.85rem] font-bold font-sans cursor-pointer shadow-flat-btn transition-all duration-200 hover:bg-accent-light outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/20" 
            onClick={() => { 
              setCart([...cart, { id: Date.now(), size, toppings: [...selectedToppings], price: getPizzaPrice(size, selectedToppings) }]); 
              resetToppings();
            }}
          >
            Add Pizza to Order
          </button>
        </div>
      </div>

      <div className="col-span-1 md:pl-10">
        <h3 className="m-[0_0_1.25rem_0] text-[1.4rem] font-bold text-white">2. Your Cart</h3>
        {cart.length === 0 ? (
          <div className="text-center p-12 border-0 rounded-[12px] bg-background-surface">
            <p className="text-slateText-muted m-0 italic text-[1.05rem]">Your cart is empty. Build a pizza and add it to your cart to begin.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              {cart.map((item) => (
                <div key={item.id} className="bg-background-surface p-4 rounded-[16px] flex justify-between items-center shadow-md">
                  <div>
                    <span className="capitalize font-bold text-[1.05rem] text-white">{item.size} Size Pizza</span>
                    <div className="text-[0.85rem] text-slateText-muted mt-1 font-sans">
                      Toppings: {item.toppings.length === 0 ? 'None' : item.toppings.map(tId => menu.toppings?.find(t => t.id === tId)?.name).join(', ')}
                    </div>
                  </div>
                  <strong className="text-[1.1rem] text-white font-bold font-mono">{formatCurrency(item.price)}</strong>
                </div>
              ))}
            </div>

            <div className="bg-background-surface p-5 rounded-[12px] shadow-flat-card">
              <h4 className="m-[0_0_0.5rem_0] text-[1.05rem] font-bold text-white uppercase tracking-wider font-mono">Demo Checkout</h4>
              <p className="m-0 text-slateText-muted text-[0.9rem] leading-relaxed">This portfolio demo does not process payments or collect personal details. Orders use fictional customer records inside your visitor sandbox.</p>
            </div>

            <div className="bg-background-surface p-5 rounded-[12px] shadow-flat-card">
              <div className="flex justify-between text-[1.25rem] font-bold mb-5 text-white">
                <span>Order Total:</span>
                <span className="text-accent-primary font-mono">{formatCurrency(cart.reduce((sum, i) => sum + i.price, 0))}</span>
              </div>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-accent-primary text-background border-0 rounded-[6px] py-[0.55rem] text-[0.85rem] font-bold font-sans cursor-pointer shadow-flat-btn transition-all duration-200 hover:bg-accent-light outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/20" 
                onClick={handleCheckout}
              >
                {isSubmitting ? 'Submitting...' : 'Place Demo Order'}
              </button>
              {checkoutError && <p role="alert" className="text-red-300 text-sm mt-3">{checkoutError}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
