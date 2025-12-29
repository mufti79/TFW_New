import React, { useMemo } from 'react';
import { RideWithCount, Operator, AttendanceRecord, HistoryRecord } from '../types';

type View = 'counter' | 'reports' | 'assignments' | 'expertise' | 'roster' | 'ticket-sales-dashboard' | 'ts-assignments' | 'ts-roster' | 'ts-expertise' | 'history' | 'my-sales' | 'sales-officer-dashboard' | 'dashboard';

interface DashboardProps {
  ridesWithCounts: RideWithCount[];
  operators: Operator[];
  attendance: AttendanceRecord[];
  historyLog: HistoryRecord[];
  onNavigate: (view: View) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  // FIX: Corrected the type to expect an array of numbers for assignments.
  dailyAssignments: Record<string, Record<string, number[]>>;
}

const Dashboard: React.FC<DashboardProps> = ({ ridesWithCounts, operators, attendance, historyLog, onNavigate, selectedDate, onDateChange, dailyAssignments }) => {

  const dashboardData = useMemo(() => {
    const totalGuests = ridesWithCounts.reduce((sum, ride) => sum + ride.count, 0);
    const activeRides = ridesWithCounts.filter(ride => ride.count > 0).length;
    
    const attendanceTodayMap = new Map(attendance.filter(a => a.date === selectedDate).map(a => [a.operatorId, a]));
    const presentOperators = operators.filter(op => attendanceTodayMap.has(op.id)).sort((a,b) => a.name.localeCompare(b.name));
    const absentOperators = operators.filter(op => !attendanceTodayMap.has(op.id)).sort((a,b) => a.name.localeCompare(b.name));
    const presentCount = presentOperators.length;

    const topRides = [...ridesWithCounts]
        .filter(ride => ride.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
        
    const assignmentsToday = dailyAssignments[selectedDate] || {};
    const operatorMap = new Map(operators.map(op => [op.id, op.name]));
    
    const assignedRideIds = new Set(Object.keys(assignmentsToday));
    const unassignedRides = ridesWithCounts
        .filter(r => !assignedRideIds.has(r.id.toString()))
        .sort((a, b) => a.name.localeCompare(b.name));

    const ridesAwaitingCount = ridesWithCounts
        .filter(ride => ride.count === 0 && assignmentsToday[ride.id])
        .map(ride => {
            // FIX: Handle both old (number) and new (number[]) data formats
            const operatorIdValue = assignmentsToday[ride.id];
            const operatorIds = Array.isArray(operatorIdValue) ? operatorIdValue : [operatorIdValue];
            const operatorNames = operatorIds
                .map(id => operatorMap.get(id))
                .filter(Boolean) as string[];
            return {
                ...ride,
                operatorNames,
            };
        })
        .sort((a,b) => a.name.localeCompare(b.name));

    return { totalGuests, activeRides, presentCount, topRides, presentOperators, absentOperators, unassignedRides, ridesAwaitingCount };
  }, [ridesWithCounts, operators, attendance, selectedDate, dailyAssignments]);

  const [year, month, day] = selectedDate.split('-').map(Number);
  const displayDate = new Date(year, month - 1, day);

  const formatTime = (timeStr: string | null): string => {
      if (!timeStr) return '';
      const [hours, minutes] = timeStr.split(':');
      let h = parseInt(hours, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      h = h ? h : 12; // the hour '0' should be '12'
      return `${h}:${minutes} ${ampm}`;
  };

  const handleDownloadAttendance = () => {
      const attendanceTodayMap = new Map<number, AttendanceRecord>();
      attendance
        .filter(record => record.date === selectedDate)
        .forEach(record => attendanceTodayMap.set(record.operatorId, record));

      const operatorsWithAttendance = operators.map(op => ({
        ...op,
        attendance: attendanceTodayMap.get(op.id) || null
      })).sort((a, b) => {
          if (a.attendance && !b.attendance) return -1;
          if (!a.attendance && b.attendance) return 1;
          return a.name.localeCompare(b.name);
      });

      if (operatorsWithAttendance.length === 0) {
          alert("No operator data to download.");
          return;
      }

      const headers = ['Operator Name', 'Status', 'Check-in Time', 'Briefing Attended'];
      
      const rows = operatorsWithAttendance.map(operator => {
          const status = operator.attendance ? 'Present' : 'Absent';
          let checkInTime = 'N/A';
          let attendedBriefing = 'N/A';

          if(operator.attendance) {
              checkInTime = formatTime(operator.attendance.briefingTime);
              attendedBriefing = operator.attendance.attendedBriefing ? 'Yes' : 'No';
          }
          
          const operatorName = `"${operator.name.replace(/"/g, '""')}"`;
          
          return [operatorName, status, checkInTime, attendedBriefing].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.setAttribute('download', `TFW_Ops_Attendance_${selectedDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };
  
  const handleDownloadAwaitingCount = () => {
    if (dashboardData.ridesAwaitingCount.length === 0) {
        alert("No data to download.");
        return;
    }

    const headers = ['Ride Name', 'Floor', 'Assigned Operators'];
    
    const rows = dashboardData.ridesAwaitingCount.map(ride => {
        const rideName = `"${ride.name.replace(/"/g, '""')}"`;
        const floor = `"${ride.floor.replace(/"/g, '""')}"`;
        const operators = `"${ride.operatorNames.join(', ').replace(/"/g, '""')}"`;
        return [rideName, floor, operators].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `TFW_Awaiting_Guest_Counts_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="animate-fade-in-down space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            Operations Dashboard (v2)
          </h1>
          <p className="text-gray-400">Showing data for {displayDate.toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
            <div className="flex items-center gap-2 bg-gray-700/50 p-2 rounded-lg">
                <label htmlFor="dashboard-date" className="text-sm font-medium text-gray-300">View Date:</label>
                <input
                    id="dashboard-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => onDateChange(e.target.value)}
                    className="px-2 py-1 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm"
                />
            </div>
            <button
                onClick={handleDownloadAttendance}
                className="px-4 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 active:scale-95 transition-all text-sm"
            >
                DL Attendance
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
            {/* Ride Status */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                    <div>
                        <h2 className="text-xl font-bold mb-4">Top 5 Rides Today</h2>
                        {dashboardData.topRides.length > 0 ? (
                            <ul className="space-y-3">
                            {dashboardData.topRides.map((ride, index) => (
                                <li key={ride.id} className="flex justify-between items-center text-gray-300">
                                <span className="truncate">{index + 1}. {ride.name}</span>
                                <span className="font-bold text-lg text-purple-400 tabular-nums">{ride.count.toLocaleString()}</span>
                                </li>
                            ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 text-center py-8">No ride activity recorded.</p>
                        )}
                    </div>
                    <div className="mt-6 md:mt-0">
                        <h2 className="text-xl font-bold mb-4 text-pink-400">Unassigned Rides ({dashboardData.unassignedRides.length})</h2>
                        {dashboardData.unassignedRides.length > 0 ? (
                            <ul className="space-y-2 text-sm max-h-48 overflow-y-auto pr-2">
                                {dashboardData.unassignedRides.map(ride => (
                                    <li key={ride.id} className="text-gray-400 bg-gray-700/50 p-2 rounded-md">{ride.name}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 text-center py-8">All rides are assigned!</p>
                        )}
                    </div>
                </div>
            </div>
             {/* G&R Awaiting Guest Count */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-yellow-400">G&R Awaiting Guest Count ({dashboardData.ridesAwaitingCount.length})</h2>
                    {dashboardData.ridesAwaitingCount.length > 0 && (
                        <button
                            onClick={handleDownloadAwaitingCount}
                            className="px-3 py-1 bg-green-700 text-white font-semibold rounded-md text-xs hover:bg-green-600"
                        >
                            Download List
                        </button>
                    )}
                </div>
                {dashboardData.ridesAwaitingCount.length > 0 ? (
                    <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">
                        {dashboardData.ridesAwaitingCount.map(ride => (
                            <li key={ride.id} className="p-3 bg-gray-700/50 rounded-md">
                                <p className="font-semibold text-gray-200">{ride.name}</p>
                                <p className="text-xs text-gray-400">
                                    Assigned: <span className="font-medium text-gray-300">{ride.operatorNames.join(', ')}</span>
                                </p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500 text-center py-8">All active rides are reporting guest counts.</p>
                )}
            </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
                <h2 className="text-xl font-bold mb-4">Operator Attendance</h2>
                <div className="space-y-4 max-h-72 overflow-y-auto pr-2">
                    <div>
                        <h3 className="font-semibold text-green-400 mb-2">Present ({dashboardData.presentOperators.length})</h3>
                        {dashboardData.presentOperators.length > 0 ? (
                            <ul className="space-y-1 text-sm text-gray-300">
                                {dashboardData.presentOperators.map(op => <li key={op.id}>{op.name}</li>)}
                            </ul>
                        ) : <p className="text-xs text-gray-500">No operators present.</p>}
                    </div>
                    <div>
                        <h3 className="font-semibold text-red-500 mb-2">Absent ({dashboardData.absentOperators.length})</h3>
                        {dashboardData.absentOperators.length > 0 ? (
                            <ul className="space-y-1 text-sm text-gray-300">
                                {dashboardData.absentOperators.map(op => <li key={op.id}>{op.name}</li>)}
                            </ul>
                        ) : <p className="text-xs text-gray-500">All operators accounted for.</p>}
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
