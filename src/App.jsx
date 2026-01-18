import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Plus, Trash2, GripVertical, Image, Link, MapPin, ChevronDown, ChevronUp, Download, Upload, Sun, Moon, CloudSun, Sparkles, X, Edit2, Check, Copy, Clipboard, LayoutList, Calendar, AlignJustify, Palette } from 'lucide-react';

const defCats = [{ id: 'food', name: '食事', color: '#f97316' }, { id: 'cafe', name: 'カフェ', color: '#a855f7' }, { id: 'shopping', name: '買い物', color: '#ec4899' }, { id: 'transport', name: '移動', color: '#3b82f6' }, { id: 'sightseeing', name: '観光', color: '#10b981' }, { id: 'other', name: 'その他', color: '#6b7280' }];
const tIcon = (h) => h < 6 ? Moon : h < 10 ? Sun : h < 14 ? Sun : h < 18 ? CloudSun : Moon;
const fmt = (n) => n.toLocaleString('ja-JP');
const addH = (t, h = 1) => { const [hh, mm] = t.split(':').map(Number); return `${String(Math.min(23, hh + h)).padStart(2, '0')}:${String(mm).padStart(2, '0')}`; };
const toMin = (t) => { if (!t) return 0; const [h, m] = t.split(':').map(Number); return h * 60 + m; };

// Justified Layout: 各行をコンテナ幅に合わせて画像を配置
// 画像のアスペクト比を維持しながら、行の高さを調整して隙間なく埋める
const JustifiedGallery = ({ imgs, onRm, targetRowHeight = 120, containerWidth = 400, gap = 4 }) => {
  const [imageSizes, setImageSizes] = useState({});
  const containerRef = useRef(null);
  const [actualWidth, setActualWidth] = useState(containerWidth);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setActualWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // 画像のサイズを取得
  useEffect(() => {
    imgs.forEach((img, i) => {
      if (!imageSizes[img]) {
        const imgEl = new window.Image();
        imgEl.onload = () => {
          setImageSizes(prev => ({
            ...prev,
            [img]: { width: imgEl.width, height: imgEl.height, ratio: imgEl.width / imgEl.height }
          }));
        };
        imgEl.src = img;
      }
    });
  }, [imgs, imageSizes]);

  // Justified Layoutの計算
  const layout = useMemo(() => {
    const rows = [];
    let currentRow = [];
    let currentRowWidth = 0;
    const availableWidth = actualWidth;

    const imgsWithSize = imgs.map((img, i) => ({
      img,
      index: i,
      ratio: imageSizes[img]?.ratio || 1
    }));

    for (const item of imgsWithSize) {
      // 各画像のターゲット行高さでの幅を計算
      const imgWidth = targetRowHeight * item.ratio;

      // 現在の行に画像を追加した場合の幅（ギャップ含む）
      const newRowWidth = currentRowWidth + imgWidth + (currentRow.length > 0 ? gap : 0);

      if (newRowWidth > availableWidth && currentRow.length > 0) {
        // 行が満杯になったので、行を確定
        rows.push({ items: [...currentRow], totalRatio: currentRow.reduce((s, i) => s + i.ratio, 0) });
        currentRow = [item];
        currentRowWidth = imgWidth;
      } else {
        currentRow.push(item);
        currentRowWidth = newRowWidth;
      }
    }

    // 最後の行
    if (currentRow.length > 0) {
      rows.push({ items: currentRow, totalRatio: currentRow.reduce((s, i) => s + i.ratio, 0), isLast: true });
    }

    // 各行の高さと画像の幅を計算
    return rows.map(row => {
      const totalGaps = (row.items.length - 1) * gap;
      const availableForImages = availableWidth - totalGaps;

      // 最後の行は、行幅を超えないようにターゲット高さを維持
      let rowHeight;
      if (row.isLast && row.items.length < 3) {
        rowHeight = targetRowHeight;
      } else {
        rowHeight = availableForImages / row.totalRatio;
      }

      let x = 0;
      const positions = row.items.map(item => {
        const width = rowHeight * item.ratio;
        const pos = { ...item, x, y: 0, width, height: rowHeight };
        x += width + gap;
        return pos;
      });

      return { height: rowHeight, positions };
    });
  }, [imgs, imageSizes, actualWidth, targetRowHeight, gap]);

  const totalHeight = layout.reduce((h, row) => h + row.height + gap, 0) - gap;

  if (!imgs?.length) return null;

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-lg overflow-hidden bg-black/20"
      style={{ height: Math.max(totalHeight, 60) }}
    >
      {layout.map((row, rowIndex) => {
        let yOffset = layout.slice(0, rowIndex).reduce((h, r) => h + r.height + gap, 0);
        return row.positions.map((item) => (
          <div
            key={item.index}
            className="absolute group"
            style={{
              left: item.x,
              top: yOffset,
              width: item.width,
              height: item.height,
            }}
          >
            <div className="w-full h-full relative rounded overflow-hidden">
              <img
                src={item.img}
                alt=""
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => onRm(item.index)}
                className="absolute top-1 right-1 bg-red-500/80 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        ));
      })}
    </div>
  );
};

