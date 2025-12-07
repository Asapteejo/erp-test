// src/hooks/useRealtimeActivity.jsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useRealtimeActivity() {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const channel = supabase
      .channel('activity-feed')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'activity_log' },
        (payload) => {
          setActivities(prev => [payload.new, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    // Initial load
    supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setActivities(data || []));

    return () => supabase.removeChannel(channel);
  }, []);

  return activities;
}