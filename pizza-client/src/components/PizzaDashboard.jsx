import React from 'react';

export default function PizzaDashboard({ menu, size, setSize, selectedToppings, handleToppingToggle, resetToppings, getPizzaPrice, formatCurrency, cart, setCart, handleCheckout, checkoutError, isSubmitting }) {
  const basePricesKeys = menu && menu.basePrices ? Object.keys(menu.basePrices) : [];
  const toppingsList = menu && menu.toppings ? menu.toppings : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-24 text-left md:min-h-[820px] md:mt-10 relative">
      <div className="col-span-1 flex flex-col justify-start gap-4 w-full relative">
        <h3 className="m-0 text-[1.4rem] font-bold text-white mt-4 md:mt-0">1. Build Your Pizza</h3>
        <div className="flex flex-col gap-6 w-full">
          <div className="bg-background-surface p-6 rounded-[16px] shadow-flat-card transition-colors duration-250 ease-out hover:bg-background-hover w-full box-border">
            <h4 className="text-[1.05rem] font-bold text-white mb-4 uppercase tracking-wider font-mono">Select Base Size</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
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
                      className={`flex md:flex-col flex-row items-center md:justify-center justify-between p-3 md:py-3 md:px-4 rounded-[12px] cursor-pointer transition-all duration-200 border-0 outline-none w-full box-border md:text-center focus-visible:ring-2 focus-visible:ring-accent-primary/20 ${
                        isSelected ? 'bg-accent-primary text-background' : 'bg-background text-slateText-muted hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className={`capitalize text-[0.95rem] md:text-[1rem] tracking-wide m-0 leading-tight ${isSelected ? 'text-background font-semibold' : 'font-medium text-white'}`}>
                        {s} Size
                      </span>
                      <span className={`text-[0.88rem] md:text-[0.9rem] font-mono mt-0.5 md:mt-1 block leading-tight ${isSelected ? 'text-background font-bold' : 'text-slateText-muted/60 font-medium'}`}>
                        {formatCurrency(basePrice)}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-background-surface p-6 rounded-[16px] shadow-flat-card transition-colors duration-250 ease-out hover:bg-background-hover w-full box-border">
            <h4 className="text-[1.05rem] font-bold text-white mb-4 uppercase tracking-wider font-mono">Select Ingredients</h4>
            <div className="flex flex-col gap-3 w-full">
              {toppingsList.length === 0 ? (
                <p className="text-slateText-muted italic text-sm">Loading inventory logs...</p>
              ) : (
                toppingsList.map((t) => {
                  const isChecked = selectedToppings.includes(t.id);
                  return (
                    <label key={t.id} className={`flex flex-col md:flex-row items-start md:items-center justify-between p-4 border-0 rounded-[12px] cursor-pointer box-border w-full transition-all duration-200 font-medium gap-1 md:gap-4 ${isChecked ? 'bg-background' : 'bg-background hover:bg-white/5'}`}>
                      
                      <div className="flex items-center gap-3 w-full md:min-w-0 md:flex-grow">
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={() => handleToppingToggle(t.id)} 
                          className="accent-accent-primary w-4 h-4 rounded flex-shrink-0 focus-visible:ring-2 focus-visible:ring-accent-primary/20" 
                        /> 
                        <span className={`text-[1.05rem] leading-snug whitespace-normal break-words ${isChecked ? 'text-accent-primary font-semibold' : 'text-white'}`}>
                          {t.name}
                        </span>
                      </div>

                      <div className="flex-shrink-0 flex items-center gap-2 ml-7 md:ml-auto font-mono text-[0.88rem] mt-0.5 md:mt-0">
                        {t.code && <strong className="text-accent-primary/50 font-bold">[{t.code}]</strong>} 
                        <span className="text-slateText-muted/80 font-medium">+{formatCurrency(t.price)}</span>
                      </div>

                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="bg-background-surface p-6 rounded-[16px] shadow-flat-card transition-colors duration-250 ease-out hover:bg-background-hover w-full box-border">
            <div className="flex justify-between items-center mb-6 w-full">
              <span className="font-semibold text-white text-[1.05rem]">Current Build Cost:</span>
              <strong className="text-[1.35rem] text-accent-primary font-bold font-mono">{formatCurrency(getPizzaPrice(size, selectedToppings))}</strong>
            </div>
            <button 
              className="w-full py-4 md:py-3 bg-accent-primary text-background border-0 rounded-[6px] text-[0.85rem] font-bold font-sans cursor-pointer shadow-flat-btn transition-all duration-200 hover:bg-accent-light outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/20" 
              onClick={() => { 
                setCart([...cart, { id: Date.now(), size, toppings: [...selectedToppings], price: getPizzaPrice(size, selectedToppings) }]); 
                resetToppings();
              }}
            >
              Add Pizza to Order
            </button>
          </div>
        </div>
      </div>
      <div className="col-span-1 md:pl-10 w-full flex flex-col justify-start gap-4 relative">
        <h3 className="m-0 text-[1.4rem] font-bold text-white mt-4 md:mt-0">2. Your Cart</h3>
        {cart.length === 0 ? (
          <div className="text-center p-12 border-0 rounded-[12px] bg-background-surface w-full box-border">
            <p className="text-slateText-muted m-0 italic text-[1.05rem]">Your cart is empty. Build a pizza and add it to your cart to begin.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 w-full">
            {cart.map((item) => {
              return (
                <div key={item.id} className="bg-background-surface p-4 rounded-[16px] flex justify-between items-center shadow-md w-full box-border">
                  <div>
                    <span className="capitalize font-bold text-[1.05rem] text-white">{item.size} Size Pizza</span>
                    <div className="text-[0.85rem] text-slateText-muted mt-1 font-sans">
                      Toppings: {item.toppings.length === 0 ? 'Cheese' : item.toppings.map(tId => menu.toppings?.find(t => t.id === tId)?.name).join(', ')}
                    </div>
                  </div>
                  <strong className="text-[1.1rem] text-white font-bold font-mono">{formatCurrency(item.price)}</strong>
                </div>
              );
            })}
          </div>
        )}

        {cart.length > 0 && (
          <div className="flex flex-col gap-4 w-full relative mt-6 md:mt-8">
            <h3 className="m-0 text-[1.4rem] font-bold text-white mt-4 md:mt-0">3. Place Order</h3>
            
            <div className="bg-background-surface p-5 rounded-[12px] shadow-flat-card w-full box-border flex flex-col gap-4">
              <div>
                <h4 className="m-0 text-[1.05rem] font-bold text-white uppercase tracking-wider font-mono">Demo Checkout</h4>
                <p className="mt-1 mb-0 text-slateText-muted text-[0.82rem] italic leading-normal">Fictional test parameters; no visitor contact details are collected.</p>
              </div>
              
              <div className="flex flex-col gap-3.5 text-left">
                <div>
                  <label className="block text-slateText-muted/50 font-bold uppercase tracking-wider text-[0.72rem] mb-1.5">Name:</label>
                  <input 
                    type="text" 
                    value="Sandbox Guest" 
                    readOnly 
                    className="w-full box-border p-4 md:p-4 bg-background border-0 text-white rounded-[6px] text-[0.9rem] font-medium outline-none opacity-80 cursor-not-allowed select-none"
                  />
                </div>
                <div>
                  <label className="block text-slateText-muted/50 font-bold uppercase tracking-wider text-[0.72rem] mb-1.5">Phone:</label>
                  <input 
                    type="text" 
                    value="(555) 867-5309" 
                    readOnly 
                    className="w-full box-border p-4 md:p-4 bg-background border-0 text-white/90 rounded-[6px] text-[0.88rem] font-mono outline-none opacity-80 cursor-not-allowed select-none"
                  />
                </div>
                <div>
                  <label className="block text-slateText-muted/50 font-bold uppercase tracking-wider text-[0.72rem] mb-1.5">Address:</label>
                  <input 
                    type="text" 
                    value="DEMO DELIVERY ONLY" 
                    readOnly 
                    className="w-full box-border p-4 md:p-4 bg-background border-0 text-white/80 rounded-[6px] text-[0.9rem] font-medium outline-none opacity-80 cursor-not-allowed select-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-background-surface p-5 rounded-[12px] shadow-flat-card w-full box-border mt-6">
              <div className="flex justify-between text-[1.25rem] font-bold mb-5 text-white w-full">
                <span>Order Total:</span>
                <span className="text-accent-primary font-mono">{formatCurrency(cart.reduce((sum, i) => sum + i.price, 0))}</span>
              </div>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 md:py-3 bg-accent-primary text-background border-0 rounded-[6px] text-[0.85rem] font-bold font-sans cursor-pointer shadow-flat-btn transition-all duration-200 hover:bg-accent-light outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/20" 
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
