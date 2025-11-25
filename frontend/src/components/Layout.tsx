import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import MobileBottomNav from './MobileBottomNav';

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="flex-grow pb-16 md:pb-0 bg-gray-50 dark:bg-gray-900">
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
