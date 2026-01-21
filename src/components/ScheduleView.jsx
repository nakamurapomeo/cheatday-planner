import React, { useMemo } from 'react';
import { MapPin, Clock, GripVertical, Image as ImageIcon, Link as LinkIcon, AlertCircle } from 'lucide-react';
import JustifiedGallery from './JustifiedGallery';

// Helpers
const toMin = (t) => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
};

const PX_PER_MIN = 2.5; // 1 hour = 150px



const ScheduleView = ({
    items,
    cats,
    viewMode, // 'list' or 'timeline' 
    onEdit,
    onImgClick
}) => {

    // Calculate gaps and process items for display
    const processedItems = useMemo(() => {
        if (!items.length) return [];

        // Sort items by start time to ensure gap calculation is correct
        const sorted = [...items].sort((a, b) => toMin(a.startTime) - toMin(b.startTime));

        const result = [];
        sorted.forEach((item, index) => {
            result.push({ type: 'event', data: item });

            const nextItem = sorted[index + 1];
            if (nextItem) {
                const endMin = toMin(item.endTime);
                const startMin = toMin(nextItem.startTime);
                const gap = startMin - endMin;

                if (gap > 0) {
                    result.push({
                        type: 'gap',
                        duration: gap,
                        startTime: item.endTime,
                        endTime: nextItem.startTime,
                        height: gap * PX_PER_MIN
                    });
                }
            }
        });
        return result;
    }, [items]);

    return (
        <div className="flex flex-col p-4 pb-20">
            {items.length === 0 && (
                <div className="flex flex-col items-center justify-center p-10 text-slate-400">
                    <p>予定がありません</p>
                </div>
            )}

            {processedItems.map((node, idx) => {
                if (node.type === 'gap') {
                    return (
                        <div key={`gap-${idx}`} className="flex items-center gap-4 pl-4 opacity-60 relative group/gap" style={viewMode === 'timeline' ? { height: node.height } : { height: '32px', marginBottom: '8px' }}>
                            <div className="w-16 text-right text-xs font-mono text-slate-400">
                                {node.duration}分
                            </div>
                            <div className="flex-1 flex items-center justify-center relative h-8">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t-2 border-dashed border-slate-300"></div>
                                </div>
                                <span className="relative bg-slate-50 px-2 text-xs text-slate-400 font-medium flex items-center gap-1">
                                    <span className="inline-block w-2 h-2 rounded-full bg-slate-300"></span>
                                    移動 / 休憩
                                </span>
                            </div>
                        </div>
                    );
                }

                const item = node.data;
                const cat = cats.find(c => c.id === item.category);
                const duration = toMin(item.endTime) - toMin(item.startTime);

                // Timeline View: Height is proportional
                // List View: Height is auto (undefined)
                const style = viewMode === 'timeline'
                    ? { height: (duration * PX_PER_MIN) + 'px' }
                    : undefined;

                return (
                    <div
                        key={item.id}
                        className={`group relative flex gap-4 transition-all duration-300 ${viewMode === 'timeline' ? 'items-start mb-0' : 'items-center mb-2'}`}
                        style={style}
                        onClick={() => onEdit(item.id)}
                    >
                        {/* Time Column */}
                        <div className={`w-16 flex flex-col items-end pt-1 ${viewMode === 'timeline' ? 'sticky top-[80px]' : ''}`}>
                            <span className="text-sm font-bold font-mono text-slate-700">{item.startTime}</span>
                            <span className="text-xs text-slate-400 font-mono">{item.endTime}</span>
                        </div>

                        {/* Main Card */}
                        <div
                            className="flex-1 rounded-xl bg-white card-shadow relative group-hover:shadow-md transition-shadow cursor-pointer"
                            style={{
                                borderLeft: `4px solid ${cat?.color || '#ccc'}`,
                                // Remove overflow-hidden to allow sticky children if needed, but rounding clips images. 
                                // Actually, sticky inside here works if height is tall.
                            }}
                        >
                            <div className={`${viewMode === 'timeline' ? 'sticky top-[80px] h-full' : ''} p-3 flex flex-col`}>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        {/* Title */}
                                        <div className={`font-bold text-slate-800 leading-tight mb-1 truncate ${viewMode === 'timeline' && duration < 30 ? 'text-sm' : 'text-lg'}`}>
                                            {item.title || '(タイトルなし)'}
                                        </div>

                                        {/* Meta Row */}
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                                            {item.location && (
                                                <span className="flex items-center gap-0.5">
                                                    <MapPin size={12} /> {item.location}
                                                </span>
                                            )}
                                            {item.budget > 0 && (
                                                <span className="font-mono text-emerald-600 font-medium">
                                                    ¥{Number(item.budget).toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Edit Indicator (visible on hover or if needed) */}
                                    {/* Could put a small button here or just rely on clicking the card */}
                                </div>

                                {/* Images Preview (Justified) */}
                                {item.images && item.images.length > 0 && (
                                    <div className="mt-3 -mx-1">
                                        <JustifiedGallery
                                            imgs={item.images}
                                            targetRowHeight={viewMode === 'timeline' ? 100 : 80}
                                            gap={2}
                                            containerWidth={300}
                                            onImgClick={onImgClick} // Just view
                                        />
                                    </div>
                                )}

                                {/* Note/Memo snippet if timeline and tall enough */}
                                {viewMode === 'timeline' && duration > 40 && item.memo && (
                                    <div className="mt-2 text-xs text-slate-400 line-clamp-2">
                                        {item.memo}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ScheduleView;
