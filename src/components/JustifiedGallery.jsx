import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';

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
    // Initial measure
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    if (containerRef.current) observer.observe(containerRef.current);
    
    return () => observer.disconnect();
  }, []);

  // Preload images to get aspect ratios
  useEffect(() => {
    imgs.forEach((img) => {
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

  const layout = useMemo(() => {
    const rows = [];
    let currentRow = [];
    let currentRowWidth = 0;
    const availableWidth = actualWidth;

    const imgsWithSize = imgs.map((img, i) => ({
      img,
      index: i,
      ratio: imageSizes[img]?.ratio || 1 // default ratio 1
    }));

    for (const item of imgsWithSize) {
      const imgWidth = targetRowHeight * item.ratio;
      const newRowWidth = currentRowWidth + imgWidth + (currentRow.length > 0 ? gap : 0);

      if (newRowWidth > availableWidth && currentRow.length > 0) {
        rows.push({ items: [...currentRow], totalRatio: currentRow.reduce((s, i) => s + i.ratio, 0) });
        currentRow = [item];
        currentRowWidth = imgWidth;
      } else {
        currentRow.push(item);
        currentRowWidth = newRowWidth;
      }
    }

    if (currentRow.length > 0) {
      rows.push({ items: currentRow, totalRatio: currentRow.reduce((s, i) => s + i.ratio, 0), isLast: true });
    }

    return rows.map(row => {
      const totalGaps = (row.items.length - 1) * gap;
      const availableForImages = availableWidth - totalGaps;
      
      let rowHeight;
      // Don't stretch the last row if it's not full
      if (row.isLast && row.items.length < 3) { // Heuristic: <3 items means "not enough to fill properly"
         rowHeight = Math.min(targetRowHeight, availableForImages / row.totalRatio);
         // If it's really sparsely populated, just stick to targetRowHeight
         if (availableForImages / row.totalRatio > targetRowHeight * 1.5) rowHeight = targetRowHeight;
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
      className="relative w-full overflow-hidden"
      style={{ height: Math.max(totalHeight, 10) }}
    >
      {layout.map((row, rowIndex) => {
        let yOffset = layout.slice(0, rowIndex).reduce((h, r) => h + r.height + gap, 0);
        return row.positions.map((item) => (
          <div
            key={item.index + item.img}
            className="absolute group transition-all duration-300"
            style={{
              left: item.x,
              top: yOffset,
              width: item.width,
              height: item.height,
            }}
          >
            <div className="w-full h-full relative rounded overflow-hidden bg-gray-100">
              <img
                src={item.img}
                alt=""
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                draggable={false}
              />
              {onRm && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRm(item.index); }}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        ));
      })}
    </div>
  );
};

export default JustifiedGallery;
