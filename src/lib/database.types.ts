export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type DeviceType = 'APX_NEXT' | 'N70' | 'V700' | 'SVX';
export type DeviceStatus = 'available' | 'assigned' | 'retired' | 'maintenance';
export type UserStatus = 'active' | 'inactive' | 'provisioning' | 'pending';
export type TerritoryType = 'Central' | 'Northeast' | 'Southeast' | 'West' | 'Federal' | 'Software' | 'Video';

export interface Database {
  public: {
    Tables: {
      users_directory: {
        Row: {
          id: string;
          name: string;
          login_email: string;
          title: string;
          department: string;
          territory: TerritoryType | null;
          core_id: string;
          reports_to: string | null;
          status: UserStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          login_email: string;
          title?: string;
          department?: string;
          territory?: TerritoryType | null;
          core_id?: string;
          reports_to?: string | null;
          status?: UserStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          login_email?: string;
          title?: string;
          department?: string;
          territory?: TerritoryType | null;
          core_id?: string;
          reports_to?: string | null;
          status?: UserStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      devices: {
        Row: {
          id: string;
          user_id: string | null;
          device_type: DeviceType;
          serial_number: string;
          device_id: string;
          status: DeviceStatus;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          device_type: DeviceType;
          serial_number: string;
          device_id?: string;
          status?: DeviceStatus;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          device_type?: DeviceType;
          serial_number?: string;
          device_id?: string;
          status?: DeviceStatus;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      account_configs: {
        Row: {
          id: string;
          user_id: string;
          vesta_nxt_login: string;
          radio_next_login: string;
          radio_n70_login: string;
          rapid_deploy_login: string;
          phone_extension: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vesta_nxt_login?: string;
          radio_next_login?: string;
          radio_n70_login?: string;
          rapid_deploy_login?: string;
          phone_extension?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          vesta_nxt_login?: string;
          radio_next_login?: string;
          radio_n70_login?: string;
          rapid_deploy_login?: string;
          phone_extension?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      provisioning_tasks: {
        Row: {
          id: string;
          user_id: string;
          task_name: string;
          task_order: number;
          completed: boolean;
          completed_at: string | null;
          completed_by: string;
          notes: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          task_name: string;
          task_order?: number;
          completed?: boolean;
          completed_at?: string | null;
          completed_by?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          task_name?: string;
          task_order?: number;
          completed?: boolean;
          completed_at?: string | null;
          completed_by?: string;
          notes?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      provisioning_task_templates: {
        Row: {
          id: string;
          task_name: string;
          task_order: number;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_name: string;
          task_order: number;
          description?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_name?: string;
          task_order?: number;
          description?: string;
          created_at?: string;
        };
      };
      import_history: {
        Row: {
          id: string;
          filename: string;
          rows_processed: number;
          rows_success: number;
          rows_failed: number;
          imported_by: string;
          import_data: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          filename: string;
          rows_processed?: number;
          rows_success?: number;
          rows_failed?: number;
          imported_by?: string;
          import_data?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          filename?: string;
          rows_processed?: number;
          rows_success?: number;
          rows_failed?: number;
          imported_by?: string;
          import_data?: Json;
          created_at?: string;
        };
      };
    };
  };
}
