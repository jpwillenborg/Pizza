import React, { useState } from 'react';
import './styles/index.css';
import SiteNavbar from './components/SiteNavbar';
import SiteFooter from './components/SiteFooter';
import DashboardHeader from './components/DashboardHeader';
import TrackingView from './components/TrackingView';
import KitchenAdmin from './components/KitchenAdmin';
import PizzaDashboard from './components/PizzaDashboard';
import { usePizzaSockets } from './hooks/usePizzaSockets';
import { formatCurrency, getNumericPrice } from './utils/priceUtils';

export default function App() {
  const {
    menu,
    loading,
    sandboxKey,
    sandboxError,
    orderStatus,
    setOrderStatus,
    trackingError,
    trackOrder,
    isTracking,
    API_BASE_URL
  } = usePizzaSockets();

  const [size, setSize] = useState('medium');
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [cart, setCart] = useState([]);
  const [view, setView] = useState('dashboard');
  const [checkoutError, setCheckoutError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToppingToggle = (id) => {
    setSelectedToppings((prev) =>
      prev.includes(id) ? prev.filter((tId) => tId !== id) : [...prev, id]
    );
  };

  const resetToppings = () => {
    setSelectedToppings([]);
  };

  const getPizzaPrice = (pSize, pToppings) => {
    if (!menu || !menu.basePrices) return 0;
    const base = getNumericPrice(menu.basePrices[pSize]);
    const toppingsPrice = pToppings.reduce((sum, id) => {
      const match = menu.toppings?.find(t => t.id === id);
      return sum + (match ? getNumericPrice(match.price) : 0);
    }, 0);
    return base + toppingsPrice;
  };

  const handleCheckout = async () => {
    setCheckoutError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-sandbox-key': sandboxKey },
        body: JSON.stringify({ items: cart })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || result.error || 'Unable to place the demo order.');

      trackOrder(result.id);
      setView('tracking');
      setCart([]);
    } catch (error) {
      setCheckoutError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[80vh] w-full bg-[#090d16] text-center">
        <h2 className="text-[#00e5ff] font-mono font-medium text-[1.2rem] tracking-wider">Syncing Web Service</h2>
        <p className="text-[#a0aec0] mt-2 font-mono text-[1.2rem] opacity-80">This may take up to 30 seconds if the service is asleep</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen flex flex-col justify-between bg-[#090d16] relative font-sans antialiased text-[#a0aec0]">
      <div className="app-shell flex flex-col w-full max-w-full overflow-x-hidden box-border flex-grow md:min-h-[820px]">
        <SiteNavbar />
        <div className="pt-[125px] md:pt-[140px] lg:pt-[160px] pb-4 px-6 sm:px-8 md:px-[40px] lg:px-6 w-full relative z-10 flex flex-col justify-start flex-grow">
          <div className="max-w-[1024px] mx-auto w-full flex flex-col justify-start flex-grow">
            <DashboardHeader view={view} isTracking={isTracking} setView={setView} />
            {sandboxError && <p role="alert" className="text-red-300 text-sm">{sandboxError}</p>}

            <div className="w-full box-border flex flex-col justify-start flex-grow">
              {view === 'tracking' && (
                <TrackingView orderStatus={orderStatus} trackingError={trackingError} setView={setView} setIsTracking={() => {}} />
              )}
              
              {view === 'admin' && (
                <KitchenAdmin 
                  orderStatus={orderStatus} setOrderStatus={setOrderStatus} apiBaseUrl={API_BASE_URL} sandboxKey={sandboxKey}
                  formatCurrency={formatCurrency} getNumericPrice={getNumericPrice} 
                />
              )}
              
              {view === 'dashboard' && (
                <PizzaDashboard 
                  menu={menu} size={size} setSize={setSize} selectedToppings={selectedToppings} 
                  handleToppingToggle={handleToppingToggle} resetToppings={resetToppings} getPizzaPrice={getPizzaPrice} 
                  formatCurrency={formatCurrency} cart={cart} setCart={setCart} handleCheckout={handleCheckout}
                  checkoutError={checkoutError} isSubmitting={isSubmitting}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
