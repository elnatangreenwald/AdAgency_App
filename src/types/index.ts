/**
 * Central TypeScript type definitions
 * All shared interfaces for the application
 */

// ============ Task Types ============
export interface Task {
  id: string;
  task_number?: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  due_date?: string;
  deadline?: string;
  assigned_user?: string | string[];
  assignee?: string;
  created_by?: string;  // NEW: Track who created the task
  note?: string;
  notes?: string;
  manager_note?: string;
  is_recurring?: boolean;
  created_at?: string;
  created_date?: string;
  updated_at?: string;
  estimated_hours?: number;
  dependencies?: string[];
}

export type TaskStatus = 'לביצוע' | 'בתהליך' | 'הושלם' | 'ממתין';
export type TaskPriority = 'נמוכה' | 'רגילה' | 'גבוהה' | 'דחוף';

// ============ Project Types ============
export interface Project {
  id: string;
  project_number?: string;
  name?: string;
  title?: string;
  description?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  tasks: Task[];
  is_shared?: boolean;
  created_by?: string;
  created_at?: string;
}

// ============ Charge Types ============
export interface Charge {
  id: string;
  charge_number?: string;
  title?: string;
  description?: string;
  amount: number;
  our_cost?: number;
  date: string;
  paid?: boolean;
  completed?: boolean;
  notes?: string;
  created_at?: string;
}

// ============ Contact Types ============
export interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role?: string;
  notes?: string;
}

// ============ Document Types ============
export interface Document {
  id: string;
  display_name?: string;
  original_name?: string;
  filename?: string;
  file_path?: string;
  upload_date?: string;
  uploaded_at?: string;
}

// ============ Activity Types ============
export interface Activity {
  id: string;
  activity_type: string;
  title?: string;
  content?: string;
  duration?: string;
  participants?: string;
  follow_up_required?: boolean;
  follow_up_date?: string;
  timestamp: string;
  user_id: string;
}

export type ActivityType = 'שיחה' | 'פגישה' | 'מייל' | 'הערה' | 'אחר';

// ============ Client Types ============
export interface Client {
  id: string;
  client_number?: string;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  logo_url?: string;
  retainer: number;
  projects: Project[];
  extra_charges: Charge[];
  contacts: Contact[];
  documents: Document[];
  activities?: Activity[];
  assigned_user?: string | string[];
  assigned_user_names?: string[];
  active?: boolean;
  archived?: boolean;
  created_at?: string;
}

// ============ User Types ============
export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  hourly_rate?: number;
  created_at?: string;
  updated_at?: string;
}

export type UserRole = 'עובד' | 'מנהל' | 'אדמין';

// ============ Event Types ============
export interface EventItem {
  id: string;
  name: string;
  date: string;
  time?: string;
  location?: string;
  client?: string;
  description?: string;
  event_type?: string;
  guests_count?: number;
  budget?: number;
  assigned_users?: string[];
  checklist?: ChecklistItem[];
  suppliers?: EventSupplier[];
  equipment?: EquipmentItem[];
  charges?: Charge[];
  active?: boolean;
  created_at?: string;
  created_by?: string;
}

export interface ChecklistItem {
  text: string;
  done: boolean;
}

export interface EventSupplier {
  supplier_id?: string;
  supplier_name: string;
  service?: string;
  cost?: number;
  notes?: string;
  confirmed?: boolean;
}

export interface EquipmentItem {
  name: string;
  quantity?: number;
  notes?: string;
}

// ============ Supplier Types ============
export interface Supplier {
  id: string;
  name: string;
  category?: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  rating?: number;
  files?: SupplierFile[];
  supplier_notes?: SupplierNote[];
  created_at?: string;
}

export interface SupplierFile {
  id: string;
  original_name: string;
  filename: string;
  uploaded_at?: string;
}

export interface SupplierNote {
  id: string;
  text: string;
  created_by: string;
  created_at: string;
}

// ============ Quote Types ============
export interface Quote {
  id: string;
  title: string;
  supplier_id?: string;
  supplier_name?: string;
  client?: string;
  amount: number;
  status: QuoteStatus;
  valid_until?: string;
  description?: string;
  notes?: string;
  created_by?: string;
  created_at?: string;
}

export type QuoteStatus = 'ממתין' | 'אושר' | 'נדחה' | 'פג תוקף';

// ============ Notification Types ============
export interface Notification {
  id: string;
  user_id: string;
  type: 'task_assigned' | 'task_updated' | 'task_completed' | 'general';
  task_id?: string;
  client_id?: string;
  project_id?: string;
  from_user_id?: string;
  from_user_name?: string;
  task_title?: string;
  client_name?: string;
  message: string;
  created_at: string;
  read: boolean;
  read_at?: string;
}

// ============ Message/Chat Types ============
export interface Message {
  id: string;
  sender: string;
  recipient: string;
  content: string;
  timestamp: string;
  read: boolean;
  file?: {
    original_name: string;
    filename: string;
  };
}

export interface Conversation {
  user_id: string;
  user_name: string;
  last_message: Message;
  unread_count: number;
}

// ============ Time Tracking Types ============
export interface TimeEntry {
  id: string;
  user_id: string;
  user_name?: string;
  client_id: string;
  client_name: string;
  project_id?: string;
  project_name?: string;
  task_id?: string;
  task_title?: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  notes?: string;
  created_at?: string;
}

export interface ActiveSession {
  client_id: string;
  client_name: string;
  project_id?: string;
  project_name?: string;
  task_id?: string;
  task_title?: string;
  start_time: string;
}

// ============ Form Types ============
export interface Form {
  id: string;
  token: string;
  title: string;
  description?: string;
  client_id?: string;
  fields: FormField[];
  submissions?: FormSubmission[];
  active: boolean;
  created_by?: string;
  created_at?: string;
}

export interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'file' | 'date';
  label: string;
  required?: boolean;
  options?: string[];
}

export interface FormSubmission {
  id: string;
  submitted_at: string;
  data: Record<string, unknown>;
  files?: Document[];
}

// ============ API Response Types ============
export interface ApiResponse<T = unknown> {
  success: boolean;
  error?: string;
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  per_page: number;
}

// ============ Utility Types ============
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: string;
  direction: SortDirection;
}

export interface FilterConfig {
  field: string;
  value: string | string[] | boolean | number;
  operator?: 'eq' | 'ne' | 'gt' | 'lt' | 'contains' | 'in';
}
