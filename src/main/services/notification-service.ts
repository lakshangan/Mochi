import { Notification } from 'electron';

export class NotificationService {
  public showNotification(title: string, body: string, onClick?: () => void): boolean {
    try {
      if (!Notification.isSupported()) {
        console.log(`[Notification Fallback] ${title}: ${body}`);
        return false;
      }

      const notif = new Notification({
        title,
        body,
        silent: false,
      });

      if (onClick) {
        notif.on('click', onClick);
      }

      notif.show();
      return true;
    } catch (err) {
      console.error('[NotificationService] Failed to show notification:', err);
      return false;
    }
  }
}
