import { useState, useEffect } from 'react';
import { itemsAPI } from '../api/client';
import apiClient from '../api/client';
import type { Item } from '../types';

interface KitComponent {
  item_id: string;
  quantity: number;
}

interface KitTemplate {
  id: string;
  name: string;
  description: string | null;
  kit_item_id: string;
  components: Array<{ item_id: string; quantity: number }>;
  is_active: number;
  created_at: string;
}

export default function Kits() {
  const [items, setItems] = useState<Item[]>([]);
  const [kitTemplates, setKitTemplates] = useState<KitTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAssembleForm, setShowAssembleForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<KitTemplate | null>(null);

  // Form states
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [selectedKitItem, setSelectedKitItem] = useState('');
  const [components, setComponents] = useState<KitComponent[]>([{ item_id: '', quantity: 1 }]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [itemsData, templatesData] = await Promise.all([
        itemsAPI.list(),
        apiClient.get('/kits/templates').then(r => r.data)
      ]);
      setItems(itemsData);
      setKitTemplates(templatesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addComponent = () => {
    setComponents([...components, { item_id: '', quantity: 1 }]);
  };

  const removeComponent = (index: number) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  const updateComponent = (index: number, field: 'item_id' | 'quantity', value: string | number) => {
    const updated = [...components];
    updated[index] = { ...updated[index], [field]: value };
    setComponents(updated);
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedKitItem || components.some(c => !c.item_id || c.quantity <= 0)) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await apiClient.post('/kits/templates', {
        name: templateName,
        description: templateDescription || null,
        kit_item_id: selectedKitItem,
        components: components
      });
      
      setShowCreateForm(false);
      setTemplateName('');
      setTemplateDescription('');
      setSelectedKitItem('');
      setComponents([{ item_id: '', quantity: 1 }]);
      loadData();
    } catch (error: any) {
      console.error('Failed to create template:', error);
      alert(error.response?.data?.detail || 'Failed to create kit template');
    }
  };

  const handleAssembleKit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedTemplate) return;
    
    const formData = new FormData(e.currentTarget);
    const quantity = Number(formData.get('quantity'));
    
    try {
      await apiClient.post('/kits/assemble', {
        kit_template_id: selectedTemplate.id,
        quantity: quantity,
        notes: formData.get('notes') as string || null
      });
      
      setShowAssembleForm(false);
      setSelectedTemplate(null);
      loadData();
      alert(`Successfully assembled ${quantity} ${selectedTemplate.name}(s)!`);
    } catch (error: any) {
      console.error('Failed to assemble kit:', error);
      alert(error.response?.data?.detail || 'Failed to assemble kit');
    }
  };

  const getItemName = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    return item ? item.name : 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5FA8A6]"></div>
        <p className="mt-4 text-gray-600">Loading kits...</p>
      </div>
    );
  }

  const assembledKitItems = items.filter(i => i.category === 'assembled_kit');

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold text-gray-900">Kit Assembly</h1>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-[#5FA8A6] text-white px-6 py-3 rounded-lg hover:bg-[#52918F] font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Kit Template
          </button>
        </div>
        <p className="text-gray-600">Define standard kits and assemble them from component items</p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">How Kit Assembly Works</h3>
            <p className="text-sm text-blue-800">
              1. First, add all individual items to inventory (soap, toothbrush, etc.)<br />
              2. Create a kit item (e.g., "Hygiene Kit") with category "Assembled Kit"<br />
              3. Create a kit template defining what goes in each kit<br />
              4. Assemble kits - components are auto-deducted, assembled kits are added to inventory
            </p>
          </div>
        </div>
      </div>

      {/* Create Template Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-[#5FA8A6]">
          <h2 className="text-2xl font-semibold mb-4">Create Kit Template</h2>
          <form onSubmit={handleCreateTemplate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Template Name *</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  required
                  className="w-full border rounded-lg p-2"
                  placeholder="e.g., Hygiene Kit, School Kit"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kit Item *</label>
                <select
                  value={selectedKitItem}
                  onChange={(e) => setSelectedKitItem(e.target.value)}
                  required
                  className="w-full border rounded-lg p-2"
                >
                  <option value="">Select kit item...</option>
                  {assembledKitItems.map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Must be category "Assembled Kit"</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                className="w-full border rounded-lg p-2"
                rows={2}
                placeholder="Brief description of this kit"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">Components *</label>
                <button
                  type="button"
                  onClick={addComponent}
                  className="text-sm text-[#5FA8A6] hover:text-[#52918F] flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Component
                </button>
              </div>
              {components.map((component, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <select
                    value={component.item_id}
                    onChange={(e) => updateComponent(index, 'item_id', e.target.value)}
                    required
                    className="flex-1 border rounded-lg p-2"
                  >
                    <option value="">Select item...</option>
                    {items.filter(i => i.category !== 'assembled_kit').map(item => (
                      <option key={item.id} value={item.id}>{item.name} - {item.category}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={component.quantity}
                    onChange={(e) => updateComponent(index, 'quantity', Number(e.target.value))}
                    required
                    min="1"
                    className="w-24 border rounded-lg p-2"
                    placeholder="Qty"
                  />
                  {components.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeComponent(index)}
                      className="text-red-600 hover:text-red-700 p-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                className="bg-[#5FA8A6] text-white px-6 py-2 rounded-lg hover:bg-[#52918F] font-medium"
              >
                Create Template
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setTemplateName('');
                  setTemplateDescription('');
                  setSelectedKitItem('');
                  setComponents([{ item_id: '', quantity: 1 }]);
                }}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assemble Kit Form */}
      {showAssembleForm && selectedTemplate && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-[#A8B968]">
          <h2 className="text-2xl font-semibold mb-4">Assemble {selectedTemplate.name}</h2>
          <form onSubmit={handleAssembleKit} className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium mb-2">Components per kit:</h4>
              <ul className="text-sm space-y-1">
                {selectedTemplate.components.map((comp, idx) => (
                  <li key={idx}>
                    • {getItemName(comp.item_id)} × {comp.quantity}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Quantity to Assemble *</label>
              <input
                type="number"
                name="quantity"
                required
                min="1"
                className="w-full border rounded-lg p-2"
                placeholder="How many kits to assemble?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notes (optional)</label>
              <textarea
                name="notes"
                className="w-full border rounded-lg p-2"
                rows={2}
                placeholder="Any notes about this assembly"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="submit"
                className="bg-[#A8B968] text-white px-6 py-2 rounded-lg hover:bg-[#96A55C] font-medium"
              >
                Assemble Kits
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAssembleForm(false);
                  setSelectedTemplate(null);
                }}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Kit Templates List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Kit Templates</h2>
        </div>
        {kitTemplates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No kit templates yet. Create one to get started!
          </div>
        ) : (
          <div className="divide-y">
            {kitTemplates.map((template) => (
              <div key={template.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">{template.name}</h3>
                    {template.description && (
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                    )}
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Components:</h4>
                      <div className="flex flex-wrap gap-2">
                        {template.components.map((comp, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 px-3 py-1 rounded-full">
                            {getItemName(comp.item_id)} × {comp.quantity}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTemplate(template);
                      setShowAssembleForm(true);
                    }}
                    className="ml-4 bg-[#A8B968] text-white px-4 py-2 rounded-lg hover:bg-[#96A55C] font-medium whitespace-nowrap"
                  >
                    Assemble
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
