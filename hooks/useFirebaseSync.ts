import { useState, useEffect, Dispatch, SetStateAction, useCallback, useRef } from 'react';
import { database, isFirebaseConfigured } from '../firebaseConfig';

function useFirebaseSync<T>(
  path: string,
  initialValue: T
): { data: T; setData: Dispatch<SetStateAction<T>>; isLoading: boolean } {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const initialValueRef = useRef(initialValue);

  useEffect(() => {
    if (!isFirebaseConfigured) {
        return;
    }
    
    const dbRef = database.ref(path);

    const timeoutId = setTimeout(() => {
        if (loading) {
            console.warn(`Firebase listener for path "${path}" timed out after 8 seconds. Proceeding with initial/stale data.`);
            setLoading(false);
        }
    }, 8000);

    const listener = dbRef.on('value', (snapshot) => {
      clearTimeout(timeoutId);
      if (snapshot.exists()) {
        setStoredValue(snapshot.val());
      } else {
        dbRef.set(initialValueRef.current).catch(error => console.error(`Firebase initial set error at path "${path}":`, error));
        setStoredValue(initialValueRef.current);
      }
      setLoading(false);
    }, (error) => {
        clearTimeout(timeoutId);
        console.error(`Firebase read error at path "${path}":`, error);
        setLoading(false);
    });

    return () => {
      clearTimeout(timeoutId);
      dbRef.off('value', listener);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  const setValue: Dispatch<SetStateAction<T>> = useCallback((value) => {
    if (!isFirebaseConfigured) {
      console.warn(`Firebase is not configured. Data for "${path}" will not be saved.`);
      setStoredValue(value);
      return;
    }

    try {
        const dbRef = database.ref(path);
        if (value instanceof Function) {
            // For function-based updates, compute the new value first, then use set() instead of transaction
            // This avoids transaction conflicts and ensures immediate local state update
            dbRef.once('value').then((snapshot) => {
                const currentData = snapshot.exists() ? snapshot.val() : initialValueRef.current;
                const newValue = value(currentData);
                // Update local state immediately for better UX
                setStoredValue(newValue);
                // Then persist to Firebase
                return dbRef.set(newValue);
            }).catch(error => {
                console.error(`Firebase function-based update error at path "${path}":`, error);
            });
        } else {
            // For direct value sets, update local state immediately and persist to Firebase
            setStoredValue(value);
            dbRef.set(value).catch(error => {
                console.error(`Firebase write error at path "${path}":`, error);
            });
        }
    } catch (error) {
        console.error(`Error setting value for Firebase path "${path}":`, error);
    }
  }, [path]);

  return { data: storedValue, setData: setValue, isLoading: loading };
}

export default useFirebaseSync;