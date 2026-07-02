import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";

export default function AdminLayout() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const isSuperAdmin = authService.isSuperAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-4 sm:px-6 py-3 text-white transition-colors duration-200 ${
      isActive
        ? "bg-white/10 border-l-4 border-white"
        : "hover:bg-white/10 border-l-4 border-transparent"
    }`;

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-50 
        w-64 bg-primary text-white 
        flex flex-col transform transition-transform duration-200 lg:h-screen
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="shrink-0 px-4 sm:px-6 py-6 border-b border-white/10">
          <h2 className="text-xl font-semibold">Agrovista</h2>
          <p className="text-xs opacity-80 mt-1">Admin Dashboard</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <NavLink to="/admin" end className={navLinkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/pending-parcels" className={navLinkClass}>
            Pending Parcels
          </NavLink>
          <NavLink to="/admin/approved-parcels" className={navLinkClass}>
            Parcel Management
          </NavLink>
          <NavLink to="/admin/crops" className={navLinkClass}>
            Crops
          </NavLink>
          <NavLink to="/admin/users" className={navLinkClass}>
            Users
          </NavLink>
          {isSuperAdmin && (
            <NavLink to="/admin/create-admin" className={navLinkClass}>
              Create Admin
            </NavLink>
          )}
        </nav>

        <div className="shrink-0 p-4 sm:p-6 border-t border-white/10">
          <div className="mb-3">
            <p className="font-medium text-sm">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs opacity-80">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition-colors duration-200"
          >
            Sign Out
          </button>
          <button
            onClick={() => navigate("/admin/change-password")}
            className="w-full mt-2 py-2 px-4 bg-white/5 hover:bg-white/15 text-white border border-white/10 rounded-lg text-sm transition-colors duration-200"
          >
            Change Password
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen max-w-full lg:ml-64">
        {/* Mobile header */}
        <header className="lg:hidden bg-primary text-white px-4 py-3 flex items-center justify-between">
          <span className="font-semibold">Agrovista</span>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-white/10 rounded-lg"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
