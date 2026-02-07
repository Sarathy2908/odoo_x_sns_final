'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
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

    useEffect(() => {
        const currentUser = getUser();
        if (!currentUser) {
            router.push('/login');
        } else {
            setUser(currentUser);
        }
    }, [router]);

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

    return (
        <ToastProvider>
        <div className="min-h-screen bg-[#F0EEEF]">
            {/* Fixed Sidebar */}
            <aside className={`fixed top-0 left-0 h-full bg-primary text-white transition-all duration-200 z-50 ${sidebarOpen ? 'w-56' : 'w-16'}`}>
                <div className="h-14 flex items-center justify-between px-4 border-b border-white/15">
                    {sidebarOpen && <span className="text-base font-bold tracking-tight">SIDAZ</span>}
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-white/10 rounded transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? 'M11 19l-7-7 7-7m8 14l-7-7 7-7' : 'M13 5l7 7-7 7M5 5l7 7-7 7'} />
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
                            title={!sidebarOpen ? item.name : undefined}
                        >
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                            </svg>
                            {sidebarOpen && <span>{item.name}</span>}
                        </Link>
                    ))}
                </nav>

                {/* User info at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/15">
                    <div className={`flex items-center gap-2 ${!sidebarOpen && 'justify-center'}`}>
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        {sidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{user.name}</p>
                                <p className="text-xs text-white/60 truncate">PORTAL USER</p>
                            </div>
                        )}
                    </div>
                    {sidebarOpen && (
                        <button onClick={handleLogout} className="mt-2 w-full px-3 py-1.5 text-xs text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors text-left flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                        </button>
                    )}
                </div>
            </aside>

            {/* Main content area */}
            <main className={`transition-all duration-200 ${sidebarOpen ? 'ml-56' : 'ml-16'}`}>
                <header className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-40">
                    <h2 className="text-lg font-semibold text-gray-900">{currentPageName}</h2>
                    <span className="text-sm text-gray-500">Welcome, <span className="font-medium text-gray-700">{user.name}</span></span>
                </header>
                <div className="p-6">{children}</div>
            </main>
        </div>
        </ToastProvider>
    );
}
