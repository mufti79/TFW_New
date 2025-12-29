

import React, { useMemo, useState, useEffect } from 'react';
import { Counter, Operator, AttendanceRecord } from '../types';
import { Role } from '../hooks/useAuth';
import BriefingCheckin from './BriefingCheckin';

type View = 'counter' | 'reports' | 'assignments' | 'expertise' | 'roster' | 'ticket-sales-dashboard' | 'ts-assignments' | 'ts-roster';

// Manage Assignments Modal Component
interface ManageAssignmentsModalProps {
    counter: Counter;
    allPersonnel: Operator[];
    assignedPersonnelIds: number[];
    onClose: () => void;
    onSave: (counterId: number, newPersonnelIds: number[]) => void;
    attendance: AttendanceRecord[];
    selectedDate: string;
}

const ManageAssignmentsModal: React.FC<ManageAssignmentsModalProps> = ({ counter, allPersonnel, assignedPersonnelIds, onClose, onSave, attendance, selectedDate }) => {
    const [selectedIds, setSelectedIds] = useState<number[]>(assignedPersonnelIds);
    
    const attendanceStatusMap = useMemo(() => {
        const statusMap = new Map<number, boolean>();
        attendance
          .filter(record => record.date === selectedDate)
          .forEach(record => statusMap.set(record.operatorId, true));
        return statusMap;
    }, [attendance, selectedDate]);
      
    const handleToggle = (personnelId: number) => {
        setSelectedIds(prev => 
            prev.includes(personnelId) 
            ? prev.filter(id => id !== personnelId) 
            : [...prev, personnelId]
        );
    };

    const handleConfirm = () => {
        onSave(counter.id, selectedIds);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-sm border border-gray-700 animate-fade-in-up flex flex-col">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-100">Manage Assignments</h2>
                            <p className="text-teal-400 font-semibold">{counter.name}</p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close modal">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Select personnel to assign:</label>
                        {allPersonnel.sort((a,b) => a.name.localeCompare(b.name)).map(p => {
                            const isPresent = attendanceStatusMap.get(p.id);
                            const statusLabel = isPresent ? '(P)' : '(A)';
                            return (
                                <label key={p.id} className="flex items-center p-2 rounded-md hover:bg-gray-700 cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={selectedIds.includes(p.id)}
                                        onChange={() => handleToggle(p.id)}
                                        className="h-4 w-4 rounded bg-gray-900 border-gray-600 text-teal-600 focus:ring-teal-500"
                                    />
                                    <span className="ml-3 text-gray-300">{p.name} {statusLabel}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>
                
                <div className="bg-gray-700/50 px-6 py-4 flex justify-end gap-4 rounded-b-lg mt-auto">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 active:scale-95 transition-all">
                        Cancel
                    </button>
                    <button 
                        onClick={handleConfirm} 
                        className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 active:scale-95 transition-all"
                    >
                        Save Assignments
                    </button>
                </div>
            </div>
        </div>
    );
};


interface TicketSalesRosterProps {
  counters: Counter[];
  ticketSalesPersonnel: Operator[];
  dailyAssignments: Record<string, Record<string, number[]>>;
  selectedDate: string;
  onDateChange: (date: string) => void;
  role: Exclude<Role, null>;
  currentUser: Operator | null;
  attendance: AttendanceRecord[];
  onNavigate: (view: View) => void;
  onSaveAssignments: (date: string, assignments: Record<string, number[]>) => void;
  hasCheckedInToday: boolean;
  onClockIn: (attendedBriefing: boolean, briefingTime: string | null) => void;
  isCheckinAllowed: boolean;
  onSyncData?: () => void;
}

const TicketSalesRoster: React.FC<TicketSalesRosterProps> = ({ counters, ticketSalesPersonnel, dailyAssignments, selectedDate, onDateChange, role, currentUser, attendance, onNavigate, onSaveAssignments, hasCheckedInToday, onClockIn, isCheckinAllowed, onSyncData }) => {
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [manageModalInfo, setManageModalInfo] = useState<Counter | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const handleSyncData = () => {
    setIsSyncing(true);
    if (onSyncData) {
      onSyncData();
    }
    // Note: isSyncing state will be reset by page reload in App.tsx
  };
  
  const formatTime = (timeStr: string | null): string => {
      if (!timeStr) return '';
      const [hours, minutes] = timeStr.split(':');
      let h = parseInt(hours, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      h = h ? h : 12;
      return `${h}:${minutes} ${ampm}`;
  };

  const { assignmentsByPersonnel, assignmentsByCounter, unassignedCounters, personnelWithAttendance, presentCount, absentCount } = useMemo(() => {
    const assignmentsToday: Record<string, any> = dailyAssignments[selectedDate] || {};
    const counterMap = new Map(counters.map(c => [c.id.toString(), c]));
    
    const assignmentsByPersonnel = new Map<number, Counter[]>();
    const assignmentsByCounter = new Map<number, number[]>();
    const assignedCounterIds = new Set<string>();

    for (const [counterIdStr, personnelIdValue] of Object.entries(assignmentsToday)) {
        const counterId = Number(counterIdStr);
        // FIX: Handle both old (number) and new (number[]) data formats
        const personnelIds = Array.isArray(personnelIdValue) ? personnelIdValue : [personnelIdValue];
        
        assignmentsByCounter.set(counterId, personnelIds);
        const counter = counterMap.get(counterIdStr);
        if (counter) {
            personnelIds.forEach(personnelId => {
                const personnelCounters = assignmentsByPersonnel.get(personnelId) || [];
                assignmentsByPersonnel.set(personnelId, [...personnelCounters, counter as Counter]);
            });
            assignedCounterIds.add(counterIdStr);
        }
    }
    
    for (const counterList of assignmentsByPersonnel.values()) {
      counterList.sort((a, b) => a.name.localeCompare(b.name));
    }

    const unassignedCounters = counters
        .filter(c => !assignedCounterIds.has(c.id.toString()))
        .sort((a, b) => a.name.localeCompare(b.name));
    
    const attendanceTodayMap = new Map<number, AttendanceRecord>();
    const allPersonnelIds = new Set(ticketSalesPersonnel.map(p => p.id));
    attendance
      .filter(record => record.date === selectedDate && allPersonnelIds.has(record.operatorId))
      .forEach(record => attendanceTodayMap.set(record.operatorId, record));

    const personnelWithAttendance = ticketSalesPersonnel.map(op => ({
      ...op,
      attendance: attendanceTodayMap.get(op.id) || null
    })).sort((a, b) => {
        if (a.attendance && !b.attendance) return -1;
        if (!a.attendance && b.attendance) return 1;
        return a.name.localeCompare(b.name);
    });

    const presentCount = personnelWithAttendance.filter(op => op.attendance).length;
    const absentCount = personnelWithAttendance.length - presentCount;

    return { assignmentsByPersonnel, assignmentsByCounter, unassignedCounters, personnelWithAttendance, presentCount, absentCount };
  }, [dailyAssignments, selectedDate, counters, ticketSalesPersonnel, attendance]);


  const filteredPersonnel = useMemo(() => {
    const relevantPersonnel = (role === 'ticket-sales' && currentUser)
        ? personnelWithAttendance.filter(op => op.id === currentUser.id)
        : personnelWithAttendance;

    if (attendanceFilter === 'present') {
        return relevantPersonnel.filter(p => p.attendance);
    }
    if (attendanceFilter === 'absent') {
        return relevantPersonnel.filter(p => !p.attendance);
    }
    return relevantPersonnel;
  }, [personnelWithAttendance, attendanceFilter, role, currentUser]);

  const handleDownloadAttendanceReport = () => {
    if (filteredPersonnel.length === 0) {
        alert("No personnel data to download for the current filter.");
        return;
    }

    const headers = ['Personnel Name', 'Status', 'Briefing Attended', 'Briefing Time'];
    
    const rows = filteredPersonnel.map(personnel => {
        const status = personnel.attendance ? 'Present' : 'Absent';
        let attendedBriefing = 'N/A';
        let briefingTime = 'N/A';

        if(personnel.attendance) {
            attendedBriefing = personnel.attendance.attendedBriefing ? 'Yes' : 'No';
            briefingTime = formatTime(personnel.attendance.briefingTime);
        }
        
        const personnelName = `"${personnel.name.replace(/"/g, '""')}"`;
        
        return [personnelName, status, attendedBriefing, briefingTime].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    const filterText = attendanceFilter !== 'all' ? `_${attendanceFilter}` : '';
    link.setAttribute('download', `ToggiFunWorld_SalesAttendance_${selectedDate}${filterText}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadRoster = () => {
    if (ticketSalesPersonnel.length === 0) {
        alert("No personnel data to download.");
        return;
    }

    const headers = ['Personnel Name', 'Checked In', 'Attended Briefing', 'Briefing Time', 'Assigned Counters'];
    
    const rows = personnelWithAttendance.map((personnel: Operator & { attendance: AttendanceRecord | null }) => {
        const assignedCounters = assignmentsByPersonnel.get(personnel.id);
        const counterNames = assignedCounters ? assignedCounters.map(c => c.name).join('; ') : 'N/A';
        
        const checkedIn = personnel.attendance ? 'Yes' : 'No';
        let attendedBriefing = 'N/A';
        let briefingTime = 'N/A';

        if(personnel.attendance) {
            attendedBriefing = personnel.attendance.attendedBriefing ? 'Yes' : 'No';
            briefingTime = formatTime(personnel.attendance.briefingTime);
        }
        
        const personnelName = `"${personnel.name.replace(/"/g, '""')}"`;
        const counterNamesCsv = `"${counterNames.replace(/"/g, '""')}"`;

        return [personnelName, checkedIn, attendedBriefing, briefingTime, counterNamesCsv].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `ToggiFunWorld_SalesRoster_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAssignments = () => {
    const assignmentsToday: Record<string, number[]> = dailyAssignments[selectedDate] || {};
    
    if (Object.keys(assignmentsToday).length === 0) {
        alert("No assignments to download for this date.");
        return;
    }

    const headers = ['Counter Name', 'Personnel Name(s)'];
    const counterMap = new Map<string, string>(counters.map(c => [c.id.toString(), c.name]));
    const personnelMap = new Map<number, string>(ticketSalesPersonnel.map(p => [p.id, p.name]));
    
    const rows: Array<{ counterName: string; personnelNames: string }> = [];
    
    for (const [counterIdStr, personnelIdValue] of Object.entries(assignmentsToday)) {
        const counterName = counterMap.get(counterIdStr);
        if (!counterName) continue;
        
        const personnelIds = Array.isArray(personnelIdValue) ? personnelIdValue : [personnelIdValue];
        const personnelNames = personnelIds
            .map((id: number) => personnelMap.get(id))
            .filter(Boolean)
            .join(', ');
        
        if (personnelNames) {
            rows.push({ counterName, personnelNames });
        }
    }
    
    // Sort by counter name for consistency
    rows.sort((a, b) => a.counterName.localeCompare(b.counterName));
    
    // Format as CSV
    const csvRows = rows.map(({ counterName, personnelNames }) => {
        const counterNameCsv = `"${counterName.replace(/"/g, '""')}"`;
        const personnelNamesCsv = `"${personnelNames.replace(/"/g, '""')}"`;
        return [counterNameCsv, personnelNamesCsv].join(',');
    });
    
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `ToggiFunWorld_SalesAssignments_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
    const handleManageAssignmentsSave = (counterId: number, newPersonnelIds: number[]) => {
        const currentAssignments = dailyAssignments[selectedDate] || {};
        const updatedAssignments = {...currentAssignments};
        if (newPersonnelIds.length > 0) {
            updatedAssignments[counterId] = newPersonnelIds;
        } else {
            delete updatedAssignments[counterId];
        }
        onSaveAssignments(selectedDate, updatedAssignments);
    };

  const isRosterEmpty = personnelWithAttendance.length === 0;
  const isManager = role === 'admin' || role === 'sales-officer';

  const [year, month, day] = selectedDate.split('-').map(Number);
  const displayDate = new Date(year, month - 1, day);

  if (role === 'ticket-sales' && currentUser) {
      if (!hasCheckedInToday) {
        if (isCheckinAllowed) {
            return <BriefingCheckin operatorName={currentUser.name} onClockIn={onClockIn} />;
        } else {
            return (
                <div className="w-full max-w-lg mx-auto bg-gray-800 p-8 rounded-lg shadow-lg border border-yellow-500 text-center animate-fade-in-up">
                    <h1 className="text-3xl font-bold text-yellow-400 mb-4">Check-in Closed for Today</h1>
                    <p className="text-lg text-gray-300">
                        The check-in window for today has closed at 10:00 PM.
                    </p>
                    <p className="text-lg text-gray-400 mt-2">
                        Check-in for the next day will be available after 12:00 AM.
                    </p>
                </div>
            );
        }
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-500">
              Ticket Sales Roster for {displayDate.toLocaleDateString()}
            </h1>
            {isManager && (
            <div className="flex items-center gap-6 mt-2 text-lg">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-green-400">Present:</span>
                    <span className="font-bold text-2xl text-gray-100">{presentCount}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-red-500">Absent:</span>
                    <span className="font-bold text-2xl text-gray-100">{absentCount}</span>
                </div>
            </div>
        )}
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
           <div className="flex items-center gap-2 bg-gray-700/50 p-2 rounded-lg">
                <label htmlFor="roster-date" className="text-sm font-medium text-gray-300">Date:</label>
                <input
                    id="roster-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => onDateChange(e.target.value)}
                    className="px-2 py-1 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm"
                />
            </div>
            {isManager && (
                <div className="flex items-center gap-2 bg-gray-700/50 p-2 rounded-lg">
                    <label htmlFor="attendance-filter" className="text-sm font-medium text-gray-300">Filter:</label>
                    <select
                        id="attendance-filter"
                        value={attendanceFilter}
                        onChange={(e) => setAttendanceFilter(e.target.value as 'all' | 'present' | 'absent')}
                        className="px-2 py-1 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm"
                    >
                        <option value="all">All</option>
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                    </select>
                </div>
            )}
           {isManager && (
              <div className="flex items-center gap-2 flex-wrap justify-center">
                  <button
                      onClick={handleSyncData}
                      disabled={isSyncing}
                      className="px-3 py-2 bg-cyan-600 text-white font-semibold rounded-lg hover:bg-cyan-700 active:scale-95 transition-all text-sm disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2"
                      title="Refresh roster data from database"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {isSyncing ? 'Syncing...' : 'Sync'}
                  </button>
                  <div className="flex items-center gap-2 p-1 bg-gray-700/50 rounded-lg">
                      <button
                          onClick={handleDownloadAttendanceReport}
                          className="px-3 py-1.5 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 active:scale-95 transition-all text-sm"
                      >
                          DL Attendance
                      </button>
                      <button
                          onClick={handleDownloadRoster}
                          className="px-3 py-1.5 bg-green-800 text-white font-semibold rounded-md hover:bg-green-700 active:scale-95 transition-all text-sm"
                      >
                          DL Roster
                      </button>
                      <button
                          onClick={handleDownloadAssignments}
                          className="px-3 py-1.5 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 active:scale-95 transition-all text-sm"
                      >
                          DL Assignments
                      </button>
                  </div>
                  <button
                    onClick={() => onNavigate('ts-assignments')}
                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:scale-95 transition-all text-sm"
                  >
                    Edit Assignments
                  </button>
              </div>
            )}
        </div>
      </div>
      
        {isRosterEmpty ? (
            <div className="text-center py-16">
                <h2 className="text-2xl font-bold text-gray-400">No Personnel Data Found</h2>
                <p className="text-gray-500 mt-2">The personnel list is managed by the development team.</p>
            </div>
        ) : (
            <>
                <div className={role === 'ticket-sales' ? "max-w-xl mx-auto w-full" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"}>
                {filteredPersonnel.map(personnel => {
                    const personnelAssignments = assignmentsByPersonnel.get(personnel.id);

                    // If personnel is absent, render a simplified card.
                    if (!personnel.attendance) {
                        return (
                            <div key={personnel.id} className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4 flex flex-col justify-center">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-gray-500">{personnel.name}</h2>
                                    <div className="flex items-center gap-2 text-sm font-semibold text-red-500">
                                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                        <span>Absent</span>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    // If present, render the full card.
                    return (
                        <div key={personnel.id} className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4 flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <h2 className="text-xl font-bold text-teal-400">{personnel.name}</h2>
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></span>
                                    <span className="text-green-400">
                                        Checked In
                                    </span>
                                </div>
                            </div>

                            <div className="text-sm text-gray-400 mb-4 h-5">
                               {personnel.attendance && (
                                    <p>
                                        Checked In: <span className="font-semibold text-gray-200">{formatTime(personnel.attendance.briefingTime)}</span> 
                                        ({personnel.attendance.attendedBriefing ? <span className="text-teal-300">Briefing</span> : <span className="text-yellow-400">No Briefing</span>})
                                    </p>
                                )}
                            </div>

                            <div className="flex-grow">
                                <h3 className="font-semibold text-gray-300 mb-2 border-t border-gray-700 pt-3">Assignments:</h3>
                                <ul className="space-y-2 text-sm">
                                    {personnelAssignments && personnelAssignments.length > 0 ? (
                                        personnelAssignments.map(counter => {
                                            return (
                                                <li key={counter.id} className="text-gray-300 bg-gray-700/50 p-2 rounded-md">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            {counter.name} <span className="text-xs text-gray-500">({counter.location})</span>
                                                        </div>
                                                        {(isManager) && (
                                                            <button 
                                                                onClick={() => setManageModalInfo(counter)}
                                                                className="px-2 py-1 text-xs bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 active:scale-95 transition-all"
                                                            >
                                                                Manage
                                                            </button>
                                                        )}
                                                    </div>
                                                </li>
                                            );
                                        })
                                    ) : (
                                        <li className="text-gray-500 italic">No assignments for this date</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    );
                })}
                </div>

                {filteredPersonnel.length === 0 && !isRosterEmpty && (
                    <div className="text-center py-16 md:col-span-2 lg:col-span-3">
                        <h2 className="text-2xl font-bold text-gray-400">No Personnel Found</h2>
                        <p className="text-gray-500 mt-2">Try adjusting the attendance filter.</p>
                    </div>
                )}

                {isManager && unassignedCounters.length > 0 && (
                <div className="mt-12">
                    <h2 className="text-2xl font-bold text-pink-500 mb-4">Unassigned Counters</h2>
                    <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-4">
                    <ul className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-x-6">
                        {unassignedCounters.map(counter => (
                        <li key={counter.id} className="text-gray-400 mb-2 break-inside-avoid">{counter.name}</li>
                        ))}
                    </ul>
                    </div>
                </div>
                )}
            </>
        )}

        {manageModalInfo && (
            <ManageAssignmentsModal
                counter={manageModalInfo}
                allPersonnel={ticketSalesPersonnel}
                assignedPersonnelIds={assignmentsByCounter.get(manageModalInfo.id) || []}
                onClose={() => setManageModalInfo(null)}
                onSave={handleManageAssignmentsSave}
                attendance={attendance}
                selectedDate={selectedDate}
            />
        )}
    </div>
  );
};

export default TicketSalesRoster;