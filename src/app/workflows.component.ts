import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'ai' | 'action';
  title: string;
  description: string;
  icon: string;
  status: 'idle' | 'active' | 'completed' | 'error';
  color: string;
  x: number;
  y: number;
}

export interface WorkflowConnection {
  id: string;
  fromId: string;
  toId: string;
}

@Component({
  selector: 'app-workflows',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="max-w-[1400px] mx-auto space-y-8 animate-fade-in relative px-2 md:px-0">
      
      <!-- Header -->
      <header class="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2 mb-6">
        <div>
          <h1 class="font-display text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-[0_0_15px_rgba(106,13,173,0.15)]">
              <mat-icon class="text-purple-400 text-[24px]">account_tree</mat-icon>
            </div>
            Workflow Architect
          </h1>
          <p class="text-xs text-zinc-400 mt-2">
            Design and construct automated behavioral pipelines using node-based sequences. Connect triggers, logic gates, AI filters, and dispatch hooks.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button 
            (click)="resetSimulation()" 
            class="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center gap-2">
            <mat-icon class="text-xs">restart_alt</mat-icon>
            Reset Board
          </button>
          
          <button 
            (click)="runSimulation()" 
            [disabled]="isSimulating()"
            class="bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-zinc-950 font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(32,178,170,0.2)] flex items-center gap-2">
            <mat-icon class="text-xs">play_arrow</mat-icon>
            Execute Pipeline
          </button>
        </div>
      </header>

      <!-- Main Workspace -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        <!-- Sidebar Controls & Config (4 cols) -->
        <div class="xl:col-span-4 space-y-6">
          
          <!-- Add Nodes Toolpane -->
          <div class="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-5 space-y-4">
            <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-widest font-display flex items-center gap-2">
              <mat-icon class="text-[#20B2AA] text-sm">add_circle_outline</mat-icon>
              Node Generator
            </h3>
            
            <div class="grid grid-cols-2 gap-3">
              <!-- Trigger -->
              <button 
                (click)="addNode('trigger')"
                class="bg-zinc-950/60 hover:bg-zinc-950 border border-zinc-850 hover:border-blue-500/30 p-3 rounded-xl flex flex-col items-center justify-center text-center group transition-all">
                <mat-icon class="text-blue-400 mb-1.5 group-hover:scale-110 transition-transform">bolt</mat-icon>
                <span class="text-[11px] font-bold text-white font-display">Trigger</span>
                <span class="text-[9px] text-zinc-500 mt-1">Inbound signals</span>
              </button>

              <!-- Logic Gate -->
              <button 
                (click)="addNode('condition')"
                class="bg-zinc-950/60 hover:bg-zinc-950 border border-zinc-850 hover:border-amber-500/30 p-3 rounded-xl flex flex-col items-center justify-center text-center group transition-all">
                <mat-icon class="text-amber-400 mb-1.5 group-hover:scale-110 transition-transform">alt_route</mat-icon>
                <span class="text-[11px] font-bold text-white font-display">Filter Gate</span>
                <span class="text-[9px] text-zinc-500 mt-1">Conditional router</span>
              </button>

              <!-- AI Brain -->
              <button 
                (click)="addNode('ai')"
                class="bg-zinc-950/60 hover:bg-zinc-950 border border-zinc-850 hover:border-purple-500/30 p-3 rounded-xl flex flex-col items-center justify-center text-center group transition-all">
                <mat-icon class="text-purple-400 mb-1.5 group-hover:scale-110 transition-transform">psychology</mat-icon>
                <span class="text-[11px] font-bold text-white font-display">Gemini Brain</span>
                <span class="text-[9px] text-zinc-500 mt-1">Enrich & analyze</span>
              </button>

              <!-- Hook Action -->
              <button 
                (click)="addNode('action')"
                class="bg-zinc-950/60 hover:bg-zinc-950 border border-zinc-850 hover:border-teal-500/30 p-3 rounded-xl flex flex-col items-center justify-center text-center group transition-all">
                <mat-icon class="text-teal-400 mb-1.5 group-hover:scale-110 transition-transform">webhook</mat-icon>
                <span class="text-[11px] font-bold text-white font-display">Action Hook</span>
                <span class="text-[9px] text-zinc-500 mt-1">Webhook dispatch</span>
              </button>
            </div>
          </div>

          <!-- Selected Node Configurator -->
          <div class="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-5 space-y-4">
            <h3 class="text-xs font-bold text-zinc-400 uppercase tracking-widest font-display flex items-center gap-2">
              <mat-icon class="text-[#3EB991] text-sm">settings_input_component</mat-icon>
              Node Inspector
            </h3>

            @if (selectedNode(); as node) {
              <div class="space-y-4 animate-fade-in">
                <div class="p-3.5 bg-zinc-950/60 rounded-xl border border-zinc-800 flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                       [ngClass]="{
                         'bg-blue-500/10 text-blue-400 border border-blue-500/20': node.type === 'trigger',
                         'bg-amber-500/10 text-amber-400 border border-amber-500/20': node.type === 'condition',
                         'bg-purple-500/10 text-purple-400 border border-purple-500/20': node.type === 'ai',
                         'bg-teal-500/10 text-[#20B2AA] border border-teal-500/20': node.type === 'action'
                       }">
                    <mat-icon class="text-[18px]">{{ node.icon }}</mat-icon>
                  </div>
                  <div>
                    <h4 class="text-xs font-bold text-white uppercase tracking-wider font-mono">{{ node.type }} NODE</h4>
                    <p class="text-[10px] text-zinc-500">ID: {{ node.id }}</p>
                  </div>
                </div>

                <!-- Fields -->
                <div class="space-y-3">
                  <div class="space-y-1">
                    <label for="nodeTitleInput" class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Label Name</label>
                    <input id="nodeTitleInput" type="text" [value]="node.title" (input)="updateNodeTitle($event)"
                           class="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-teal-500/40" />
                  </div>

                  <div class="space-y-1">
                    <label for="nodeDescInput" class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Operational Role</label>
                    <textarea id="nodeDescInput" [value]="node.description" (input)="updateNodeDesc($event)" rows="3"
                              class="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-teal-500/40 font-sans"></textarea>
                  </div>

                  <!-- Coordinates for fine layout adjustment -->
                  <div class="grid grid-cols-2 gap-3">
                    <div class="space-y-1">
                      <label for="offsetXInput" class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Offset X (px)</label>
                      <input id="offsetXInput" type="range" min="10" max="680" [value]="node.x" (input)="updateNodeCoord($event, 'x')"
                             class="w-full accent-teal-500 bg-zinc-950 rounded-lg h-1" />
                    </div>
                    <div class="space-y-1">
                      <label for="offsetYInput" class="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Offset Y (px)</label>
                      <input id="offsetYInput" type="range" min="10" max="420" [value]="node.y" (input)="updateNodeCoord($event, 'y')"
                             class="w-full accent-teal-500 bg-zinc-950 rounded-lg h-1" />
                    </div>
                  </div>
                </div>

                <!-- Connect / Delete -->
                <div class="flex items-center gap-2 pt-2">
                  <button 
                    (click)="deleteSelectedNode()"
                    class="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5">
                    <mat-icon class="text-sm">delete_outline</mat-icon>
                    Deconstruct Node
                  </button>
                </div>
              </div>
            } @else {
              <div class="py-8 text-center text-zinc-500 select-none">
                <mat-icon class="text-zinc-700 text-3xl mb-2">touch_app</mat-icon>
                <p class="text-xs">Click any node in the canvas grid to inspect and adjust properties.</p>
              </div>
            }
          </div>

        </div>

        <!-- Canvas Node Sandbox (8 cols) -->
        <div class="xl:col-span-8">
          
          <div class="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-2 relative h-[500px] overflow-hidden group shadow-2xl">
            <!-- Grid Background Overlay -->
            <div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none rounded-2xl"></div>

            <!-- Dynamic SVG Connections (VEIN FLOWS) -->
            <svg class="absolute inset-0 w-full h-full pointer-events-none z-10">
              <defs>
                <!-- Glowing Aqua Laser Gradient -->
                <linearGradient id="laserGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#6A0DAD" />
                  <stop offset="50%" stop-color="#20B2AA" />
                  <stop offset="100%" stop-color="#3EB991" />
                </linearGradient>
              </defs>

              @for (conn of connections(); track conn.id) {
                @let from = getNodeById(conn.fromId);
                @let to = getNodeById(conn.toId);
                @if (from && to) {
                  <!-- Standard resting trace line -->
                  <path 
                    [attr.d]="getBezierPath(from.x + 90, from.y + 40, to.x + 10, to.y + 40)" 
                    fill="none" 
                    stroke="rgba(255,255,255,0.06)" 
                    stroke-width="1.5" />
                  
                  <!-- Flowing active laser line -->
                  <path 
                    [attr.d]="getBezierPath(from.x + 90, from.y + 40, to.x + 10, to.y + 40)" 
                    fill="none" 
                    [attr.stroke]="getConnStrokeColor(from)" 
                    stroke-width="2.5" 
                    stroke-linecap="round"
                    class="flow-laser"
                    [ngClass]="from.status === 'active' || from.status === 'completed' ? 'active-pulse' : ''" />
                }
              }
            </svg>

            <!-- Rendered Nodes -->
            <div class="absolute inset-0 z-20 overflow-hidden">
              @for (node of nodes(); track node.id) {
                <div 
                  role="button"
                  tabindex="0"
                  (click)="selectNode(node)"
                  (keydown.enter)="selectNode(node)"
                  class="absolute w-[180px] bg-zinc-900/90 backdrop-blur-xl border rounded-xl p-3 cursor-pointer select-none hover:bg-zinc-900 transition-all shadow-lg flex flex-col justify-between"
                  [ngClass]="getNodeClass(node)"
                  [style.left.px]="node.x"
                  [style.top.px]="node.y">
                  
                  <div class="flex items-start justify-between">
                    <div class="w-7 h-7 rounded-lg flex items-center justify-center"
                         [ngClass]="{
                           'bg-blue-500/10 text-blue-400': node.type === 'trigger',
                           'bg-amber-500/10 text-amber-400': node.type === 'condition',
                           'bg-purple-500/10 text-purple-400': node.type === 'ai',
                           'bg-teal-500/10 text-[#20B2AA]': node.type === 'action'
                         }">
                      <mat-icon class="text-sm font-bold">{{ node.icon }}</mat-icon>
                    </div>

                    <!-- Connection Dot (Right side Anchor) -->
                    <div class="w-1.5 h-1.5 rounded-full bg-zinc-700 group-hover:bg-teal-400 transition-all"></div>
                  </div>

                  <div class="mt-2.5">
                    <h4 class="text-xs font-bold text-white font-display truncate">{{ node.title }}</h4>
                    <p class="text-[9px] text-zinc-500 mt-0.5 line-clamp-2 leading-relaxed h-[26px]">{{ node.description }}</p>
                  </div>

                  <div class="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[8px] font-mono tracking-wide uppercase font-bold">
                    <span class="text-zinc-500">Node Status:</span>
                    <span [ngClass]="{
                      'text-zinc-600': node.status === 'idle',
                      'text-blue-400 animate-pulse': node.status === 'active',
                      'text-[#3EB991]': node.status === 'completed',
                      'text-rose-400': node.status === 'error'
                    }">{{ node.status }}</span>
                  </div>
                </div>
              }
            </div>

            <!-- Canvas empty tip overlay -->
            @if (nodes().length === 0) {
              <div class="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-10 select-none">
                <mat-icon class="text-zinc-800 text-5xl mb-3">cloud_queue</mat-icon>
                <p class="text-zinc-500 font-display font-medium">Your architect board is fully blank</p>
                <p class="text-zinc-600 text-xs mt-1 max-w-xs">Use the Node Generator on the left pane to deploy triggers, conditional checks, AI components, and outgoing actions.</p>
              </div>
            }

          </div>

          <!-- Connection Helper Information bar -->
          <div class="bg-zinc-900/30 border border-zinc-900 rounded-xl p-3.5 flex items-center justify-between text-[11px] text-zinc-400 font-medium">
            <span class="flex items-center gap-1.5">
              <mat-icon class="text-[#20B2AA] text-[16px]">info</mat-icon>
              Interactive Veins automatically route sequential data streams based on chronological node ID linkage.
            </span>
            <span class="font-mono text-[9px] text-zinc-600 uppercase">LAEVOS-ENGINE V3</span>
          </div>

        </div>

      </div>

    </div>
  `,
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Laser light flowing along SVGs */
    .flow-laser {
      stroke-dasharray: 20 40;
      stroke-dashoffset: 60;
      opacity: 0.15;
      transition: opacity 0.3s, stroke-dashoffset 0.3s;
    }

    .flow-laser.active-pulse {
      opacity: 1;
      animation: flowStream 1.5s linear infinite;
    }

    @keyframes flowStream {
      to {
        stroke-dashoffset: 0;
      }
    }
  `]
})
export class WorkflowsComponent {
  nodes = signal<WorkflowNode[]>([
    {
      id: 'node-1',
      type: 'trigger',
      title: 'Inbound Ingest Alert',
      description: 'Ingests new prospect pipeline events via external Appwrite API telemetry channels.',
      icon: 'bolt',
      status: 'idle',
      color: 'blue',
      x: 30,
      y: 60
    },
    {
      id: 'node-2',
      type: 'condition',
      title: 'Enterprise Filter Gate',
      description: 'Examines estimated pipeline value criteria and filters out deals under $100k.',
      icon: 'alt_route',
      status: 'idle',
      color: 'amber',
      x: 250,
      y: 120
    },
    {
      id: 'node-3',
      type: 'ai',
      title: 'Gemini Context Enricher',
      description: 'Generates detailed target company intelligence dossiers and contextual outline matrices.',
      icon: 'psychology',
      status: 'idle',
      color: 'purple',
      x: 470,
      y: 80
    },
    {
      id: 'node-4',
      type: 'action',
      title: 'Sales Alert Dispatch',
      description: 'Triggers global CRM notifications and posts enriched details payload into Slack alerts.',
      icon: 'webhook',
      status: 'idle',
      color: 'teal',
      x: 690,
      y: 180
    }
  ]);

