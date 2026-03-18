import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react';
import type { TerritoryType, UserStatus, DeviceType, DeviceStatus } from '../lib/database.types';

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export default function ImportData() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  }

  async function handleImport() {
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        setResult({ success: 0, failed: 0, errors: ['No data found in CSV file'] });
        return;
      }

      const results = await processRows(rows);
      setResult(results);

      await supabase.from('import_history').insert({
        filename: file.name,
        rows_processed: rows.length,
        rows_success: results.success,
        rows_failed: results.failed,
        imported_by: 'System User',
        import_data: { errors: results.errors },
      });
    } catch (error) {
      console.error('Import error:', error);
      setResult({
        success: 0,
        failed: 0,
        errors: ['Failed to import CSV file: ' + (error as Error).message],
      });
    } finally {
      setImporting(false);
    }
  }

  function parseCSV(text: string): Record<string, string>[] {
    const lines = text.split('\n').filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim());
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }

    return rows;
  }

  async function processRows(rows: Record<string, string>[]): Promise<ImportResult> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        if (row['Name'] && row['Login Email']) {
          const userData = {
            name: row['Name'],
            login_email: row['Login Email'],
            title: row['Title'] || '',
            department: row['Dept'] || row['Department'] || '',
            territory: (row['Territory'] || row['Territory/Group'] || null) as TerritoryType | null,
            core_id: row['Core ID'] || '',
            status: (row['Status'] || 'active') as UserStatus,
          };

          const { data: existingUser } = await supabase
            .from('users_directory')
            .select('id')
            .eq('login_email', userData.login_email)
            .maybeSingle();

          let userId: string;

          if (existingUser) {
            const { error } = await supabase
              .from('users_directory')
              .update(userData)
              .eq('id', existingUser.id);

            if (error) throw error;
            userId = existingUser.id;
          } else {
            const { data: newUser, error } = await supabase
              .from('users_directory')
              .insert(userData)
              .select('id')
              .single();

            if (error) throw error;
            userId = newUser.id;

            const { data: templates } = await supabase
              .from('provisioning_task_templates')
              .select('*')
              .order('task_order');

            if (templates && templates.length > 0) {
              const tasks = templates.map((template) => ({
                user_id: userId,
                task_name: template.task_name,
                task_order: template.task_order,
                completed: false,
              }));

              await supabase.from('provisioning_tasks').insert(tasks);
            }
          }

          if (row['VESTA NXT Login'] || row['Radio Next Login'] || row['Phone Extension']) {
            const configData = {
              user_id: userId,
              vesta_nxt_login: row['VESTA NXT Login'] || '',
              radio_next_login: row['Radio Next Login'] || '',
              radio_n70_login: row['Radio N70 Login'] || '',
              rapid_deploy_login: row['Rapid Deploy Login'] || '',
              phone_extension: row['Phone Extension'] || '',
            };

            const { data: existingConfig } = await supabase
              .from('account_configs')
              .select('id')
              .eq('user_id', userId)
              .maybeSingle();

            if (existingConfig) {
              await supabase.from('account_configs').update(configData).eq('id', existingConfig.id);
            } else {
              await supabase.from('account_configs').insert(configData);
            }
          }

          success++;
        } else if (row['Serial Number'] && row['Device Type']) {
          const deviceData = {
            device_type: row['Device Type'] as DeviceType,
            serial_number: row['Serial Number'],
            device_id: row['Device ID'] || '',
            status: (row['Device Status'] || 'available') as DeviceStatus,
            notes: row['Notes'] || '',
          };

          const { data: existing } = await supabase
            .from('devices')
            .select('id')
            .eq('serial_number', deviceData.serial_number)
            .maybeSingle();

          if (existing) {
            await supabase.from('devices').update(deviceData).eq('id', existing.id);
          } else {
            await supabase.from('devices').insert(deviceData);
          }

          success++;
        } else {
          failed++;
          errors.push(`Row ${i + 1}: Missing required fields`);
        }
      } catch (error) {
        failed++;
        errors.push(`Row ${i + 1}: ${(error as Error).message}`);
      }
    }

    return { success, failed, errors };
  }

  function downloadTemplate() {
    const template = `Name,Login Email,Title,Dept,Territory,Core ID,Status,VESTA NXT Login,Radio Next Login,Radio N70 Login,Rapid Deploy Login,Phone Extension
John Doe,john.doe@example.com,Engineer,Engineering,Central,12345,active,jdoe_vesta,jdoe_radio,jdoe_n70,jdoe_rapid,x1001
Device Row,,,,,,,,,,,
,,,,,,,,,Serial Number,Device Type,Device ID,Device Status,Notes
,,,,,,,,,SN123456,APX_NEXT,DEV001,available,New device`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'asset_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Import Data</h1>
        <p className="text-slate-600 mt-1">Upload CSV files to bulk-update inventory and user data</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-slate-900">Upload CSV File</h2>
          </div>

          <div className="mb-6">
            <label className="block border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                disabled={importing}
              />
              <FileText className="mx-auto text-slate-400 mb-2" size={48} />
              <p className="text-slate-600 font-medium">
                {file ? file.name : 'Click to select CSV file'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {file ? `${(file.size / 1024).toFixed(2)} KB` : 'or drag and drop'}
              </p>
            </label>
          </div>

          <button
            onClick={handleImport}
            disabled={!file || importing}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            {importing ? 'Importing...' : 'Import Data'}
          </button>

          {result && (
            <div className="mt-6 p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {result.failed === 0 ? (
                  <CheckCircle className="text-green-600" size={24} />
                ) : (
                  <AlertCircle className="text-amber-600" size={24} />
                )}
                <h3 className="font-bold text-slate-900">Import Results</h3>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-green-600">Successfully imported: {result.success}</p>
                <p className="text-red-600">Failed: {result.failed}</p>
              </div>
              {result.errors.length > 0 && (
                <div className="mt-3 p-3 bg-red-50 rounded">
                  <p className="text-xs font-medium text-red-800 mb-1">Errors:</p>
                  <div className="text-xs text-red-700 space-y-1 max-h-32 overflow-y-auto">
                    {result.errors.map((error, i) => (
                      <p key={i}>{error}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="text-green-600" size={24} />
            <h2 className="text-xl font-bold text-slate-900">CSV Format Guide</h2>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-medium text-slate-900 mb-2">User Data Columns:</h3>
              <ul className="list-disc list-inside text-slate-600 space-y-1">
                <li>Name (required)</li>
                <li>Login Email (required)</li>
                <li>Title</li>
                <li>Dept / Department</li>
                <li>Territory / Territory/Group</li>
                <li>Core ID</li>
                <li>Status</li>
                <li>VESTA NXT Login</li>
                <li>Radio Next Login</li>
                <li>Radio N70 Login</li>
                <li>Rapid Deploy Login</li>
                <li>Phone Extension</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium text-slate-900 mb-2">Device Data Columns:</h3>
              <ul className="list-disc list-inside text-slate-600 space-y-1">
                <li>Serial Number (required)</li>
                <li>Device Type (required: APX_NEXT, N70, V700, SVX)</li>
                <li>Device ID</li>
                <li>Device Status (available, assigned, retired, maintenance)</li>
                <li>Notes</li>
              </ul>
            </div>

            <div className="pt-4 border-t">
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                <Download size={18} />
                Download Template CSV
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
