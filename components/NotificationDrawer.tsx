'use client';

import { Bell, Check, Trash2, Calendar, Stethoscope, FlaskConical, AlertCircle, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface NotificationItem {
  id: string;
  type: 'appointment' | 'doctor_done' | 'lab_ready' | 'system';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  actionTab?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onClear: () => void;
  onNavigate: (tab: string) => void;
}

export function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onClear,
  onNavigate,
}: Props) {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="notification-dropdown shadow-2xl">
      <div className="p-3.5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-teal-900 to-teal-800 text-white rounded-t-2xl">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-teal-300" />
          <b className="text-xs">مركز التنبيهات والإشعارات</b>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {unreadCount} جديد
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onMarkAllRead}
            className="text-[10px] text-teal-200 hover:text-white px-2 py-1 rounded transition-colors"
            title="تحديد الكل كمقروء"
          >
            تحديد الكل
          </button>
        </div>
      </div>

      <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100 bg-white">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs">
            لا توجد تنبيهات جديدة في الوقت الحالي.
          </div>
        ) : (
          notifications.map((n) => {
            const Icon =
              n.type === 'doctor_done'
                ? Stethoscope
                : n.type === 'appointment'
                ? Calendar
                : n.type === 'lab_ready'
                ? FlaskConical
                : ShieldCheck;

            const iconBg =
              n.type === 'doctor_done'
                ? 'bg-emerald-100 text-emerald-800'
                : n.type === 'appointment'
                ? 'bg-teal-100 text-teal-800'
                : n.type === 'lab_ready'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-blue-100 text-blue-800';

            return (
              <div
                key={n.id}
                onClick={() => {
                  if (n.actionTab) onNavigate(n.actionTab);
                  onClose();
                }}
                className={`p-3 text-right hover:bg-teal-50/40 transition-colors cursor-pointer flex gap-3 items-start ${
                  !n.isRead ? 'bg-teal-50/20 font-medium' : ''
                }`}
              >
                <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center mt-0.5 ${iconBg}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <b className="text-xs text-gray-900">{n.title}</b>
                    <span className="text-[10px] text-gray-400 font-mono">{n.time}</span>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-0.5 m-0 leading-relaxed">
                    {n.message}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 rounded-b-2xl">
        <button
          onClick={onClear}
          className="text-[11px] text-red-600 hover:text-red-700 flex items-center gap-1 font-bold"
        >
          <Trash2 className="w-3 h-3" /> مسح كل التنبيهات
        </button>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-[11px]">
          إغلاق
        </button>
      </div>
    </div>
  );
}
