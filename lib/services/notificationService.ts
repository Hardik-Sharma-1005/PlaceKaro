import { ref, push, set, get, query, orderByChild, equalTo, update } from "firebase/database";
import { database } from "../firebase/database";
import { Notification, NotificationType } from "../../types/database";

export const notificationService = {
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    relatedJobId?: string
  ): Promise<string> {
    const notificationsRef = ref(database, "notifications");
    const newNotificationRef = push(notificationsRef);
    const notificationId = newNotificationRef.key as string;

    const notification: Notification = {
      id: notificationId,
      userId,
      type,
      title,
      message,
      isRead: false,
      createdAt: Date.now(),
      ...(relatedJobId && { relatedJobId }),
    };

    await set(newNotificationRef, notification);
    return notificationId;
  },

  async getUserNotifications(userId: string): Promise<Notification[]> {
    const notificationsQuery = query(
      ref(database, "notifications"),
      orderByChild("userId"),
      equalTo(userId)
    );

    const snapshot = await get(notificationsQuery);
    if (!snapshot.exists()) {
      return [];
    }

    const data = snapshot.val() as Record<string, Notification>;
    return Object.values(data).sort((a, b) => b.createdAt - a.createdAt);
  },

  async getUnreadCount(userId: string): Promise<number> {
    const notifications = await this.getUserNotifications(userId);
    return notifications.filter(n => !n.isRead).length;
  },

  async markAsRead(notificationId: string): Promise<void> {
    const notificationRef = ref(database, `notifications/${notificationId}`);
    await update(notificationRef, { isRead: true });
  },

  async markAllAsRead(userId: string): Promise<void> {
    const notifications = await this.getUserNotifications(userId);
    const unreadNotifications = notifications.filter(n => !n.isRead);
    
    const updates: Record<string, any> = {};
    for (const notification of unreadNotifications) {
      updates[`notifications/${notification.id}/isRead`] = true;
    }
    
    if (Object.keys(updates).length > 0) {
      await update(ref(database), updates);
    }
  }
};
