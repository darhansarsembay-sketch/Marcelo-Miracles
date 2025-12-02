import { useState, useEffect, useMemo } from 'react';
import { Search, ShoppingBag, Menu, X, ChevronLeft, MessageCircle, Trash2, Plus, Minus } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface User {
  id: number;
  username: string;
  firstName: string;
}

const PRODUCTS: Product[] = [
  { id: '1', name: 'La Seine Coat Black', price: 22000, category: 'Верхняя одежда', image: '/placeholder-LaSeineCoatBlack.jpg' },
  { id: '2', name: 'Reversible Fur Zip Hoodie Black', price: 15000, category: 'Худи и свитера', image: '/placeholder-ReversibleFurZipHoodieBlack.jpg' },
  { id: '3', name: 'Fragment Shirt Grey', price: 10000, category: 'Рубашки', image: '/placeholder-FragmentShirtGrey.jpg' },
  { id: '4', name: 'Paris Longsleeve Black', price: 7500, category: 'Футболки и лонгсливы', image: '/placeholder-ParisLongsleeveBlack.jpg' },
  { id: '5', name: 'Serpent Flare Denim Grey', price: 10000, category: 'Штаны и деним', image: '/placeholder-SerpentFlareDenimGrey.jpg' },
  { id: '6', name: 'Diana Bag Black', price: 50000, category: 'Сумки', image: '/placeholder-DianaBagBlack.jpg' },
  { id: '7', name: 'Address iPhone Case Black', price: 2000, category: 'Аксессуары', image: '/placeholder-AddressiPhoneCaseBlack.jpg' },
  { id: '8', name: 'Siberian Bomber Black', price: 25000, category: 'Верхняя одежда', image: '/placeholder-SiberianBomberBlack.jpg' },
  { id: '9', name: 'Paris Hoodie Black', price: 9000, category: 'Худи и свитера', image: '/placeholder-ParisHoodieBlack.jpg' },
  { id: '10', name: 'EDEC T-Shirt Black', price: 4000, category: 'Футболки и лонгсливы', image: '/placeholder-EDEC-T-Shirt-Black.jpg' },
];

const CATEGORIES = [
  'Все товары',
  'Верхняя одежда',
  'Худи и свитера',
  'Рубашки',
  'Футболки и лонгсливы',
  'Штаны и деним',
  'Сумки',
  'Аксессуары',
];

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const getTelegramWebApp = () => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp;
  }
  return {
    initDataUnsafe: {
      user: { id: 123456789, username: 'testuser', first_name: 'Test' }
    },
    initData: 'mock_init_data',
    ready: () => {},
    expand: () => {},
    close: () => {},
    openTelegramLink: (url: string) => window.open(url, '_blank'),
  };
};

