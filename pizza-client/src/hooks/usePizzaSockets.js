import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://onrender.com';
const SANDBOX_STORAGE_KEY = 'pizza-demo-sandbox';
const PERSISTENT_TRACK_KEY = 'activePizzaOrder';

let sandboxSessionRequest;

function getSandboxSession() {
  const storedSession = sessionStorage.getItem(SANDBOX_STORAGE_KEY);
  if (storedSession) {
    try {
      const session = JSON.parse(storedSession);
      if (session.adminKey && Date.parse(session.expiresAt) > Date.now()) {
        return Promise.resolve(session);
      }
    } catch {
      sessionStorage.removeItem(SANDBOX_STORAGE_KEY);
    }
    sessionStorage.removeItem(SANDBOX_STORAGE_KEY);
  }

  if (!sandboxSessionRequest) {
    sandboxSessionRequest = fetch(`${API_BASE_URL}/api/sandboxes`, { method: 'POST' })
      .then(async (response) => {
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          throw new Error('The Pizza API is missing visitor sandbox support. Redeploy the latest pizza-server service on Render, then reload this page.');
        }

        const session = await response.json();
        if (!response.ok) throw new Error(session.error || 'Unable to create a private demo sandbox.');
        if (!session.adminKey || !session.expiresAt) {
          throw new Error('The Pizza API returned an incomplete sandbox session. Redeploy the latest pizza-server service on Render, then reload this page.');
        }
        sessionStorage.setItem(SANDBOX_STORAGE_KEY, JSON.stringify(session));
        return session;
      })
      .finally(() => {
        sandboxSessionRequest = undefined;
      });
  }

  return sandboxSessionRequest;
}

const socket = io(API_BASE_URL, {
  transports: ['websocket'],
  upgrade: false
});

const FALLBACK_MENU = {
  basePrices: { small: 6.50, medium: 8.00, large: 10.50 },
  toppings: [
    { id: 'pepperoni', name: 'Pepperoni', price: 1.00, code: 'PEP' },
    { id: 'ham', name: 'Ham', price: 1.00, code: 'HAM' },
    { id: 'bacon', name: 'Bacon', price: 1.50, code: 'BCN' },
    { id: 'red_peppers', name: 'Red Peppers', price: 0.75, code: 'PEP' },
    { id: 'pineapple', name: 'Pineapple', price: 0.75, code: 'PIN' },
    { id: 'onions', name: 'Onions', price: 0.50, code: 'ONN' },
    { id: 'extra_cheese', name: 'Extra Cheese', price: 1.00, code: 'CHS' }
  ]
};

export function usePizzaSockets() {
  const [menu, setMenu] = useState(FALLBACK_MENU);
  const [loading, setLoading] = useState(true);
  const [sandboxKey, setSandboxKey] = useState('');
  const [sandboxError, setSandboxError] = useState('');
  const [orderStatus, setOrderStatus] = useState('Received');
  const [trackedOrderId, setTrackedOrderId] = useState(() => {
    return localStorage.getItem(PERSISTENT_TRACK_KEY);
  });
  const [trackingError, setTrackingError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const menuRequest = fetch(`${API_BASE_URL}/api/menu`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Menu request failed.');
        return response.json();
      });

    Promise.all([menuRequest, getSandboxSession()])
      .then(([data, session]) => {
        if (!isActive) return;
        if (data?.basePrices && data?.toppings) setMenu(data);
        setSandboxKey(session.adminKey);
      })
      .catch((error) => {
        if (error.name !== 'AbortError' && isActive) {
          setMenu(FALLBACK_MENU);
          setSandboxError(error.message);
        }
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);
  useEffect(() => {
    if (!trackedOrderId || !sandboxKey) return undefined;

    const trackCurrentOrder = () => socket.emit('track_order', { id: trackedOrderId, sandboxKey });
    const updateCurrentOrder = ({ id, status }) => {
      if (id === trackedOrderId) setOrderStatus(status);
    };
    const handleOrderNotFound = () => setTrackingError('This demo order could not be found.');

    socket.on('connect', trackCurrentOrder);
    socket.on('order_status_changed', updateCurrentOrder);
    socket.on('order_not_found', handleOrderNotFound);
    if (socket.connected) trackCurrentOrder();

    return () => {
      socket.off('connect', trackCurrentOrder);
      socket.off('order_status_changed', updateCurrentOrder);
      socket.off('order_not_found', handleOrderNotFound);
    };
  }, [trackedOrderId, sandboxKey]);

  const trackOrder = (orderId) => {
    setTrackingError('');
    setOrderStatus('Received');
    localStorage.setItem(PERSISTENT_TRACK_KEY, orderId);
    setTrackedOrderId(orderId);
  };

  return {
    menu,
    loading,
    sandboxKey,
    sandboxError,
    orderStatus,
    setOrderStatus,
    trackingError,
    trackOrder,
    isTracking: !!trackedOrderId,
    API_BASE_URL
  };
}
