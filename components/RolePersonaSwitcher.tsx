'use client';

import { ShieldCheck, Building2, UserCheck, Stethoscope } from 'lucide-react';

export type UserRole = 'admin' | 'branch_manager' | 'reception' | 'doctor' | 'laboratory' | 'radiology' | 'accounting';

export interface Persona {
  id: string;
  role: UserRole;
  name: string;
  title: string;
  branchId: string;
  branchName: string;
  specialty?: string;
  icon: typeof ShieldCheck;
}

export const defaultPersonas: Persona[] = [
  {
    id: 'admin',
    role: 'admin',
    name: 'باشمهندس عمرو',
    title: 'المالك وصاحب المنشأة (Owner)',
    branchId: 'all',
    branchName: 'كافة الفروع الستة (إشراف عام)',
    icon: ShieldCheck,
  },
  {
    id: 'reception-1',
    role: 'reception',
    name: 'أستاذة منّة إبراهيم',
    title: 'مسؤولة الاستقبال وتنظيم الحالات',
    branchId: 'b-hawamdia',
    branchName: 'فرع الحوامدية الرئيسي',
    icon: UserCheck,
  },
  {
    id: 'doctor-cardio',
    role: 'doctor',
    name: 'د. أحمد عادل',
    title: 'استشاري القلب والقسطرة',
    branchId: 'b-hawamdia',
    branchName: 'فرع الحوامدية الرئيسي',
    specialty: 'القلب والأوعية الدموية',
    icon: Stethoscope,
  },
  {
    id: 'bm-hawamdia',
    role: 'branch_manager',
    name: 'د. طارق الجيزاوي',
    title: 'مدير فرع الحوامدية الرئيسي',
    branchId: 'b-hawamdia',
    branchName: 'فرع الحوامدية الرئيسي',
    icon: Building2,
  },
  {
    id: 'bm-badrasheen',
    role: 'branch_manager',
    name: 'د. أشرف عبد السلام',
    title: 'مدير فرع البدرشين',
    branchId: 'b-badrasheen',
    branchName: 'فرع البدرشين',
    icon: Building2,
  },
];

interface Props {
  activePersona: Persona;
  onSelectPersona: (p: Persona) => void;
}

export function RolePersonaSwitcher({ activePersona, onSelectPersona }: Props) {
  return (
    <div className="role-persona-bar">
      <span className="label">
        <ShieldCheck className="w-4 h-4 text-teal-700" />
        مبدّل الأدوار السريع:
      </span>
      <div className="role-pill-group">
        {defaultPersonas.map((p) => {
          const Icon = p.icon;
          const isActive = activePersona.id === p.id;
          return (
            <button
              key={p.id}
              className={`role-pill ${isActive ? 'active' : ''}`}
              onClick={() => onSelectPersona(p)}
              title={`${p.name} - ${p.title}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{p.title.split(' ')[0]} {p.title.split(' ')[1] || ''}: {p.name.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
      <div className="branch-scope-badge">
        <Building2 className="w-3.5 h-3.5" />
        <span>النطاق: <b>{activePersona.branchName}</b></span>
      </div>
    </div>
  );
}
