/**
 * 通知サービス抽象レイヤー
 * BrowserPush / InApp の2チャネル対応
 */

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface NotificationChannel {
  name: string;
  send(payload: NotificationPayload): Promise<boolean>;
  isAvailable(): boolean;
}

// ===== Browser Push =====
export class BrowserPushChannel implements NotificationChannel {
  name = 'BrowserPush';

  isAvailable(): boolean {
    return typeof window !== 'undefined'
      && 'Notification' in window
      && Notification.permission === 'granted';
  }

  async send(payload: NotificationPayload): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      new Notification(payload.title, {
        body: payload.body,
        icon: '/pwa-192x192.png',
        data: payload.data,
      });
      return true;
    } catch {
      return false;
    }
  }
}

// ===== In-App (Toast) =====
export class InAppChannel implements NotificationChannel {
  name = 'InApp';
  private listeners: Array<(payload: NotificationPayload) => void> = [];

  isAvailable(): boolean {
    return true;
  }

  onNotification(listener: (payload: NotificationPayload) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  async send(payload: NotificationPayload): Promise<boolean> {
    for (const listener of this.listeners) {
      listener(payload);
    }
    return true;
  }
}

// ===== Manager =====
export class NotificationManager {
  private channels: NotificationChannel[] = [];

  addChannel(channel: NotificationChannel) {
    this.channels.push(channel);
  }

  async sendAll(payload: NotificationPayload): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    for (const channel of this.channels) {
      if (channel.isAvailable()) {
        results[channel.name] = await channel.send(payload);
      } else {
        results[channel.name] = false;
      }
    }
    return results;
  }
}