  connections = signal<WorkflowConnection[]>([
    { id: 'c-1', fromId: 'node-1', toId: 'node-2' },
    { id: 'c-2', fromId: 'node-2', toId: 'node-3' },
    { id: 'c-3', fromId: 'node-3', toId: 'node-4' }
  ]);

  selectedNode = signal<WorkflowNode | null>(null);
  isSimulating = signal<boolean>(false);

  getNodeById(id: string): WorkflowNode | undefined {
    return this.nodes().find(n => n.id === id);
  }

  // Generate pretty cubic bezier paths between nodes
  getBezierPath(x1: number, y1: number, x2: number, y2: number): string {
    const controlOffset = Math.abs(x2 - x1) * 0.5;
    return `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`;
  }

  getConnStrokeColor(fromNode: WorkflowNode): string {
    if (fromNode.status === 'completed' || fromNode.status === 'active') {
      return 'url(#laserGrad)';
    }
    return 'rgba(255,255,255,0.1)';
  }

  addNode(type: 'trigger' | 'condition' | 'ai' | 'action') {
    const id = 'node-' + (this.nodes().length + 1);
    
    let title = '';
    let description = '';
    let icon = '';
    let color = '';

    switch (type) {
      case 'trigger':
        title = 'Custom API Trigger';
        description = 'Fires a raw webhook listener when a custom event telemetry threshold is hit.';
        icon = 'bolt';
        color = 'blue';
        break;
      case 'condition':
        title = 'Conditional Logic Gate';
        description = 'Branches the stream based on logical assertions on incoming properties.';
        icon = 'alt_route';
        color = 'amber';
        break;
      case 'ai':
        title = 'Gemini Predictive Intel';
        description = 'Analyzes deal probability and outlines best-response actions using LLM models.';
        icon = 'psychology';
        color = 'purple';
        break;
      case 'action':
        title = 'API Hook Dispatcher';
        description = 'Posts JSON structured payloads to remote external system endpoints.';
        icon = 'webhook';
        color = 'teal';
        break;
    }

    // Distribute nicely across space
    const x = Math.min(680, 50 + (this.nodes().length * 150) % 600);
    const y = Math.min(420, 100 + (this.nodes().length * 80) % 320);

    const newNode: WorkflowNode = {
      id,
      type,
      title,
      description,
      icon,
      status: 'idle',
      color,
      x,
      y
    };

    this.nodes.update(arr => [...arr, newNode]);

    // Automatically build connection if previous nodes exist to keep the board fully connected
    if (this.nodes().length > 1) {
      const prevNode = this.nodes()[this.nodes().length - 2];
      const newConn: WorkflowConnection = {
        id: 'c-' + Date.now(),
        fromId: prevNode.id,
        toId: newNode.id
      };
      this.connections.update(arr => [...arr, newConn]);
    }

    this.selectNode(newNode);
  }

