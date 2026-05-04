export interface Profile {
  id: string;
  role: 'owner' | 'employee';
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  owner_name: string;
  owner_email: string;
  owner_id: string | null;
  created_at: string;
}

export interface Employee {
  id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  status: 'active' | 'sick';
  user_id: string | null;
  email: string | null;
  hourly_wage: number | null;
  created_at: string;
}

export interface Property {
  id: string;
  company_id: string;
  name: string;
  address: string;
  type: 'office' | 'school' | 'supermarket' | 'doctor' | 'other';
  cleaning_days: string[];
  time_from: string;
  time_to: string;
  created_at: string;
}

export interface EmployeeProperty {
  id: string;
  employee_id: string;
  property_id: string;
}

export interface Assignment {
  id: string;
  property_id: string;
  employee_id: string;
  date: string;
  status: 'assigned' | 'checked_in' | 'completed' | 'cancelled';
  created_at: string;
  checked_in_at?: string | null;
  completed_at?: string | null;
}

export interface SickReport {
  id: string;
  employee_id: string;
  date: string;
  reason: string;
  created_at: string;
}

export interface ReplacementRequest {
  id: string;
  sick_report_id: string;
  property_id: string;
  replacement_employee_id: string;
  status: 'pending' | 'accepted' | 'declined';
  message: string;
  channel: 'whatsapp' | 'sms' | 'app';
  created_at: string;
}

export interface EmployeeWithDetails extends Employee {
  known_properties: Property[];
}

export interface AssignmentWithDetails extends Assignment {
  property: Property;
  employee: Employee;
}

export interface SickReportWithDetails extends SickReport {
  employee: Employee;
  assignments: AssignmentWithDetails[];
}

export interface Notification {
  id: string;
  employee_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}
