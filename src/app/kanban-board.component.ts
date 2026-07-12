import { Component, ChangeDetectionStrategy, input, output, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { Lead } from './lead.service';

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DragDropModule, MatIconModule],
  template: `
    <div class="flex-1 overflow-x-auto pb-4 h-full custom-scrollbar snap-x snap-mandatory md:snap-none">
      <div cdkDropListGroup class="flex gap-4 md:gap-6 h-full min-w-max px-4 sm:px-0">
        @for (stage of stages(); track stage) {
          <div 
            cdkDropList
            [cdkDropListData]="leadsMap()[stage] || []"
            (cdkDropListDropped)="handleDrop($event, stage)"
            class="flex-shrink-0 w-[85vw] sm:w-80 snap-center flex flex-col bg-zinc-900/30 rounded-2xl border border-zinc-800/50 overflow-hidden"
          >
            <!-- Column Header -->
            <div class="p-4 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/80 select-none">
              <h3 class="font-bold text-zinc-300 flex items-center gap-2">
                <span [class]="getStageColorClass(stage)"></span>
                {{ stage === 'Closed' ? 'Closed' : stage }}
              </h3>
              <span class="bg-zinc-800 text-zinc-400 text-xs font-bold px-2 py-0.5 rounded-md">{{ (leadsMap()[stage] || []).length }}</span>
            </div>
            
            <!-- Column Card Container -->
            <div class="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar min-h-[250px]">
              @for (lead of leadsMap()[stage] || []; track lead.$id) {
                <div 
                  cdkDrag
                  [cdkDragData]="lead"
                  class="cursor-grab active:cursor-grabbing"
                >
                  <!-- Drag Placeholder -->
                  <div *cdkDragPlaceholder class="bg-zinc-950/40 border border-dashed border-zinc-800 rounded-xl h-[120px] transition-all"></div>
                  
                  <ng-container *ngTemplateOutlet="cardTemplate(); context: { lead: lead }"></ng-container>
                </div>
              } @empty {
                <!-- Empty Column Placeholder -->
                <div class="h-full min-h-[150px] flex flex-col items-center justify-center text-zinc-600 border border-dashed border-zinc-800/30 rounded-xl p-4 text-xs text-center select-none">
                  <mat-icon class="text-zinc-700 mb-1">drag_indicator</mat-icon>
                  Drag leads here
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(24, 24, 27, 0.5); 
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(82, 82, 91, 0.5); 
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(113, 113, 122, 0.8); 
    }
    .cdk-drag-preview {
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
      border-color: rgba(249, 115, 22, 0.3) !important;
      background-color: #18181b !important;
      pointer-events: none;
      z-index: 1000 !important;
      transform: scale(1.02);
      transition: transform 0.15s cubic-bezier(0, 0, 0.2, 1);
    }
    .cdk-drag-placeholder {
      opacity: 0.2;
      border: 2px dashed rgba(249, 115, 22, 0.2) !important;
      background: rgba(249, 115, 22, 0.02) !important;
    }
    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
    .cdk-drop-list-dragging .cdk-drag {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
  `]
})
export class KanbanBoardComponent {
  stages = input.required<string[]>();
  leadsMap = input.required<Record<string, Lead[]>>();
  cardTemplate = input.required<TemplateRef<unknown>>();

  statusChange = output<{ lead: Lead; newStatus: string }>();

  getStageColorClass(stage: string): string {
    switch (stage) {
      case 'New':
        return 'w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]';
      case 'Contacted':
        return 'w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]';
      case 'Qualified':
        return 'w-2.5 h-2.5 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.5)]';
      case 'Closed':
        return 'w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
      default:
        return 'w-2.5 h-2.5 rounded-full bg-zinc-500';
    }
  }

  handleDrop(event: CdkDragDrop<Lead[]>, targetStage: string) {
    if (event.previousContainer === event.container) {
      return;
    }

    const lead = event.item.data as Lead;
    if (lead && lead.$id) {
      this.statusChange.emit({ lead, newStatus: targetStage });
    }
  }
}
