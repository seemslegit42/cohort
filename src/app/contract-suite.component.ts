import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface ContractTemplate {
  id: string;
  title: string;
  description: string;
  collaborators: number;
}

@Component({
  selector: 'app-contract-suite',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="mt-8 space-y-6 animate-fade-in" style="animation-delay: 200ms;">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
           <mat-icon class="text-zinc-500">folder_shared</mat-icon>
           <h2 class="text-lg font-bold text-white font-display tracking-tight">Your Contacts / Contractual Suite</h2>
        </div>
        
        <div class="relative w-full sm:w-64 hidden sm:block">
          <mat-icon class="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-[18px]">search</mat-icon>
          <input type="text" placeholder="Search" class="w-full bg-zinc-900/40 border border-zinc-800 rounded-lg py-1.5 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition-all shadow-inner" />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-5">
        @for (template of templates(); track template.id) {
          <div class="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-5 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all group shadow-sm">
            <div class="flex justify-between items-start mb-4">
              <!-- Folder icon container -->
              <div class="w-10 h-10 bg-zinc-800/50 rounded-xl flex items-center justify-center border border-zinc-700/50 shadow-inner group-hover:border-zinc-600 transition-colors">
                <mat-icon class="text-zinc-400">folder</mat-icon>
              </div>
              
              <!-- Collaborators avatars -->
              <div class="flex -space-x-2">
                 <div class="w-6 h-6 rounded-full bg-zinc-800 border-2 border-zinc-900 z-30 overflow-hidden flex justify-center items-center text-[10px] text-zinc-400 font-bold tracking-tighter">{{ template.collaborators }}+</div>
                 <img src="https://api.dicebear.com/7.x/notionists/svg?seed=A1&backgroundColor=fcd34d" class="w-6 h-6 rounded-full border-2 border-zinc-900 z-20" alt="Collaborator face yellow" />
                 <img src="https://api.dicebear.com/7.x/notionists/svg?seed=B2&backgroundColor=67e8f9" class="w-6 h-6 rounded-full border-2 border-zinc-900 z-10" alt="Collaborator face blue" />
              </div>
            </div>
            
            <h4 class="text-white font-semibold text-sm mb-1 tracking-tight">{{ template.title }}</h4>
            <p class="text-[13px] text-zinc-500 mb-5 line-clamp-2 leading-relaxed min-h-[40px]">{{ template.description }}</p>
            
            <div class="flex gap-2">
              <button class="flex-1 bg-zinc-950/50 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm">
                <mat-icon class="text-[16px]">share</mat-icon> Share
              </button>
              <button class="flex-1 bg-zinc-950/50 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-lg py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm">
                <mat-icon class="text-[16px]">edit</mat-icon> Edit
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class ContractSuiteComponent {
  templates = signal<ContractTemplate[]>([
    {
      id: '1',
      title: 'NDA Agreement',
      description: 'To make sure our data is secure when we build',
      collaborators: 240
    },
    {
      id: '2',
      title: 'Service Level Agreement',
      description: 'Defines the expected level of service performance',
      collaborators: 50
    },
    {
      id: '3',
      title: 'User Onboarding Guide',
      description: 'A comprehensive guide to help new users start',
      collaborators: 89
    },
    {
      id: '4',
      title: 'Privacy Policy',
      description: 'Details on how we handle user data and privacy',
      collaborators: 12
    }
  ]);
}
