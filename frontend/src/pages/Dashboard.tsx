import { useState, useEffect } from 'react';
import { quickEntryAPI, itemsAPI } from '../api/client';
import Walkthrough from '../components/Walkthrough';
import DemoNotice from '../components/DemoNotice';
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
  const [loading, setLoading] = useState(true);
  const [showWalkthrough, setShowWalkthrough] = useState(() => {
    return !localStorage.getItem('walkthroughCompleted');
  });

  // Quick entry states
  const [showProductionForm, setShowProductionForm] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showDistributionForm, setShowDistributionForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, itemsData] = await Promise.all([
        quickEntryAPI.getDashboardStats(),
        itemsAPI.list(),
      ]);
      setStats(statsData);
      setItems(itemsData);
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
      loadData();
      e.currentTarget.reset();
    } catch (error) {
      console.error('Failed to record production:', error);
      alert('Failed to record production. Please try again.');
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
      loadData();
      e.currentTarget.reset();
    } catch (error) {
      console.error('Failed to record purchase:', error);
      alert('Failed to record purchase. Please try again.');
    }
  };

  const handleDistributionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: QuickDistributionEntry = {
      distribution_type: formData.get('distribution_type') as DistributionType,
      items: [{
        item_id: formData.get('item_id') as string,
        quantity: Number(formData.get('quantity')),
      }],
      recipient_info: formData.get('recipient_info') as string || undefined,
      notes: formData.get('notes') as string || undefined,
    };

    try {
      await quickEntryAPI.distribution(data);
      setShowDistributionForm(false);
      loadData();
      e.currentTarget.reset();
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
      
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
            <button
              onClick={() => setShowWalkthrough(true)}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Show Tutorial
            </button>
          </div>
          <p className="text-gray-600">Track production, purchases, and distributions in real-time</p>
        </div>

        <DemoNotice />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Items</div>
              <div className="p-2 bg-gray-100 rounded-lg">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold text-gray-900">{stats?.total_items || 0}</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-red-100">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-red-600 uppercase tracking-wide">Low Stock</div>
              <div className="p-2 bg-red-50 rounded-lg">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold text-red-600">{stats?.low_stock_items || 0}</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-green-100">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-[#A8B968] uppercase tracking-wide">Productions</div>
              <div className="p-2 bg-[#A8B968]/10 rounded-lg">
                <svg className="w-5 h-5 text-[#A8B968]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold text-[#A8B968]">{stats?.productions_this_week || 0}</div>
            <div className="text-xs text-gray-500 mt-1">This week</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-teal-100">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-[#5FA8A6] uppercase tracking-wide">Distributions</div>
              <div className="p-2 bg-[#5FA8A6]/10 rounded-lg">
                <svg className="w-5 h-5 text-[#5FA8A6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold text-[#5FA8A6]">{stats?.distributions_this_week || 0}</div>
            <div className="text-xs text-gray-500 mt-1">This week</div>
          </div>
        </div>

      {/* Quick Entry Cards */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Quick Entry</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Production Card */}
          <button
            onClick={() => setShowProductionForm(!showProductionForm)}
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 text-left group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-[#A8B968] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">Record Production</h3>
              <p className="text-sm text-gray-600">Log in-house manufactured items</p>
            </div>
          </button>

          {/* Purchase Card */}
          <button
            onClick={() => setShowPurchaseForm(!showPurchaseForm)}
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 text-left group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-[#D9896C] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">Record Purchase</h3>
              <p className="text-sm text-gray-600">Log incoming supplies & bulk items</p>
            </div>
          </button>

          {/* Distribution Card */}
          <button
            onClick={() => setShowDistributionForm(!showDistributionForm)}
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 text-left group"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-[#5FA8A6] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">Record Distribution</h3>
              <p className="text-sm text-gray-600">Track outgoing aid packages</p>
            </div>
          </button>
        </div>
      </div>

      {/* Quick Entry Forms */}
      {showProductionForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
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
        <div className="bg-white rounded-lg shadow p-6 mb-6">
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
                <option value="weekly_package">Weekly Package</option>
                <option value="crisis_aid">Crisis Aid</option>
                <option value="school_delivery">School Delivery</option>
                <option value="boarding_home">Boarding Home</option>
                <option value="large_aid_drop">Large Aid Drop</option>
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
              <label className="block text-sm font-medium mb-1">Recipient Info (optional)</label>
              <input type="text" name="recipient_info" placeholder="Location, organization, etc." className="w-full border rounded-lg p-2" />
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
        <div className="space-y-2">
          {stats?.recent_activity.length === 0 && (
            <p className="text-gray-500">No recent activity</p>
          )}
          {stats?.recent_activity.map((activity, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b">
              <div>
                <span className="font-medium">{activity.item_name}</span>
                <span className="text-gray-600 ml-2">
                  {activity.movement_type === 'in' ? '+' : '-'}{activity.quantity}
                </span>
                <span className="text-sm text-gray-500 ml-2">({activity.type})</span>
              </div>
              <div className="text-sm text-gray-500">
                {new Date(activity.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
        </div>
      </div>
    </>
  );
}
