import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Trash2, Calendar as CalIcon, Download, Upload,
  MapPin, Clock, Info, Check, X, Palette, LayoutGrid, AlignJustify
} from 'lucide-react';
import Layout from './components/Layout';
import ScheduleView from './components/ScheduleView';
import JustifiedGallery from './components/JustifiedGallery';

// --- Default Data & Helpers ---
const defCats = [
  { id: 'food', name: '食事', color: '#f97316' },
  { id: 'cafe', name: 'カフェ', color: '#a855f7' },
  { id: 'shopping', name: '買い物', color: '#ec4899' },
  { id: 'transport', name: '移動', color: '#3b82f6' },
  { id: 'sightseeing', name: '観光', color: '#10b981' },
];

const addH = (t, h = 1) => {
  if (!t) return '09:00';
  const [hh, mm] = t.split(':').map(Number);
  return `${String(Math.min(23, hh + h)).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

export default function App({ loadData, saveData }) {
  // --- State ---
  const [plans, setPlans] = useState([{ id: 'def', name: '新しいプラン', date: new Date().toISOString().split('T')[0], items: [] }]);
  const [curId, setCurId] = useState('def');
  const [cats, setCats] = useState(defCats);
  const [loaded, setLoaded] = useState(false);

  // UI State
  const [viewMode, setViewMode] = useState('timeline'); // 'list' | 'timeline'
  const [editId, setEditId] = useState(null); // ID of item being edited in Right Sidebar
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366f1');
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // Lightbox state

  const impRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Derived
  const plan = plans.find(p => p.id === curId) || plans[0];
  const items = plan?.items || [];

  // Totals
  const totalBudget = items.reduce((sum, i) => sum + (parseInt(i.budget) || 0), 0);

  // --- Effects ---
  useEffect(() => {
    if (loadData) {
      loadData().then(data => {
        if (data) {
          if (data.plans) setPlans(data.plans);
          if (data.cats) setCats(data.cats);
          if (data.curId) setCurId(data.curId);
        }
        setLoaded(true);
      });
    } else {
      setTimeout(() => setLoaded(true), 0);
    }
  }, [loadData]);

  useEffect(() => {
    if (!loaded || !saveData) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveData({ plans, cats, curId });
    }, 2000);
    return () => clearTimeout(saveTimeoutRef.current);
  }, [plans, cats, curId, loaded, saveData]);

  // --- Actions ---
  const setPlanName = (name) => setPlans(plans.map(p => p.id === curId ? { ...p, name } : p));
  const setPlanDate = (date) => setPlans(plans.map(p => p.id === curId ? { ...p, date } : p));

  const addItem = () => {
    const last = items[items.length - 1];
    const st = last ? (last.endTime || addH(last.startTime)) : '09:00';
    const newItem = {
      id: crypto.randomUUID(),
      startTime: st,
      endTime: addH(st),
      title: '',
      memo: '',
      category: cats[0].id,
      budget: '',
      images: [],
      links: [],
      location: ''
    };
    const newItems = [...items, newItem];
    // Sort logic could go here, but for now append
    setPlans(plans.map(p => p.id === curId ? { ...p, items: newItems } : p));
    setEditId(newItem.id);
  };

  const updateItem = (id, changes) => {
    setPlans(plans.map(p => p.id === curId ? {
      ...p,
      items: p.items.map(i => i.id === id ? { ...i, ...changes } : i)
    } : p));
  };

  const deleteItem = (id) => {
    setPlans(plans.map(p => p.id === curId ? {
      ...p,
      items: p.items.filter(i => i.id !== id)
    } : p));
    if (editId === id) setEditId(null);
  };

  const addCategory = () => {
    if (!newCatName.trim()) return;
    setCats([...cats, { id: 'c' + Date.now(), name: newCatName, color: newCatColor }]);
    setNewCatName('');
    setIsAddingCat(false);
  };

  const deleteCategory = (id) => {
    if (cats.length <= 1) return;
    setCats(cats.filter(c => c.id !== id));
  };

  const importData = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
      try {
        const d = JSON.parse(ev.target.result);
        if (d.plans) setPlans(d.plans);
        if (d.cats) setCats(d.cats);
        // Reset view
        setCurId(d.plans ? d.plans[0].id : plans[0].id);
      } catch { alert('Import failed'); }
    };
    r.readAsText(f);
  };

  const exportData = () => {
    const b = new Blob([JSON.stringify({ plans, cats }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = `cheatday-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const handleImageUpload = async (itemId, files) => {
    const fileList = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileList.length === 0) return;

    try {
      const newImages = await Promise.all(
        fileList.map(f => new Promise((resolve, reject) => {
          const r = new FileReader();
          r.onload = e => resolve(e.target.result);
          r.onerror = reject;
          r.readAsDataURL(f);
        }))
      );

      setPlans(currentPlans => currentPlans.map(p => {
        if (p.id !== curId) return p;
        return {
          ...p,
          items: p.items.map(i => {
            if (i.id !== itemId) return i;
            return {
              ...i,
              images: [...(i.images || []), ...newImages]
            };
          })
        };
      }));
    } catch (err) {
      console.error('Image upload failed', err);
    }
  };

  // --- Render Components ---

  // 1. Left Sidebar: Navigation & Categories
  const LeftSidebar = (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-slate-100">
        <h1 className="text-xl font-bold gradient-text flex items-center gap-2">
          <span>🍕</span> CheatDay
        </h1>
        <p className="text-xs text-slate-400 mt-1">最高の1日を計画しよう</p>
      </div>

      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        {/* Date / Plan Meta */}
        <section>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">プラン名</label>
          <input
            type="text"
            value={plan.name}
            onChange={(e) => setPlanName(e.target.value)}
            className="w-full text-sm font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded px-3 py-2 mb-2 focus:ring-2 ring-orange-200 outline-none"
          />
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded border border-slate-200">
            <CalIcon size={14} className="text-slate-400" />
            <input
              type="date"
              value={plan.date}
              onChange={(e) => setPlanDate(e.target.value)}
              className="bg-transparent text-sm text-slate-600 outline-none font-medium w-full"
            />
          </div>
        </section>

        {/* Categories */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">カテゴリ</label>
            <button onClick={() => setIsAddingCat(!isAddingCat)} className="p-1 hover:bg-slate-100 rounded text-slate-500">
              {isAddingCat ? <X size={14} /> : <Plus size={14} />}
            </button>
          </div>

          {isAddingCat && (
            <div className="p-2 bg-slate-50 rounded mb-2 border border-slate-200 text-sm animate-fadeIn">
              <div className="flex gap-2 mb-2">
                <input type="color" value={newCatColor} onChange={e => setNewCatColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                <input
                  type="text"
                  placeholder="カテゴリ名"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded px-2 outline-none"
                />
              </div>
              <button onClick={addCategory} className="w-full bg-orange-500 text-white rounded py-1 text-xs font-bold">追加</button>
            </div>
          )}

          <div className="space-y-1">
            {cats.map(cat => (
              <div key={cat.id} className="group flex items-center justify-between text-sm py-1.5 px-2 hover:bg-slate-50 rounded cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: cat.color }} />
                  <span className="text-slate-600 font-medium">{cat.name}</span>
                </div>
                {cats.length > 1 && (
                  <button onClick={() => deleteCategory(cat.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Tools */}
        <section>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">ツール</label>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => impRef.current?.click()} className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-xs text-slate-600 font-medium transition-colors">
              <Upload size={14} /> Import
            </button>
            <button onClick={exportData} className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-xs text-slate-600 font-medium transition-colors">
              <Download size={14} /> Export
            </button>
            <input ref={impRef} type="file" accept=".json" onChange={importData} className="hidden" />
          </div>
        </section>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-100 text-xs text-slate-400">
        Ver 2.0 Light
      </div>
    </div>
  );

  // 2. Right Sidebar: Details or Overview
  const editingItem = items.find(i => i.id === editId);

  const RightSidebar = (
    <div className="flex flex-col h-full bg-white">
      {editingItem ? (
        <>
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 sticky top-0 z-10">
            <h2 className="font-bold text-slate-700">詳細を編集</h2>
            <button onClick={() => deleteItem(editingItem.id)} className="text-red-400 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
              <Trash2 size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">タイトル</label>
              <input
                type="text"
                value={editingItem.title}
                onChange={(e) => updateItem(editingItem.id, { title: e.target.value })}
                className="w-full text-lg font-bold text-slate-800 border-b-2 border-slate-100 focus:border-orange-400 outline-none pb-1 bg-transparent placeholder-slate-300"
                placeholder="何をする？"
              />
            </div>

            {/* Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">開始</label>
                <input
                  type="time"
                  value={editingItem.startTime}
                  onChange={(e) => updateItem(editingItem.id, { startTime: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-2 font-mono text-sm outline-none focus:ring-1 ring-orange-200"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">終了</label>
                <input
                  type="time"
                  value={editingItem.endTime}
                  onChange={(e) => updateItem(editingItem.id, { endTime: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-2 font-mono text-sm outline-none focus:ring-1 ring-orange-200"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">カテゴリ</label>
              <div className="flex flex-wrap gap-2">
                {cats.map(c => (
                  <button
                    key={c.id}
                    onClick={() => updateItem(editingItem.id, { category: c.id })}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${editingItem.category === c.id ? 'ring-2 ring-offset-2 ring-slate-300 scale-110' : ''}`}
                    style={{ backgroundColor: c.color }}
                    title={c.name}
                  >
                    {editingItem.category === c.id && <Check size={14} className="text-white/80" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Meta: Budget & Loc */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">予算</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">¥</span>
                  <input
                    type="number"
                    value={editingItem.budget}
                    onChange={(e) => updateItem(editingItem.id, { budget: e.target.value })}
                    className="w-full pl-8 pr-2 py-2 bg-slate-50 border border-slate-200 rounded text-sm font-mono outline-none text-right"
                    placeholder="0"
                    step="100"
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                        e.preventDefault();
                        const val = parseInt(editingItem.budget) || 0;
                        const delta = e.key === 'ArrowUp' ? 100 : -100;
                        updateItem(editingItem.id, { budget: Math.max(0, val + delta) });
                      }
                    }}
                    onWheel={(e) => {
                      e.target.blur(); // Unfocus to prevent accidental rapid changes, or implement custom handler if user insists on wheel.
                      // User requested wheel support. Implementing custom wheel logic:
                      e.preventDefault();
                      const val = parseInt(editingItem.budget) || 0;
                      const delta = e.deltaY < 0 ? 100 : -100;
                      updateItem(editingItem.id, { budget: Math.max(0, val + delta) });
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">場所</label>
                <input
                  type="text"
                  value={editingItem.location}
                  onChange={(e) => updateItem(editingItem.id, { location: e.target.value })}
                  className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded text-sm outline-none"
                  placeholder="場所を入力"
                />
              </div>
            </div>

            {/* Memo */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">メモ</label>
              <textarea
                value={editingItem.memo}
                onChange={(e) => updateItem(editingItem.id, { memo: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded text-sm outline-none h-24 resize-none"
                placeholder="メモを入力..."
              />
            </div>

            {/* Images */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-400">画像</label>
                <button onClick={() => document.getElementById('upload-img').click()} className="text-xs text-orange-500 font-bold hover:underline">
                  + 追加
                </button>
                <input id="upload-img" type="file" multiple accept="image/*" onChange={(e) => handleImageUpload(editingItem.id, e.target.files)} className="hidden" />
              </div>

              <div
                className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg p-4 min-h-[100px] transition-colors hover:bg-slate-100 hover:border-slate-300"
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  if (e.dataTransfer.files.length) handleImageUpload(editingItem.id, e.dataTransfer.files);
                }}
              >
                {editingItem.images && editingItem.images.length > 0 ? (
                  <JustifiedGallery
                    imgs={editingItem.images}
                    targetRowHeight={80}
                    gap={4}
                    containerWidth={280}
                    onRm={(idx) => {
                      const newImgs = editingItem.images.filter((_, i) => i !== idx);
                      updateItem(editingItem.id, { images: newImgs });
                    }}
                  />
                ) : (
                  <div className="text-center py-6 text-slate-300 text-xs pointer-events-none">
                    画像をドラッグ＆ドロップ
                  </div>
                )}
              </div>
            </div>

            <button onClick={() => setEditId(null)} className="w-full py-3 mt-4 text-slate-500 font-medium hover:bg-slate-100 rounded-lg">
              編集を閉じる
            </button>
          </div>
        </>
      ) : (
        <div className="p-6 flex flex-col items-center justify-center h-full text-center">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-4">
            <Info size={32} className="text-orange-400" />
          </div>
          <h3 className="text-slate-700 font-bold mb-2">予定が選択されていません</h3>
          <p className="text-slate-400 text-sm mb-6">予定を選択すると詳細が表示されます。</p>

          <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-xs text-slate-400 uppercase font-bold mb-2">予算合計</p>
            <p className="text-3xl font-bold text-emerald-500 font-mono">¥{totalBudget.toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Layout
      leftSidebar={LeftSidebar}
      rightSidebar={RightSidebar}
      title={plan.name}
    >
      <div className="w-full h-full flex flex-col">
        <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('timeline')}
              className={`p-2 rounded-md transition-all ${viewMode === 'timeline' ? 'bg-white shadow-sm text-orange-500' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <AlignJustify size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-orange-500' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LayoutGrid size={18} />
            </button>
          </div>

          <button
            onClick={addItem}
            className="bg-gradient-to-r from-orange-400 to-pink-500 hover:from-orange-500 hover:to-pink-600 text-white px-6 py-2.5 rounded-full font-bold shadow-lg shadow-orange-200/50 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={20} /> <span className="tracking-wide">追加</span>
          </button>
        </div>

        <div className="min-h-[calc(100vh-80px)]">
          <ScheduleView
            items={items}
            cats={cats}
            viewMode={viewMode}
            onEdit={setEditId}
            onImgClick={setSelectedImage}
          />
        </div>
      </div>

      {/* Lightbox Overlay */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/50 rounded-full p-2 transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X size={32} />
          </button>
          <img
            src={selectedImage}
            alt="Enlarged"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl scale-100 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </Layout>
  );
}
