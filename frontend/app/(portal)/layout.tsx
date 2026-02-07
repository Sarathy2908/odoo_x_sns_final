'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getUser, removeToken } from '@/lib/api';
import { ToastProvider } from '@/app/components/Toast';

const portalMenuItems = [
    { name: 'Products', path: '/portal/catalog', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { name: 'Plans', path: '/portal/subscriptions', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { name: 'Cart', path: '/portal/cart', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z' },
    { name: 'Profile', path: '/portal/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const currentUser = getUser();
        if (!currentUser) {
            router.push('/login');
        } else {
            setUser(currentUser);
        }
    }, [router]);

    // Close mobile sidebar on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    const handleLogout = () => {
        removeToken();
        router.push('/login');
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F0EEEF]">
                <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    const currentPageName = portalMenuItems.find(
        (item) => item.path === pathname || pathname.startsWith(item.path + '/')
    )?.name || 'Portal';

    const showLabels = sidebarOpen || mobileOpen;

    const sidebarContent = (
        <>
            <div className="h-14 flex items-center justify-between px-4 border-b border-white/15">
                {showLabels ? (
                    <Image src="/logo.png" alt="SIDAZ" width={110} height={30} className="object-contain mix-blend-screen" priority />
                ) : (
                    <Image src="/logo.png" alt="SIDAZ" width={28} height={28} className="object-contain mix-blend-screen" priority />
                )}
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden md:block p-1 hover:bg-white/10 rounded transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? 'M11 19l-7-7 7-7m8 14l-7-7 7-7' : 'M13 5l7 7-7 7M5 5l7 7-7 7'} />
                    </svg>
                </button>
                <button onClick={() => setMobileOpen(false)} className="md:hidden p-1 hover:bg-white/10 rounded transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <nav className="py-2 px-2 space-y-0.5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
                {portalMenuItems.map((item) => (
                    <Link
                        key={item.path}
                        href={item.path}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                            pathname === item.path || pathname.startsWith(item.path + '/')
                                ? 'bg-white/20 text-white font-medium'
                                : 'text-white/75 hover:bg-white/10 hover:text-white'
                        }`}
                        title={!showLabels ? item.name : undefined}
                    >
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                        </svg>
                        {showLabels && <span>{item.name}</span>}
                    </Link>
                ))}
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/15">
                <div className={`flex items-center gap-2 ${!showLabels && 'justify-center'}`}>
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    {showLabels && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.name}</p>
                            <p className="text-xs text-white/60 truncate">PORTAL USER</p>
                        </div>
                    )}
                </div>
                {showLabels && (
                    <button onClick={handleLogout} className="mt-2 w-full px-3 py-1.5 text-xs text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors text-left flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                    </button>
                )}
            </div>
        </>
    );

    return (
        <ToastProvider>
        <div className="min-h-screen bg-[#F0EEEF]">
            {/* Mobile backdrop */}
            {mobileOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
            )}

            {/* Desktop sidebar */}
            <aside className={`hidden md:block fixed top-0 left-0 h-full bg-primary text-white transition-all duration-200 z-50 ${sidebarOpen ? 'w-56' : 'w-16'}`}>
                {sidebarContent}
            </aside>

            {/* Mobile sidebar (slide-over) */}
            <aside className={`md:hidden fixed top-0 left-0 h-full w-64 bg-primary text-white z-50 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {sidebarContent}
            </aside>

            <main className={`transition-all duration-200 ${sidebarOpen ? 'md:ml-56' : 'md:ml-16'}`}>
                <header className="h-14 bg-white border-b border-gray-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setMobileOpen(true)} className="md:hidden p-1.5 -ml-1 rounded-md hover:bg-gray-100 transition-colors">
                            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <h2 className="text-base md:text-lg font-semibold text-gray-900 truncate">{currentPageName}</h2>
                    </div>
                    <span className="text-sm text-gray-500 hidden sm:block">Welcome, <span className="font-medium text-gray-700">{user.name}</span></span>
                </header>
                <div className="p-4 md:p-6">{children}</div>
            </main>
        </div>
        </ToastProvider>
    );
}