export default function App({ loadData, saveData }) {
  const [cats, setCats] = useState(defCats);
  const [plans, setPlans] = useState([{ id: 'def', name: '新しいプラン', date: new Date().toISOString().split('T')[0], items: [] }]);
  const [curId, setCurId] = useState('def');
  const [dragged, setDragged] = useState(null);
  const [editId, setEditId] = useState(null);
  const [showList, setShowList] = useState(false);
  const [editName, setEditName] = useState(false);
  const [view, setView] = useState('list');
  const [imgDrag, setImgDrag] = useState(null);
  const [showCat, setShowCat] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', color: '#f97316' });
  const [loaded, setLoaded] = useState(false);
  const impRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Load data from cloud on mount
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
      setLoaded(true);
    }
  }, []);

  // Auto-save to cloud when data changes (debounced)
  useEffect(() => {
    if (!loaded || !saveData) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveData({ plans, cats, curId });
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [plans, cats, curId, loaded]);

  const plan = plans.find(p => p.id === curId) || plans[0], items = plan?.items || [];
  const setItems = (a) => setPlans(plans.map(p => p.id === curId ? { ...p, items: a } : p));
  const upd = (id, o) => setItems(items.map(i => i.id === id ? { ...i, ...o } : i));

  const add = () => { const last = items[items.length - 1], st = last ? (last.endTime || addH(last.startTime)) : '09:00'; const n = { id: Date.now().toString(), startTime: st, endTime: addH(st), title: '', memo: '', category: 'other', budget: '', images: [], links: [], location: '' }; setItems([...items, n]); setEditId(n.id); };
  const del = (id) => { setItems(items.filter(i => i.id !== id)); if (editId === id) setEditId(null); };

  const onDS = (e, i) => { setDragged(i); e.dataTransfer.effectAllowed = 'move'; };
  const onDO = (e, t) => { e.preventDefault(); if (!dragged || dragged.id === t.id) return; const a = [...items], di = a.findIndex(x => x.id === dragged.id), ti = a.findIndex(x => x.id === t.id); a.splice(di, 1); a.splice(ti, 0, dragged); setItems(a); };

  const upImg = (id, files) => { Array.from(files).forEach(f => { if (!f.type.startsWith('image/')) return; const r = new FileReader(); r.onload = (e) => upd(id, { images: [...(items.find(x => x.id === id).images || []), e.target.result] }); r.readAsDataURL(f); }); };
  const dropImg = (id, e) => { e.preventDefault(); setImgDrag(null); if (e.dataTransfer.files.length) upImg(id, e.dataTransfer.files); };
  const pasteImg = async (id) => { try { for (const c of await navigator.clipboard.read()) for (const t of c.types) if (t.startsWith('image/')) { const r = new FileReader(); r.onload = (e) => upd(id, { images: [...(items.find(x => x.id === id).images || []), e.target.result] }); r.readAsDataURL(await c.getType(t)); return; } alert('画像なし'); } catch { alert('アクセス不可'); } };
  const pasteLink = async (id) => { try { const t = await navigator.clipboard.readText(); if (t?.startsWith('http')) setItems(items.map(x => x.id === id ? { ...x, links: [...(x.links || []), { url: t, label: '' }] } : x)); else alert('URLなし'); } catch { alert('アクセス不可'); } };
  const addLink = (id) => setItems(items.map(x => x.id === id ? { ...x, links: [...(x.links || []), { url: '', label: '' }] } : x));
  const updLink = (id, i, k, v) => setItems(items.map(x => { if (x.id !== id) return x; const l = [...x.links]; l[i] = { ...l[i], [k]: v }; return { ...x, links: l }; }));
  const rmLink = (id, i) => setItems(items.map(x => x.id === id ? { ...x, links: x.links.filter((_, j) => j !== i) } : x));
  const rmImg = (id, i) => setItems(items.map(x => x.id === id ? { ...x, images: x.images.filter((_, j) => j !== i) } : x));

  const total = items.reduce((s, i) => s + (parseInt(i.budget) || 0), 0);
  const addPlan = () => { const n = { id: Date.now().toString(), name: '新しいプラン', date: new Date().toISOString().split('T')[0], items: [] }; setPlans([...plans, n]); setCurId(n.id); setShowList(false); };
  const delPlan = (id) => { if (plans.length === 1) return; const a = plans.filter(p => p.id !== id); setPlans(a); if (curId === id) setCurId(a[0].id); };
  const dupPlan = () => { const n = { ...plan, id: Date.now().toString(), name: plan.name + ' (コピー)', items: plan.items.map(i => ({ ...i, id: Date.now() + '' + Math.random() })) }; setPlans([...plans, n]); setCurId(n.id); setShowList(false); };
  const exp = () => { const b = new Blob([JSON.stringify({ plans, cats }, null, 2)], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `cheatday.json`; a.click(); };
  const imp = (e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = (ev) => { try { const d = JSON.parse(ev.target.result); setPlans(d.plans || d); setCurId((d.plans || d)[0].id); if (d.cats) setCats(d.cats); } catch { alert('失敗'); } }; r.readAsText(f); };
  const addCat = () => { if (!newCat.name.trim()) return; setCats([...cats, { id: 'c' + Date.now(), ...newCat }]); setNewCat({ name: '', color: '#f97316' }); };
  const updCat = (id, o) => setCats(cats.map(c => c.id === id ? { ...c, ...o } : c));
  const delCat = (id) => { if (cats.length <= 1) return; setCats(cats.filter(c => c.id !== id)); };

  const Dot = ({ c, s = 16 }) => <div style={{ width: s, height: s, borderRadius: '50%', backgroundColor: cats.find(x => x.id === c)?.color || '#888' }} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-3">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 mb-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">🎉 チートデイプランナー</h1>
            <div className="flex gap-1">
              {[['list', LayoutList], ['timeline', AlignJustify], ['overview', Calendar]].map(([v, I]) => <button key={v} onClick={() => setView(v)} className={`p-2 rounded-lg ${view === v ? 'bg-white/20' : 'hover:bg-white/10'}`}><I size={18} /></button>)}
              <div className="w-px bg-white/20 mx-1" />
              <button onClick={() => setShowCat(true)} className="p-2 hover:bg-white/10 rounded-lg"><Palette size={18} /></button>
              <button onClick={() => impRef.current?.click()} className="p-2 hover:bg-white/10 rounded-lg"><Upload size={18} /></button>
              <input ref={impRef} type="file" accept=".json" onChange={imp} className="hidden" />
              <button onClick={exp} className="p-2 hover:bg-white/10 rounded-lg"><Download size={18} /></button>
            </div>
          </div>
          <div className="relative">
            <button onClick={() => setShowList(!showList)} className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-xl p-3">
              <div className="flex items-center gap-3">{editName ? <input type="text" value={plan.name} onChange={(e) => setPlans(plans.map(p => p.id === curId ? { ...p, name: e.target.value } : p))} onBlur={() => setEditName(false)} onKeyDown={(e) => e.key === 'Enter' && setEditName(false)} onClick={(e) => e.stopPropagation()} className="bg-transparent border-b border-white/30 outline-none" autoFocus /> : <span className="font-medium">{plan.name}</span>}<input type="date" value={plan.date} onChange={(e) => setPlans(plans.map(p => p.id === curId ? { ...p, date: e.target.value } : p))} onClick={(e) => e.stopPropagation()} className="bg-transparent text-sm text-white/60 outline-none" /></div>
              <div className="flex items-center gap-2"><button onClick={(e) => { e.stopPropagation(); setEditName(true); }} className="p-1 hover:bg-white/10 rounded"><Edit2 size={14} /></button>{showList ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
            </button>
            {showList && <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 rounded-xl border border-white/10 z-10">{plans.map(p => <div key={p.id} className={`flex items-center justify-between p-3 hover:bg-white/5 cursor-pointer ${p.id === curId ? 'bg-white/10' : ''}`} onClick={() => { setCurId(p.id); setShowList(false); }}><span>{p.name}</span>{plans.length > 1 && <button onClick={(e) => { e.stopPropagation(); delPlan(p.id); }} className="p-1 hover:bg-red-500/20 rounded text-red-400"><Trash2 size={14} /></button>}</div>)}<div className="border-t border-white/10 p-2 flex gap-2"><button onClick={addPlan} className="flex-1 p-2 hover:bg-white/5 rounded-lg text-sm flex items-center justify-center gap-1"><Plus size={16} />新規</button><button onClick={dupPlan} className="flex-1 p-2 hover:bg-white/5 rounded-lg text-sm flex items-center justify-center gap-1"><Copy size={16} />複製</button></div></div>}
          </div>
          <div className="mt-3 flex items-center justify-between text-sm"><span className="text-white/60">予算合計</span><span className="text-lg font-bold text-emerald-400">¥{fmt(total)}</span></div>
        </div>

        {showCat && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCat(false)}><div className="bg-slate-800 rounded-2xl p-4 w-full max-w-md border border-white/10" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between mb-4"><h2 className="font-bold">カテゴリ編集</h2><button onClick={() => setShowCat(false)} className="p-1 hover:bg-white/10 rounded"><X size={20} /></button></div><div className="space-y-2 mb-4 max-h-60 overflow-y-auto">{cats.map(c => <div key={c.id} className="flex items-center gap-2 bg-white/5 rounded-lg p-2"><input type="color" value={c.color} onChange={(e) => updCat(c.id, { color: e.target.value })} className="w-8 h-8 rounded cursor-pointer" /><input type="text" value={c.name} onChange={(e) => updCat(c.id, { name: e.target.value })} className="flex-1 bg-transparent outline-none" />{cats.length > 1 && <button onClick={() => delCat(c.id)} className="p-1 hover:bg-red-500/20 rounded text-red-400"><Trash2 size={16} /></button>}</div>)}</div><div className="flex gap-2 border-t border-white/10 pt-4"><input type="color" value={newCat.color} onChange={(e) => setNewCat({ ...newCat, color: e.target.value })} className="w-8 h-8 rounded cursor-pointer" /><input type="text" value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} placeholder="新カテゴリ" className="flex-1 bg-white/5 rounded-lg px-3 py-2 outline-none" onKeyDown={(e) => e.key === 'Enter' && addCat()} /><button onClick={addCat} className="px-4 py-2 bg-orange-500 rounded-lg">追加</button></div></div></div>}

        {view === 'overview' && (() => { const minT = items.length ? Math.min(...items.map(i => toMin(i.startTime))) : 540, maxT = items.length ? Math.max(...items.map(i => toMin(i.endTime || addH(i.startTime)))) : 1080, hrs = []; for (let h = Math.floor(minT / 60); h <= Math.ceil(maxT / 60); h++) hrs.push(h); return <div className="bg-white/5 rounded-xl p-4 border border-white/10"><div className="flex"><div className="w-14">{hrs.map(h => <div key={h} className="h-16 text-xs text-white/40 flex items-start justify-end pr-2">{String(h).padStart(2, '0')}:00</div>)}</div><div className="flex-1 relative border-l border-white/10">{hrs.map(h => <div key={h} className="h-16 border-b border-white/5" />)}{items.map(i => { const cat = cats.find(c => c.id === i.category), st = toMin(i.startTime), en = toMin(i.endTime || addH(i.startTime)), top = ((st - hrs[0] * 60) / 60) * 64, ht = Math.max(24, ((en - st) / 60) * 64 - 4); return <div key={i.id} className="absolute left-1 right-1 rounded-lg px-2 py-1 cursor-pointer hover:ring-2 ring-white/30" style={{ top, height: ht, backgroundColor: cat?.color + '40', borderLeft: `3px solid ${cat?.color}` }} onClick={() => { setView('list'); setEditId(i.id); }}><div className="text-xs font-medium truncate">{i.title || '(無題)'}</div><div className="text-xs text-white/60">{i.startTime}〜{i.endTime}</div></div>; })}</div></div></div>; })()}

        {view === 'timeline' && <div className="space-y-0">{items.map(i => { const cat = cats.find(c => c.id === i.category), ht = Math.max(60, (toMin(i.endTime) - toMin(i.startTime)) * 1.5 || 90); return <div key={i.id} className="flex" style={{ minHeight: ht }}><div className="w-16 text-right pr-3 pt-2"><div className="text-sm font-mono">{i.startTime}</div><div className="text-xs text-white/40">{i.endTime}</div></div><div className="flex-1 pl-4 border-l-2" style={{ borderColor: cat?.color }}><div className="bg-white/5 rounded-lg p-3 cursor-pointer hover:bg-white/10" onClick={() => { setView('list'); setEditId(i.id); }}><div className="flex items-center gap-2"><Dot c={i.category} /><span className="font-medium">{i.title || '(無題)'}</span>{i.budget && <span className="text-emerald-400 text-sm ml-auto">¥{fmt(parseInt(i.budget))}</span>}</div>{i.location && <div className="text-sm text-white/50 mt-1 flex items-center gap-1"><MapPin size={12} />{i.location}</div>}{i.images?.length > 0 && <div className="mt-2"><JustifiedGallery imgs={i.images} onRm={() => { }} targetRowHeight={80} /></div>}</div></div></div>; })}</div>}

        {view === 'list' && <div className="space-y-3">{items.map(i => {
          const TI = tIcon(parseInt(i.startTime?.split(':')[0]) || 9), cat = cats.find(c => c.id === i.category), ed = editId === i.id; return <div key={i.id} draggable onDragStart={(e) => onDS(e, i)} onDragOver={(e) => onDO(e, i)} onDragEnd={() => setDragged(null)} className={`bg-white/5 rounded-xl border ${ed ? 'border-orange-500/50 ring-1 ring-orange-500/20' : 'border-white/10'}`}>
            <div className="flex items-center gap-2 p-3"><div className="cursor-grab text-white/30"><GripVertical size={18} /></div><TI size={16} className="text-yellow-400" /><input type="time" value={i.startTime} onChange={(e) => upd(i.id, { startTime: e.target.value })} className="bg-white/10 rounded px-2 py-1 text-sm font-mono w-[90px] outline-none" /><span className="text-white/30">→</span><input type="time" value={i.endTime} onChange={(e) => upd(i.id, { endTime: e.target.value })} className="bg-white/10 rounded px-2 py-1 text-sm font-mono w-[90px] outline-none" /><input type="text" value={i.title} onChange={(e) => upd(i.id, { title: e.target.value })} placeholder="タイトル" className="flex-1 bg-transparent outline-none font-medium min-w-0" /><button onClick={() => setEditId(ed ? null : i.id)} className={`p-1.5 rounded-lg ${ed ? 'bg-orange-500' : 'hover:bg-white/10'}`}>{ed ? <Check size={16} /> : <Edit2 size={16} />}</button><button onClick={() => del(i.id)} className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400"><Trash2 size={16} /></button></div>
            <div className="px-3 pb-2 flex items-center gap-3 text-sm flex-wrap"><div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ backgroundColor: cat?.color + '20' }}><Dot c={i.category} s={12} /><span style={{ color: cat?.color }}>{cat?.name}</span></div>{i.budget && <span className="text-emerald-400">¥{fmt(parseInt(i.budget))}</span>}{i.location && <span className="text-white/50 flex items-center gap-1"><MapPin size={12} />{i.location}</span>}{i.images?.length > 0 && <span className="text-white/50 flex items-center gap-1"><Image size={12} />{i.images.length}</span>}{i.links?.length > 0 && <span className="text-white/50 flex items-center gap-1"><Link size={12} />{i.links.length}</span>}</div>
            {ed && <div className="border-t border-white/10 p-3 space-y-3">
              <div className="flex gap-2 flex-wrap">{cats.map(c => <button key={c.id} onClick={() => upd(i.id, { category: c.id })} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm ${i.category === c.id ? 'ring-2' : 'opacity-60 hover:opacity-100'}`} style={{ backgroundColor: c.color + '20', color: c.color }}><div style={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: c.color }} />{c.name}</button>)}</div>
              <div className="flex gap-2"><div className="flex-1 flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2"><MapPin size={16} className="text-white/40" /><input type="text" value={i.location} onChange={(e) => upd(i.id, { location: e.target.value })} placeholder="場所" className="flex-1 bg-transparent outline-none text-sm" /></div><div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2"><span className="text-emerald-400">¥</span><input type="number" value={i.budget} onChange={(e) => upd(i.id, { budget: e.target.value })} placeholder="予算" className="w-20 bg-transparent outline-none text-sm" /></div></div>
              <textarea value={i.memo} onChange={(e) => upd(i.id, { memo: e.target.value })} placeholder="メモ..." className="w-full bg-white/5 rounded-lg p-3 outline-none text-sm resize-none h-16" />
              <div><div className="flex items-center gap-2 mb-2"><Image size={16} className="text-white/40" /><span className="text-sm text-white/60">画像</span><div className="ml-auto flex gap-1"><button onClick={() => pasteImg(i.id)} className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded-lg flex items-center gap-1"><Clipboard size={12} />貼付</button><button onClick={() => document.getElementById(`img-${i.id}`).click()} className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded-lg">選択</button></div><input id={`img-${i.id}`} type="file" accept="image/*" multiple onChange={(e) => upImg(i.id, e.target.files)} className="hidden" /></div><div onDrop={(e) => dropImg(i.id, e)} onDragOver={(e) => { e.preventDefault(); setImgDrag(i.id); }} onDragLeave={() => setImgDrag(null)} className={`border-2 border-dashed rounded-lg p-2 ${imgDrag === i.id ? 'border-orange-500 bg-orange-500/10' : 'border-white/20'}`}>{i.images?.length > 0 ? <JustifiedGallery imgs={i.images} onRm={(idx) => rmImg(i.id, idx)} targetRowHeight={100} /> : <div className="text-center text-white/40 text-sm py-4">画像をドロップまたは貼り付け</div>}</div></div>
              <div><div className="flex items-center gap-2 mb-2"><Link size={16} className="text-white/40" /><span className="text-sm text-white/60">リンク</span><div className="ml-auto flex gap-1"><button onClick={() => pasteLink(i.id)} className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded-lg flex items-center gap-1"><Clipboard size={12} />貼付</button><button onClick={() => addLink(i.id)} className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded-lg">追加</button></div></div>{i.links?.map((l, j) => <div key={j} className="flex gap-2 mb-2"><input type="text" value={l.label} onChange={(e) => updLink(i.id, j, 'label', e.target.value)} placeholder="ラベル" className="w-20 bg-white/5 rounded-lg px-2 py-1.5 outline-none text-sm" /><input type="url" value={l.url} onChange={(e) => updLink(i.id, j, 'url', e.target.value)} placeholder="https://..." className="flex-1 bg-white/5 rounded-lg px-2 py-1.5 outline-none text-sm" /><button onClick={() => rmLink(i.id, j)} className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400"><X size={16} /></button></div>)}</div>
            </div>}
          </div>;
        })}</div>}

        <button onClick={add} className="w-full mt-4 p-4 border-2 border-dashed border-white/20 hover:border-orange-500/50 rounded-xl flex items-center justify-center gap-2 text-white/60 hover:text-orange-400"><Plus size={20} />予定を追加</button>
        {items.length === 0 && <div className="text-center py-12 text-white/40"><Sparkles size={48} className="mx-auto mb-4 opacity-50" /><p>まだ予定がありません</p></div>}
      </div>
    </div>
  );
}
