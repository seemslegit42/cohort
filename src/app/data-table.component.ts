import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface Transaction {
  id: string;
  name: string;
  email: string;
  amount: string;
  date: string;
  status: 'Paid' | 'Pending' | 'Failed';
  avatar: string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-2xl overflow-hidden shadow-lg shadow-black/20">
      <!-- Toolbar -->
      <div class="p-5 border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="relative w-full sm:w-72">
          <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-[18px]">search</mat-icon>
          <input type="text" placeholder="Search a name..." class="w-full bg-zinc-950/60 border border-zinc-800 rounded-lg py-2 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all shadow-inner" />
        </div>
        <div class="flex items-center gap-3">
          <button class="flex items-center gap-2 bg-zinc-950/40 hover:bg-zinc-800 px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-300 transition-colors border border-zinc-800">
            <mat-icon class="text-[16px] text-zinc-400">calendar_month</mat-icon>
            Signup Date
          </button>
          <button class="flex items-center gap-2 bg-zinc-950/40 hover:bg-zinc-800 px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-300 transition-colors border border-zinc-800">
            <mat-icon class="text-[16px] text-zinc-400">filter_alt</mat-icon>
            Status
          </button>
          <button class="flex items-center gap-2 bg-zinc-950/40 hover:bg-zinc-800 px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-300 transition-colors border border-zinc-800 hidden md:flex">
            <mat-icon class="text-[16px] text-zinc-400">account_tree</mat-icon>
            Source
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-zinc-400 border-collapse cursor-default">
          <thead class="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider bg-zinc-950/30 border-b border-zinc-800/80">
            <tr>
              <th scope="col" class="px-6 py-4">Customer Name</th>
              <th scope="col" class="px-6 py-4">Email Address</th>
              <th scope="col" class="px-6 py-4">Signup Date</th>
              <th scope="col" class="px-6 py-4">Amount</th>
              <th scope="col" class="px-6 py-4">Status</th>
              <th scope="col" class="px-6 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-800/50">
            @for (tx of transactions(); track tx.id) {
              <tr class="hover:bg-zinc-800/40 transition-colors group">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-3">
                    <img [src]="tx.avatar" alt="" class="w-8 h-8 rounded-full bg-zinc-800 object-cover border border-zinc-700 group-hover:border-teal-500/50 transition-colors" />
                    <span class="font-medium text-zinc-200 group-hover:text-white transition-colors">{{ tx.name }}</span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-zinc-400">{{ tx.email }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-zinc-400">{{ tx.date }}</td>
                <td class="px-6 py-4 font-medium text-zinc-200 whitespace-nowrap">{{ tx.amount }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span [ngClass]="{
                    'text-teal-400 bg-teal-500/10 border-teal-500/20': tx.status === 'Paid',
                    'text-amber-400 bg-amber-500/10 border-amber-500/20': tx.status === 'Pending',
                    'text-rose-400 bg-rose-500/10 border-rose-500/20': tx.status === 'Failed'
                  }" class="px-2.5 py-1 text-xs font-semibold rounded-md border flex items-center w-fit gap-1.5 shadow-sm">
                    <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                    {{ tx.status }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right whitespace-nowrap">
                  <button class="text-zinc-600 hover:text-white transition-colors p-1 rounded-md hover:bg-zinc-800 opacity-0 group-hover:opacity-100 focus:opacity-100">
                    <mat-icon class="text-[20px]">edit</mat-icon>
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class DataTableComponent {
  transactions = signal<Transaction[]>([
    { id: '1', name: 'Lily-Rose Chedjou', email: 'lilyrose@gmail.com', amount: '$100.14', date: 'Jan 16, 2025', status: 'Paid', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Lily&backgroundColor=14b8a6' },
    { id: '2', name: 'Caitlyn King', email: 'hi@caitlynking.com', amount: '$96.32', date: 'Jan 15, 2025', status: 'Paid', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Caitlyn&backgroundColor=3b82f6' },
    { id: '3', name: 'Ahmed Ali', email: 'ahmed.ali@example.com', amount: '$1,250.00', date: 'Jan 14, 2025', status: 'Pending', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Ahmed&backgroundColor=8b5cf6' },
    { id: '4', name: 'Sarah Jenkins', email: 'sarah.j@company.co', amount: '$45.00', date: 'Jan 12, 2025', status: 'Failed', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sarah&backgroundColor=ef4444' },
    { id: '5', name: 'Marcus Chen', email: 'm.chen@studio.design', amount: '$340.50', date: 'Jan 10, 2025', status: 'Paid', avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=Marcus&backgroundColor=10b981' }
  ]);
}
