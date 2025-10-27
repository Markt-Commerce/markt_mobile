export interface NotificationCount{
    count: number;
}
export interface NotificationResponse {
  pagination: {
    total_pages: number;
    per_page: number;
    page: number;
    total_items: number;
  };
  items: NotificationItem[];
}

export interface NotificationItem {
  message: string;
  id: number;
  reference_id: string;
  created_at: string; // ISO date string
  is_read: boolean;
  reference_type: string;
  type: string;
  title: string;
  metadata_: Record<string, string>; // flexible key-value structure
}
