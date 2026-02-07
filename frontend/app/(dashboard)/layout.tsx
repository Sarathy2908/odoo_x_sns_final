'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getUser, removeToken } from '@/lib/api';

const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊', roles: ['ADMIN', 'INTERNAL_USER', 'PORTAL_USER'] },
    { name: 'Products', path: '/products', icon: '📦', roles: ['ADMIN', 'INTERNAL_USER'] },
    { name: 'Recurring Plans', path: '/plans', icon: '🔄', roles: ['ADMIN', 'INTERNAL_USER'] },
    { name: 'Subscriptions', path: '/subscriptions', icon: '📋', roles: ['ADMIN', 'INTERNAL_USER', 'PORTAL_USER'] },
    { name: 'Quotations', path: '/quotations', icon: '📝', roles: ['ADMIN', 'INTERNAL_USER'] },
    { name: 'Invoices', path: '/invoices', icon: '🧾', roles: ['ADMIN', 'INTERNAL_USER', 'PORTAL_USER'] },
    { name: 'Payments', path: '/payments', icon: '💳', roles: ['ADMIN', 'INTERNAL_USER', 'PORTAL_USER'] },
    { name: 'Discounts', path: '/discounts', icon: '🏷️', roles: ['ADMIN'] },
    { name: 'Taxes', path: '/taxes', icon: '💰', roles: ['ADMIN', 'INTERNAL_USER'] },
    { name: 'Users', path: '/users', icon: '👥', roles: ['ADMIN', 'INTERNAL_USER'] },
    { name: 'Reports', path: '/reports', icon: '📈', roles: ['ADMIN', 'INTERNAL_USER', 'PORTAL_USER'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
        return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;
    }

    const filteredMenuItems = menuItems.filter(item => item.roles.includes(user.role));

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            {/* Sidebar */}
            <aside className={`fixed top-0 left-0 h-full bg-gradient-to-b from-indigo-900 to-purple-900 text-white transition-all duration-300 z-50 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
                <div className="p-6 flex items-center justify-between border-b border-white/10">
                    {sidebarOpen && <h1 className="text-xl font-bold">SubsManager</h1>}
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-white/10 rounded-lg transition">
                        {sidebarOpen ? '◀' : '▶'}
                    </button>
                </div>

                <nav className="p-4 space-y-2">
                    {filteredMenuItems.map((item) => (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${pathname === item.path
                                    ? 'bg-white/20 text-white'
                                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            {sidebarOpen && <span className="font-medium">{item.name}</span>}
                        </Link>
                    ))}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
                    <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            {user.name.charAt(0)}
                        </div>
                        {sidebarOpen && (
                            <div className="flex-1">
                                <p className="text-sm font-semibold">{user.name}</p>
                                <p className="text-xs text-gray-400">{user.role.replace('_', ' ')}</p>
                            </div>
                        )}
                    </div>
                    {sidebarOpen && (
                        <button
                            onClick={handleLogout}
                            className="mt-3 w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition"
                        >
                            Logout
                        </button>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
                <header className="bg-white/5 backdrop-blur-sm border-b border-white/10 px-8 py-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-white">
                            {menuItems.find(item => item.path === pathname)?.name || 'Dashboard'}
                        </h2>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm text-gray-400">Welcome back,</p>
                                <p className="text-white font-semibold">{user.name}</p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
