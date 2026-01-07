import { useState, useEffect } from 'react';
import { quickEntryAPI, itemsAPI, recipientsAPI } from '../api/client';
import Walkthrough from '../components/Walkthrough';
import type {
  DashboardStats,
  Item,
  QuickProductionEntry,
  QuickPurchaseEntry,
  QuickDistributionEntry,
  DistributionType,
} from '../types';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [recipients, setRecipients] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWalkthrough, setShowWalkthrough] = useState(() => {
    return !localStorage.getItem('walkthroughCompleted');
  });

  // Quick entry states
  const [showProductionForm, setShowProductionForm] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showDistributionForm, setShowDistributionForm] = useState(false);

  // Quick Actions dropdown state
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickDistOpen, setQuickDistOpen] = useState(false);
  const [quickItemId, setQuickItemId] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, itemsData, recipientsData] = await Promise.all([
        quickEntryAPI.getDashboardStats(),
        itemsAPI.list(),
        recipientsAPI.list(),
      ]);
      setStats(statsData);
      setItems(itemsData);
      setRecipients(recipientsData.map(r => ({ id: r.id, name: r.name })));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: QuickProductionEntry = {
      produced_item_id: formData.get('item_id') as string,
      quantity_produced: Number(formData.get('quantity')),
      notes: formData.get('notes') as string || undefined,
    };

    try {
      await quickEntryAPI.production(data);
      setShowProductionForm(false);
      e.currentTarget.reset();
      await loadData();
      alert('✓ Production recorded successfully');
    } catch (error: any) {
      console.error('Failed to record production:', error);
      alert(error.response?.data?.detail || 'Failed to record production. Please try again.');
    }
  };

  const handlePurchaseSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: QuickPurchaseEntry = {
      items: [{
        item_id: formData.get('item_id') as string,
        quantity: Number(formData.get('quantity')),
        unit_cost: Number(formData.get('unit_cost')) || undefined,
      }],
      supplier_name: formData.get('supplier_name') as string || undefined,
      notes: formData.get('notes') as string || undefined,
    };

    try {
      await quickEntryAPI.purchase(data);
      setShowPurchaseForm(false);
      e.currentTarget.reset();
      await loadData();
      alert('✓ Purchase recorded successfully');
    } catch (error: any) {
      console.error('Failed to record purchase:', error);
      alert(error.response?.data?.detail || 'Failed to record purchase. Please try again.');
    }
  };

  const handleDistributionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const recipientId = (formData.get('recipient_id') as string) || '';
    const recipientFreeText = (formData.get('recipient_info') as string) || '';
    const selectedRecipientName = recipientId
      ? recipients.find(r => r.id === recipientId)?.name
      : undefined;

    const recipientInfo = recipientFreeText.trim() || selectedRecipientName;

    const data: QuickDistributionEntry = {
      distribution_type: formData.get('distribution_type') as DistributionType,
      items: [{
        item_id: formData.get('item_id') as string,
        quantity: Number(formData.get('quantity')),
      }],
      recipient_info: recipientInfo || undefined,
      notes: (formData.get('notes') as string) || undefined,
    };

    try {
      await quickEntryAPI.distribution(data);
      setShowDistributionForm(false);
      e.currentTarget.reset();
      await loadData();
      alert('✓ Distribution recorded successfully');
    } catch (error: any) {
      console.error('Failed to record distribution:', error);
      alert(error.response?.data?.detail || 'Failed to record distribution. Please try again.');
    }
  };

  const handleWalkthroughComplete = () => {
    localStorage.setItem('walkthroughCompleted', 'true');
    setShowWalkthrough(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5FA8A6]"></div>
        <p className="mt-4 text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <>
      {showWalkthrough && <Walkthrough onComplete={handleWalkthroughComplete} />}
      
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Dashboard</h1>
            <div className="relative">
              <button
                onClick={() => setQuickMenuOpen(!quickMenuOpen)}
                className="text-sm bg-white border rounded-lg px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2"
                aria-haspopup="menu"
                aria-expanded={quickMenuOpen}
              >
                Quick Actions
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {quickMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow z-10">
                  <button
                    onClick={() => { setQuickMenuOpen(false); setQuickAddOpen(true); }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                  >
                    Add Stock
                  </button>
                  <button
                    onClick={() => { setQuickMenuOpen(false); setQuickDistOpen(true); }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                  >
                    Distribute Item
                  </button>
                  <button
                    onClick={() => { setQuickMenuOpen(false); setShowWalkthrough(true); }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                  >
                    Show Tutorial
                  </button>
                </div>
              )}
            </div>
          </div>
        <p className="text-gray-600">Track production, purchases, and distributions in real-time</p>
      </div>

      {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-10">
          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wide">Total Items</div>
              <div className="p-1.5 sm:p-2 bg-gray-100 rounded-lg">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-gray-900">{stats?.total_items || 0}</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6 border border-red-100">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="text-xs sm:text-sm font-medium text-red-600 uppercase tracking-wide">Low Stock</div>
              <div className="p-1.5 sm:p-2 bg-red-50 rounded-lg">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-red-600">{stats?.low_stock_items || 0}</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6 border border-green-100">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="text-xs sm:text-sm font-medium text-[#A8B968] uppercase tracking-wide">Productions</div>
              <div className="p-1.5 sm:p-2 bg-[#A8B968]/10 rounded-lg">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#A8B968]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-[#A8B968]">{stats?.productions_this_week || 0}</div>
            <div className="text-xs text-gray-500 mt-1">This week</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6 border border-teal-100">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="text-xs sm:text-sm font-medium text-[#5FA8A6] uppercase tracking-wide">Distributions</div>
              <div className="p-1.5 sm:p-2 bg-[#5FA8A6]/10 rounded-lg">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#5FA8A6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-[#5FA8A6]">{stats?.distributions_this_week || 0}</div>
            <div className="text-xs text-gray-500 mt-1">This week</div>
          </div>
        </div>

      {/* Quick Entry Cards */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Quick Entry</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Production Card */}
          <button
            onClick={() => setShowProductionForm(!showProductionForm)}
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6 text-left group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#A8B968] flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-105 transition-transform">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">Record Production</h3>
              <p className="text-xs sm:text-sm text-gray-600">Log in-house manufactured items</p>
            </div>
          </button>

          {/* Purchase Card */}
          <button
            onClick={() => setShowPurchaseForm(!showPurchaseForm)}
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6 text-left group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#D9896C] flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-105 transition-transform">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">Record Purchase</h3>
              <p className="text-xs sm:text-sm text-gray-600">Log incoming supplies & bulk items</p>
            </div>
          </button>

          {/* Distribution Card */}
          <button
            onClick={() => setShowDistributionForm(!showDistributionForm)}
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 sm:p-6 text-left group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#5FA8A6] flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-105 transition-transform">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-1 sm:mb-2">Record Distribution</h3>
              <p className="text-xs sm:text-sm text-gray-600">Track outgoing aid packages</p>
            </div>
          </button>
        </div>
      </div>

      {/* Quick Entry Forms */}
      {showProductionForm && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="text-lg font-semibold mb-4">Record Production</h3>
          <form onSubmit={handleProductionSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Item Produced</label>
              <select name="item_id" required className="w-full border rounded-lg p-2">
                <option value="">Select an item...</option>
                {items.filter(i => i.category === 'in_house_product').map(item => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <input type="number" name="quantity" required min="0" step="0.01" className="w-full border rounded-lg p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes (optional)</label>
              <textarea name="notes" className="w-full border rounded-lg p-2" rows={2}></textarea>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-[#A8B968] text-white px-4 py-2 rounded-lg hover:bg-[#96A55C] font-medium">
                Submit
              </button>
              <button type="button" onClick={() => setShowProductionForm(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showPurchaseForm && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="text-lg font-semibold mb-4">Record Purchase</h3>
          <form onSubmit={handlePurchaseSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Item Purchased</label>
              <select name="item_id" required className="w-full border rounded-lg p-2">
                <option value="">Select an item...</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input type="number" name="quantity" required min="0" step="0.01" className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit Cost (optional)</label>
                <input type="number" name="unit_cost" min="0" step="0.01" className="w-full border rounded-lg p-2" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Supplier Name (optional)</label>
              <input type="text" name="supplier_name" className="w-full border rounded-lg p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes (optional)</label>
              <textarea name="notes" className="w-full border rounded-lg p-2" rows={2}></textarea>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-[#D9896C] text-white px-4 py-2 rounded-lg hover:bg-[#C77A5F] font-medium">
                Submit
              </button>
              <button type="button" onClick={() => setShowPurchaseForm(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showDistributionForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Record Distribution</h3>
          <form onSubmit={handleDistributionSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Distribution Type</label>
              <select name="distribution_type" required className="w-full border rounded-lg p-2">
                <option value="weekly">Weekly</option>
                <option value="bi_weekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="bi_monthly">Bi-monthly</option>
                <option value="crisis_aid">Crisis Aid</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Item</label>
              <select name="item_id" required className="w-full border rounded-lg p-2">
                <option value="">Select an item...</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>{item.name} (Stock: {item.current_stock_level})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <input type="number" name="quantity" required min="0" step="0.01" className="w-full border rounded-lg p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Recipient (optional)</label>
              <select name="recipient_id" className="w-full border rounded-lg p-2">
                <option value="">Select recipient...</option>
                {recipients.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <input
                type="text"
                name="recipient_info"
                placeholder="Or type a new recipient..."
                className="w-full border rounded-lg p-2 mt-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes (optional)</label>
              <textarea name="notes" className="w-full border rounded-lg p-2" rows={2}></textarea>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-[#5FA8A6] text-white px-4 py-2 rounded-lg hover:bg-[#52918F] font-medium">
                Submit
              </button>
              <button type="button" onClick={() => setShowDistributionForm(false)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="overflow-x-auto">
          {stats?.recent_activity?.length === 0 && (
            <p className="text-gray-500 p-4">No recent activity</p>
          )}
          {stats?.recent_activity && stats.recent_activity.length > 0 && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-2 font-semibold text-gray-700">Item</th>
                  <th className="text-left p-2 font-semibold text-gray-700">Type</th>
                  <th className="text-center p-2 font-semibold text-gray-700">Qty</th>
                  <th className="text-left p-2 font-semibold text-gray-700">User</th>
                  <th className="text-left p-2 font-semibold text-gray-700">Recipient</th>
                  <th className="text-left p-2 font-semibold text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_activity.map((activity, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">
                      {activity.item_name}
      {(activity as any).notes && (
                        <span className="ml-2 text-xs text-gray-500" title={(activity as any).notes}>
                          <svg className="inline h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20h9" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
                          </svg>
                        </span>
                      )}
                    </td>
                    <td className="p-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        activity.type === 'production' ? 'bg-[#A8B968]/20 text-[#A8B968]' :
                        activity.type === 'purchase' ? 'bg-[#D9896C]/20 text-[#D9896C]' :
                        activity.type === 'distribution' ? 'bg-[#5FA8A6]/20 text-[#5FA8A6]' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {activity.type}
                      </span>
                    </td>
                    <td className="p-2 text-center font-semibold">
                      {activity.movement_type === 'in' ? '+' : '-'}{activity.quantity}
                    </td>
                    <td className="p-2 text-gray-600">{(activity as any).user_name || 'N/A'}</td>
                    <td className="p-2 text-gray-600">
                      {activity.type === 'distribution' 
                        ? ((activity as any).recipient_info || 'Not specified')
                        : '—'
                      }
                    </td>
                    <td className="p-2 text-gray-500 whitespace-nowrap">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        </div>
      </div>

      {/* Quick Add Stock Modal */}
      {quickAddOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Stock</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget as HTMLFormElement;
                const formData = new FormData(form);
                const qty = Number(formData.get('add_qty'));
                const notes = (formData.get('add_notes') as string) || undefined;
                try {
                  if (!quickItemId) throw new Error('Select an item');
                  await itemsAPI.adjust(quickItemId, qty, notes);
                  setQuickAddOpen(false);
                  setQuickItemId('');
                  await loadData();
                  alert('✓ Stock added successfully');
                } catch (err: any) {
                  console.error('Quick add stock error:', err);
                  alert(err.response?.data?.detail || err.message || 'Failed to add stock');
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Item</label>
                <select required className="w-full border rounded-lg p-2" value={quickItemId} onChange={(e)=>setQuickItemId(e.target.value)}>
                  <option value="">Select item...</option>
                  {items.map(i => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Quantity to add</label>
                <input name="add_qty" type="number" inputMode="numeric" min="1" step="1" required className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                <input name="add_notes" type="text" className="w-full border rounded-lg p-2" />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={()=>{setQuickAddOpen(false); setQuickItemId('');}} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Distribute Modal */}
      {quickDistOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Distribute Item</h3>
            <form
              onSubmit={async (e)=>{
                e.preventDefault();
                const form = e.currentTarget as HTMLFormElement;
                const fd = new FormData(form);
                const qty = Number(fd.get('dist_qty'));
                const dtype = fd.get('dist_type') as any;
                const recipient = (fd.get('recipient') as string) || undefined;
                const notes = (fd.get('dist_notes') as string) || undefined;
                try {
                  if (!quickItemId) throw new Error('Select an item');
                  await quickEntryAPI.distribution({
                    distribution_type: dtype,
                    items: [{ item_id: quickItemId, quantity: qty }],
                    recipient_info: recipient,
                    notes,
                  });
                  setQuickDistOpen(false);
                  setQuickItemId('');
                  await loadData();
                  alert('✓ Distribution recorded successfully');
                } catch (err: any) {
                  console.error('Quick distribute error:', err);
                  alert(err.response?.data?.detail || err.message || 'Failed to distribute');
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Item</label>
                <select required className="w-full border rounded-lg p-2" value={quickItemId} onChange={(e)=>setQuickItemId(e.target.value)}>
                  <option value="">Select item...</option>
                  {items.map(i => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>
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
                <input name="recipient" type="text" className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                <input name="dist_notes" type="text" className="w-full border rounded-lg p-2" />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={()=>{setQuickDistOpen(false); setQuickItemId('');}} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#5FA8A6] text-white rounded-lg">Distribute</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
