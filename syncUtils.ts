// @ts-nocheck
// Utility functions for syncing roster data to TFW-ops-sales database

import { tfwOpsSalesDatabase, isTfwOpsSalesConfigured as isTfwOpsSalesConfiguredFromConfig } from './tfwOpsSalesConfig';
import { Operator, AttendanceRecord } from './types';

// Re-export the configuration check
export const isTfwOpsSalesConfigured = isTfwOpsSalesConfiguredFromConfig;

export interface SyncResult {
  success: boolean;
  message: string;
  timestamp?: string;
}

/**
 * Sync operator roster assignments to TFW-ops-sales database
 * @param date - The date of the roster (YYYY-MM-DD format)
 * @param assignments - Operator assignments by ride/counter ID
 * @param operators - Array of all operators
 * @param attendance - Attendance records for the date
 * @param type - Type of roster ('operator' or 'ticket-sales')
 */
export async function syncRosterToOpsSales(
  date: string,
  assignments: Record<string, number[]>,
  operators: Operator[],
  attendance: AttendanceRecord[],
  type: 'operator' | 'ticket-sales'
): Promise<SyncResult> {
  // Check if TFW-ops-sales is configured
  if (!isTfwOpsSalesConfigured) {
    return {
      success: false,
      message: 'TFW-ops-sales database is not configured. Please configure it in tfwOpsSalesConfig.ts'
    };
  }

  if (!tfwOpsSalesDatabase) {
    return {
      success: false,
      message: 'TFW-ops-sales database connection is not available.'
    };
  }

  try {
    const timestamp = new Date().toISOString();
    
    // Filter attendance for the specific date
    const attendanceForDate = attendance.filter(record => record.date === date);
    
    // Create a comprehensive roster data structure
    const rosterData = {
      date,
      type,
      timestamp,
      assignments,
      operators: operators.map(op => ({
        id: op.id,
        name: op.name
      })),
      attendance: attendanceForDate.map(record => ({
        operatorId: record.operatorId,
        attendedBriefing: record.attendedBriefing,
        briefingTime: record.briefingTime
      }))
    };

    // Determine the path based on roster type
    const syncPath = type === 'operator' 
      ? `synced/operatorRoster/${date}` 
      : `synced/ticketSalesRoster/${date}`;

    // Push data to TFW-ops-sales database
    await tfwOpsSalesDatabase.ref(syncPath).set(rosterData);

    // Also update a "lastSync" record for tracking
    await tfwOpsSalesDatabase.ref('synced/lastSync').update({
      [type]: {
        date,
        timestamp,
        status: 'success'
      }
    });

    return {
      success: true,
      message: `Roster successfully synced to TFW-ops-sales for ${date}`,
      timestamp
    };

  } catch (error) {
    console.error('Error syncing roster to TFW-ops-sales:', error);
    return {
      success: false,
      message: `Failed to sync roster: ${error.message || 'Unknown error'}`
    };
  }
}

/**
 * Check the last sync status from TFW-ops-sales
 */
export async function getLastSyncStatus(
  type: 'operator' | 'ticket-sales'
): Promise<{ date: string; timestamp: string; status: string } | null> {
  if (!isTfwOpsSalesConfigured || !tfwOpsSalesDatabase) {
    return null;
  }

  try {
    const snapshot = await tfwOpsSalesDatabase.ref(`synced/lastSync/${type}`).once('value');
    return snapshot.val();
  } catch (error) {
    console.error('Error getting last sync status:', error);
    return null;
  }
}

/**
 * Verify that the TFW-ops-sales database is accessible
 */
export async function testOpsSalesConnection(): Promise<boolean> {
  if (!isTfwOpsSalesConfigured || !tfwOpsSalesDatabase) {
    return false;
  }

  try {
    // Try to read a test path
    await tfwOpsSalesDatabase.ref('.info/connected').once('value');
    return true;
  } catch (error) {
    console.error('TFW-ops-sales connection test failed:', error);
    return false;
  }
}
