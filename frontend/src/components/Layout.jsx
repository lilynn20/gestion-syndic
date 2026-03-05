import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationService, searchService } from '../services/api';
import {
  LayoutDashboard,
  Users,
  Building2,
  CreditCard,
  Receipt,
  Wallet,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Check,
  RefreshCw,
  AlertCircle,
  Loader2,
  Settings,
} from 'lucide-react';

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { path: '/proprietaires', icon: Users, label: 'Propriétaires' },
  { path: '/biens', icon: Building2, label: 'Biens' },
  { path: '/paiements', icon: CreditCard, label: 'Paiements' },
  { path: '/frais', icon: Receipt, label: 'Frais' },
  { path: '/depenses', icon: Wallet, label: 'Dépenses' },
  { path: '/settings', icon: Settings, label: 'Paramètres' },
];

const Layout = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const notifRef = useRef(null);
  const searchRef = useRef(null);
  const searchTimeout = useRef(null);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    loadUnreadCount();
    // Poll for new notifications every 60 seconds
    const interval = setInterval(loadUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close search on navigation
  useEffect(() => {
    setSearchOpen(false);
    setSearchQuery('');
  }, [location.pathname]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    if (query.length < 2) {
      setSearchResults(null);
      setSearchOpen(false);
      return;
    }
    
    setSearchLoading(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const response = await searchService.search(query);
        setSearchResults(response.data.data);
        setSearchOpen(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  };

  const loadUnreadCount = async () => {
    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.data.data.count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const loadNotifications = async () => {
    setLoadingNotifs(true);
    try {
      const response = await notificationService.getAll();
      setNotifications(response.data.data.notifications);
      setUnreadCount(response.data.data.unread_count);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleNotifClick = () => {
    if (!notifOpen) {
      loadNotifications();
    }
    setNotifOpen(!notifOpen);
  };

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const generateOverdue = async () => {
    setLoadingNotifs(true);
    try {
      await notificationService.generateOverdue();
      await loadNotifications();
    } catch (error) {
      console.error('Error generating notifications:', error);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-56 bg-slate-800 transform transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 h-14 px-4 border-b border-slate-700">
            <div className="w-7 h-7 bg-slate-700 rounded-md flex items-center justify-center">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">SyndicPro</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                    isActive
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-3 border-t border-slate-700">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-white text-sm font-medium">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="lg:ml-56">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 h-14">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-800"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Search (desktop) */}
            <div className="hidden lg:block relative flex-1 max-w-md" ref={searchRef}>
              <div className="flex items-center gap-2">
                {searchLoading ? (
                  <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 text-slate-400" />
                )}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => searchQuery.length >= 2 && setSearchOpen(true)}
                  placeholder="Rechercher propriétaire, bien, dépense..."
                  className="flex-1 text-sm text-slate-600 placeholder-slate-400 bg-transparent focus:outline-none"
                />
              </div>
              
              {/* Search Results Dropdown */}
              {searchOpen && searchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-slate-200 z-50 max-h-96 overflow-y-auto">
                  {/* Proprietaires */}
                  {searchResults.proprietaires?.length > 0 && (
                    <div>
                      <div className="px-3 py-2 bg-slate-50 text-xs font-medium text-slate-500 uppercase">
                        Propriétaires
                      </div>
                      {searchResults.proprietaires.map((p) => (
                        <Link
                          key={`prop-${p.id}`}
                          to={`/proprietaires`}
                          onClick={() => setSearchOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50"
                        >
                          <Users className="h-4 w-4 text-slate-400" />
                          <div>
                            <p className="text-sm text-slate-800">{p.prenom} {p.nom}</p>
                            <p className="text-xs text-slate-500">{p.email}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                  
                  {/* Biens */}
                  {searchResults.biens?.length > 0 && (
                    <div>
                      <div className="px-3 py-2 bg-slate-50 text-xs font-medium text-slate-500 uppercase">
                        Biens
                      </div>
                      {searchResults.biens.map((b) => (
                        <Link
                          key={`bien-${b.id}`}
                          to={`/biens`}
                          onClick={() => setSearchOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50"
                        >
                          <Building2 className="h-4 w-4 text-slate-400" />
                          <div>
                            <p className="text-sm text-slate-800">
                              <span className={`px-1.5 py-0.5 text-xs rounded ${b.type === 'appartement' ? 'bg-slate-100' : 'bg-teal-50 text-teal-700'}`}>
                                {b.type === 'appartement' ? 'App' : 'Mag'}
                              </span>
                              {' '}{b.numero}
                            </p>
                            {b.proprietaire && (
                              <p className="text-xs text-slate-500">{b.proprietaire.prenom} {b.proprietaire.nom}</p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                  
                  {/* Depenses */}
                  {searchResults.depenses?.length > 0 && (
                    <div>
                      <div className="px-3 py-2 bg-slate-50 text-xs font-medium text-slate-500 uppercase">
                        Dépenses
                      </div>
                      {searchResults.depenses.map((d) => (
                        <Link
                          key={`dep-${d.id}`}
                          to={`/depenses`}
                          onClick={() => setSearchOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50"
                        >
                          <Wallet className="h-4 w-4 text-slate-400" />
                          <div>
                            <p className="text-sm text-slate-800">{d.description}</p>
                            <p className="text-xs text-slate-500">{d.categorie} · {d.montant} DH</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                  
                  {/* No results */}
                  {!searchResults.proprietaires?.length && !searchResults.biens?.length && !searchResults.depenses?.length && (
                    <div className="px-3 py-4 text-center text-sm text-slate-500">
                      Aucun résultat pour "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button 
                  onClick={handleNotifClick}
                  className="p-2 text-slate-500 hover:text-slate-700 relative"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
                    <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-slate-800">Notifications</h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={generateOverdue}
                          className="p-1 text-slate-400 hover:text-teal-600 transition-colors"
                          title="Générer notifications de retard"
                        >
                          <RefreshCw className={`h-4 w-4 ${loadingNotifs ? 'animate-spin' : ''}`} />
                        </button>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-teal-600 hover:text-teal-700"
                          >
                            Tout lire
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {loadingNotifs ? (
                        <div className="p-4 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-teal-600 mx-auto"></div>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-500">
                          Aucune notification
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer ${
                              !notif.is_read ? 'bg-teal-50/50' : ''
                            }`}
                            onClick={() => !notif.is_read && markAsRead(notif.id)}
                          >
                            <div className="flex items-start gap-2">
                              <div className={`mt-0.5 p-1 rounded-full ${
                                notif.type === 'payment_overdue' ? 'bg-red-100' : 'bg-teal-100'
                              }`}>
                                <AlertCircle className={`h-3 w-3 ${
                                  notif.type === 'payment_overdue' ? 'text-red-600' : 'text-teal-600'
                                }`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800">{notif.title}</p>
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                <p className="text-xs text-slate-400 mt-1">
                                  {new Date(notif.created_at).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                              {!notif.is_read && (
                                <div className="w-2 h-2 bg-teal-500 rounded-full mt-1.5"></div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-sm font-medium">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="text-sm text-slate-700">{user?.name}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
