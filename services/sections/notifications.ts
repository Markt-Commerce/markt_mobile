import { request, BASE_URL } from "../api";
import { ApiResponse } from "../../models/auth";
import { NotificationCount, NotificationResponse } from "../../models/notifications";

// Fetch products
export async function getNotifications(page = 1, perPage = 10): Promise<NotificationResponse> {
  const res = await request<NotificationResponse>(
    `${BASE_URL}/notifications?page=${page}&per_page=${perPage}`,
    { method: "GET" }
  );
  return res;
}

export async function getUnreadNotificationCount(): Promise<NotificationCount> {
    const res = await request<NotificationCount>(
    `${BASE_URL}/notifications/unread/count`,
    { method: "GET" }
  );
  return res;
}

export async function markAllAsRead(notificationIds:{ notification_ids:number[]}): Promise<NotificationCount> {
    const res = await request<NotificationCount>(
    `${BASE_URL}/notifications/mark-read`,{
        method: "POST", 
        body: JSON.stringify(notificationIds) 
    }
  );
  return res;
}