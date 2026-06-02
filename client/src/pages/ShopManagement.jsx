import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, MapPin, Phone, ExternalLink } from 'lucide-react';

const ShopManagement = () => {
  const [shops, setShops] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    routeGroup: '',
    mapsLink: ''
  });

  useEffect(() => {
    fetchShops();
    fetchRoutes();
  }, []);

  const fetchShops = async () => {
    const res = await axios.get('https://varun-nutrition.onrender.com/api/shops');
    setShops(res.data);
  };

  const fetchRoutes = async () => {
    const res = await axios.get('https://varun-nutrition.onrender.com/api/routes');
    setRoutes(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingShop) {
      await axios.put(`https://varun-nutrition.onrender.com/api/shops/${editingShop.id}`, formData);
    } else {
      await axios.post('https://varun-nutrition.onrender.com/api/shops', formData);
    }
    setIsModalOpen(false);
    setEditingShop(null);
    setFormData({ name: '', address: '', phone: '', routeGroup: '', mapsLink: '' });
    fetchShops();
  };

  const handleEdit = (shop) => {
    setEditingShop(shop);
    setFormData(shop);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this shop?')) {
      await axios.delete(`https://varun-nutrition.onrender.com/api/shops/${id}`);
      fetchShops();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Shop Management</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Shop
        </button>
      </div>

      {shops.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-lg shadow-sm border-2 border-dashed border-gray-300">
          <Store className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-xl text-gray-600">No shops added yet. Add manually or upload Excel.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => (
            <div key={shop.id} className="bg-white p-6 rounded-lg shadow-md relative group">
              <div className="absolute top-4 right-4 space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(shop)} className="text-blue-600 hover:text-blue-800">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(shop.id)} className="text-red-600 hover:text-red-800">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-xl font-semibold mb-2">{shop.name}</h3>
              <div className="space-y-2 text-gray-600">
                <p className="flex items-center"><MapPin className="w-4 h-4 mr-2" /> {shop.address}</p>
                <p className="flex items-center"><Phone className="w-4 h-4 mr-2" /> {shop.phone}</p>
                <p className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  {shop.routeGroup}
                </p>
                {shop.mapsLink && (
                  <a
                    href={shop.mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:underline mt-2"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" /> Google Maps
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">{editingShop ? 'Edit Shop' : 'Add New Shop'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Shop Name</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full border rounded-md px-3 py-2"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    required
                    className="mt-1 block w-full border rounded-md px-3 py-2"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full border rounded-md px-3 py-2"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Route Group</label>
                  <select
                    required
                    className="mt-1 block w-full border rounded-md px-3 py-2"
                    value={formData.routeGroup}
                    onChange={(e) => setFormData({ ...formData, routeGroup: e.target.value })}
                  >
                    <option value="">Select a route</option>
                    {routes.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Google Maps Link</label>
                  <input
                    type="url"
                    className="mt-1 block w-full border rounded-md px-3 py-2"
                    value={formData.mapsLink}
                    onChange={(e) => setFormData({ ...formData, mapsLink: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditingShop(null); }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingShop ? 'Save Changes' : 'Add Shop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Placeholder for Lucide Store icon if it's not imported properly in my snippet
const Store = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>
);

export default ShopManagement;
