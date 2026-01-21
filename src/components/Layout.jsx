import React, { useState } from 'react';
import { Menu, PanelRightClose, PanelLeftClose } from 'lucide-react';

export default function Layout({
    children,       // Center content
    leftSidebar,    // Left panel content
    rightSidebar,   // Right panel content
    title = "Planner"
}) {
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(false);

    // Touch handling
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);

    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        // Right swipe (Open Left / Close Right)
        if (isRightSwipe) {
            if (showRight) setShowRight(false);
            else if (touchStart < 50 && !showLeft) setShowLeft(true);
        }

        // Left swipe (Open Right / Close Left)
        if (isLeftSwipe) {
            if (showLeft) setShowLeft(false);
            else if (touchStart > window.innerWidth - 50 && !showRight) setShowRight(true);
        }
    };

    return (
        <div
            className="flex h-screen w-full bg-slate-50 overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {/* --- DESKTOP LEFT SIDEBAR --- */}
            <aside className="hidden lg:flex w-[280px] h-full flex-col border-r border-slate-200 bg-white shadow-sm z-20">
                {leftSidebar}
            </aside>

            {/* --- MAIN CONTENT CENTER --- */}
            <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-slate-50">
                {/* Mobile Header */}
                <div className="lg:hidden flex items-center justify-between p-3 bg-white border-b border-slate-200 shadow-sm z-30">
                    <button onClick={() => setShowLeft(true)} className="p-2 hover:bg-slate-100 rounded-lg">
                        <Menu size={20} className="text-slate-700" />
                    </button>
                    <h1 className="font-bold text-lg text-slate-800">{title}</h1>
                    <button onClick={() => setShowRight(true)} className="p-2 hover:bg-slate-100 rounded-lg">
                        {/* Using an icon that implies detail/filter or just standard menu if preferred */}
                        <PanelLeftClose size={20} className="text-slate-700 rotate-180" />
                    </button>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-0 relative">
                    {children}
                </div>
            </main>

            {/* --- DESKTOP RIGHT SIDEBAR --- */}
            <aside className="hidden lg:flex w-[320px] h-full flex-col border-l border-slate-200 bg-white shadow-sm z-20">
                {rightSidebar}
            </aside>


            {/* --- MOBILE OVERLAYS & OFF-CANVAS SIDEBARS --- */}

            {/* Left Sidebar Overlay */}
            {showLeft && (
                <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setShowLeft(false)} />
            )}
            <div className={`fixed top-0 left-0 bottom-0 w-[80%] max-w-[300px] bg-white z-50 transform transition-transform duration-300 shadow-2xl lg:hidden ${showLeft ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="h-full flex flex-col">
                    <div className="flex justify-between items-center p-3 border-b border-slate-100">
                        <span className="font-bold text-slate-700">Menu</span>
                        <button onClick={() => setShowLeft(false)} className="p-2"><PanelRightClose size={20} /></button>
                    </div>
                    {leftSidebar}
                </div>
            </div>

            {/* Right Sidebar Overlay */}
            {showRight && (
                <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setShowRight(false)} />
            )}
            <div className={`fixed top-0 right-0 bottom-0 w-[85%] max-w-[340px] bg-white z-50 transform transition-transform duration-300 shadow-2xl lg:hidden ${showRight ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="h-full flex flex-col">
                    <div className="flex justify-between items-center p-3 border-b border-slate-100">
                        <span className="font-bold text-slate-700">Details</span>
                        <button onClick={() => setShowRight(false)} className="p-2"><PanelLeftClose size={20} /></button>
                    </div>
                    {rightSidebar}
                </div>
            </div>
        </div>
    );
}
