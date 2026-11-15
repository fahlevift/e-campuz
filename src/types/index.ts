export type Role = 'mahasiswa' | 'dosen';

export interface User {
  id: string;
  role: Role;
  name: string;
  nimNip: string;
  prodi: string;
  classId?: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
  faculty?: string;
  semester?: number;
  cohortYear?: number;
  isClassLeader?: boolean;
  className?: string;
  homeroomLecturerName?: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  sks: number;
  lecturerIds: string[];
  classId: string;
  semester: string;
  description?: string;
  rpsUrl?: string;
  className?: string;
  lecturerNames?: string[];
  currentMeeting?: number;
  totalMeetings?: number;
  unreadMaterialCount?: number;
  activeAssignmentCount?: number;
}

export interface ScheduleChange {
  id: string;
  field: 'time' | 'room' | 'day' | 'cancel';
  oldValue: string;
  newValue: string;
  scope: 'once' | 'permanent';
  date?: string;
  reason?: string;
  changedBy: string;
  changedByName?: string;
  changedAt: string;
  broadcastToChat?: boolean;
}

export interface ScheduleItem {
  id: string;
  courseId: string;
  day: 1 | 2 | 3 | 4 | 5 | 6;
  startTime: string;
  endTime: string;
  room: string;
  type: 'teori' | 'praktikum' | 'online';
  onlineUrl?: string;
  status: 'normal' | 'changed' | 'cancelled';
  changes: ScheduleChange[];
  courseCode?: string;
  courseName?: string;
  courseSks?: number;
  className?: string;
  lecturerNames?: string[];
}

export interface Material {
  id: string;
  courseId: string;
  meeting: number;
  title: string;
  description?: string;
  type: 'pdf' | 'ppt' | 'doc' | 'video' | 'link';
  url: string;
  sizeBytes?: number;
  uploadedBy: string;
  uploadedByName?: string;
  uploadedAt: string;
  isRead?: boolean;
  isDownloadedOffline?: boolean;
  courseCode?: string;
  courseName?: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  attachments: string[];
  dueAt: string;
  allowLate: boolean;
  submissionType: 'file' | 'text';
  courseCode?: string;
  courseName?: string;
  submission?: Submission;
  submittedCount?: number;
  totalStudentsCount?: number;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName?: string;
  studentNim?: string;
  submittedAt: string;
  files?: string[];
  text?: string;
  notes?: string;
  status: 'submitted' | 'late' | 'graded';
  score?: number;
  feedback?: string;
  gradedAt?: string;
}

export type NotifCategory =
  | 'SCHEDULE'
  | 'ASSIGNMENT'
  | 'FINANCE'
  | 'LEARNING'
  | 'CHAT'
  | 'SUPPORT'
  | 'ANNOUNCEMENT';

export type NotifPriority = 'urgent' | 'high' | 'normal' | 'low';

export interface AppNotification {
  id: string;
  category: NotifCategory;
  type: string;
  priority: NotifPriority;
  title: string;
  body: string;
  deepLink: string;
  isRead: boolean;
  createdAt: string;
  meta?: Record<string, string>;
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  categories: Record<NotifCategory, { enabled: boolean; types: Record<string, boolean> }>;
  classReminderMinutes: 15 | 30 | 60;
  assignmentReminders: Array<'H-3' | 'H-1' | '6h'>;
  mutedCourseIdsForMaterial: string[];
  quietHours: { enabled: boolean; start: string; end: string; allowUrgent: boolean };
}

export type NavItemKey =
  | 'jadwal'
  | 'pembelajaran'
  | 'chat'
  | 'tugas'
  | 'keuangan'
  | 'layanan'
  | 'notifikasi'
  | 'profil';

export interface NavPreference {
  slots: [NavItemKey, NavItemKey, NavItemKey];
}

export interface ChatRoomMemberInfo {
  userId: string;
  name: string;
  nimNip: string;
  role: Role;
  isClassLeader?: boolean;
  isAdmin: boolean;
  avatarUrl?: string;
}

export interface ChatRoom {
  id: string;
  type: 'class' | 'course';
  name: string;
  description?: string;
  refId: string;
  adminIds: string[];
  memberIds: string[];
  pinnedMessageId?: string;
  pinnedMessage?: ChatMessage;
  lastMessage?: ChatMessage;
  unreadCount?: number;
  mutedUntil?: string | null;
  hasNewAnnouncement?: boolean;
  courseCode?: string;
  lecturerName?: string;
  members?: ChatRoomMemberInfo[];
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName?: string;
  senderRole?: Role;
  senderIsClassLeader?: boolean;
  senderIsAdmin?: boolean;
  text?: string;
  attachments?: string[];
  replyToId?: string;
  replyToPreview?: { senderName: string; text: string };
  mentions?: string[];
  isAnnouncement?: boolean;
  deleted?: boolean;
  createdAt: string;
  deliveryStatus?: 'sending' | 'sent' | 'failed';
}

export interface BillComponent {
  label: string;
  amount: number;
}

export interface Bill {
  id: string;
  semester: string;
  amount: number;
  dueDate: string;
  status: 'unpaid' | 'paid' | 'overdue' | 'installment';
  vaNumber: string;
  bankName?: string;
  components?: BillComponent[];
  invoiceCode?: string;
  receiptUrl?: string;
  paidAt?: string;
}

export type TicketStatus = 'submitted' | 'in_progress' | 'need_info' | 'resolved' | 'closed';

export type TicketCategory =
  | 'Akademik & KRS'
  | 'Nilai'
  | 'Keuangan/UKT'
  | 'Akun & IT'
  | 'Fasilitas'
  | 'Lainnya';

export interface TicketHistoryItem {
  status: TicketStatus;
  at: string;
  note?: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId?: string;
  senderRole: 'student' | 'staff';
  senderLabel: string;
  message: string;
  attachments: string[];
  createdAt: string;
}

export interface Ticket {
  id: string;
  code: string;
  kind: 'bantuan' | 'pengaduan';
  category: TicketCategory | string;
  courseId?: string;
  courseName?: string;
  title: string;
  description: string;
  attachments: string[];
  anonymous: boolean;
  status: TicketStatus;
  history: TicketHistoryItem[];
  rating?: number;
  ratingComment?: string;
  createdAt: string;
  messages?: TicketMessage[];
  reporterName?: string;
  reporterNim?: string;
}

export interface FAQItem {
  id: string;
  category: TicketCategory | string;
  question: string;
  summary: string;
  steps: string[];
  attachments: string[];
  warningNote?: string;
  isPopular: boolean;
  updatedAt: string;
}

export interface CampusAnnouncement {
  id: string;
  title: string;
  body: string;
  category: string;
  publishedBy?: string;
  publishedAt: string;
}
