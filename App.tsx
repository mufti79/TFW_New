import React, { useState, useMemo, useCallback, useEffect, useRef, ReactNode } from 'react';
import { RIDES, FLOORS, OPERATORS, TICKET_SALES_PERSONNEL, COUNTERS, RIDES_ARRAY, OPERATORS_ARRAY, TICKET_SALES_PERSONNEL_ARRAY, COUNTERS_ARRAY, MAINTENANCE_PERSONNEL, MAINTENANCE_PERSONNEL_ARRAY } from './constants';
// FIX: Imported PackageSalesData to resolve a type error.
import { RideWithCount, Ride, Operator, AttendanceRecord, Counter, CounterWithSales, HistoryRecord, PackageSalesRecord, AttendanceData, PackageSalesData, MaintenanceTicket } from './types';
import { useAuth, Role } from './hooks/useAuth';
import useFirebaseSync from './hooks/useFirebaseSync';
import { isFirebaseConfigured, getDatabase } from './firebaseConfig';
import { NotificationContext, useNotification, NotificationType } from './imageStore';
import NotificationComponent from './components/AttendanceCheckin';


import Login from './components/Login';
import Header from './components/Header';
import RideCard from './components/RideCard';
import Footer from './components/Footer';
import Reports from './components/Reports';
import EditImageModal from './components/EditImageModal';
import CodeAssistant from './components/CodeAssistant';
import OperatorManager from './components/OperatorManager';
import AssignmentView from './components/AssignmentView';
import ExpertiseReport from './components/ExpertiseReport';
import DailyRoster from './components/DailyRoster';
import KioskModeWrapper from './components/KioskModeWrapper';
import BackupManager from './components/BackupManager';
import TicketSalesView from './components/TicketSalesView';
import TicketSalesAssignmentView from './components/TicketSalesAssignmentView';
import TicketSalesRoster from './components/TicketSalesRoster';
import TicketSalesExpertiseReport from './components/TicketSalesExpertiseReport';
import HistoryLog from './components/HistoryLog';
import DailySalesEntry from './components/DailySalesEntry';
import SalesOfficerDashboard from './components/SalesOfficerDashboard';
import ConfigErrorScreen from './components/ConfigErrorScreen';
import Dashboard from './components/Dashboard';
import MaintenanceDashboard from './components/MaintenanceDashboard';
import ConnectionStatus from './components/ConnectionStatus';


// Notification System Implementation
interface NotificationState {
  message: string;
  type: NotificationType;
  visible: boolean;
}

const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState<NotificationState>({ message: '', type: 'info', visible: false });

  const showNotification = useCallback((message: string, type: NotificationType = 'info', duration: number = 4000) => {
    setNotification({ message, type, visible: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, duration);
  }, []);

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, visible: false }));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <NotificationComponent
        message={notification.message}
        type={notification.type}
        visible={notification.visible}
        onClose={hideNotification}
      />
    </NotificationContext.Provider>
  );
};


type View = 'counter' | 'reports' | 'assignments' | 'expertise' | 'roster' | 'ticket-sales-dashboard' | 'ts-assignments' | 'ts-roster' | 'ts-expertise' | 'history' | 'my-sales' | 'sales-officer-dashboard' | 'dashboard' | 'maintenance-dashboard';
type Modal = 'edit-image' | 'ai-assistant' | 'operators' | 'backup' | null;
type FirebaseObject<T extends { id: number }> = Record<number, Omit<T, 'id'>>;