  selectNode(node: WorkflowNode) {
    this.selectedNode.set(node);
  }

  updateNodeTitle(event: Event) {
    const input = event.target as HTMLInputElement;
    const title = input.value;
    const sNode = this.selectedNode();
    if (!sNode) return;

    this.nodes.update(arr => arr.map(n => {
      if (n.id === sNode.id) {
        const next = { ...n, title };
        this.selectedNode.set(next);
        return next;
      }
      return n;
    }));
  }

  updateNodeDesc(event: Event) {
    const input = event.target as HTMLTextAreaElement;
    const description = input.value;
    const sNode = this.selectedNode();
    if (!sNode) return;

    this.nodes.update(arr => arr.map(n => {
      if (n.id === sNode.id) {
        const next = { ...n, description };
        this.selectedNode.set(next);
        return next;
      }
      return n;
    }));
  }

  updateNodeCoord(event: Event, prop: 'x' | 'y') {
    const input = event.target as HTMLInputElement;
    const val = Number(input.value);
    const sNode = this.selectedNode();
    if (!sNode) return;

    this.nodes.update(arr => arr.map(n => {
      if (n.id === sNode.id) {
        const next = { ...n, [prop]: val };
        this.selectedNode.set(next);
        return next;
      }
      return n;
    }));
  }

