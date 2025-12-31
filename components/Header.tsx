import React, { useState } from 'react';
import { FLOORS } from '../constants';
import { Role } from '../hooks/useAuth';
import { Operator } from '../types';
import ConnectionStatus from './ConnectionStatus';

type View = 'counter' | 'reports' | 'assignments' | 'expertise' | 'roster' | 'ticket-sales-dashboard' | 'ts-assignments' | 'ts-roster' | 'ts-expertise' | 'history' | 'my-sales' | 'sales-officer-dashboard' | 'dashboard' | 'maintenance-dashboard';
type Modal = 'ai-assistant' | 'operators' | 'backup' | null;
type Connection = 'connecting' | 'connected' | 'disconnected';

interface HeaderProps {
  onSearch: (term: string) => void;
  onSelectFloor: (floor: string) => void;
  selectedFloor: string;
  role: Role;
  currentUser: Operator;
  onLogout: () => void;
  onNavigate: (view: View) => void;
  onShowModal: (modal: Modal) => void;
  currentView: View;
  connectionStatus: Connection;
  appLogo: string | null;
}

const Header: React.FC<HeaderProps> = ({
  onSearch,
  onSelectFloor,
  selectedFloor,
  role,
  currentUser,
  onLogout,
  onNavigate,
  onShowModal,
  currentView,
  connectionStatus,
  appLogo,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const isManager = role === 'admin' || role === 'operation-officer';
  const isSalesManager = role === 'admin' || role === 'sales-officer';
  const isAdmin = role === 'admin';
  const isSalesRole = role === 'ticket-sales' || role === 'sales-officer';
  const isMaintenance = role === 'maintenance';
  
  const getHeaderTitle = () => {
    if (isSalesRole) return 'TFW Sales';
    if (isMaintenance) return 'TFW Maintenance';
    return 'TFW Ops';
  };
  const headerTitle = getHeaderTitle();

  const navLinkClasses = "px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors";

  const renderNavLinks = () => {
      const links = [];
      if (isManager) {
          links.push(<button key="dashboard" onClick={() => onNavigate('dashboard')} className={navLinkClasses}>Dashboard</button>);
          links.push(<button key="counter" onClick={() => onNavigate('counter')} className={navLinkClasses}>G&R</button>);
          links.push(<button key="roster" onClick={() => onNavigate('roster')} className={navLinkClasses}>Ops Roster</button>);
          links.push(<button key="reports" onClick={() => onNavigate('reports')} className={navLinkClasses}>Ops Reports</button>);
      }
      if (isSalesManager) {
          links.push(<button key="ts-roster" onClick={() => onNavigate('ts-roster')} className={navLinkClasses}>Sales Roster</button>);
          links.push(<button key="sales-dashboard" onClick={() => onNavigate('sales-officer-dashboard')} className={navLinkClasses}>Sales Dashboard</button>);
      }
      if (isAdmin || isMaintenance) {
          links.push(<button key="maintenance-dashboard" onClick={() => onNavigate('maintenance-dashboard')} className={navLinkClasses}>Maintenance</button>);
      }
      
      if (isManager || isSalesManager) {
          links.push(<button key="history" onClick={() => onNavigate('history')} className={navLinkClasses}>History Log</button>);
      }
      if (role === 'operator') {
          links.push(<button key="my-roster" onClick={() => onNavigate('roster')} className={navLinkClasses}>My Roster</button>);
      }
      if (role === 'ticket-sales') {
          links.push(<button key="my-ts-roster" onClick={() => onNavigate('ts-roster')} className={navLinkClasses}>My Roster</button>);
          links.push(<button key="my-sales" onClick={() => onNavigate('my-sales')} className={navLinkClasses}>My Sales</button>);
      }
      return links;
  }
   const renderMobileNavLinks = () => {
      const links = [];
      const closeMenu = (view: View) => { onNavigate(view); setMenuOpen(false); };
      
      if (isManager) {
          links.push(<button key="m-dashboard" onClick={() => closeMenu('dashboard')} className={`${navLinkClasses} w-full text-left block`}>Dashboard</button>);
          links.push(<button key="m-counter" onClick={() => closeMenu('counter')} className={`${navLinkClasses} w-full text-left block`}>G&R</button>);
          links.push(<button key="m-roster" onClick={() => closeMenu('roster')} className={`${navLinkClasses} w-full text-left block`}>Ops Roster</button>);
          links.push(<button key="m-reports" onClick={() => closeMenu('reports')} className={`${navLinkClasses} w-full text-left block`}>Ops Reports</button>);
      }
      if (isSalesManager) {
          links.push(<button key="m-ts-roster" onClick={() => closeMenu('ts-roster')} className={`${navLinkClasses} w-full text-left block`}>Sales Roster</button>);
          links.push(<button key="m-sales-dashboard" onClick={() => closeMenu('sales-officer-dashboard')} className={`${navLinkClasses} w-full text-left block`}>Sales Dashboard</button>);
      }
      if (isAdmin || isMaintenance) {
          links.push(<button key="m-maintenance-dashboard" onClick={() => closeMenu('maintenance-dashboard')} className={`${navLinkClasses} w-full text-left block`}>Maintenance</button>);
      }
      
      if (isManager || isSalesManager) {
        links.push(<button key="m-history" onClick={() => closeMenu('history')} className={`${navLinkClasses} w-full text-left block`}>History Log</button>);
      }
      if (role === 'operator') {
          links.push(<button key="m-my-roster" onClick={() => closeMenu('roster')} className={`${navLinkClasses} w-full text-left block`}>My Roster</button>);
      }
      if (role === 'ticket-sales') {
          links.push(<button key="m-my-ts-roster" onClick={() => closeMenu('ts-roster')} className={`${navLinkClasses} w-full text-left block`}>My Roster</button>);
          links.push(<button key="m-my-sales" onClick={() => closeMenu('my-sales')} className={`${navLinkClasses} w-full text-left block`}>My Sales</button>);
      }
      return links;
  }

  return (
    <nav className="bg-gray-900 shadow-lg sticky top-0 z-30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            {appLogo ? (
              <img src={appLogo} alt="App Logo" className="h-10 w-10 object-contain mr-3" />
            ) : (
              <div className="w-10 h-10 bg-gray-700 border-2 border-dashed border-gray-500 rounded-md flex items-center justify-center mr-3">
                <span className="text-gray-500 text-xs font-bold">Logo</span>
              </div>
            )}
            <span className="text-white font-bold text-xl">{headerTitle}</span>
          </div>

          <div className="hidden md:flex items-center space-x-2">
            {renderNavLinks()}
          </div>
          
          <div className="flex-1 flex justify-center px-2 lg:ml-6 lg:justify-start">
             {currentView === 'counter' && (
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      id="search"
                      name="search"
                      className="block w-full pl-10 pr-3 py-2 border-transparent rounded-md leading-5 bg-gray-700 text-gray-300 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-white focus:ring-white focus:text-gray-900 sm:text-sm"
                      placeholder="Search rides..."
                      type="search"
                      onChange={(e) => onSearch(e.target.value)}
                    />
                  </div>
                  <select
                    onChange={(e) => onSelectFloor(e.target.value)}
                    value={selectedFloor}
                    className="block pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 text-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">All Floors</option>
                    {FLOORS.map(floor => <option key={floor} value={floor}>{floor} Floor</option>)}
                  </select>
                </div>
             )}
          </div>


          <div className="hidden md:flex items-center ml-4 md:ml-6 space-x-4">
            <ConnectionStatus status={connectionStatus} showLabel={false} />
            
            {isAdmin && <button onClick={() => onShowModal('ai-assistant')} className={navLinkClasses}>AI Assistant</button>}
            {isAdmin && <button onClick={() => onShowModal('operators')} className={navLinkClasses}>Operators</button>}
            {isAdmin && <button onClick={() => onShowModal('backup')} className={navLinkClasses}>Backup</button>}
            
            <div className="ml-3 relative flex items-center">
              <span className="text-white font-semibold">{currentUser.name}</span>
              <button 
                onClick={onLogout} 
                title="Logout" 
                className="ml-4 flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 active:scale-95 transition-all text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
          
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              type="button"
              className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
            >
              <span className="sr-only">Open main menu</span>
              {menuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {menuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {renderMobileNavLinks()}
             <div className="border-t border-gray-700 pt-4 mt-4">
                <p className="px-3 text-sm font-medium text-gray-400">Admin Tools</p>
                 {isAdmin && <button onClick={() => { onShowModal('ai-assistant'); setMenuOpen(false); }} className={`${navLinkClasses} w-full text-left block`}>AI Assistant</button>}
                 {isAdmin && <button onClick={() => { onShowModal('operators'); setMenuOpen(false); }} className={`${navLinkClasses} w-full text-left block`}>Operators</button>}
                 {isAdmin && <button onClick={() => { onShowModal('backup'); setMenuOpen(false); }} className={`${navLinkClasses} w-full text-left block`}>Backup</button>}
            </div>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-700">
            <div className="flex items-center justify-between px-5">
              <div>
                 <p className="text-base font-medium leading-none text-white">{currentUser.name}</p>
                 <p className="text-sm font-medium leading-none text-gray-400 capitalize">{role}</p>
              </div>
              <button
                onClick={onLogout}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 active:scale-95 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
             <div className="mt-3 px-5 flex items-center">
                 <ConnectionStatus status={connectionStatus} showLabel={false} />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Header;