function App() {
  const [page, setPage] = useState<'home' | 'catalog' | 'cart' | 'checkout' | 'search'>('home');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Все товары');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    username: '',
    phone: '',
  });
  const tg = getTelegramWebApp();

  useEffect(() => {
    tg.ready();
    tg.expand();
    
    const telegramUser = tg.initDataUnsafe?.user;
    if (telegramUser) {
      setUser({
        id: telegramUser.id,
        username: telegramUser.username || '',
        firstName: telegramUser.first_name || '',
      });
      setCheckoutForm(prev => ({
        ...prev,
        username: telegramUser.username || '',
        name: telegramUser.first_name || '',
      }));
    }
  }, []);

  const handleAdminActivation = async (query: string) => {
    if (query.toLowerCase() === 'noggeratemywhopper' && user) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/admin/activate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            username: user.username,
            initData: tg.initData,
          }),
        });
        
        if (response.ok) {
          setIsAdmin(true);
          alert('🎉 Вы стали администратором!');
        }
      } catch (error) {
        console.error('Admin activation failed:', error);
      }
    }
  };

  const filteredProducts = useMemo(() => {
    let products = PRODUCTS;
    
    if (selectedCategory !== 'Все товары') {
      products = products.filter(p => p.category === selectedCategory);
    }
    
    if (searchQuery) {
      products = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return products;
  }, [selectedCategory, searchQuery]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQuantity = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckout = async () => {
    if (!checkoutForm.name || !checkoutForm.phone) {
      alert('Пожалуйста, заполните все поля');
      return;
    }

    try {
      const orderData = {
        userId: user?.id,
        username: checkoutForm.username,
        name: checkoutForm.name,
        phone: checkoutForm.phone,
        items: cart,
        total: cartTotal,
        initData: tg.initData,
      };

      await fetch(`${BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      alert('✅ Спасибо! Ваш заказ принят. Скоро с вами свяжемся.');
      setCart([]);
      
      setTimeout(() => {
        tg.close();
      }, 5000);
      
    } catch (error) {
      alert('Ошибка при отправке заказа. Попробуйте ещё раз.');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits.length <= 1) return `+7 (${digits}`;
    if (digits.length <= 4) return `+7 (${digits.slice(1, 4)}`;
    if (digits.length <= 7) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}`;
    if (digits.length <= 9) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}`;
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  };

  if (page === 'home') {
    return (
      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(/images/bg.jpg)',
            filter: 'brightness(0.3)',
          }}
        />
        
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
          <h1 className="text-5xl md:text-7xl font-bold mb-16 text-center tracking-wider">
            MARCELO<br/>MIRACLES
          </h1>
          
          <div className="space-y-4 w-full max-w-md">
            <button
              onClick={() => setPage('catalog')}
              className="w-full py-4 px-6 bg-white text-black font-semibold text-lg hover:bg-gray-200 transition-all transform hover:scale-105"
            >
              Ассортимент
            </button>
            
            <button
              onClick={() => setPage('cart')}
              className="w-full py-4 px-6 bg-white text-black font-semibold text-lg hover:bg-gray-200 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <ShoppingBag size={24} />
              Корзина
              {cartItemsCount > 0 && (
                <span className="bg-black text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                  {cartItemsCount}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full py-4 px-6 bg-white text-black font-semibold text-lg hover:bg-gray-200 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <Search size={24} />
              Поиск
            </button>
            
            <button
              onClick={() => tg.openTelegramLink('https://t.me/marcelo_admin')}
              className="w-full py-4 px-6 bg-gray-800 text-white font-semibold text-lg hover:bg-gray-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <MessageCircle size={24} />
              Связаться с администрацией
            </button>
          </div>
          
          {isAdmin && (
            <div className="mt-8 px-4 py-2 bg-yellow-600 text-black rounded text-sm font-bold">
              👑 ADMIN MODE
            </div>
          )}
        </div>
      </div>
    );
  }

  if (page === 'catalog') {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="sticky top-0 z-50 bg-black border-b border-gray-800 px-4 py-4 flex items-center justify-between">
          <button onClick={() => setPage('home')} className="p-2 hover:bg-gray-800 rounded">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-bold">MARCELO MIRACLES</h2>
          <div className="flex gap-2">
            <button onClick={() => setSearchOpen(true)} className="p-2 hover:bg-gray-800 rounded">
              <Search size={20} />
            </button>
            <button onClick={() => setPage('cart')} className="p-2 hover:bg-gray-800 rounded relative">
              <ShoppingBag size={20} />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-black rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
        <div className="flex">
          <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-gray-900 border-r border-gray-800 overflow-hidden`}>
            <div className="p-4">
              <h3 className="text-sm font-bold mb-4 text-gray-400">КАТЕГОРИИ</h3>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-4 py-3 mb-2 rounded transition-all ${
                    selectedCategory === cat 
                      ? 'bg-white text-black font-semibold' 
                      : 'hover:bg-gray-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="fixed left-0 top-20 bg-gray-800 p-2 rounded-r z-40 hover:bg-gray-700"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex-1 p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <div key={product.id} className="bg-gray-900 rounded-lg overflow-hidden group cursor-pointer hover:transform hover:scale-105 transition-all">
                  <div className="aspect-[3/4] bg-gray-800 relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-xs p-2 text-center">
                      {product.name}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold mb-2 text-sm">{product.name}</h3>
                    <p className="text-lg mb-3">{formatPrice(product.price)}</p>
                    <button
                      onClick={() => addToCart(product)}
                      className="w-full py-2 bg-white text-black font-semibold text-sm hover:bg-gray-200 transition-all"
                    >
                      В корзину
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (page === 'cart') {
    return (
      <div className="min-h-screen bg-black text-white pb-32">
        <div className="sticky top-0 z-50 bg-black border-b border-gray-800 px-4 py-4 flex items-center justify-between">
          <button onClick={() => setPage('catalog')} className="p-2 hover:bg-gray-800 rounded">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-bold">КОРЗИНА</h2>
          <div className="w-10" />
        </div>
        <div className="p-4">
          {cart.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <ShoppingBag size={64} className="mx-auto mb-4 opacity-50" />
              <p>Корзина пуста</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="bg-gray-900 rounded-lg p-4 flex gap-4">
                  <div className="w-20 h-28 bg-gray-800 rounded flex-shrink-0 flex items-center justify-center text-xs text-gray-600 p-1 text-center">
                    {item.name}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold mb-1">{item.name}</h3>
                    <p className="text-gray-400 mb-2">{formatPrice(item.price)}</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center hover:bg-gray-700"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center hover:bg-gray-700"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 hover:bg-gray-800 rounded h-fit"
                  >
                    <Trash2 size={20} className="text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg">Итого:</span>
              <span className="text-2xl font-bold">{formatPrice(cartTotal)}</span>
            </div>
            <button
              onClick={() => setPage('checkout')}
              className="w-full py-4 bg-white text-black font-bold text-lg hover:bg-gray-200 transition-all"
            >
              Оформить заказ
            </button>
          </div>
        )}
      </div>
    );
  }

  if (page === 'checkout') {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="sticky top-0 z-50 bg-black border-b border-gray-800 px-4 py-4 flex items-center justify-between">
          <button onClick={() => setPage('cart')} className="p-2 hover:bg-gray-800 rounded">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-bold">ОФОРМЛЕНИЕ</h2>
          <div className="w-10" />
        </div>
        <div className="p-6 max-w-2xl mx-auto">
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Имя и фамилия</label>
              <input
                type="text"
                value={checkoutForm.name}
                onChange={(e: any) => setCheckoutForm((prev: { name: string; username: string; phone: string }) => ({ ...prev, name: e.target.value }))}
                className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-3 focus:outline-none focus:border-white"
                placeholder="Иван Иванов"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Telegram username</label>
              <input
                type="text"
                value={checkoutForm.username}
                onChange={(e: any) => setCheckoutForm((prev: { name: string; username: string; phone: string }) => ({ ...prev, username: e.target.value }))}
                className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-3 focus:outline-none focus:border-white"
                placeholder="@username"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Номер телефона</label>
              <input
                type="tel"
                value={checkoutForm.phone}
                onChange={(e: any) => setCheckoutForm((prev: { name: string; username: string; phone: string }) => ({ ...prev, phone: formatPhone(e.target.value) }))}
                className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-3 focus:outline-none focus:border-white"
                placeholder="+7 (999) 123-45-67"
              />
            </div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 mb-6">
            <h3 className="font-bold mb-4">Ваш заказ:</h3>
            {cart.map(item => (
              <div key={item.id} className="flex justify-between mb-2 text-sm">
                <span>{item.name} × {item.quantity}</span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t border-gray-700 mt-4 pt-4 flex justify-between font-bold text-lg">
              <span>Итого:</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
          </div>
          <button
            onClick={handleCheckout}
            className="w-full py-4 bg-white text-black font-bold text-lg hover:bg-gray-200 transition-all"
          >
            Отправить заказ
          </button>
        </div>
      </div>
    );
  }

  if (searchOpen) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="sticky top-0 bg-black border-b border-gray-800 px-4 py-4 flex items-center gap-4">
          <button onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className="p-2 hover:bg-gray-800 rounded">
            <X size={24} />
          </button>
          <input
            type="text"
            value={searchQuery}
            onChange={(e: any) => {
              setSearchQuery(e.target.value);
              handleAdminActivation(e.target.value);
            }}
            className="flex-1 bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-white"
            placeholder="Поиск товаров..."
            autoFocus
          />
        </div>
        <div className="flex-1 overflow-auto p-4">
          {searchQuery && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredProducts.map(product => (
                <div 
                  key={product.id} 
                  className="bg-gray-900 rounded-lg overflow-hidden cursor-pointer hover:transform hover:scale-105 transition-all"
                  onClick={() => {
                    addToCart(product);
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                >
                  <div className="aspect-[3/4] bg-gray-800 flex items-center justify-center text-gray-600 text-xs p-2 text-center">
                    {product.name}
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-sm mb-1">{product.name}</h3>
                    <p className="text-sm">{formatPrice(product.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

export default App;