  deleteSelectedNode() {
    const sNode = this.selectedNode();
    if (!sNode) return;

    this.nodes.update(arr => arr.filter(n => n.id !== sNode.id));
    this.connections.update(arr => arr.filter(c => c.fromId !== sNode.id && c.toId !== sNode.id));
    this.selectedNode.set(null);
  }

  runSimulation() {
    if (this.nodes().length === 0 || this.isSimulating()) return;
    this.isSimulating.set(true);

    // Reset status to idle first
    this.nodes.update(arr => arr.map(n => ({ ...n, status: 'idle' })));

    let currentIndex = 0;
    
    const executeStep = () => {
      if (currentIndex >= this.nodes().length) {
        this.isSimulating.set(false);
        return;
      }

      // Set current node to active
      const currentNodeId = this.nodes()[currentIndex].id;
      this.nodes.update(arr => arr.map(n => {
        if (n.id === currentNodeId) {
          return { ...n, status: 'active' };
        }
        return n;
      }));

      // Finish this node after 1.5 seconds, then move to next
      setTimeout(() => {
        this.nodes.update(arr => arr.map(n => {
          if (n.id === currentNodeId) {
            return { ...n, status: 'completed' };
          }
          return n;
        }));

        currentIndex++;
        executeStep();
      }, 1500);
    };

    executeStep();
  }

  resetSimulation() {
    this.nodes.update(arr => arr.map(n => ({ ...n, status: 'idle' })));
    this.isSimulating.set(false);
  }

  getNodeClass(node: WorkflowNode): string {
    const isSelected = this.selectedNode()?.id === node.id;
    const base = isSelected ? 'ring-1 ring-teal-500/50 scale-102 border-teal-500/30' : 'border-zinc-800 hover:border-zinc-700';
    
    switch (node.status) {
      case 'active':
        return `${base} ring-1 ring-blue-500/40 bg-zinc-950`;
      case 'completed':
        return `${base} ring-1 ring-emerald-500/40 bg-zinc-950`;
      case 'error':
        return `${base} ring-1 ring-rose-500/40 bg-zinc-950`;
      default:
        return `${base} bg-zinc-900/90`;
    }
  }
}
