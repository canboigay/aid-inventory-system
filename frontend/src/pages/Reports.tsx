import { useState, useEffect } from 'react';
import { reportsAPI } from '../api/client';
import type { ComprehensiveReport } from '../types';

export default function Reports() {
  const [report, setReport] = useState<ComprehensiveReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [activeTab, setActiveTab] = useState<'summary' | 'users' | 'distributions' | 'details'>('summary');

  useEffect(() => {
    loadReport();
  }, [period]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await reportsAPI.getActivityReport(period);
      setReport(data);
    } catch (error) {
      console.error('Failed to load report:', error);
      alert('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDistributionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      weekly_package: 'Weekly Package',
      crisis_aid: 'Crisis Aid',
      school_delivery: 'School Delivery',
      boarding_home: 'Boarding Home',
      large_aid_drop: 'Large Aid Drop',
      other: 'Other'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5FA8A6]"></div>
        <p className="mt-4 text-gray-600">Loading report...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="text-center text-gray-500">No report data available</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Activity Reports</h1>
            <p className="text-gray-600 mt-1">
              {formatDateShort(report.summary.date_from)} - {formatDateShort(report.summary.date_to)}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPeriod('day')}
              className={`px-4 py-2 rounded-lg font-medium ${
                period === 'day'
                  ? 'bg-[#5FA8A6] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`px-4 py-2 rounded-lg font-medium ${
                period === 'week'
                  ? 'bg-[#5FA8A6] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-lg font-medium ${
                period === 'month'
                  ? 'bg-[#5FA8A6] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b mb-6">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'summary'
                ? 'border-b-2 border-[#5FA8A6] text-[#5FA8A6]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'users'
                ? 'border-b-2 border-[#5FA8A6] text-[#5FA8A6]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            User Activity
          </button>
          <button
            onClick={() => setActiveTab('distributions')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'distributions'
                ? 'border-b-2 border-[#5FA8A6] text-[#5FA8A6]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Distributions
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'details'
                ? 'border-b-2 border-[#5FA8A6] text-[#5FA8A6]'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Details
          </button>
        </div>
      </div>

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <div className="text-sm text-gray-600 mb-2">Total Productions</div>
              <div className="text-3xl font-bold text-[#A8B968]">{report.summary.total_productions}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <div className="text-sm text-gray-600 mb-2">Total Purchases</div>
              <div className="text-3xl font-bold text-[#D9896C]">{report.summary.total_purchases}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <div className="text-sm text-gray-600 mb-2">Total Distributions</div>
              <div className="text-3xl font-bold text-[#5FA8A6]">{report.summary.total_distributions}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <div className="text-sm text-gray-600 mb-2">Kits Assembled</div>
              <div className="text-3xl font-bold text-gray-900">{report.summary.total_assemblies}</div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-sm text-gray-600 mb-2">Total Items Distributed</div>
              <div className="text-4xl font-bold text-[#5FA8A6]">{report.summary.total_items_distributed}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-sm text-gray-600 mb-2">Active Users</div>
              <div className="text-4xl font-bold text-gray-900">{report.summary.unique_users}</div>
            </div>
          </div>
        </div>
      )}

      {/* User Activity Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">User Activity Summary</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-700">User</th>
                    <th className="text-center p-4 font-semibold text-gray-700">Productions</th>
                    <th className="text-center p-4 font-semibold text-gray-700">Purchases</th>
                    <th className="text-center p-4 font-semibold text-gray-700">Distributions</th>
                    <th className="text-center p-4 font-semibold text-gray-700">Assemblies</th>
                    <th className="text-center p-4 font-semibold text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.user_activities.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-gray-500">
                        No user activity recorded
                      </td>
                    </tr>
                  ) : (
                    report.user_activities.map((user, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium">{user.user_name}</td>
                        <td className="p-4 text-center text-[#A8B968] font-semibold">{user.productions_count}</td>
                        <td className="p-4 text-center text-[#D9896C] font-semibold">{user.purchases_count}</td>
                        <td className="p-4 text-center text-[#5FA8A6] font-semibold">{user.distributions_count}</td>
                        <td className="p-4 text-center text-gray-700 font-semibold">{user.assemblies_count}</td>
                        <td className="p-4 text-center font-bold">{user.total_entries}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Distributions Tab */}
      {activeTab === 'distributions' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Distribution Details</h2>
            {report.distributions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No distributions recorded</p>
            ) : (
              <div className="space-y-4">
                {report.distributions.map((dist) => (
                  <div key={dist.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-lg">{getDistributionTypeLabel(dist.distribution_type)}</div>
                        <div className="text-sm text-gray-600">{formatDate(dist.date)}</div>
                      </div>
                      <div className="text-sm text-gray-600">By: {dist.user_name}</div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="text-sm font-medium text-gray-700 mb-2">Items:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {dist.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                            <span>{item.item_name}</span>
                            <span className="font-semibold">{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {dist.recipient_info && (
                      <div className="mt-3 text-sm">
                        <span className="font-medium">Recipient:</span> {dist.recipient_info}
                      </div>
                    )}

                    {dist.notes && (
                      <div className="mt-2 text-sm text-gray-600 italic">{dist.notes}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* All Details Tab */}
      {activeTab === 'details' && (
        <div className="space-y-6">
          {/* Productions */}
          {report.productions.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-[#A8B968]">Productions</h2>
              <div className="space-y-3">
                {report.productions.map((prod) => (
                  <div key={prod.id} className="border-l-4 border-[#A8B968] pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{prod.item_name}</div>
                        <div className="text-sm text-gray-600">Quantity: {prod.quantity}</div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-gray-600">{formatDate(prod.date)}</div>
                        <div className="text-gray-500">By: {prod.user_name}</div>
                      </div>
                    </div>
                    {prod.notes && <div className="text-sm text-gray-600 mt-1 italic">{prod.notes}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Purchases */}
          {report.purchases.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-[#D9896C]">Purchases</h2>
              <div className="space-y-3">
                {report.purchases.map((purch) => (
                  <div key={purch.id} className="border-l-4 border-[#D9896C] pl-4 py-2">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">
                          {purch.supplier_name || 'Unknown Supplier'}
                        </div>
                        {purch.total_cost && (
                          <div className="text-sm text-gray-600">Total: ${purch.total_cost.toFixed(2)}</div>
                        )}
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-gray-600">{formatDate(purch.date)}</div>
                        <div className="text-gray-500">By: {purch.user_name}</div>
                      </div>
                    </div>
                    <div className="text-sm space-y-1">
                      {purch.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-gray-700">
                          <span>{item.item_name}</span>
                          <span>{item.quantity} @ ${item.unit_cost?.toFixed(2) || 'N/A'}</span>
                        </div>
                      ))}
                    </div>
                    {purch.notes && <div className="text-sm text-gray-600 mt-2 italic">{purch.notes}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assemblies */}
          {report.assemblies.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Kit Assemblies</h2>
              <div className="space-y-3">
                {report.assemblies.map((asm) => (
                  <div key={asm.id} className="border-l-4 border-gray-400 pl-4 py-2">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">{asm.kit_name}</div>
                        <div className="text-sm text-gray-600">Assembled: {asm.quantity_assembled} kits</div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-gray-600">{formatDate(asm.date)}</div>
                        <div className="text-gray-500">By: {asm.user_name}</div>
                      </div>
                    </div>
                    <div className="text-sm space-y-1">
                      {asm.components.map((comp: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-gray-700">
                          <span>{comp.item_name}</span>
                          <span>{comp.quantity_per_kit} per kit</span>
                        </div>
                      ))}
                    </div>
                    {asm.notes && <div className="text-sm text-gray-600 mt-2 italic">{asm.notes}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
