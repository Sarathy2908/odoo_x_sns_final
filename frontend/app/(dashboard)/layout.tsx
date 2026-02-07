'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getUser, removeToken } from '@/lib/api';

const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', roles: ['ADMIN', 'INTERNAL_USER', 'PORTAL_USER'] },
    { name: 'Contacts', path: '/contacts', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', roles: ['ADMIN', 'INTERNAL_USER'] },
    { name: 'Products', path: '/products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', roles: ['ADMIN', 'INTERNAL_USER'] },
    { name: 'Subscriptions', path: '/subscriptions', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01', roles: ['ADMIN', 'INTERNAL_USER', 'PORTAL_USER'] },
    { name: 'Quotations', path: '/quotations', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', roles: ['ADMIN', 'INTERNAL_USER'] },
    { name: 'Invoices', path: '/invoices', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z', roles: ['ADMIN', 'INTERNAL_USER', 'PORTAL_USER'] },
    { name: 'Payments', path: '/payments', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', roles: ['ADMIN', 'INTERNAL_USER', 'PORTAL_USER'] },
    { name: 'Reports', path: '/reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', roles: ['ADMIN', 'INTERNAL_USER', 'PORTAL_USER'] },
];

const configItems = [
    { name: 'Recurring Plans', path: '/plans', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15', roles: ['ADMIN', 'INTERNAL_USER'] },
    { name: 'Attributes', path: '/attributes', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z', roles: ['ADMIN', 'INTERNAL_USER'] },
    { name: 'Discounts', path: '/discounts', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1', roles: ['ADMIN'] },
    { name: 'Taxes', path: '/taxes', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z', roles: ['ADMIN', 'INTERNAL_USER'] },
    { name: 'Users', path: '/users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', roles: ['ADMIN', 'INTERNAL_USER'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [configOpen, setConfigOpen] = useState(false);

    useEffect(() => {
        const currentUser = getUser();
        if (!currentUser) {
            router.push('/login');
        } else if (currentUser.role === 'PORTAL_USER') {
            router.push('/portal/catalog');
        } else {
            setUser(currentUser);
        }
    }, [router]);

    // Auto-expand config section if current path matches
    useEffect(() => {
        if (configItems.some(item => pathname === item.path)) {
            setConfigOpen(true);
        }
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

    const filteredMenuItems = menuItems.filter(item => item.roles.includes(user.role));
    const filteredConfigItems = configItems.filter(item => item.roles.includes(user.role));
    const allPaths = [...menuItems, ...configItems];

    return (
        <div className="min-h-screen bg-[#F0EEEF]">
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
                    {filteredMenuItems.map((item) => (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${pathname === item.path || pathname.startsWith(item.path + '/')
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

                    {/* Configuration Section */}
                    {filteredConfigItems.length > 0 && (
                        <>
                            {sidebarOpen && <div className="pt-3 pb-1 px-3"><div className="border-t border-white/15" /></div>}
                            <button
                                onClick={() => setConfigOpen(!configOpen)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                                    configItems.some(c => pathname === c.path) ? 'bg-white/10 text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'
                                }`}
                                title={!sidebarOpen ? 'Configuration' : undefined}
                            >
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {sidebarOpen && (
                                    <>
                                        <span className="flex-1 text-left">Configuration</span>
                                        <svg className={`w-4 h-4 transition-transform ${configOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </>
                                )}
                            </button>
                            {configOpen && sidebarOpen && (
                                <div className="pl-4 space-y-0.5">
                                    {filteredConfigItems.map((item) => (
                                        <Link
                                            key={item.path}
                                            href={item.path}
                                            className={`flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-colors ${pathname === item.path
                                                    ? 'bg-white/20 text-white font-medium'
                                                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                                                }`}
                                        >
                                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                                            </svg>
                                            <span>{item.name}</span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/15">
                    <div className={`flex items-center gap-2 ${!sidebarOpen && 'justify-center'}`}>
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        {sidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{user.name}</p>
                                <p className="text-xs text-white/60 truncate">{user.role.replace(/_/g, ' ')}</p>
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

            <main className={`transition-all duration-200 ${sidebarOpen ? 'ml-56' : 'ml-16'}`}>
                <header className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-40">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {allPaths.find(item => item.path === pathname)?.name || 'Dashboard'}
                    </h2>
                    <span className="text-sm text-gray-500">Welcome, <span className="font-medium text-gray-700">{user.name}</span></span>
                </header>
                <div className="p-6">{children}</div>
            </main>
        </div>
    );
}
