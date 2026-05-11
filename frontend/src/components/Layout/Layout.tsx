import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

export const Layout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-gray-50 flex">
    <Sidebar />
    <main className="flex-1 ml-64 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </div>
    </main>
  </div>
);
