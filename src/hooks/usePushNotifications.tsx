import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported';

export function usePushNotifications(employeeId: string | null) {
  const [permission, setPermission] = useState<PushPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check current state on mount
  useEffect(() => {
    if (!employeeId) return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission as PushPermission);

    // Check if already subscribed in DB
    supabase
      .from('push_subscriptions')
      .select('id')
      .eq('employee_id', employeeId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('Push subscription check failed:', error);
        setSubscribed(!!data);
      });
  }, [employeeId]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!employeeId || !VAPID_PUBLIC_KEY) return false;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;

      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm as PushPermission);
      if (perm !== 'granted') { setLoading(false); return false; }

      // Subscribe to push
      const pushSub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const json = pushSub.toJSON();
      const endpoint = json.endpoint!;
      const p256dh = json.keys!.p256dh!;
      const auth = json.keys!.auth!;

      // Save to DB (upsert — handles re-subscription)
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({ employee_id: employeeId, endpoint, p256dh, auth, updated_at: new Date().toISOString() },
          { onConflict: 'employee_id' });

      if (error) throw error;
      setSubscribed(true);
      setLoading(false);
      return true;
    } catch (err) {
      console.error('Push subscribe failed:', err);
      setLoading(false);
      return false;
    }
  }, [employeeId]);

  const unsubscribe = useCallback(async () => {
    if (!employeeId) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const pushSub = await reg.pushManager.getSubscription();
      await pushSub?.unsubscribe();
      await supabase.from('push_subscriptions').delete().eq('employee_id', employeeId);
      setSubscribed(false);
    } catch (err) {
      console.error('Push unsubscribe failed:', err);
    }
  }, [employeeId]);

  return { permission, subscribed, loading, subscribe, unsubscribe };
}

// Utility: send a push notification from the owner side (calls edge function)
export async function sendPushToEmployee(
  employeeId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<boolean> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? anonKey;

    const res = await fetch(`${supabaseUrl}/functions/v1/send-push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ employee_id: employeeId, title, body, data }),
    });
    const json = await res.json();
    return json.ok === true;
  } catch {
    return false;
  }
}
