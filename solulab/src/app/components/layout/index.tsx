import type React from 'react';

export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-gray-50">
            <main className="px-4 sm:px-6 lg:px-8 py-6">{children}</main>
        </div>
    );
}
