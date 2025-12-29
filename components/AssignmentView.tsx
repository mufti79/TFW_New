import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Ride, Operator, AttendanceRecord } from '../types';
import { useNotification } from '../imageStore';

// Make sure XLSX is available from the script tag in index.html
declare var XLSX: any;

interface AssignmentViewProps {
  rides: Ride[];
  operators: Operator[];
  dailyAssignments: Record<string, Record<string, number[]>>;
  onSave: (date: string, assignments: Record<string, number[]>) => void;
  selectedDate: string;
  attendance: AttendanceRecord[];
}

const AssignmentView: React.FC<AssignmentViewProps> = ({ rides, operators, dailyAssignments, onSave, selectedDate, attendance }) => {
  const [assignments, setAssignments] = useState<Record<string, number[]>>({});
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<'up' | 'down'>('down');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showNotification } = useNotification();
  
  // Sync local state with prop from Firebase
  useEffect(() => {
    setAssignments(dailyAssignments[selectedDate] || {});
  }, [selectedDate, dailyAssignments]);

  const isDirty = useMemo(() => {
    const currentRemoteAssignments = dailyAssignments[selectedDate] || {};
    return JSON.stringify(assignments) !== JSON.stringify(currentRemoteAssignments);
  }, [assignments, dailyAssignments, selectedDate]);

  // Prevent leaving with unsaved changes
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
        event.preventDefault();
        event.returnValue = ''; // Required for Chrome
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);


  const attendanceStatusMap = useMemo(() => {
    const statusMap = new Map<number, boolean>();
    attendance
      .filter(record => record.date === selectedDate)
      .forEach(record => statusMap.set(record.operatorId, true));
    return statusMap;
  }, [attendance, selectedDate]);

  const handleAssignmentChange = (rideId: number, operatorId: number) => {
    setAssignments(prev => {
        const newAssignments = {...prev};
        const currentAssignedValue = newAssignments[rideId];
        const currentAssigned = Array.isArray(currentAssignedValue) ? currentAssignedValue : currentAssignedValue ? [currentAssignedValue] : [];
        
        const isAssigned = currentAssigned.includes(operatorId);
        
        let updatedAssigned: number[];
        if (isAssigned) {
            updatedAssigned = currentAssigned.filter(id => id !== operatorId);
        } else {
            updatedAssigned = [...currentAssigned, operatorId];
        }

        if (updatedAssigned.length > 0) {
            newAssignments[rideId] = updatedAssigned;
        } else {
            delete newAssignments[rideId];
        }
        return newAssignments;
    });
  };

  const handleSave = () => {
    onSave(selectedDate, assignments);
  };
  
  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all of today's assignments?")) {
        setAssignments({});
    }
  };

    const handleToggleDropdown = (e: React.MouseEvent<HTMLButtonElement>, rideId: number) => {
        if (openDropdownId === rideId) {
            setOpenDropdownId(null);
            return;
        }

        const buttonRect = e.currentTarget.getBoundingClientRect();
        const spaceBelow = window.innerHeight - buttonRect.bottom;
        const dropdownHeight = 240; // Corresponds to max-h-60

        if (spaceBelow < dropdownHeight && buttonRect.top > spaceBelow) {
            setDropdownPosition('up');
        } else {
            setDropdownPosition('down');
        }
        setOpenDropdownId(rideId);
    };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const rideNameMap = new Map(rides.map(r => [r.name.toLowerCase(), r.id]));
        const operatorNameMap = new Map(operators.map(o => [o.name.toLowerCase(), o.id]));

        let successCount = 0;
        const errors: string[] = [];
        // FIX: Explicitly type `newAssignments` to prevent type-widening issues downstream.
        const newAssignments: Record<string, number[]> = { ...assignments };

        const dataRows = json.slice(1);

        dataRows.forEach((row, index) => {
          const rideName = String(row[0] ?? '').trim().toLowerCase();
          const operatorNamesStr = String(row[1] ?? '').trim();
          
          if (!rideName || !operatorNamesStr) return;

          const rideId = rideNameMap.get(rideName);
          if (!rideId) {
            errors.push(`Row ${index + 2}: Ride "${String(row[0])}" not found.`);
            return;
          }

          const operatorNames = operatorNamesStr.split(',').map(name => name.trim().toLowerCase());
          const operatorIds: number[] = [];
          
          operatorNames.forEach(name => {
              const opId = operatorNameMap.get(name);
              if (opId) {
                  // FIX: Argument of type 'unknown' is not assignable to parameter of type 'number'.
                  operatorIds.push(opId as number);
              } else {
                  errors.push(`Row ${index + 2}: Operator "${name}" not found.`);
              }
          });

          if (operatorIds.length > 0) {
              newAssignments[String(rideId)] = [...(newAssignments[String(rideId)] || []), ...operatorIds];
              // Remove duplicates
              // FIX: Explicitly providing the generic type to `new Set` ensures TypeScript correctly infers the array elements as numbers, resolving a type error.
              newAssignments[String(rideId)] = Array.from(new Set<number>(newAssignments[String(rideId)]));
              successCount++;
          }
        });

        setAssignments(newAssignments);

        if (errors.length > 0) {
          showNotification(`${successCount} assignments imported, but with errors. Check console.`, 'warning', 8000);
          console.warn("Import errors:", errors);
        } else {
          showNotification(`${successCount} assignment rows processed successfully!`, 'success');
        }

      } catch (error) {
        console.error("Error parsing Excel file:", error);
        showNotification("Failed to parse file. Check format.", 'error');
      } finally {
        if(fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExportAssignments = () => {
    if (Object.keys(assignments).length === 0) {
      showNotification('No assignments to export for this date.', 'warning');
      return;
    }

    // Create header row
    const headers = ['Ride Name', 'Operator Name(s)'];
    
    // Create data rows
    const rideMap = new Map<string, string>(rides.map(r => [r.id.toString(), r.name]));
    const operatorMap = new Map<number, string>(operators.map(o => [o.id, o.name]));
    
    const rows: string[] = [];
    
    // Sort by ride name for consistency
    const sortedAssignments = Object.entries(assignments).sort((a, b) => {
      const rideName1 = rideMap.get(a[0]) || '';
      const rideName2 = rideMap.get(b[0]) || '';
      return rideName1.localeCompare(rideName2);
    });
    
    for (const [rideId, operatorIdValue] of sortedAssignments) {
      const rideName = rideMap.get(rideId);
      if (!rideName) continue;
      
      const operatorIds = Array.isArray(operatorIdValue) ? operatorIdValue : [operatorIdValue];
      const operatorNames = operatorIds
        .map((id: number) => operatorMap.get(id))
        .filter(Boolean)
        .join(', ');
      
      if (operatorNames) {
        const rideNameCsv = `"${rideName.replace(/"/g, '""')}"`;
        const operatorNamesCsv = `"${operatorNames.replace(/"/g, '""')}"`;
        rows.push([rideNameCsv, operatorNamesCsv].join(','));
      }
    }
    
    if (rows.length === 0) {
      showNotification('No valid assignments to export.', 'warning');
      return;
    }
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `Operator_Assignments_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification(`Exported ${rows.length} assignments successfully!`, 'success');
  };
  
  const [year, month, day] = selectedDate.split('-').map(Number);
  const displayDate = new Date(year, month - 1, day);

  return (
    <div className="flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              Operator Assignments for {displayDate.toLocaleDateString()}
          </h1>
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto flex-wrap justify-center">
              <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".xlsx, .xls, .csv" className="hidden" />
              <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto px-4 py-2 text-sm bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 active:scale-95 transition-all"
              >
                  Import
              </button>
              <button
                  onClick={handleExportAssignments}
                  className="w-full sm:w-auto px-4 py-2 text-sm bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 active:scale-95 transition-all"
              >
                  Export
              </button>
               <button
                  onClick={handleClearAll}
                  className="w-full sm:w-auto px-4 py-2 text-sm bg-yellow-600 text-white font-bold rounded-lg hover:bg-yellow-700 active:scale-95 transition-all"
              >
                  Clear All
              </button>
              <button
                  onClick={handleSave}
                  disabled={!isDirty}
                  className={`w-full sm:w-auto px-6 py-2 text-sm font-bold rounded-lg active:scale-95 transition-all ${
                    isDirty 
                    ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400 animate-pulse' 
                    : 'bg-green-600 text-white opacity-75 cursor-default'
                }`}
              >
                  {isDirty ? 'Save Changes' : 'All Saved'}
              </button>
          </div>
      </div>
      
        {operators.length > 0 ? (
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
            <div className="p-4 bg-gray-700/50 text-gray-300">
                <p>Assign one or more operators below, or use the "Import" button to upload an Excel/CSV file.</p>
                <p className="text-sm text-gray-400">Use "Export" to download current assignments in CSV format for syncing with TFW-OPS-Sales. The exported file has two columns: Ride Name and Operator Name(s), with multiple operators separated by commas.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-700">
                {rides.map((ride) => {
                    const rawAssignment = assignments[ride.id];
                    const assignedOperatorIds = Array.isArray(rawAssignment) ? rawAssignment : rawAssignment ? [rawAssignment] : [];
                    const operatorIdMap = new Map(operators.map(op => [op.id, op.name]));
                    const assignedNames = assignedOperatorIds.map(id => operatorIdMap.get(id)).filter(Boolean).join(', ');

                    return (
                        <div key={ride.id} className="p-4 bg-gray-800">
                            <h3 className="font-bold text-lg">{ride.name}</h3>
                            <p className="text-sm text-gray-400 mb-2">{ride.floor} Floor</p>
                            <div className="relative">
                                <button
                                    onClick={(e) => handleToggleDropdown(e, ride.id)}
                                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-left truncate"
                                >
                                    {assignedNames || <span className="text-gray-500">Unassigned</span>}
                                </button>
                                {openDropdownId === ride.id && (
                                    <div className={`absolute z-10 w-full bg-gray-900 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto ${dropdownPosition === 'up' ? 'bottom-full mb-1' : 'mt-1'}`}>
                                        {operators.sort((a, b) => a.name.localeCompare(b.name)).map(op => {
                                            const isPresent = attendanceStatusMap.get(op.id);
                                            const statusLabel = isPresent ? '(P)' : '(A)';
                                            return (
                                                <label key={op.id} className="flex items-center px-3 py-2 hover:bg-gray-700 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={assignedOperatorIds.includes(op.id)}
                                                        onChange={() => handleAssignmentChange(ride.id, op.id)}
                                                        className="h-4 w-4 rounded bg-gray-800 border-gray-500 text-purple-600 focus:ring-purple-500"
                                                    />
                                                    <span className="ml-3 text-gray-300">{op.name} {statusLabel}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-gray-400">No Operators Found.</h2>
            <p className="text-gray-500">Please add operators in the 'Manage Operators' panel before making assignments.</p>
          </div>
        )}
    </div>
  );
};

export default AssignmentView;
