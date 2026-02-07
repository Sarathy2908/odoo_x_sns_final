'use client';

import { useRouter } from 'next/navigation';

const roles = [
    {
        key: 'admin',
        title: 'Sign in as Admin',
        description: 'Full system access — manage users, plans, subscriptions, and settings',
        icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
        color: 'bg-primary',
    },
    {
        key: 'internal',
        title: 'Sign in as Internal User',
        description: 'Manage subscriptions, invoices, and customer accounts',
        icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
        color: 'bg-accent',
    },
    {
        key: 'portal',
        title: 'Sign in as User',
        description: 'View and manage your subscriptions and payments',
        icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
        color: 'bg-emerald-600',
    },
];

export default function HomePage() {
    const router = useRouter();

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F0EEEF] py-12 px-4">
            <div className="w-full max-w-4xl">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">SIDAZ</h1>
                    <p className="text-gray-500 mt-2">Subscription Management System</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {roles.map((role) => (
                        <button
                            key={role.key}
                            onClick={() => router.push(`/login?role=${role.key}`)}
                            className="card p-8 text-center cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all group text-left"
                        >
                            <div className={`inline-flex items-center justify-center w-14 h-14 ${role.color} rounded-xl mb-5`}>
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={role.icon} />
                                </svg>
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                                {role.title}
                            </h2>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                {role.description}
                            </p>
                            <div className="mt-5 flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                Continue
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
