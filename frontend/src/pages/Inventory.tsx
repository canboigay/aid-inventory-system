import { useState, useEffect } from 'react';
import { itemsAPI, quickEntryAPI, recipientsAPI } from '../api/client';
import { useToast } from '../components/ToastProvider';
import type { Item, ItemCategory } from '../types';

export default function Inventory() {
  const { pushToast } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [addItem, setAddItem] = useState<Item | null>(null);
  const [distributeItem, setDistributeItem] = useState<Item | null>(null);
  const [filterCategory, setFilterCategory] = useState<ItemCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [recipients, setRecipients] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const [itemsData, recipientsData] = await Promise.all([
        itemsAPI.list(),
        recipientsAPI.list(),
      ]);
      setItems(itemsData);
      setRecipients(recipientsData.map(r => ({ id: r.id, name: r.name })));
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const itemData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string || undefined,
      category: formData.get('category') as ItemCategory,
      unit_of_measure: formData.get('unit_of_measure') as string,
      current_stock_level: Number(formData.get('current_stock_level')) || 0,
      minimum_stock_level: formData.get('minimum_stock_level') 
        ? Number(formData.get('minimum_stock_level')) 
        : undefined,
      sku: formData.get('sku') as string || undefined,
      unit_cost_thb: formData.get('unit_cost_thb') ? Number(formData.get('unit_cost_thb')) : undefined,
      notes: formData.get('notes') as string || undefined,
    };

    try {
      if (editingItem) {
        await itemsAPI.update(editingItem.id, itemData);
        pushToast({ variant: 'success', title: 'Item updated', message: editingItem.name });
      } else {
        await itemsAPI.create(itemData);
        pushToast({ variant: 'success', title: 'Item created', message: itemData.name });
      }
      setShowForm(false);
      setEditingItem(null);
      e.currentTarget.reset();

      // Refresh list; if refresh fails, do not show a second blocking "failed" popup.
      try {
        await loadItems();
      } catch (err) {
        console.error('Post-save refresh failed:', err);
        pushToast({ variant: 'info', title: 'Saved, but refresh failed', message: 'Please reload the page.' });
      }
    } catch (error: any) {
      console.error('Failed to save item:', error);
      pushToast({
        variant: 'error',
        title: 'Save failed',
        message: error.response?.data?.detail || 'Please try again.'
      });

      // In case the request actually succeeded server-side (e.g., network timeout), attempt a refresh.
      try {
        await loadItems();
      } catch {
        // ignore
      }
    }
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await itemsAPI.delete(itemId);
      loadItems();
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Failed to delete item. Please try again.');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  // Add stock (adjust +delta)
  const handleAddStock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const qty = Number(formData.get('add_qty'));
    const notes = (formData.get('add_notes') as string) || undefined;
    if (!addItem) return;
    try {
      await itemsAPI.adjust(addItem.id, qty, notes);
      setAddItem(null);
      await loadItems();
      pushToast({ variant: 'success', title: 'Stock added', message: `${qty} added to ${addItem.name}` });
    } catch (err: any) {
      console.error('Add stock error:', err);
      pushToast({ variant: 'error', title: 'Add stock failed', message: err.response?.data?.detail || 'Please try again.' });
    }
  };

  // Distribute (subtract quantity via quick distribution)
  const handleDistribute = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const qty = Number(formData.get('dist_qty'));
    const dtype = formData.get('dist_type') as any;

    const recipientId = (formData.get('recipient_id') as string) || '';
    const recipientFreeText = (formData.get('recipient') as string) || '';
    const selectedRecipientName = recipientId
      ? recipients.find(r => r.id === recipientId)?.name
      : undefined;

    const recipient = recipientFreeText.trim() || selectedRecipientName;
    const notes = (formData.get('dist_notes') as string) || undefined;
    if (!distributeItem) return;
    try {
      await quickEntryAPI.distribution({
        distribution_type: dtype,
        items: [{ item_id: distributeItem.id, quantity: qty }],
        recipient_info: recipient || undefined,
        notes,
      });
      setDistributeItem(null);
      await loadItems();
      pushToast({
        variant: 'success',
        title: 'Distribution recorded',
        message: `${qty} ${distributeItem.unit_of_measure} of ${distributeItem.name}`
      });
    } catch (err: any) {
      console.error('Distribution error:', err);
      pushToast({ variant: 'error', title: 'Distribution failed', message: err.response?.data?.detail || 'Please try again.' });
    }
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryLabel = (category: ItemCategory) => {
    const labels: Record<ItemCategory, string> = {
      raw_material: 'Raw Material',
      in_house_product: 'In-House Product',
      purchased_item: 'Purchased Item',
      assembled_kit: 'Assembled Kit',
      donated: 'Donated',
    };
    return labels[category];
  };

  const getCategoryColor = (category: ItemCategory) => {
    const colors: Record<ItemCategory, string> = {
      raw_material: 'bg-gray-100 text-gray-800',
      in_house_product: 'bg-[#A8B968]/20 text-[#A8B968]',
      purchased_item: 'bg-[#D9896C]/20 text-[#D9896C]',
      assembled_kit: 'bg-[#5FA8A6]/20 text-[#5FA8A6]',
      donated: 'bg-purple-100 text-purple-800',
    };
    return colors[category];
  };

  const formatStock = (stock: any) => {
    const num = Number(stock);
    return Number.isInteger(num) ? num : num.toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5FA8A6]"></div>
        <p className="mt-4 text-gray-600">Loading items...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold text-gray-900">Inventory Items</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#5FA8A6] text-white px-6 py-3 rounded-lg hover:bg-[#52918F] font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Item
          </button>
        </div>
        <p className="text-gray-600">Manage your inventory items, categories, and stock levels</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Search</label>
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Filter by Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as ItemCategory | 'all')}
              className="w-full border rounded-lg p-2"
            >
              <option value="all">All Categories</option>
              <option value="raw_material">Raw Material</option>
              <option value="in_house_product">In-House Product</option>
              <option value="purchased_item">Purchased Item</option>
              <option value="assembled_kit">Assembled Kit</option>
              <option value="donated">Donated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-[#5FA8A6]">
          <h2 className="text-2xl font-semibold mb-4">
            {editingItem ? 'Edit Item' : 'Add New Item'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Item Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingItem?.name}
                  className="w-full border rounded-lg p-2"
                  placeholder="e.g., Organic Soap, Rice Bag, Mosquito Net"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select
                  name="category"
                  required
                  defaultValue={editingItem?.category}
                  className="w-full border rounded-lg p-2"
                >
                  <option value="">Select category...</option>
                  <option value="raw_material">Raw Material</option>
                  <option value="in_house_product">In-House Product</option>
                  <option value="purchased_item">Purchased Item</option>
                  <option value="assembled_kit">Assembled Kit</option>
                  <option value="donated">Donated</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                name="description"
                defaultValue={editingItem?.description}
                className="w-full border rounded-lg p-2"
                rows={2}
                placeholder="Brief description of the item"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Unit of Measure *</label>
                <input
                  type="text"
                  name="unit_of_measure"
                  required
                  defaultValue={editingItem?.unit_of_measure}
                  className="w-full border rounded-lg p-2"
                  placeholder="e.g., kg, liters, units, bags"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Current Stock Level</label>
                <input
                  type="number"
                  name="current_stock_level"
                  min="0"
                  step="0.01"
                  defaultValue={editingItem?.current_stock_level || 0}
                  className="w-full border rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Minimum Stock Level</label>
                <input
                  type="number"
                  name="minimum_stock_level"
                  min="0"
                  step="0.01"
                  defaultValue={editingItem?.minimum_stock_level}
                  className="w-full border rounded-lg p-2"
                  placeholder="For low-stock alerts"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">SKU (Stock Keeping Unit)</label>
                <input
                  type="text"
                  name="sku"
                  defaultValue={editingItem?.sku}
                  className="w-full border rounded-lg p-2"
                  placeholder="Optional unique identifier"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">฿/pc</label>
                <input
                  type="number"
                  name="unit_cost_thb"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  defaultValue={editingItem?.unit_cost_thb}
                  className="w-full border rounded-lg p-2"
                  placeholder="Thai Baht per piece"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <input
                  type="text"
                  name="notes"
                  defaultValue={editingItem?.notes}
                  className="w-full border rounded-lg p-2"
                  placeholder="Additional information"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                className="bg-[#5FA8A6] text-white px-6 py-2 rounded-lg hover:bg-[#52918F] font-medium"
              >
                {editingItem ? 'Update Item' : 'Create Item'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Items List */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-700">Name</th>
                <th className="text-left p-4 font-semibold text-gray-700">Category</th>
                <th className="text-left p-4 font-semibold text-gray-700">Stock Level</th>
                <th className="text-left p-4 font-semibold text-gray-700">Unit</th>
                <th className="text-left p-4 font-semibold text-gray-700">฿/pc</th>
                <th className="text-left p-4 font-semibold text-gray-700">Min. Stock</th>
                <th className="text-right p-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-gray-500">
                    {searchTerm || filterCategory !== 'all' 
                      ? 'No items match your filters'
                      : 'No items yet. Click "Add New Item" to get started.'}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLowStock = item.minimum_stock_level && 
                    Number(item.current_stock_level) <= Number(item.minimum_stock_level);
                  
                  return (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div>
                          <div className="font-medium text-gray-900">{item.name}</div>
                          {item.description && (
                            <div className="text-sm text-gray-500">{item.description}</div>
                          )}
                          {item.sku && (
                            <div className="text-xs text-gray-400 mt-1">SKU: {item.sku}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                          {getCategoryLabel(item.category)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                          {formatStock(item.current_stock_level)}
                        </span>
                        {isLowStock && (
                          <span className="ml-2 text-xs text-red-600">⚠️ Low</span>
                        )}
                      </td>
                      <td className="p-4 text-gray-600">{item.unit_of_measure}</td>
                      <td className="p-4 text-gray-600">{typeof item.unit_cost_thb === 'number' ? item.unit_cost_thb : '—'}</td>
                      <td className="p-4 text-gray-600">
                        {item.minimum_stock_level ? formatStock(item.minimum_stock_level) : '—'}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setAddItem(item)}
                            className="text-green-600 hover:text-green-700 p-2"
                            title="Add stock"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDistributeItem(item)}
                            className="text-[#5FA8A6] hover:text-[#52918F] p-2"
                            title="Distribute (subtract stock)"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-[#5FA8A6] hover:text-[#52918F] p-2"
                            title="Edit item"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-700 p-2"
                            title="Delete item"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Stock Modal */}
      {addItem && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Stock — {addItem.name}</h3>
            <form onSubmit={handleAddStock} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Quantity to add</label>
                <input name="add_qty" type="number" inputMode="numeric" min="1" step="1" required className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                <input name="add_notes" type="text" className="w-full border rounded-lg p-2" />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setAddItem(null)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Distribute Modal */}
      {distributeItem && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Distribute — {distributeItem.name}</h3>
            <form onSubmit={handleDistribute} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <input name="dist_qty" type="number" inputMode="numeric" min="1" step="1" required className="w-full border rounded-lg p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select name="dist_type" className="w-full border rounded-lg p-2" required>
                    <option value="weekly">Weekly</option>
                    <option value="bi_weekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="bi_monthly">Bi-monthly</option>
                    <option value="crisis_aid">Crisis Aid</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Recipient (optional)</label>
                <select name="recipient_id" className="w-full border rounded-lg p-2">
                  <option value="">Select recipient...</option>
                  {recipients.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
                <input name="recipient" type="text" placeholder="Or type a new recipient..." className="w-full border rounded-lg p-2 mt-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                <input name="dist_notes" type="text" className="w-full border rounded-lg p-2" />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setDistributeItem(null)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#5FA8A6] text-white rounded-lg">Distribute</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600">Total Items</div>
          <div className="text-2xl font-bold text-gray-900">{items.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600">In-House Products</div>
          <div className="text-2xl font-bold text-[#A8B968]">
            {items.filter(i => i.category === 'in_house_product').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600">Purchased Items</div>
          <div className="text-2xl font-bold text-[#D9896C]">
            {items.filter(i => i.category === 'purchased_item').length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600">Low Stock Alerts</div>
          <div className="text-2xl font-bold text-red-600">
            {items.filter(i => i.minimum_stock_level && Number(i.current_stock_level) <= Number(i.minimum_stock_level)).length}
          </div>
        </div>
      </div>
    </div>
  );
}