const AppContent: React.FC = () => {
    const { role, currentUser, login, logout } = useAuth();
    
    // Get database instance (will initialize if not already done)
    const database = getDatabase();
    
    // On app load, check if a session reset is required from a daily rollover.
    // This is the most reliable way to ensure a clean state after a new day starts.
    useEffect(() => {
        if (window.localStorage.getItem('TFW_SESSION_EXPIRED') === 'true') {
            window.localStorage.removeItem('TFW_SESSION_EXPIRED');
            logout();
        }
    }, [logout]);
    
    const { showNotification } = useNotification();
    const [today, setToday] = useState(() => new Date().toISOString().split('T')[0]);
    const [isCheckinAllowed, setIsCheckinAllowed] = useState(true);

    // Effect to detect a new day and trigger a reset
    useEffect(() => {
        const checkTime = () => {
            const now = new Date();
            const newToday = now.toISOString().split('T')[0];
            
            if (newToday !== today) {
                // A new day has started. Set a flag and force a reload.
                // The logic above will handle the logout after the reload.
                window.localStorage.setItem('TFW_SESSION_EXPIRED', 'true');
                window.location.reload();
            } else {
                 // Same day, just update the check-in window status
                setIsCheckinAllowed(now.getHours() < 22);
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkTime();
            }
        };

        checkTime(); // Initial check
        const intervalId = setInterval(checkTime, 30000); // Periodic check for long-running tabs
        document.addEventListener('visibilitychange', handleVisibilityChange); // Check on tab focus for immediate update

        return () => {
            clearInterval(intervalId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [today]);

    const getInitialViewForRole = useCallback((r: Role): View => {
        if (r === 'admin' || r === 'operation-officer') return 'dashboard';
        if (r === 'sales-officer') return 'sales-officer-dashboard';
        if (r === 'ticket-sales') return 'ts-roster';
        if (r === 'operator') return 'roster';
        if (r === 'maintenance') return 'maintenance-dashboard';
        
        return 'counter'; // Should not be reached if role is set
    }, []);

    // App State
    const [currentView, setCurrentView] = useState<View>(() => getInitialViewForRole(role));
    const [modal, setModal] = useState<Modal>(null);
    const [selectedRideForModal, setSelectedRideForModal] = useState<Ride | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');


    // Refs for detecting data updates
    const prevOperatorsRef = useRef<Operator[] | undefined>(undefined);
    const prevTicketSalesPersonnelRef = useRef<Operator[] | undefined>(undefined);

    // Firebase Synced State (using object structure for collections)
    const { data: dailyCounts, setData: setDailyCounts, isLoading: l1 } = useFirebaseSync<Record<string, Record<string, number>>>('data/dailyCounts', {});
    const { data: ticketSalesData, setData: setTicketSalesData, isLoading: l2 } = useFirebaseSync<Record<string, Record<string, number>>>('data/ticketSalesData', {});
    const { data: ridesData, setData: setRidesData, isLoading: l3 } = useFirebaseSync<FirebaseObject<Ride>>('config/rides', RIDES);
    const { data: operatorsData, setData: setOperatorsData, isLoading: l4 } = useFirebaseSync<FirebaseObject<Operator>>('config/operators', OPERATORS);
    const { data: ticketSalesPersonnelData, setData: setTicketSalesPersonnelData, isLoading: l5 } = useFirebaseSync<FirebaseObject<Operator>>('config/ticketSalesPersonnel', TICKET_SALES_PERSONNEL);
    const { data: countersData, setData: setCountersData, isLoading: l6 } = useFirebaseSync<FirebaseObject<Counter>>('config/counters', COUNTERS);
    const { data: dailyAssignments, setData: setDailyAssignments, isLoading: l7 } = useFirebaseSync<Record<string, Record<string, number[]>>>('data/operatorAssignments', {});
    const { data: ticketSalesAssignments, setData: setTicketSalesAssignments, isLoading: l8 } = useFirebaseSync<Record<string, Record<string, number[]>>>('data/ticketSalesAssignments', {});
    const { data: attendanceData, setData: setAttendanceData, isLoading: l9 } = useFirebaseSync<AttendanceData>('data/attendance', {});
    const { data: historyLogData, setData: setHistoryLogData, isLoading: l10 } = useFirebaseSync<Record<number, Omit<HistoryRecord, 'id'>>>('data/historyLog', {});
    const { data: packageSalesData, setData: setPackageSalesData, isLoading: l12 } = useFirebaseSync<PackageSalesData>('data/packageSales', {});
    const { data: otherSalesCategories, setData: setOtherSalesCategories, isLoading: l11 } = useFirebaseSync<string[]>('config/otherSalesCategories', []);
    const { data: maintenanceTickets, setData: setMaintenanceTickets, isLoading: l13 } = useFirebaseSync<Record<string, Record<string, MaintenanceTicket>>>('data/maintenanceTickets', {});
    const { data: maintenancePersonnelData, setData: setMaintenancePersonnelData, isLoading: l14 } = useFirebaseSync<FirebaseObject<Operator>>('config/maintenancePersonnel', MAINTENANCE_PERSONNEL);
    
    // **FIX**: Dedicated state and effect for logo to ensure robust cross-device syncing.
    const [appLogo, setAppLogo] = useState<string | null>(null);
    const [isLogoLoading, setIsLogoLoading] = useState(isFirebaseConfigured);

    useEffect(() => {
        if (!isFirebaseConfigured || !database) return;
        const logoRef = database.ref('config/appLogo');
        const listener = logoRef.on('value', (snapshot) => {
            const logoData = snapshot.val();
            setAppLogo(logoData || null);
            setIsLogoLoading(false);
        }, (error) => {
            console.error("Firebase logo read error:", error);
            setIsLogoLoading(false);
        });

        // Cleanup function
        return () => logoRef.off('value', listener);
    }, []);

    const handleLogoChange = useCallback((newLogo: string | null) => {
        if (!isFirebaseConfigured) {
            showNotification("Cannot save logo, Firebase is not configured.", "error");
            return;
        }
        if (!database) {
            showNotification("Database connection failed. Please check your network connection or contact support.", "error");
            return;
        }
        database.ref('config/appLogo').set(newLogo)
            .catch(error => {
                console.error("Firebase logo write error:", error);
                showNotification("Failed to save logo. Check connection.", "error");
            });
    }, [showNotification]);

    // Dynamically update the favicon
    useEffect(() => {
      const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (favicon) {
        favicon.href = appLogo || 'data:image/x-icon;,'; // Use data URI or an empty one
      }
    }, [appLogo]);
    
    // Memoized arrays derived from Firebase objects for UI rendering
    const rides = useMemo<Ride[]>(() => ridesData ? Object.entries(ridesData).map(([id, ride]) => ({ id: Number(id), ...ride })) : RIDES_ARRAY, [ridesData]);
    const operators = useMemo<Operator[]>(() => operatorsData ? Object.entries(operatorsData).map(([id, op]) => ({ id: Number(id), ...op })) : OPERATORS_ARRAY, [operatorsData]);
    const ticketSalesPersonnel = useMemo<Operator[]>(() => ticketSalesPersonnelData ? Object.entries(ticketSalesPersonnelData).map(([id, p]) => ({ id: Number(id), ...p })) : TICKET_SALES_PERSONNEL_ARRAY, [ticketSalesPersonnelData]);
    const counters = useMemo<Counter[]>(() => countersData ? Object.entries(countersData).map(([id, c]) => ({ id: Number(id), ...c })) : COUNTERS_ARRAY, [countersData]);
    const historyLog = useMemo<HistoryRecord[]>(() => historyLogData ? Object.entries(historyLogData).map(([id, h]) => ({ id: Number(id), ...h })).sort((a,b) => b.id - a.id) : [], [historyLogData]);
    const packageSales = useMemo<PackageSalesRecord[]>(() => {
        const sales: PackageSalesRecord[] = [];
        if (packageSalesData) {
            for (const date in packageSalesData) {
                for (const personnelId in packageSalesData[date]) {
                    sales.push({
                        date,
                        personnelId: Number(personnelId),
                        ...packageSalesData[date][personnelId]
                    });
                }
            }
        }
        return sales;
    }, [packageSalesData]);
    const maintenancePersonnel = useMemo<Operator[]>(() => maintenancePersonnelData ? Object.entries(maintenancePersonnelData).map(([id, p]) => ({ id: Number(id), ...p })) : MAINTENANCE_PERSONNEL_ARRAY, [maintenancePersonnelData]);
    
    const loadingStates = {
        'Ride Counts': l1, 'Ticket Sales': l2, 'Ride Configuration': l3,
        'Operator Roster': l4, 'Sales Personnel': l5, 'Counter Configuration': l6,
        'Operator Assignments': l7, 'Sales Assignments': l8, 'Attendance Records': l9,
        'History Log': l10, 'Other Categories': l11, 'Package Sales': l12,
        'Maintenance Tickets': l13, 'Maintenance Personnel': l14,
    };
    const isFirebaseLoading = Object.values(loadingStates).some(status => status) || isLogoLoading;

    // UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFloor, setSelectedFloor] = useState('');
    const [selectedDate, setSelectedDate] = useState(today);
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [mySalesStartDate, setMySalesStartDate] = useState(today);
    const [mySalesEndDate, setMySalesEndDate] = useState(today);

    useEffect(() => {
        // When the app detects a new day has started, reset all date-based views
        // to default to the new "today". This prevents stale data from being shown.
        setSelectedDate(today);
        setStartDate(today);
        setEndDate(today);
        setMySalesStartDate(today);
        setMySalesEndDate(today);
    }, [today]);

    useEffect(() => { setCurrentView(getInitialViewForRole(role)); }, [role, getInitialViewForRole]);

    useEffect(() => {
        if (isFirebaseConfigured && database) {
            const connectedRef = database.ref('.info/connected');
            const listener = connectedRef.on('value', (snap) => {
                setConnectionStatus(snap.val() === true ? 'connected' : 'disconnected');
            });
            return () => connectedRef.off('value', listener);
        } else {
            setConnectionStatus('disconnected');
        }
    }, []);
    
    const logAction = useCallback((action: string, details: string) => {
        if (!currentUser) return;
        const newId = Date.now();
        const newRecord: Omit<HistoryRecord, 'id'> = {
            timestamp: new Date().toISOString(), user: currentUser.name, action, details,
        };
        // Perform a direct, efficient write to Firebase for the new log entry.
        if (isFirebaseConfigured && database) {
          database.ref(`data/historyLog/${newId}`).set(newRecord).catch(e => console.error("Failed to log action:", e));
        }
    }, [currentUser]);

    const handleLogout = useCallback(() => {
        if (currentUser) {
            logAction('LOGOUT', `${currentUser.name} logged out.`);
        }
        logout();
    }, [currentUser, logAction, logout]);

    useEffect(() => {
        if (prevOperatorsRef.current && role) {
            if (JSON.stringify(prevOperatorsRef.current) !== JSON.stringify(operators)) {
                showNotification("Operator list updated by admin. You will be logged out for security.", 'warning', 8000);
                setTimeout(handleLogout, 3000);
            }
        }
        prevOperatorsRef.current = operators;
    }, [operators, role, handleLogout, showNotification]);

    useEffect(() => {
        if (prevTicketSalesPersonnelRef.current && role) {
            if (JSON.stringify(prevTicketSalesPersonnelRef.current) !== JSON.stringify(ticketSalesPersonnel)) {
                showNotification("Sales personnel list updated by admin. You will be logged out for security.", 'warning', 8000);
                setTimeout(handleLogout, 3000);
            }
        }
        prevTicketSalesPersonnelRef.current = ticketSalesPersonnel;
    }, [ticketSalesPersonnel, role, handleLogout, showNotification]);

    const attendanceArray = useMemo<AttendanceRecord[]>(() => {
        const arr: AttendanceRecord[] = [];
        for (const date in attendanceData) {
            for (const operatorId in attendanceData[date]) {
                arr.push({ date, operatorId: Number(operatorId), ...attendanceData[date][operatorId] });
            }
        }
        return arr;
    }, [attendanceData]);

    const ridesWithCounts = useMemo<RideWithCount[]>(() => {
        const countsForDate = dailyCounts[selectedDate] || {};
        return rides.map(ride => ({ ...ride, count: countsForDate[ride.id] || 0 }));
    }, [rides, dailyCounts, selectedDate]);

    const countersWithSales = useMemo<CounterWithSales[]>(() => {
        const salesForToday = ticketSalesData[today] || {};
        return counters.map(counter => ({ ...counter, sales: salesForToday[counter.id] || 0 }));
    }, [counters, ticketSalesData, today]);

    const filteredRides = useMemo(() => ridesWithCounts.filter(ride => 
        ride.name.toLowerCase().includes(searchTerm.toLowerCase()) && (!selectedFloor || ride.floor === selectedFloor)
    ), [ridesWithCounts, searchTerm, selectedFloor]);

    const totalGuests = useMemo(() => Object.values(dailyCounts[today] || {}).reduce((sum, count) => sum + count, 0), [dailyCounts, today]);
    const totalSales = useMemo(() => Object.values(ticketSalesData[today] || {}).reduce((sum, count) => sum + count, 0), [ticketSalesData, today]);
    const hasCheckedInToday = useMemo(() => !!(currentUser && attendanceData[today]?.[currentUser.id]), [currentUser, attendanceData, today]);

    const handleLogin = (newRole: 'admin' | 'operator' | 'operation-officer' | 'ticket-sales' | 'sales-officer' | 'maintenance', payload?: string | Operator): boolean => {
        const success = login(newRole, payload);
        if (success && payload) {
            const user = typeof payload === 'object' ? payload : { id: 0, name: newRole };
            logAction('LOGIN', `${user.name} logged in as ${newRole}.`);
        }
        return success;
    };

    const handleCountChange = useCallback((rideId: number, newCount: number) => {
        const rideName = rides.find(r => r.id === rideId)?.name || 'Unknown Ride';
        const oldCount = dailyCounts[selectedDate]?.[rideId] || 0;
        if (oldCount === newCount) return;

        if (isFirebaseConfigured && database) {
            database.ref(`data/dailyCounts/${selectedDate}/${rideId}`).set(newCount)
                .then(() => {
                    logAction('GUEST_COUNT_UPDATE', `Set count for '${rideName}' from ${oldCount} to ${newCount}.`);
                })
                .catch(error => {
                    console.error("Firebase count update failed:", error);
                    showNotification('Failed to save count. Check connection.', 'error');
                });
        }
    }, [dailyCounts, rides, selectedDate, logAction, showNotification]);

    const handleSalesChange = useCallback((counterId: number, newCount: number) => {
        const counterName = counters.find(c => c.id === counterId)?.name || 'Unknown Counter';
        const oldSales = ticketSalesData[today]?.[counterId] || 0;
        if (oldSales === newCount) return;
        
        if (isFirebaseConfigured && database) {
            database.ref(`data/ticketSalesData/${today}/${counterId}`).set(newCount)
                .then(() => {
                    logAction('SALES_COUNT_UPDATE', `Set sales for '${counterName}' from ${oldSales} to ${newCount}.`);
                })
                .catch(error => {
                    console.error("Firebase sales update failed:", error);
                    showNotification('Failed to save sales data. Check connection.', 'error');
                });
        }
    }, [counters, ticketSalesData, today, logAction, showNotification]);

    const handleResetCounts = useCallback(() => {
        if (window.confirm("Are you sure you want to reset all of today's guest counts to zero? This cannot be undone.")) {
            if (isFirebaseConfigured && database) {
                database.ref(`data/dailyCounts/${today}`).remove()
                    .then(() => {
                        logAction('RESET_GUEST_COUNTS', `Reset all guest counts for ${today}.`);
                    })
                    .catch(error => {
                        console.error("Firebase reset counts failed:", error);
                        showNotification('Failed to reset counts. Check connection.', 'error');
                    });
            }
        }
    }, [today, logAction, showNotification]);

    const handleResetSales = useCallback(() => {
        if (window.confirm("Are you sure you want to reset all of today's ticket sales to zero? This cannot be undone.")) {
            if (isFirebaseConfigured && database) {
                database.ref(`data/ticketSalesData/${today}`).remove()
                    .then(() => {
                         logAction('RESET_SALES_COUNTS', `Reset all ticket sales for ${today}.`);
                    })
                    .catch(error => {
                        console.error("Firebase reset sales failed:", error);
                        showNotification('Failed to reset sales. Check connection.', 'error');
                    });
            }
        }
    }, [today, logAction, showNotification]);
    
    const handleSaveImage = useCallback(async (rideId: number, imageBase64: string) => {
        setRidesData(prev => ({ ...prev, [rideId]: { ...prev[rideId], imageUrl: imageBase64 } }));
        logAction('UPDATE_RIDE_IMAGE', `Updated image for ride: '${rides.find(r => r.id === rideId)?.name}'.`);
        setModal(null);
    }, [setRidesData, rides, logAction]);
    
    const handleClockIn = useCallback((attendedBriefing: boolean, briefingTime: string | null) => {
        if (!currentUser || !isFirebaseConfigured || !database) return;

        const clockInDate = new Date().toISOString().split('T')[0];
        const userAtClockIn = currentUser; 
    
        database.ref(`data/attendance/${clockInDate}/${userAtClockIn.id}`).set({ attendedBriefing, briefingTime })
            .then(() => {
                logAction('ATTENDANCE_CHECKIN', `${userAtClockIn.name} checked in. Briefing: ${attendedBriefing ? 'Yes' : 'No'}.`);
                showNotification("Check-in successful! Please log in again to view your roster.", 'success', 5000);
                setTimeout(logout, 1000); // Log out after a short delay to let user see message
            })
            .catch(error => {
                console.error("Firebase check-in failed:", error);
                showNotification('Check-in failed. Please try again.', 'error');
            });
    }, [currentUser, logAction, logout, showNotification]);

    const handleSavePackageSales = useCallback((salesData: Omit<PackageSalesRecord, 'date' | 'personnelId'>) => {
        if (!currentUser || !isFirebaseConfigured || !database) return;
        
        // Learn new categories from the submitted data
        const existingCategories = new Set(otherSalesCategories);
        let categoriesWereUpdated = false;
        salesData.otherSales?.forEach(item => {
            if (item.category && !existingCategories.has(item.category)) {
                existingCategories.add(item.category);
                categoriesWereUpdated = true;
            }
        });

        if (categoriesWereUpdated) {
            setOtherSalesCategories(Array.from(existingCategories).sort());
        }

        database.ref(`data/packageSales/${selectedDate}/${currentUser.id}`).set(salesData)
            .then(() => {
                logAction('PACKAGE_SALES_UPDATE', `${currentUser.name} updated package sales for ${selectedDate}.`);
                showNotification('Sales data saved successfully!', 'success');
            })
            .catch(error => {
                console.error("Firebase package sales update failed:", error);
                showNotification('Failed to save package sales. Check connection.', 'error');
            });
    }, [currentUser, selectedDate, logAction, showNotification, otherSalesCategories, setOtherSalesCategories]);

    const handleEditPackageSales = useCallback((date: string, personnelId: number, salesData: Omit<PackageSalesRecord, 'date' | 'personnelId'>) => {
        if (!currentUser || !isFirebaseConfigured || !database) return;
        const personnelName = ticketSalesPersonnel.find(p => p.id === personnelId)?.name || 'Unknown Personnel';

        // Learn new categories
        const existingCategories = new Set(otherSalesCategories);
        let categoriesWereUpdated = false;
        salesData.otherSales?.forEach(item => {
            if (item.category && !existingCategories.has(item.category)) {
                existingCategories.add(item.category);
                categoriesWereUpdated = true;
            }
        });
    
        if (categoriesWereUpdated) {
            setOtherSalesCategories(Array.from(existingCategories).sort());
        }

        database.ref(`data/packageSales/${date}/${personnelId}`).set(salesData)
            .then(() => {
                logAction('PACKAGE_SALES_CORRECTION', `${currentUser.name} corrected package sales for ${personnelName} on ${date}.`);
                showNotification('Sales record updated successfully!', 'success');
            })
            .catch(error => {
                console.error("Firebase package sales correction failed:", error);
                showNotification('Failed to update sales record. Check connection.', 'error');
            });
    }, [currentUser, logAction, showNotification, ticketSalesPersonnel, otherSalesCategories, setOtherSalesCategories]);

    const handleExportData = () => {
        const backupData = {
            version: 1,
            timestamp: new Date().toISOString(),
            data: {
                dailyCounts, ticketSalesData, dailyAssignments, ticketSalesAssignments,
                attendanceData, historyLogData, packageSalesData, maintenanceTickets
            },
            config: {
                ridesData, operatorsData, ticketSalesPersonnelData, countersData, appLogo, otherSalesCategories, maintenancePersonnelData
            }
        };

        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `TFW_Backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        logAction('DATA_EXPORT', 'Exported all application data to a backup file.');
        showNotification('Data exported successfully!', 'success');
        setModal(null);
    };

    const handleImportData = (jsonString: string) => {
        try {
            const backupData = JSON.parse(jsonString);
            if (!backupData.data || !backupData.config) {
                throw new Error('Invalid backup file format.');
            }

            // A series of confirmations for destructive actions
            if (!window.confirm("Stage 1/3: You are about to overwrite all CONFIGURATION data (Rides, Operators, Counters, Logo). This cannot be undone. Proceed?")) return;
            if (!window.confirm("Stage 2/3: You are about to overwrite all OPERATIONAL data (Counts, Sales, Assignments, Attendance). This cannot be undone. Proceed?")) return;
            if (!window.confirm("Stage 3/3: FINAL CONFIRMATION. Are you absolutely sure you want to restore from this backup? All current data will be permanently lost.")) return;

            // Restore Config
            setRidesData(backupData.config.ridesData || {});
            setOperatorsData(backupData.config.operatorsData || {});
            setTicketSalesPersonnelData(backupData.config.ticketSalesPersonnelData || {});
            setCountersData(backupData.config.countersData || {});
            handleLogoChange(backupData.config.appLogo || null);
            setOtherSalesCategories(backupData.config.otherSalesCategories || []);
            setMaintenancePersonnelData(backupData.config.maintenancePersonnelData || {});

            // Restore Data
            setDailyCounts(backupData.data.dailyCounts || {});
            setTicketSalesData(backupData.data.ticketSalesData || {});
            setDailyAssignments(backupData.data.dailyAssignments || {});
            setTicketSalesAssignments(backupData.data.ticketSalesAssignments || {});
            setAttendanceData(backupData.data.attendanceData || {});
            setHistoryLogData(backupData.data.historyLogData || {});
            setPackageSalesData(backupData.data.packageSalesData || {});
            setMaintenanceTickets(backupData.data.maintenanceTickets || {});

            logAction('DATA_IMPORT', 'Imported data from a backup file, overwriting all existing data.');
            showNotification('Data imported successfully! The app may need to reload.', 'success', 6000);
            setModal(null);
            setTimeout(() => window.location.reload(), 2000);

        } catch (error) {
            console.error("Import failed:", error);
            showNotification(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error', 8000);
        }
    };

    const handleResetDay = (dateToReset: string) => {
        if (!window.confirm(`Stage 1/2: You are about to permanently delete ALL operational data for ${dateToReset}. This includes guest counts, sales, assignments, and attendance records for that day. This action cannot be undone. Proceed?`)) {
            return;
        }
        if (!window.confirm(`Stage 2/2: FINAL CONFIRMATION. Are you absolutely sure you want to reset all data for ${dateToReset}?`)) {
            return;
        }

        if (!isFirebaseConfigured || !database) {
            showNotification("Firebase is not configured. Cannot perform reset.", "error");
            return;
        }

        const pathsToDelete = [
            `data/dailyCounts/${dateToReset}`,
            `data/ticketSalesData/${dateToReset}`,
            `data/operatorAssignments/${dateToReset}`,
            `data/ticketSalesAssignments/${dateToReset}`,
            `data/attendance/${dateToReset}`,
            `data/packageSales/${dateToReset}`,
            `data/maintenanceTickets/${dateToReset}`,
        ];

        const updates: { [key: string]: null } = {};
        pathsToDelete.forEach(path => {
            updates[path] = null;
        });

        database.ref().update(updates)
            .then(() => {
                logAction('DAILY_DATA_RESET', `Reset all operational data for date: ${dateToReset}.`);
                showNotification(`All data for ${dateToReset} has been successfully reset.`, 'success');
                setModal(null); // Close the modal on success
            })
            .catch((error: Error) => {
                console.error("Firebase daily reset failed:", error);
                showNotification(`Failed to reset data for ${dateToReset}. Check connection and permissions.`, 'error');
            });
    };
    
    const handleNavigate = (view: View) => { setCurrentView(view); setSearchTerm(''); setSelectedFloor(''); };
    const handleShowModal = (modalType: Modal, ride?: Ride) => { if (ride) setSelectedRideForModal(ride); setModal(modalType); };

    const handleAddOperator = (name: string) => {
        const newId = Date.now(); // Simple unique ID
        setOperatorsData((prev: FirebaseObject<Operator>) => ({ ...prev, [newId]: { name } }));
        logAction('ADD_OPERATOR', `Added new operator: '${name}'.`);
    };

    const handleDeleteOperators = (ids: number[]) => {
        setOperatorsData((prev: FirebaseObject<Operator>) => {
            const newState = { ...prev };
            const deletedNames: string[] = [];
            ids.forEach(id => {
                const operatorToDelete = newState[id];
                if (operatorToDelete) {
                    deletedNames.push(operatorToDelete.name);
                    delete newState[id];
                }
            });
            logAction('DELETE_OPERATORS', `Deleted operators: ${deletedNames.join(', ')}.`);
            return newState;
        });
    };

    const handleImportOperators = (newOperators: Operator[], strategy: 'merge' | 'replace') => {
        logAction('IMPORT_OPERATORS', `Imported operators with strategy: '${strategy}'.`);
        if (strategy === 'replace') {
            const newOperatorsObject = newOperators.reduce((acc, op, index) => {
                acc[Date.now() + index] = { name: op.name };
                return acc;
            }, {} as FirebaseObject<Operator>);
            setOperatorsData(newOperatorsObject);
            setDailyAssignments({});
            setAttendanceData({});
        } else {
            setOperatorsData((prev: FirebaseObject<Operator>) => {
                const existingNames = new Set(Object.values(prev).map(op => op.name.toLowerCase()));
                const merged = { ...prev };
                let newIdCounter = Date.now();
                newOperators.forEach(op => {
                    if (!existingNames.has(op.name.toLowerCase())) {
                        merged[newIdCounter++] = { name: op.name };
                    }
                });
                return merged;
            });
        }
    };

    const handleSaveAssignments = (date: string, assignmentsForDate: Record<string, number[]>) => {
        if (!isFirebaseConfigured) {
            showNotification('Cannot save assignments, Firebase is not configured.', 'error');
            return;
        }
        
        if (!database) {
            showNotification('Database connection failed. Please check your network connection or contact support.', 'error');
            console.error('Database object is null');
            return;
        }
        
        // Directly write to Firebase to ensure the data is persisted immediately
        database.ref(`data/operatorAssignments/${date}`).set(assignmentsForDate)
            .then(() => {
                logAction('SAVE_ASSIGNMENTS', `Operator assignments saved for ${date}.`);
                showNotification('Operator assignments saved!', 'success');
            })
            .catch(error => {
                console.error("Firebase assignment save failed:", error);
                showNotification('Failed to save assignments. Check connection.', 'error');
            });
    };
    
    const handleSaveTicketSalesAssignments = (date: string, assignmentsForDate: Record<string, number[]>) => {
        if (!isFirebaseConfigured) {
            showNotification('Cannot save assignments, Firebase is not configured.', 'error');
            return;
        }
        
        if (!database) {
            showNotification('Database connection failed. Please check your network connection or contact support.', 'error');
            console.error('Database object is null');
            return;
        }
        
        // Directly write to Firebase to ensure the data is persisted immediately
        database.ref(`data/ticketSalesAssignments/${date}`).set(assignmentsForDate)
            .then(() => {
                logAction('SAVE_TS_ASSIGNMENTS', `Ticket sales assignments saved for ${date}.`);
                showNotification('Ticket sales assignments saved!', 'success');
            })
            .catch(error => {
                console.error("Firebase ticket sales assignment save failed:", error);
                showNotification('Failed to save ticket sales assignments. Check connection.', 'error');
            });
    };

    const handleClearHistory = () => {
        if (window.confirm("Are you sure you want to permanently delete all history logs? This action cannot be undone.")) {
            if (isFirebaseConfigured && database) {
                database.ref('data/historyLog').remove()
                    .catch(e => {
                        console.error("Failed to clear history log:", e);
                        showNotification('Could not clear history log.', 'error');
                    });
            }
        }
    };

    const handleRenameOtherSalesCategory = useCallback(async (oldName: string, newName: string) => {
        if (!oldName || !newName || oldName === newName) return;
        if (!window.confirm(`Are you sure you want to rename "${oldName}" to "${newName}"? This will update all historical sales records.`)) return;

        // 1. Update the config list
        const newCategories = otherSalesCategories.map(c => c === oldName ? newName : c);
        setOtherSalesCategories([...new Set(newCategories)].sort());

        // 2. Update all historical records
        if (isFirebaseConfigured && database) {
            try {
                const salesSnapshot = await database.ref('data/packageSales').once('value');
                const salesData: PackageSalesData = salesSnapshot.val() || {};
                const updates: { [key: string]: any } = {};

                for (const date in salesData) {
                    for (const personnelId in salesData[date]) {
                        const record = salesData[date][personnelId];
                        if (record.otherSales && Array.isArray(record.otherSales)) {
                            let wasModified = false;
                            const updatedOtherSales = record.otherSales.map(item => {
                                if (item.category === oldName) {
                                    wasModified = true;
                                    return { ...item, category: newName };
                                }
                                return item;
                            });

                            if (wasModified) {
                                updates[`data/packageSales/${date}/${personnelId}/otherSales`] = updatedOtherSales;
                            }
                        }
                    }
                }

                if (Object.keys(updates).length > 0) {
                    await database.ref().update(updates);
                }
                
                logAction('CATEGORY_RENAME', `Renamed category "${oldName}" to "${newName}".`);
                showNotification('Category renamed successfully across all records.', 'success');

            } catch (error) {
                console.error("Failed to rename category:", error);
                showNotification('Failed to update historical records.', 'error');
                // Revert the config change on failure
                setOtherSalesCategories(otherSalesCategories);
            }
        }
    }, [otherSalesCategories, setOtherSalesCategories, logAction, showNotification]);

    const handleDeleteOtherSalesCategory = useCallback((categoryToDelete: string) => {
        if (!window.confirm(`Are you sure you want to delete the category "${categoryToDelete}"? This will remove it from the suggestion list but will NOT change any historical records.`)) return;

        const newCategories = otherSalesCategories.filter(c => c !== categoryToDelete);
        setOtherSalesCategories(newCategories);
        logAction('CATEGORY_DELETE', `Deleted category: "${categoryToDelete}".`);
        showNotification('Category deleted from suggestion list.', 'success');
    }, [otherSalesCategories, setOtherSalesCategories, logAction, showNotification]);

    const [obsoleteRides, setObsoleteRides] = useState<Ride[]>([]);
    useEffect(() => {
        if (ridesData) {
            const codeRideIds = new Set(RIDES_ARRAY.map(r => r.id));
            const dbRides: Ride[] = Object.entries(ridesData).map(([id, ride]) => ({ id: Number(id), ...ride as any }));
            const obsolete = dbRides.filter(r => !codeRideIds.has(r.id));
            setObsoleteRides(obsolete);
        }
    }, [ridesData]);

    const handleRemoveObsoleteRides = useCallback(() => {
        if (obsoleteRides.length === 0) return;
        if (!window.confirm(`Are you sure you want to permanently remove ${obsoleteRides.length} obsolete ride(s) from the database? This cannot be undone.`)) return;

        if (isFirebaseConfigured && database) {
            const updates: { [key: string]: null } = {};
            obsoleteRides.forEach(ride => {
                updates[`config/rides/${ride.id}`] = null;
            });
            database.ref().update(updates)
                .then(() => {
                    logAction('DB_CLEANUP', `Removed obsolete rides: ${obsoleteRides.map(r => r.name).join(', ')}.`);
                    showNotification('Obsolete rides removed successfully!', 'success');
                })
                .catch(error => {
                    console.error("Firebase obsolete ride removal failed:", error);
                    showNotification('Failed to remove obsolete rides.', 'error');
                });
        }
    }, [obsoleteRides, logAction, showNotification]);

    const handleReportProblem = useCallback((rideId: number, problem: string) => {
        if (!currentUser || !isFirebaseConfigured || !database || !problem.trim()) return;

        const ride = rides.find(r => r.id === rideId);
        if (!ride) return;

        const ticketId = `${today}-${rideId}-${Date.now()}`;
        const newTicket: MaintenanceTicket = {
            id: ticketId,
            date: today,
            rideId: ride.id,
            rideName: ride.name,
            problem: problem.trim(),
            status: 'reported',
            reportedById: currentUser.id,
            reportedByName: currentUser.name,
            reportedAt: new Date().toISOString(),
        };

        database.ref(`data/maintenanceTickets/${today}/${ticketId}`).set(newTicket)
            .then(() => {
                logAction('MAINTENANCE_REPORT', `Problem reported for ${ride.name}: ${problem.trim()}`);
                showNotification('Problem reported successfully!', 'success');
            })
            .catch(error => {
                console.error("Firebase ticket creation failed:", error);
                showNotification('Failed to report problem. Check connection.', 'error');
            });
    }, [currentUser, today, rides, logAction, showNotification]);

    const handleUpdateTicketStatus = useCallback((ticket: MaintenanceTicket, newStatus: 'in-progress' | 'solved', technician: Operator, helpers?: Operator[]) => {
        if (!isFirebaseConfigured || !database) return;
        
        const updates: Partial<MaintenanceTicket> = { status: newStatus };
        if (newStatus === 'in-progress') {
            updates.inProgressAt = new Date().toISOString();
            updates.assignedToId = technician.id;
            updates.assignedToName = technician.name;
            if (helpers && helpers.length > 0) {
                updates.helperIds = helpers.map(h => h.id);
                updates.helperNames = helpers.map(h => h.name);
            } else {
                updates.helperIds = undefined;
                updates.helperNames = undefined;
            }
        } else if (newStatus === 'solved') {
            updates.solvedAt = new Date().toISOString();
        }

        database.ref(`data/maintenanceTickets/${ticket.date}/${ticket.id}`).update(updates)
            .then(() => {
                logAction('MAINTENANCE_UPDATE', `${technician.name} updated status for ${ticket.rideName} to ${newStatus}.`);
                showNotification('Ticket status updated.', 'success');
            })
            .catch(error => {
                console.error("Firebase ticket update failed:", error);
                showNotification('Failed to update ticket status. Check connection.', 'error');
            });
    }, [logAction, showNotification]);
    
    // FIX: Switched to a direct set method to avoid Firebase transaction errors.
    const handleAddMaintenancePersonnel = (name: string) => {
        const newId = Date.now();
        const currentData = maintenancePersonnelData || {};
        const newData = { ...currentData, [newId]: { name } };
        setMaintenancePersonnelData(newData);
        logAction('ADD_MAINTENANCE_PERSONNEL', `Added new technician: '${name}'.`);
    };

    // FIX: Switched to a direct set method to avoid Firebase transaction errors.
    const handleDeleteMaintenancePersonnel = (id: number) => {
        const currentData = maintenancePersonnelData || {};
        const newState = { ...currentData };
        const deletedName = newState[id]?.name || 'Unknown';
        delete newState[id];
        setMaintenancePersonnelData(newState);
        logAction('DELETE_MAINTENANCE_PERSONNEL', `Deleted technician: ${deletedName}.`);
    };

    const handleClearMaintenanceTickets = () => {
        if (!window.confirm("Are you sure you want to permanently delete ALL maintenance tickets? This action cannot be undone.")) return;

        if (isFirebaseConfigured) {
            // FIX: Changed from remove() to set({}) to reliably clear the data without triggering re-initialization from the sync hook.
            database.ref('data/maintenanceTickets').set({})
                .then(() => {
                    logAction('CLEAR_MAINTENANCE_TICKETS', 'Cleared all maintenance tickets from the database.');
                    showNotification('All maintenance tickets have been cleared.', 'success');
                })
                .catch(e => {
                    console.error("Failed to clear maintenance tickets:", e);
                    showNotification('Could not clear maintenance tickets.', 'error');
                });
        }
    };

    const handleClearSolvedTickets = useCallback((date: string) => {
        if (!window.confirm(`Are you sure you want to permanently clear all SOLVED maintenance tickets for ${date}? This cannot be undone.`)) return;

        if (isFirebaseConfigured) {
            const dateTicketsRef = database.ref(`data/maintenanceTickets/${date}`);
            dateTicketsRef.once('value', (snapshot) => {
                const ticketsOnDate = snapshot.val();
                if (!ticketsOnDate) {
                    showNotification('No tickets to clear for this date.', 'info');
                    return;
                }

                const updates: { [key: string]: null } = {};
                let clearedCount = 0;
                for (const ticketId in ticketsOnDate) {
                    if (ticketsOnDate[ticketId].status === 'solved') {
                        updates[`data/maintenanceTickets/${date}/${ticketId}`] = null;
                        clearedCount++;
                    }
                }

                if (clearedCount > 0) {
                    database.ref().update(updates)
                        .then(() => {
                            logAction('CLEAR_SOLVED_TICKETS', `Cleared ${clearedCount} solved maintenance tickets for ${date}.`);
                            showNotification(`${clearedCount} solved tickets for ${date} have been cleared.`, 'success');
                        })
                        .catch(e => {
                            console.error("Failed to clear solved tickets:", e);
                            showNotification('Could not clear solved tickets.', 'error');
                        });
                } else {
                    showNotification('There are no solved tickets to clear for this date.', 'info');
                }
            });
        }
    }, [logAction, showNotification]);

    // Sync/Refresh function to force reload data from Firebase
    const handleSyncData = useCallback(() => {
        showNotification('Syncing data from database...', 'info', 2000);
        logAction('MANUAL_SYNC', 'User triggered manual data sync/refresh.');
        
        // Since the app uses Firebase real-time listeners, a page reload ensures:
        // 1. All listeners reconnect and pull fresh data
        // 2. Any stale state is cleared
        // 3. User sees the most up-to-date information
        // This is simpler and more reliable than trying to manually refresh each data source
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    }, [logAction, showNotification]);


    if (!isFirebaseConfigured) return <ConfigErrorScreen />;
    if (isFirebaseLoading) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
            <h1 className="text-3xl font-bold mb-4">Syncing with TFW Server...</h1>
            <div className="w-full max-w-md bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                <ul className="space-y-3">
                    {Object.entries(loadingStates).map(([name, isLoading]) => (
                        <li key={name} className="flex items-center justify-between text-lg animate-fade-in-up">
                            <span className="text-gray-300">{name}</span>
                            {isLoading ? (
                                <svg className="animate-spin h-5 w-5 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            )}
                        </li>
                    ))}
                     <li className="flex items-center justify-between text-lg animate-fade-in-up">
                        <span className="text-gray-300">App Logo</span>
                        {isLogoLoading ? (
                             <svg className="animate-spin h-5 w-5 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                    </li>
                </ul>
            </div>
        </div>
    );
    if (!role || !currentUser) return <Login onLogin={handleLogin} operators={operators} ticketSalesPersonnel={ticketSalesPersonnel} appLogo={appLogo} />;
    
    const renderContent = () => {
        switch (currentView) {
            case 'dashboard': return <Dashboard ridesWithCounts={ridesWithCounts} operators={operators} attendance={attendanceArray} historyLog={historyLog} onNavigate={handleNavigate} selectedDate={selectedDate} onDateChange={setSelectedDate} dailyAssignments={dailyAssignments} />;
            case 'reports': return <Reports dailyCounts={dailyCounts} rides={rides} />;
            case 'assignments': return <AssignmentView rides={rides} operators={operators} dailyAssignments={dailyAssignments} onSave={handleSaveAssignments} selectedDate={selectedDate} attendance={attendanceArray} connectionStatus={connectionStatus} />;
            case 'expertise': return <ExpertiseReport operators={operators} dailyAssignments={dailyAssignments} rides={rides} />;
            case 'roster':
                const ridesForRoster = rides.map(ride => ({ ...ride, count: dailyCounts[selectedDate]?.[ride.id] || 0 }));
                return <DailyRoster rides={ridesForRoster} operators={operators} dailyAssignments={dailyAssignments} selectedDate={selectedDate} onDateChange={setSelectedDate} role={role} currentUser={currentUser} attendance={attendanceArray} onNavigate={handleNavigate} onCountChange={handleCountChange} onShowModal={handleShowModal} hasCheckedInToday={hasCheckedInToday} onClockIn={handleClockIn} isCheckinAllowed={isCheckinAllowed} maintenanceTickets={maintenanceTickets[selectedDate] || {}} onReportProblem={handleReportProblem} onSyncData={handleSyncData} />;
            case 'ticket-sales-dashboard': return <TicketSalesView countersWithSales={countersWithSales} onSalesChange={handleSalesChange} />;
            case 'ts-assignments': return <TicketSalesAssignmentView counters={counters} ticketSalesPersonnel={ticketSalesPersonnel} dailyAssignments={ticketSalesAssignments} onSave={handleSaveTicketSalesAssignments} selectedDate={selectedDate} attendance={attendanceArray} connectionStatus={connectionStatus} />;
            case 'ts-roster': return <TicketSalesRoster counters={counters} ticketSalesPersonnel={ticketSalesPersonnel} dailyAssignments={ticketSalesAssignments} selectedDate={selectedDate} onDateChange={setSelectedDate} role={role} currentUser={currentUser} attendance={attendanceArray} onNavigate={handleNavigate} onSaveAssignments={handleSaveTicketSalesAssignments} hasCheckedInToday={hasCheckedInToday} onClockIn={handleClockIn} isCheckinAllowed={isCheckinAllowed} onSyncData={handleSyncData} />;
            case 'ts-expertise': return <TicketSalesExpertiseReport ticketSalesPersonnel={ticketSalesPersonnel} dailyAssignments={ticketSalesAssignments} counters={counters}/>;
            case 'history': return <HistoryLog history={historyLog} onClearHistory={handleClearHistory} />;
            case 'my-sales': return <DailySalesEntry currentUser={currentUser!} selectedDate={selectedDate} onDateChange={setSelectedDate} packageSales={packageSalesData} onSave={handleSavePackageSales} mySalesStartDate={mySalesStartDate} onMySalesStartDateChange={setMySalesStartDate} mySalesEndDate={mySalesEndDate} onMySalesEndDateChange={setMySalesEndDate} otherSalesCategories={otherSalesCategories} />;
            case 'sales-officer-dashboard': return <SalesOfficerDashboard ticketSalesPersonnel={ticketSalesPersonnel} packageSales={packageSalesData} startDate={startDate} endDate={endDate} onStartDateChange={setStartDate} onEndDateChange={setEndDate} role={role} onEditSales={handleEditPackageSales} otherSalesCategories={otherSalesCategories} />;
            case 'maintenance-dashboard': return <MaintenanceDashboard maintenanceTickets={maintenanceTickets} selectedDate={selectedDate} onDateChange={setSelectedDate} onUpdateTicketStatus={handleUpdateTicketStatus} maintenancePersonnel={maintenancePersonnel} onClearSolved={handleClearSolvedTickets} />;
            
            case 'counter': default: return (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredRides.map(ride => <RideCard key={ride.id} ride={ride} onCountChange={handleCountChange} role={role} onChangePicture={() => handleShowModal('edit-image', ride)} />)}
                </div>
            );
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            {(role === 'operator' || role === 'ticket-sales') && <KioskModeWrapper />}
            <Header onSearch={setSearchTerm} onSelectFloor={setSelectedFloor} selectedFloor={selectedFloor} role={role} currentUser={currentUser} onLogout={handleLogout} onNavigate={handleNavigate} onShowModal={handleShowModal} currentView={currentView} connectionStatus={connectionStatus} appLogo={appLogo} />
            
            {/* Firebase Connection Status Banner */}
            {connectionStatus !== 'connected' && (
                <div className="w-full">
                    <div className="container mx-auto px-4 py-2">
                        <ConnectionStatus status={connectionStatus} showLabel={true} size="medium" />
                    </div>
                </div>
            )}
            
            <main className="container mx-auto p-4 flex-grow">{renderContent()}</main>
            {currentView === 'counter' && <Footer title="Total Guests Today" count={totalGuests} showReset={role === 'admin'} onReset={handleResetCounts} gradient="bg-gradient-to-r from-purple-400 to-pink-600" />}
            {currentView === 'ticket-sales-dashboard' && <Footer title="Total Ticket Sales Today" count={totalSales} showReset={role === 'admin' || role === 'sales-officer'} onReset={handleResetSales} gradient="bg-gradient-to-r from-teal-400 to-cyan-500" />}
            
            {modal === 'edit-image' && selectedRideForModal && <EditImageModal ride={selectedRideForModal} onClose={() => setModal(null)} onSave={handleSaveImage} />}
            {modal === 'ai-assistant' && <CodeAssistant rides={rides} dailyCounts={dailyCounts} onClose={() => setModal(null)} />}
            {modal === 'operators' && <OperatorManager operators={operators} onClose={() => setModal(null)} onAddOperator={handleAddOperator} onDeleteOperators={handleDeleteOperators} onImport={handleImportOperators} />}
            {modal === 'backup' && <BackupManager onClose={() => setModal(null)} onExport={handleExportData} onImport={handleImportData} onResetDay={handleResetDay} appLogo={appLogo} onLogoChange={handleLogoChange} otherSalesCategories={otherSalesCategories} onRenameCategory={handleRenameOtherSalesCategory} onDeleteCategory={handleDeleteOtherSalesCategory} obsoleteRides={obsoleteRides} onRemoveObsoleteRides={handleRemoveObsoleteRides} onAddMaintenancePersonnel={handleAddMaintenancePersonnel} onDeleteMaintenancePersonnel={handleDeleteMaintenancePersonnel} maintenancePersonnel={maintenancePersonnel} onClearMaintenanceTickets={handleClearMaintenanceTickets} />}
            <footer className="text-center py-4 mt-auto">
              <p className="text-gray-600 text-xs font-light">
                  Developed By
              </p>
              <p className="text-gray-500 font-semibold text-sm">
                  Mufti Mahmud Mollah
              </p>
              <p className="text-gray-600 text-xs">
                  AGM (Maintenance & SCD, FP,TFW)
              </p>
            </footer>
        </div>
    );
};

const App: React.FC = () => (
    <NotificationProvider>
        <AppContent />
    </NotificationProvider>
);

export default App;