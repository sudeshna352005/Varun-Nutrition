import React, { useState, useEffect, Component } from 'react';
import api from '../api';
import { MapPin, CheckCircle, ChevronRight, MessageSquare, ExternalLink, Info, Search, Plus, X, Camera, AlertTriangle } from 'lucide-react';
import Skeleton from '../components/Skeleton';
import CameraCapture from '../components/CameraCapture';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("Modal Error Boundary:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center space-y-4">
          <AlertTriangle className="mx-auto text-red-500" size={48} />
          <h3 className="text-lg font-bold text-white">Something went wrong</h3>
          <p className="text-sm text-slate-500">The return form encountered an error. Please try reopening the modal.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-6 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const WorkerDashboard = ({ user }) => {
  const [shops, setShops] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState(null);
  const [createOrder, setCreateOrder] = useState(false);
  const [createReturn, setCreateReturn] = useState(false);
  const [isFetchingDelivered, setIsFetchingDelivered] = useState(false);
  const [products, setProducts] = useState([]);
  const [deliveredProducts, setDeliveredProducts] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [returnItems, setReturnItems] = useState([]);
  const [visitHistory, setVisitHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const assignedRoutes = user.assignedRoutes || [];

  useEffect(() => {
    fetchData();
    checkWorkingStatus();
  }, []);

  useEffect(() => {
    if (selectedShop) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedShop]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const workerId = user.id || user._id;
      const [shopsRes, routesRes, visitsRes, productsRes] = await Promise.all([
        api.get(`/api/shops?workerId=${workerId}`),
        api.get(`/api/routes?workerId=${workerId}`),
        api.get(`/api/visits?workerName=${user.name}`),
        api.get('/api/products')
      ]);
    setShops(Array.isArray(shopsRes.data) ? shopsRes.data : []);
    setRoutes(Array.isArray(routesRes.data) ? routesRes.data : []);
    setProducts(Array.isArray(productsRes.data) ? productsRes.data.filter(p => p.isActive) : []);
    const visits = Array.isArray(visitsRes.data) ? visitsRes.data : [];
      setVisitHistory(visits);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  const checkWorkingStatus = async () => {
    try {
      const res = await api.get('/api/attendance');
      const attendanceArr = Array.isArray(res.data) ? res.data : [];
      const active = attendanceArr.find(a => a.workerName === user.name && a.status === 'working');
      setIsWorking(!!active);
    } catch (err) {
      console.error("Failed to check working status", err);
    }
  };

  const handleVisit = async () => {
    if (!isWorking) {
      alert('You must mark start work in Attendance before visiting shops.');
      return;
    }

    if (!photo) {
      alert('Visit proof photo is mandatory.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('shopName', selectedShop.name);
      formData.append('workerName', user.name);
      formData.append('workerRole', user.role || 'Sales Worker');
      formData.append('routeName', selectedShop.routeGroup);
      formData.append('notes', notes);

      if (photo) {
        formData.append('photo', photo);
      }

      // Save visit
      await api.post('/api/visits', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Save order if requested
      if (createOrder && orderItems.length > 0) {
        const totalAmount = orderItems.reduce((sum, item) => sum + item.total, 0);
        const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);

        await api.post('/api/orders', {
          workerName: user.name,
          workerId: user.id || user._id,
          shopName: selectedShop.name,
          routeName: selectedShop.routeGroup,
          items: orderItems,
          totalQuantity,
          totalAmount,
          notes
        });
      }

      // Save returns if requested
      if (createReturn && returnItems.length > 0) {
        for (const item of returnItems) {
          const formDataRet = new FormData();
          formDataRet.append('shopId', selectedShop.id || selectedShop._id);
          formDataRet.append('shopName', selectedShop.name);
          formDataRet.append('workerId', user.id || user._id);
          formDataRet.append('workerName', user.name);
          formDataRet.append('routeName', selectedShop.routeGroup);
          formDataRet.append('productId', item.productId);
          formDataRet.append('productName', item.name);
          formDataRet.append('quantityReturned', item.quantity);
          formDataRet.append('reason', item.reason);
          formDataRet.append('notes', item.notes || '');
          formDataRet.append('returnValue', item.total);
          if (item.photo) formDataRet.append('photo', item.photo);

          await api.post('/api/returns', formDataRet, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
      }

      console.log("Visit/Order/Return saved");
      setSelectedShop(null);
      setNotes('');
      setPhoto(null);
      setCreateOrder(false);
      setCreateReturn(false);
      setOrderItems([]);
      setReturnItems([]);
      await fetchData();
    } catch (err) {
      console.error("Failed to save visit", err);
      alert("Error saving visit. Please try again.");
    }
  };

  const addOrderItem = () => {
    setOrderItems([...orderItems, { productId: '', name: '', packSize: '', quantity: 1, price: 0, total: 0 }]);
  };

  const fetchDeliveredProducts = async (shopName) => {
    setIsFetchingDelivered(true);
    try {
      const res = await api.get(`/api/delivered-products/${shopName}`);
      setDeliveredProducts(res.data || []);
    } catch (err) {
      console.error("Failed to fetch delivered products", err);
    } finally {
      setIsFetchingDelivered(false);
    }
  };

  const addReturnItem = () => {
    setReturnItems([...returnItems, { productId: '', name: '', quantity: 1, reason: 'Damaged', notes: '', price: 0, total: 0, maxQty: 0 }]);
  };

  const removeReturnItem = (index) => {
    setReturnItems(returnItems.filter((_, i) => i !== index));
  };

  const updateReturnItem = (index, field, value) => {
    const newItems = [...returnItems];
    const item = { ...newItems[index] };

    if (field === 'productId') {
      const product = deliveredProducts.find(p => String(p.productId) === String(value));
      if (product) {
        item.productId = value;
        item.name = product.name;
        item.price = product.price;
        item.maxQty = product.deliveredQty;
        if (item.quantity > item.maxQty) item.quantity = item.maxQty;
      }
    } else {
      item[field] = value;
    }

    if (field === 'quantity' && item.maxQty > 0 && value > item.maxQty) {
      alert(`Return quantity exceeds available delivered stock. Max available: ${item.maxQty}`);
      item.quantity = item.maxQty;
    }

    item.total = item.quantity * item.price;
    newItems[index] = item;
    setReturnItems(newItems);
  };

  const removeOrderItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateOrderItem = (index, field, value) => {
    const newItems = [...orderItems];
    const item = { ...newItems[index] };

    if (field === 'productId') {
      const product = products.find(p => p.id === value || p._id === value);
      item.productId = value;
      item.name = product.name;
      item.packSize = product.packSize;
      item.price = product.defaultPrice;
    } else {
      item[field] = value;
    }

    item.total = item.quantity * item.price;
    newItems[index] = item;
    setOrderItems(newItems);
  };

  const hasVisitedToday = (shopName) => {
    const today = new Date().toLocaleDateString();
    const visitsArr = Array.isArray(visitHistory) ? visitHistory : [];
    return visitsArr.some(v => v.shopName === shopName && new Date(v.timestamp).toLocaleDateString() === today);
  };

  if (loading) return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-3">
          <Skeleton className="h-12 w-80 rounded-xl" />
          <Skeleton className="h-5 w-64 rounded-md" />
        </div>
        <Skeleton className="h-12 w-full md:w-80 rounded-xl" />
      </div>
      <div className="space-y-12">
        {[1,2].map(i => (
          <div key={i} className="space-y-6">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1,2,3,4].map(j => <Skeleton key={j} className="h-32 rounded-2xl" />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Welcome, {user.name}</h1>
          <p className="text-slate-500">Here are your assigned routes and shops for today.</p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search routes or shops..."
            className="pl-12 block w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-green-500 outline-none transition-all placeholder-slate-600 shadow-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {!isWorking && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl mb-8 flex items-start">
          <Info className="w-5 h-5 text-yellow-500 mr-3 mt-0.5 flex-shrink-0" />
          <p className="text-yellow-500 text-sm">
            <strong className="font-bold uppercase tracking-wider text-xs block mb-1">Attendance Required</strong>
            Please go to the <a href="/worker-attendance" className="underline font-bold">Attendance</a> page and mark "Start Work" to enable shop visits.
          </p>
        </div>
      )}

      <div className="space-y-12">
        {(Array.isArray(routes) ? routes : [])
          .filter(route => {
            const routeMatches = (route.name || '').toLowerCase().includes(searchQuery.toLowerCase());
            const shopsArr = Array.isArray(shops) ? shops : [];
            const shopMatches = shopsArr.some(s => s.routeGroup === route.name && (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()));
            return routeMatches || shopMatches;
          })
          .map(route => {
          const shopsArr = Array.isArray(shops) ? shops : [];
          let routeShops = shopsArr.filter(s => s.routeGroup === route.name);

          if (searchQuery) {
            const routeMatches = route.name.toLowerCase().includes(searchQuery.toLowerCase());
            if (!routeMatches) {
               routeShops = routeShops.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
            }
          }

          if (routeShops.length === 0) return null;

          return (
            <div key={route.id}>
              <h2 className="text-xl font-bold text-green-500 flex items-center mb-6">
                <MapPin className="w-6 h-6 mr-2" /> {route.name}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(Array.isArray(routeShops) ? routeShops : []).map(shop => (
                  <div 
                    key={shop.id} 
                    className={`bg-slate-900 p-6 rounded-2xl shadow-lg border border-slate-800 flex justify-between items-center transition-all ${
                      hasVisitedToday(shop.name) ? 'opacity-40' : 'hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{shop.name}</h3>
                      <p className="text-sm text-slate-500 mb-3">{shop.address}</p>
                      {shop.mapsLink && (
                        <a href={shop.mapsLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:text-blue-400 flex items-center transition-colors">
                          <ExternalLink className="w-3 h-3 mr-1" /> View Map
                        </a>
                      )}
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      {hasVisitedToday(shop.name) ? (
                        <div className="flex items-center gap-2 text-green-500 font-bold bg-green-500/10 px-4 py-2 rounded-xl border border-green-500/20">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm">Visited</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedShop(shop)}
                          disabled={!isWorking}
                          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                            isWorking 
                            ? 'bg-green-600 text-zinc-900 hover:bg-green-500 shadow-lg shadow-green-600/20'
                            : 'bg-slate-800 text-zinc-600 cursor-not-allowed border border-slate-700'
                          }`}
                        >
                          Mark Visit
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedShop && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-[95vw] md:max-w-4xl shadow-2xl max-h-[95vh] md:max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-800/50">
              <h2 className="text-xl sm:text-2xl font-bold mb-1 text-white break-words">Visit: {selectedShop.name}</h2>
              <p className="text-slate-500 text-[10px] sm:text-xs uppercase tracking-wider font-bold">Log visit details</p>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar overflow-x-hidden">
              <ErrorBoundary>
              <textarea
                placeholder="e.g., Stock checked, order placed for 50 units."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 h-24 sm:h-32 focus:ring-2 focus:ring-green-500 outline-none text-white placeholder-zinc-600 transition-all text-sm"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              <CameraCapture
                onCapture={setPhoto}
                label="Visit Proof (Required)"
                required
              />

              <div className="p-3 sm:p-4 bg-slate-800/50 rounded-xl border border-slate-700 space-y-4">
                <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-6">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="size-5 rounded border-slate-600 bg-slate-800 text-green-500 focus:ring-green-500/20"
                      checked={createOrder}
                      onChange={(e) => setCreateOrder(e.target.checked)}
                    />
                    <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">Create Order</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="size-5 rounded border-slate-600 bg-slate-800 text-green-500 focus:ring-green-500/20"
                      checked={createReturn}
                      onChange={(e) => {
                        setCreateReturn(e.target.checked);
                        if (e.target.checked) fetchDeliveredProducts(selectedShop.name);
                      }}
                    />
                    <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">Create Return</span>
                  </label>
                </div>
</div>
                {createOrder && (
                  <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Order Items</p>
                      <button
                        onClick={addOrderItem}
                        type="button"
                        className="text-xs font-bold text-green-500 hover:text-green-400 flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Product
                      </button>
                    </div>

                    {(Array.isArray(orderItems) ? orderItems : []).map((item, idx) => (
                      <div key={idx} className="p-3 bg-slate-900 rounded-lg border border-slate-700 space-y-3">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                          <select
                            className="w-full sm:flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 sm:py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-green-500"
                            value={item.productId}
                            onChange={(e) => updateOrderItem(idx, 'productId', e.target.value)}
                          >
                            <option value="">Select Product</option>
                            {(Array.isArray(products) ? products : []).map(p => (
                              <option key={p.id || p._id} value={p.id || p._id}>{p.name} ({p.packSize})</option>
                            ))}
                          </select>
                          <button onClick={() => removeOrderItem(idx)} className="self-end sm:self-start text-red-500 p-2 hover:bg-red-500/10 rounded-lg border border-red-500/20 sm:border-none">
                            <span className="sm:hidden text-[10px] font-bold uppercase mr-2">Remove</span>
                            <X size={16} className="inline" />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[9px] sm:text-[10px] font-bold text-slate-600 uppercase mb-1">Qty</label>
                            <input
                              type="number"
                              min="1"
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                              value={item.quantity}
                              onChange={(e) => updateOrderItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] sm:text-[10px] font-bold text-slate-600 uppercase mb-1">Price</label>
                            <input
                              type="number"
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                              value={item.price}
                              onChange={(e) => updateOrderItem(idx, 'price', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] sm:text-[10px] font-bold text-slate-600 uppercase mb-1">Total</label>
                            <div className="w-full py-1.5 text-[11px] sm:text-xs font-bold text-green-500 truncate">₹{item.total.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {orderItems.length > 0 && (
                      <div className="pt-4 border-t border-slate-700 flex justify-between items-center">
                        <p className="text-xs font-bold text-slate-400">Total Amount</p>
                        <p className="text-lg font-black text-green-500">₹{orderItems.reduce((sum, i) => sum + i.total, 0).toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                )}

                {createReturn && (
                  <div className="mt-8 pt-8 border-t border-slate-700 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Return Items (Delivered Only)</p>
                      <button
                        onClick={addReturnItem}
                        type="button"
                        className="text-xs font-bold text-orange-500 hover:text-orange-400 flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Return
                      </button>
                    </div>

                    {isFetchingDelivered ? (
                      <div className="flex items-center gap-2 text-xs text-slate-500 italic">
                         <div className="w-3 h-3 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                         Fetching delivered stock...
                      </div>
                    ) : (
                      deliveredProducts.length === 0 && (
                        <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                           <p className="text-xs text-orange-500 font-bold">No delivered products available for return.</p>
                        </div>
                      )
                    )}

                    {(Array.isArray(returnItems) ? returnItems : []).map((item, idx) => (
                      <div key={idx} className="p-3 bg-slate-900 rounded-lg border border-orange-500/20 space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                          <select
                            className="w-full sm:flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 sm:py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-orange-500"
                            value={item.productId}
                            onChange={(e) => updateReturnItem(idx, 'productId', e.target.value)}
                          >
                            <option value="">Select Product</option>
                            {(Array.isArray(deliveredProducts) ? deliveredProducts : []).map(p => (
                              <option key={p.productId} value={p.productId}>{p.name} (Delivered: {p.deliveredQty})</option>
                            ))}
                          </select>
                          <button onClick={() => removeReturnItem(idx)} className="self-end sm:self-start text-red-500 p-2 hover:bg-red-500/10 rounded-lg border border-red-500/20 sm:border-none">
                            <span className="sm:hidden text-[10px] font-bold uppercase mr-2">Remove</span>
                            <X size={16} className="inline" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
                          <div>
                            <label className="block text-[9px] sm:text-[10px] font-bold text-slate-600 uppercase mb-1">Reason</label>
                            <select
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 sm:py-1 text-xs text-white"
                              value={item.reason}
                              onChange={(e) => updateReturnItem(idx, 'reason', e.target.value)}
                            >
                              {['Damaged', 'Expired', 'Unsold Stock', 'Wrong Product', 'Packaging Issue', 'Customer Complaint', 'Other'].map(r => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[9px] sm:text-[10px] font-bold text-slate-600 uppercase mb-1">Qty (Max: {item.maxQty || 0})</label>
                            <input
                              type="number"
                              min="1"
                              max={item.maxQty}
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 sm:py-1 text-xs text-white"
                              value={item.quantity}
                              onChange={(e) => updateReturnItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                           <Camera className="text-slate-500 shrink-0" size={16} />
                           <input
                             type="file"
                             accept="image/*"
                             className="text-[10px] text-slate-400 file:bg-slate-800 file:border-none file:text-slate-400 file:rounded file:px-2 file:py-1 w-full"
                             onChange={(e) => updateReturnItem(idx, 'photo', e.target.files[0])}
                           />
                        </div>
                      </div>
                    ))}

                    {returnItems.length > 0 && (
                      <div className="pt-4 border-t border-slate-700 flex justify-between items-center">
                        <p className="text-xs font-bold text-slate-400">Total Return Value</p>
                        <p className="text-lg font-black text-orange-500">₹{returnItems.reduce((sum, i) => sum + i.total, 0).toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                )}
              </ErrorBoundary>
              </div>
            </div>

            {/* Modal Footer - Fixed */}
            <div className="p-4 sm:p-6 border-t border-slate-800 bg-slate-900">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={() => setSelectedShop(null)}
                  className="w-full sm:flex-1 px-6 py-3 bg-slate-800 text-slate-400 font-bold rounded-xl hover:bg-zinc-700 transition-all text-sm uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVisit}
                  className="w-full sm:flex-[2] px-6 py-4 sm:py-3 bg-green-600 text-zinc-900 font-bold rounded-xl hover:bg-green-500 transition-all shadow-lg shadow-green-600/20 flex items-center justify-center text-sm uppercase tracking-widest"
                >
                  <CheckCircle className="w-5 h-5 mr-2" /> Finish Visit
                </button>
              </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default WorkerDashboard;
