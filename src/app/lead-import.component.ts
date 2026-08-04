import { Component, ChangeDetectionStrategy, signal, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { LeadService, Lead } from './lead.service';

@Component({
  selector: 'app-lead-import',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div class="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        <!-- Header -->
        <div class="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <h3 class="text-lg font-display font-bold text-white flex items-center gap-2">
            <mat-icon class="text-orange-400">upload_file</mat-icon> Bulk Import Leads
          </h3>
          <button (click)="closeModal.emit()" class="text-zinc-500 hover:text-white transition-colors">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          
          <!-- Step 1: Input -->
          @if (step() === 'input') {
            <div class="space-y-4 animate-fade-in">
              <div class="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
                <mat-icon class="text-blue-400">info</mat-icon>
                <div class="text-sm text-blue-200">
                  Paste your CSV data below. Include a header row. We will automatically try to map your columns to the lead fields.
                </div>
              </div>
              <textarea 
                [(ngModel)]="csvData" 
                placeholder="name,email,phone,value,status&#10;Acme Corp,info@acme.com,555-0100,50000,New"
                class="w-full h-64 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm font-mono text-zinc-300 focus:outline-none focus:border-orange-500/50 custom-scrollbar whitespace-pre text-nowrap overflow-auto"
              ></textarea>
            </div>
          }

          <!-- Step 2: Mapping -->
          @if (step() === 'mapping') {
            <div class="space-y-6 animate-fade-in">
              <div class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                <mat-icon class="text-amber-400">rule</mat-icon>
                <div class="text-sm text-amber-200">
                  Review how your CSV columns map to Lead fields. Required fields must be mapped.
                </div>
              </div>

              <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                <table class="w-full text-left">
                  <thead class="bg-zinc-900 border-b border-zinc-800">
                    <tr>
                      <th class="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">CSV Column</th>
                      <th class="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Sample Data</th>
                      <th class="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Lead Field</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-zinc-800/50">
                    @for (col of parsedHeaders(); track col; let i = $index) {
                      <tr>
                        <td class="px-4 py-3 text-sm font-mono text-zinc-300 font-bold">{{ col }}</td>
                        <td class="px-4 py-3 text-sm text-zinc-500 truncate max-w-[200px]">{{ parsedRows()[0]?.[i] || '' }}</td>
                        <td class="px-4 py-3">
                          <select 
                            [ngModel]="columnMapping()[i]" 
                            (ngModelChange)="updateMapping(i, $event)"
                            class="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-orange-500/50"
                          >
                            <option value="">-- Ignore --</option>
                            @for (field of availableFields; track field.key) {
                              <option [value]="field.key">{{ field.label }} {{ field.required ? '*' : '' }}</option>
                            }
                          </select>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Validation Errors -->
              @if (mappingErrors().length > 0) {
                <div class="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 space-y-2">
                  <div class="text-sm font-bold text-rose-400 flex items-center gap-2">
                    <mat-icon class="text-[18px]">error</mat-icon> Mapping Errors
                  </div>
                  <ul class="list-disc pl-5 text-sm text-rose-300 space-y-1">
                    @for (err of mappingErrors(); track err) {
                      <li>{{ err }}</li>
                    }
                  </ul>
                </div>
              }
            </div>
          }

          <!-- Step 3: Review & Import -->
          @if (step() === 'review') {
            <div class="space-y-6 animate-fade-in">
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                  <div class="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-1">Valid Leads</div>
                  <div class="text-3xl font-display font-bold text-emerald-400">{{ validLeads().length }}</div>
                </div>
                <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                  <div class="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-1">Invalid Rows</div>
                  <div class="text-3xl font-display font-bold text-rose-400">{{ invalidRows().length }}</div>
                </div>
              </div>

              @if (invalidRows().length > 0) {
                <div class="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
                  <h4 class="text-sm font-bold text-rose-400 mb-2">Rows with errors (will be skipped):</h4>
                  <div class="max-h-32 overflow-y-auto custom-scrollbar space-y-2">
                    @for (row of invalidRows(); track $index) {
                      <div class="text-xs text-rose-300 border-l-2 border-rose-500/30 pl-2">
                        Row {{ row.index + 2 }}: {{ row.error }}
                      </div>
                    }
                  </div>
                </div>
              }

              <div class="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden max-h-64 overflow-y-auto custom-scrollbar">
                <table class="w-full text-left">
                  <thead class="bg-zinc-900 border-b border-zinc-800 sticky top-0">
                    <tr>
                      <th class="px-4 py-2 text-xs font-semibold text-zinc-400">Name</th>
                      <th class="px-4 py-2 text-xs font-semibold text-zinc-400">Email</th>
                      <th class="px-4 py-2 text-xs font-semibold text-zinc-400">Status</th>
                      <th class="px-4 py-2 text-xs font-semibold text-zinc-400">Value</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-zinc-800/50">
                    @for (lead of validLeads().slice(0, 50); track $index) {
                      <tr>
                        <td class="px-4 py-2 text-sm text-zinc-300 truncate max-w-[150px]">{{ lead.name }}</td>
                        <td class="px-4 py-2 text-sm text-zinc-500 truncate max-w-[150px]">{{ lead.email }}</td>
                        <td class="px-4 py-2 text-sm text-zinc-300">{{ lead.status }}</td>
                        <td class="px-4 py-2 text-sm text-orange-400 font-mono">{{ lead.value | currency:'USD':'symbol':'1.0-0' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
                @if (validLeads().length > 50) {
                  <div class="p-2 text-center text-xs text-zinc-500 bg-zinc-900/80">Showing first 50 of {{ validLeads().length }} leads</div>
                }
              </div>
            </div>
          }
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <div>
            @if (step() === 'mapping') {
              <button (click)="step.set('input')" class="text-zinc-400 hover:text-white px-4 py-2 rounded-xl text-sm transition-colors">Back</button>
            } @else if (step() === 'review') {
              <button (click)="step.set('mapping')" class="text-zinc-400 hover:text-white px-4 py-2 rounded-xl text-sm transition-colors">Back</button>
            }
          </div>
          <div class="flex gap-3">
            <button (click)="closeModal.emit()" class="text-zinc-400 hover:text-white px-4 py-2 rounded-xl text-sm transition-colors">Cancel</button>
            
            @if (step() === 'input') {
              <button 
                (click)="parseCSV()" 
                [disabled]="!csvData().trim()"
                class="bg-orange-500 hover:bg-orange-400 text-zinc-950 disabled:opacity-50 font-bold px-6 py-2 rounded-xl text-sm transition-colors shadow-[0_0_15px_rgba(249,115,22,0.2)]"
              >
                Next: Map Fields
              </button>
            } @else if (step() === 'mapping') {
              <button 
                (click)="validateMapping()"
                class="bg-orange-500 hover:bg-orange-400 text-zinc-950 font-bold px-6 py-2 rounded-xl text-sm transition-colors shadow-[0_0_15px_rgba(249,115,22,0.2)]"
              >
                Next: Review
              </button>
            } @else if (step() === 'review') {
              <button 
                (click)="importLeads()"
                [disabled]="isImporting() || validLeads().length === 0"
                class="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 disabled:opacity-50 font-bold px-6 py-2 rounded-xl text-sm transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center gap-2"
              >
                @if (isImporting()) {
                  <mat-icon class="animate-spin text-[18px]">refresh</mat-icon> Importing...
                } @else {
                  <mat-icon class="text-[18px]">check_circle</mat-icon> Import {{ validLeads().length }} Leads
                }
              </button>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class LeadImportComponent {
  leadService = inject(LeadService);
  closeModal = output<void>();
  imported = output<void>();

  step = signal<'input' | 'mapping' | 'review'>('input');
  csvData = signal<string>('');
  
  parsedHeaders = signal<string[]>([]);
  parsedRows = signal<string[][]>([]);
  
  columnMapping = signal<string[]>([]);
  mappingErrors = signal<string[]>([]);
  
  validLeads = signal<Partial<Lead>[]>([]);
  invalidRows = signal<{index: number, error: string}[]>([]);
  
  isImporting = signal<boolean>(false);

  availableFields = [
    { key: 'name', label: 'Name', required: true },
    { key: 'email', label: 'Email', required: true },
    { key: 'phone', label: 'Phone', required: false },
    { key: 'source', label: 'Source', required: false },
    { key: 'status', label: 'Status', required: false },
    { key: 'value', label: 'Value (USD)', required: false },
    { key: 'industry', label: 'Industry', required: false },
    { key: 'region', label: 'Region', required: false },
    { key: 'companySize', label: 'Company Size', required: false },
    { key: 'priority', label: 'Priority', required: false }
  ];

  parseCSV() {
    const data = this.csvData().trim();
    if (!data) return;

    // Simple CSV parser (doesn't handle complex quoting well, but fine for basic import)
    const lines = data.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) {
      alert('Please provide at least a header row and one data row.');
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const rows = lines.slice(1).map(line => line.split(',').map(c => c.trim().replace(/^["']|["']$/g, '')));

    this.parsedHeaders.set(headers);
    this.parsedRows.set(rows);

    // Auto-map based on similar names
    const initialMapping = headers.map(header => {
      const hLower = header.toLowerCase();
      const match = this.availableFields.find(f => 
        hLower === f.key.toLowerCase() || 
        hLower.includes(f.key.toLowerCase()) || 
        f.label.toLowerCase().includes(hLower)
      );
      return match ? match.key : '';
    });
    this.columnMapping.set(initialMapping);

    this.step.set('mapping');
  }

  updateMapping(index: number, field: string) {
    const newMapping = [...this.columnMapping()];
    newMapping[index] = field;
    this.columnMapping.set(newMapping);
  }

  validateMapping() {
    const mapping = this.columnMapping();
    const errors: string[] = [];

    // Check required fields
    const mappedFields = new Set(mapping.filter(m => m !== ''));
    
    for (const field of this.availableFields) {
      if (field.required && !mappedFields.has(field.key)) {
        errors.push(`Required field "${field.label}" is not mapped.`);
      }
    }

    this.mappingErrors.set(errors);

    if (errors.length === 0) {
      this.processData();
      this.step.set('review');
    }
  }

  processData() {
    const rows = this.parsedRows();
    const mapping = this.columnMapping();
    
    const valid: Partial<Lead>[] = [];
    const invalid: {index: number, error: string}[] = [];

    rows.forEach((row, rowIndex) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const leadData: any = {};
      let hasError = false;
      let errorMsg = '';

      mapping.forEach((fieldKey, colIndex) => {
        if (!fieldKey) return;
        
        const value = row[colIndex] || '';
        
        if (fieldKey === 'name' && !value) {
          hasError = true;
          errorMsg = 'Name is required';
        } else if (fieldKey === 'email' && !value) {
          hasError = true;
          errorMsg = 'Email is required';
        }
        
        if (fieldKey === 'value') {
          const num = parseFloat(value.replace(/[^0-9.-]+/g,""));
          leadData[fieldKey] = isNaN(num) ? 0 : num;
        } else {
          leadData[fieldKey] = value;
        }
      });

      if (hasError) {
        invalid.push({ index: rowIndex, error: errorMsg });
      } else {
        // Set defaults for optional fields if missing
        if (!leadData.status) leadData.status = 'New';
        if (!leadData.source) leadData.source = 'Imported';
        if (!leadData.value) leadData.value = 0;
        
        valid.push(leadData);
      }
    });

    this.validLeads.set(valid);
    this.invalidRows.set(invalid);
  }

  importLeads() {
    const leads = this.validLeads();
    if (leads.length === 0) return;

    this.isImporting.set(true);

    // In a real app, this would be a bulk endpoint.
    // For now, we simulate a bulk add.
    setTimeout(() => {
      // Create leads
      leads.forEach(l => {
        this.leadService.createLead(l as Omit<Lead, '$id'> as Lead);
      });
      
      this.isImporting.set(false);
      this.imported.emit();
    }, 1500);
  }
}
