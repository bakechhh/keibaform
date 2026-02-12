/**
 * 一撃対象レース検出時の通知フック
 * - ブラウザ通知（PWA対応）
 * - アプリ内トースト
 * - 通知済みレースIDをlocalStorageで管理（重複防止）
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { IchigekiEligibility } from '../lib/ichigeki-checker';
import { Race } from '../types';
import { BrowserPushChannel, InAppChannel, NotificationManager } from '../lib/notification-service';

const STORAGE_KEY = 'ichigeki_notified_races';

function getNotifiedRaces(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return new Set(stored ? JSON.parse(stored) : []);
  } catch {
    return new Set();
  }
}

function markNotified(raceId: string) {
  const notified = getNotifiedRaces();
  notified.add(raceId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...notified]));
}

export interface IchigekiToast {
  show: boolean;
  raceName: string;
}

export function useIchigekiNotification(
  eligibility: IchigekiEligibility | null,
  race: Race | null,
) {
  const [toast, setToast] = useState<IchigekiToast>({ show: false, raceName: '' });
  const managerRef = useRef<NotificationManager | null>(null);

  if (!managerRef.current) {
    const manager = new NotificationManager();
    manager.addChannel(new BrowserPushChannel());
    manager.addChannel(new InAppChannel());
    managerRef.current = manager;
  }

  const requestPermission = useCallback(async () => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!eligibility?.eligible || !race) return;

    const notified = getNotifiedRaces();
    if (notified.has(race.id)) return;

    markNotified(race.id);

    const raceName = `${race.location}${race.round}R`;

    managerRef.current?.sendAll({
      title: '⚡ 一撃対象レース検出',
      body: `${raceName} ${race.name}が一撃購入条件を満たしています`,
      data: { raceId: race.id },
    });

    setToast({ show: true, raceName });

    const timer = setTimeout(() => setToast({ show: false, raceName: '' }), 5000);
    return () => clearTimeout(timer);
  }, [eligibility?.eligible, race?.id]);

  return {
    toast,
    dismissToast: useCallback(() => setToast({ show: false, raceName: '' }), []),
    requestPermission,
  };
}
