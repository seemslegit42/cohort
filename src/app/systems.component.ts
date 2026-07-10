import { Component, ChangeDetectionStrategy, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { Appwrite } from './appwrite';

export interface MicrofrontendModule {
  id: string;
  name: string;
  port: number;
  entrypoint: string;
  status: 'active' | 'reloading' | 'offline';
  latency: number;
  memoryUsage: number; // in MB
  exposedComponents: string[];
  version: string;
}

export interface MicroserviceInstance {
  id: string;
  name: string;
  endpoint: string;
  status: 'active' | 'restarting' | 'offline' | 'degraded';
  requestsHandled: number;
  avgResponseTime: number; // in ms
  version: string;
  lastPing: string;
}

@Component({
  selector: 'app-systems-hub',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="max-w-[1400px] mx-auto space-y-8 animate-fade-in relative pb-12">
      <!-- Ambient Backdrops -->
      <div class="absolute -right-40 -top-40 w-96 h-96 bg-teal-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div class="absolute -left-40 bottom-40 w-96 h-96 bg-purple-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      <!-- Top Header Title Section -->
      <header class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-6">
        <div>
          <div class="flex items-center gap-3 mb-1">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/10 to-purple-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-[0_0_20px_rgba(32,178,170,0.15)]">
              <mat-icon class="text-xl">dns</mat-icon>
            </div>
            <div>
              <h1 class="font-display text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Distributed Systems Hub
              </h1>
              <p class="text-xs text-zinc-400 mt-0.5 uppercase tracking-widest font-mono">
                Microservices Administration & Microfrontend Orchestration
              </p>
            </div>
          </div>
        </div>

        <!-- Master Status Badge -->
        <div class="flex items-center gap-3 bg-zinc-900/40 p-1.5 rounded-xl border border-zinc-800/80">
          <div class="flex items-center gap-2 px-3 py-1">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            <span class="text-xs font-mono font-bold text-teal-400">FEDERATION LEVEL: COMPATIBLE</span>
          </div>
          <div class="h-4 w-[1px] bg-zinc-800"></div>
          <button 
            (click)="triggerMasterSync()"
            class="px-3 py-1 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer">
            <mat-icon class="text-[12px] h-3 w-3 animate-spin">sync</mat-icon>
            Force Sync
          </button>
        </div>
      </header>

      <!-- Architecture Topology Diagram Visualization -->
      <section id="systemTopology" class="bg-zinc-950/40 backdrop-blur-xl border border-zinc-900 rounded-2xl p-6 relative overflow-hidden group">
        <div class="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent pointer-events-none"></div>
        
        <div class="flex items-center justify-between mb-6 border-b border-zinc-900 pb-4">
          <div class="flex items-center gap-2.5">
            <mat-icon class="text-teal-400 text-lg">schema</mat-icon>
            <div>
              <h2 class="text-sm font-bold text-white font-display">System Architecture Topology Map</h2>
              <p class="text-[10px] text-zinc-500 font-sans">Visualizing microfrontend communication, routing gateway proxies, and microservices.</p>
            </div>
          </div>
          <span class="text-[10px] bg-zinc-900/80 border border-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono">
            Active Host: laevos-core (Port 3000)
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center justify-center py-6 relative z-10">
          
          <!-- Column 1: Microfrontends (Left) -->
          <div class="md:col-span-4 space-y-3">
            <div class="text-center md:text-left">
              <span class="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-bold">Microfrontends Layer</span>
            </div>

            @for (mfe of mfes(); track mfe.id) {
              <div 
                [class.border-teal-500/40]="selectedModuleId() === mfe.id"
                [class.bg-zinc-900/40]="selectedModuleId() === mfe.id"
                (click)="selectedModuleId.set(mfe.id)"
                (keyup.enter)="selectedModuleId.set(mfe.id)"
                tabindex="0"
                class="bg-zinc-950/80 border border-zinc-900 p-3 rounded-xl transition-all hover:border-zinc-700 cursor-pointer flex items-center justify-between gap-3 group/mfe">
                <div class="flex items-center gap-2.5 min-w-0">
                  <div class="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-teal-400 font-bold text-[10px]">
                    {{ mfe.port }}
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs font-bold text-white truncate">{{ mfe.name }}</p>
                    <p class="text-[9px] text-zinc-500 font-mono truncate">{{ mfe.entrypoint }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-1.5 flex-shrink-0">
                  <span class="w-1.5 h-1.5 rounded-full" 
                        [ngClass]="mfe.status === 'active' ? 'bg-teal-400 shadow-[0_0_6px_rgba(32,178,170,0.5)]' : mfe.status === 'reloading' ? 'bg-amber-400 animate-pulse' : 'bg-zinc-600'"></span>
                  <mat-icon class="text-xs text-zinc-600 group-hover/mfe:text-zinc-400 transition-colors">arrow_forward</mat-icon>
                </div>
              </div>
            }
          </div>

          <!-- Column 2: Gateway Router Hub (Middle) -->
          <div class="md:col-span-4 flex flex-col items-center justify-center py-6 md:py-0">
            <!-- Animated Hub Circle -->
            <div class="relative w-28 h-28 rounded-full border-2 border-dashed border-teal-500/20 flex items-center justify-center group/hub bg-zinc-950/60 shadow-[0_0_30px_rgba(32,178,170,0.05)]">
              <div class="absolute inset-2 rounded-full border border-teal-500/20 bg-zinc-900/40 flex flex-col items-center justify-center p-3 text-center">
                <mat-icon class="text-teal-400 text-lg animate-pulse">router</mat-icon>
                <span class="text-[9px] font-mono font-bold text-white mt-1">API GATEWAY</span>
                <span class="text-[8px] font-sans text-zinc-500 mt-0.5">Reverse Proxy</span>
              </div>
              <!-- Outer spin ring -->
              <div class="absolute inset-0 rounded-full border-t-2 border-teal-500/40 animate-spin" style="animation-duration: 8s;"></div>
            </div>

            <!-- Intersecting wires text info -->
            <div class="text-center mt-3 space-y-1">
              <span class="block text-[8px] font-mono text-zinc-500">Cross-Origin Resource Sharing (CORS)</span>
              <span class="inline-flex items-center gap-1.5 bg-zinc-900 px-2 py-0.5 rounded text-[8px] font-mono text-teal-400 border border-zinc-800">
                http-proxy-middleware: OK
              </span>
            </div>
          </div>

          <!-- Column 3: Microservices (Right) -->
          <div class="md:col-span-4 space-y-3">
            <div class="text-center md:text-right">
              <span class="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-bold">Microservices Backend</span>
            </div>

            @for (svc of services(); track svc.id) {
              <div 
                [class.border-purple-500/40]="selectedServiceId() === svc.id"
                [class.bg-zinc-900/40]="selectedServiceId() === svc.id"
                (click)="selectedServiceId.set(svc.id)"
                (keyup.enter)="selectedServiceId.set(svc.id)"
                tabindex="0"
                class="bg-zinc-950/80 border border-zinc-900 p-3 rounded-xl transition-all hover:border-zinc-700 cursor-pointer flex items-center justify-between gap-3 group/svc">
                <div class="flex items-center gap-1.5 flex-shrink-0">
                  <mat-icon class="text-xs text-zinc-600 group-hover/svc:text-zinc-400 transition-colors">arrow_back</mat-icon>
                  <span class="w-1.5 h-1.5 rounded-full" 
                        [ngClass]="svc.status === 'active' ? 'bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.5)]' : svc.status === 'restarting' ? 'bg-amber-400 animate-pulse' : 'bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]'"></span>
                </div>
                <div class="flex-1 text-right min-w-0">
                  <p class="text-xs font-bold text-white truncate">{{ svc.name }}</p>
                  <p class="text-[9px] text-zinc-500 font-mono truncate">{{ svc.endpoint }}</p>
                </div>
                <div class="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-purple-400 font-mono text-[9px] font-bold">
                  {{ svc.requestsHandled > 1000 ? (svc.requestsHandled / 1000 | number:'1.1-1') + 'k' : svc.requestsHandled }}
                </div>
              </div>
            }
          </div>

        </div>
      </section>

      <!-- Two Column Layout: MFEs vs Microservices details and actions -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">

        <!-- Column A: Microfrontends (Federated Modules Manager) -->
        <div class="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 space-y-6 relative overflow-hidden group">
          <div class="absolute -right-20 -top-20 w-44 h-44 bg-teal-500/5 blur-3xl rounded-full"></div>
          
          <div class="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div class="flex items-center gap-2.5">
              <mat-icon class="text-teal-400">layers</mat-icon>
              <div>
                <h3 class="text-base font-bold text-white font-display">Microfrontend Federated Modules</h3>
                <p class="text-[11px] text-zinc-500 font-sans">Module Federation configuration & isolated UI reloading simulations.</p>
              </div>
            </div>
          </div>

          <!-- MFE Grid list -->
          <div class="space-y-3.5">
            @for (mfe of mfes(); track mfe.id) {
              <div 
                [class.border-teal-500/30]="selectedModuleId() === mfe.id"
                [class.bg-zinc-950/80]="selectedModuleId() === mfe.id"
                class="bg-zinc-950/40 border border-zinc-900/80 rounded-xl p-4 space-y-3.5 transition-all">
                
                <div class="flex items-start justify-between">
                  <div>
                    <div class="flex items-center gap-2">
                      <h4 class="text-xs font-bold text-white">{{ mfe.name }}</h4>
                      <span class="text-[8px] bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-400 font-mono">v{{ mfe.version }}</span>
                    </div>
                    <p class="text-[10px] text-zinc-500 mt-1 font-mono">Entrypoint: http://localhost:{{ mfe.port }}/{{ mfe.entrypoint }}</p>
                  </div>
                  
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider"
                          [ngClass]="mfe.status === 'active' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : mfe.status === 'reloading' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-zinc-900 text-zinc-500'">
                      {{ mfe.status }}
                    </span>
                  </div>
                </div>

                <!-- Exposed components tags -->
                <div class="flex flex-wrap items-center gap-1.5">
                  <span class="text-[9px] text-zinc-600 font-sans font-semibold uppercase tracking-wider">Exposes:</span>
                  @for (comp of mfe.exposedComponents; track comp) {
                    <span class="bg-zinc-900 text-zinc-400 border border-zinc-800 text-[10px] px-2 py-0.5 rounded-md font-mono">
                      {{ comp }}
                    </span>
                  }
                </div>

                <!-- Memory & Latency bar -->
                <div class="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-900/50">
                  <div>
                    <div class="flex justify-between text-[10px] text-zinc-500 font-sans mb-1">
                      <span>Module Isolation Memory</span>
                      <span class="font-mono text-zinc-300 font-bold">{{ mfe.memoryUsage }} MB</span>
                    </div>
                    <div class="w-full bg-zinc-900 rounded-full h-1">
                      <div class="bg-teal-500/80 rounded-full h-1 transition-all" [style.width]="(mfe.memoryUsage / 2.5) + '%'"></div>
                    </div>
                  </div>
                  <div>
                    <div class="flex justify-between text-[10px] text-zinc-500 font-sans mb-1">
                      <span>Module Federation Latency</span>
                      <span class="font-mono text-zinc-300 font-bold">{{ mfe.latency }} ms</span>
                    </div>
                    <div class="w-full bg-zinc-900 rounded-full h-1">
                      <div class="bg-purple-500/80 rounded-full h-1 transition-all" [style.width]="(mfe.latency / 2) + '%'"></div>
                    </div>
                  </div>
                </div>

                <!-- Individual Module Actions -->
                <div class="flex items-center gap-2 pt-2.5 border-t border-zinc-900/30">
                  <button 
                    (click)="reloadMFE(mfe)"
                    [disabled]="mfe.status === 'reloading'"
                    class="flex-1 py-1 px-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-zinc-300 rounded border border-zinc-800 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer">
                    <mat-icon class="text-xs">replay</mat-icon>
                    Hot-Reload
                  </button>
                  <button 
                    (click)="simulateHMR(mfe)"
                    class="flex-1 py-1 px-2 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer">
                    <mat-icon class="text-xs">flash_on</mat-icon>
                    Simulate HMR
                  </button>
                </div>

              </div>
            }
          </div>

        </div>

        <!-- Column B: Microservices (REST/Express Backends Manager) -->
        <div class="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 space-y-6 relative overflow-hidden group">
          <div class="absolute -right-20 -top-20 w-44 h-44 bg-purple-500/5 blur-3xl rounded-full"></div>

          <div class="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div class="flex items-center gap-2.5">
              <mat-icon class="text-purple-400">cloud_queue</mat-icon>
              <div>
                <h3 class="text-base font-bold text-white font-display">Microservice Endpoints</h3>
                <p class="text-[11px] text-zinc-500 font-sans">REST routing proxies, request log triggers, and service restart procedures.</p>
              </div>
            </div>
          </div>

          <!-- Microservice details grid -->
          <div class="space-y-3.5">
            @for (svc of services(); track svc.id) {
              <div 
                [class.border-purple-500/30]="selectedServiceId() === svc.id"
                [class.bg-zinc-950/80]="selectedServiceId() === svc.id"
                class="bg-zinc-950/40 border border-zinc-900/80 rounded-xl p-4 space-y-3.5 transition-all">

                <div class="flex items-start justify-between">
                  <div>
                    <div class="flex items-center gap-2">
                      <h4 class="text-xs font-bold text-white">{{ svc.name }}</h4>
                      <span class="text-[8px] bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-500 font-mono">v{{ svc.version }}</span>
                    </div>
                    <p class="text-[10px] text-zinc-500 mt-1 font-mono">Endpoint: <span class="text-purple-400">{{ svc.endpoint }}</span></p>
                  </div>

                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider"
                          [ngClass]="svc.status === 'active' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : svc.status === 'restarting' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-zinc-900 text-zinc-500'">
                      {{ svc.status }}
                    </span>
                  </div>
                </div>

                <div class="grid grid-cols-3 gap-2.5 pt-2 border-t border-zinc-900/50 text-[10px] font-mono">
                  <div class="bg-zinc-900/40 p-2 rounded border border-zinc-900">
                    <span class="block text-zinc-500 text-[8px] uppercase tracking-wider font-sans">Requests</span>
                    <span class="text-white font-bold">{{ svc.requestsHandled | number }} req</span>
                  </div>
                  <div class="bg-zinc-900/40 p-2 rounded border border-zinc-900">
                    <span class="block text-zinc-500 text-[8px] uppercase tracking-wider font-sans">Latency</span>
                    <span class="text-teal-400 font-bold">{{ svc.avgResponseTime }} ms</span>
                  </div>
                  <div class="bg-zinc-900/40 p-2 rounded border border-zinc-900">
                    <span class="block text-zinc-500 text-[8px] uppercase tracking-wider font-sans">Last Ping</span>
                    <span class="text-zinc-400 truncate block">{{ svc.lastPing }}</span>
                  </div>
                </div>

                <!-- Individual Service Actions -->
                <div class="flex items-center gap-2 pt-2.5 border-t border-zinc-900/30">
                  <button 
                    (click)="pingService(svc)"
                    class="flex-1 py-1 px-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded border border-zinc-800 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer">
                    <mat-icon class="text-xs">network_check</mat-icon>
                    Ping Service
                  </button>
                  <button 
                    (click)="restartService(svc)"
                    [disabled]="svc.status === 'restarting'"
                    class="flex-1 py-1 px-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer">
                    @if (svc.status === 'restarting') {
                      <mat-icon class="text-xs animate-spin">autorenew</mat-icon>
                    } @else {
                      <mat-icon class="text-xs">power_settings_new</mat-icon>
                    }
                    Restart
                  </button>
                  <button 
                    (click)="spikeLoad(svc)"
                    class="px-3.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer">
                    <mat-icon class="text-xs">query_stats</mat-icon>
                    Spike Load
                  </button>
                </div>

              </div>
            }
          </div>

        </div>

      </div>

      <!-- Footer: Microservice OpenAPI Spec Explorer -->
      <footer class="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6 relative overflow-hidden">
        <div class="flex items-center justify-between mb-4 pb-4 border-b border-zinc-900">
          <div class="flex items-center gap-2">
            <mat-icon class="text-purple-400">integration_instructions</mat-icon>
            <div>
              <h4 class="text-xs font-bold text-white font-display">Gateway OpenAPI Swagger Blueprint</h4>
              <p class="text-[10px] text-zinc-500">Exposing public schemas and specifications for proxy routes integration.</p>
            </div>
          </div>
          <button 
            (click)="copySchema()"
            class="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer">
            <mat-icon class="text-[12px]">content_copy</mat-icon>
            Copy Blueprint Specs
          </button>
        </div>

        <pre class="bg-zinc-950/90 border border-zinc-900/60 p-4 rounded-xl text-[10px] text-teal-400/90 font-mono overflow-x-auto max-h-[160px] custom-scrollbar">
{{ getJSONSchema() }}
        </pre>
      </footer>

    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 4px; }
  `]
})
export class SystemsComponent implements OnInit, OnDestroy {
  appwrite = inject(Appwrite);

  selectedModuleId = signal<string>('mfe-1');
  selectedServiceId = signal<string>('svc-1');

  // Microfrontends list
  mfes = signal<MicrofrontendModule[]>([
    {
      id: 'mfe-1',
      name: 'laevos-dashboard-mfe',
      port: 3001,
      entrypoint: 'remoteEntry.js',
      status: 'active',
      latency: 14,
      memoryUsage: 14.8,
      exposedComponents: ['DashboardWidget', 'KPIGridComponent'],
      version: '1.4.2'
    },
    {
      id: 'mfe-2',
      name: 'agent-insights-mfe',
      port: 3002,
      entrypoint: 'remoteEntry.js',
      status: 'active',
      latency: 28,
      memoryUsage: 8.4,
      exposedComponents: ['AgentInsightsCard', 'ScorecardComponent'],
      version: '2.1.0'
    },
    {
      id: 'mfe-3',
      name: 'contract-suite-mfe',
      port: 3003,
      entrypoint: 'remoteEntry.js',
      status: 'active',
      latency: 19,
      memoryUsage: 11.2,
      exposedComponents: ['ContractSuitePanel', 'DocumentPreviewComponent'],
      version: '1.0.9'
    }
  ]);

  // Microservices list
  services = signal<MicroserviceInstance[]>([
    {
      id: 'svc-1',
      name: 'Leads Pipeline Microservice',
      endpoint: '/api/leads',
      status: 'active',
      requestsHandled: 4892,
      avgResponseTime: 12,
      version: '3.1.2',
      lastPing: 'Just Now'
    },
    {
      id: 'svc-2',
      name: 'Contracts Storage Microservice',
      endpoint: '/api/contracts',
      status: 'active',
      requestsHandled: 1245,
      avgResponseTime: 45,
      version: '1.8.0',
      lastPing: '2s ago'
    },
    {
      id: 'svc-3',
      name: 'Sentiment & Edit Simulator Service',
      endpoint: '/api/simulate-edit',
      status: 'active',
      requestsHandled: 938,
      avgResponseTime: 24,
      version: '2.0.1',
      lastPing: '15s ago'
    },
    {
      id: 'svc-4',
      name: 'Appwrite Core Cloud SDK Proxy',
      endpoint: 'https://tor.cloud.appwrite.io/v1',
      status: 'active',
      requestsHandled: 11340,
      avgResponseTime: 82,
      version: '1.5.0',
      lastPing: 'Just Now'
    }
  ]);

  private statsInterval: ReturnType<typeof setInterval> | undefined;

  ngOnInit() {
    // Periodically update requests handled and latencies slightly to simulate real-time traffic activity!
    this.statsInterval = setInterval(() => {
      this.services.update(list => 
        list.map(s => {
          if (s.status === 'active') {
            const extraReq = Math.floor(Math.random() * 5) + 1;
            const variance = Math.floor(Math.random() * 5) - 2;
            return {
              ...s,
              requestsHandled: s.requestsHandled + extraReq,
              avgResponseTime: Math.max(5, s.avgResponseTime + variance),
              lastPing: 'Just Now'
            };
          }
          return s;
        })
      );

      this.mfes.update(list => 
        list.map(m => {
          if (m.status === 'active') {
            const variance = Math.floor(Math.random() * 3) - 1;
            const memoryVar = Number((Math.random() * 0.4 - 0.2).toFixed(2));
            return {
              ...m,
              latency: Math.max(4, m.latency + variance),
              memoryUsage: Number(Math.max(2, m.memoryUsage + memoryVar).toFixed(2))
            };
          }
          return m;
        })
      );
    }, 4000);
  }

  ngOnDestroy() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }
  }

  // Reload action for MFEs
  reloadMFE(mfe: MicrofrontendModule) {
    this.playCrystallineChime();
    
    this.mfes.update(list => 
      list.map(m => m.id === mfe.id ? { ...m, status: 'reloading' } : m)
    );

    // Simulate reload finished in 2 seconds
    setTimeout(() => {
      this.playSuccessHarmonic();
      this.mfes.update(list => 
        list.map(m => m.id === mfe.id ? { ...m, status: 'active', latency: Math.floor(Math.random() * 10) + 10 } : m)
      );

      this.appwrite.addNotification({
        title: 'Microfrontend Reloaded',
        message: `Federated module [${mfe.name}] successfully reloaded & re-compiled and connected back to host laevos-core.`,
        type: 'success'
      });
    }, 2000);
  }

  simulateHMR(mfe: MicrofrontendModule) {
    this.playCrystallineChime();
    this.appwrite.addNotification({
      title: 'HMR Update Received',
      message: `Hot module replacement signal dispatched for ${mfe.name}. Applying hot state delta instantly to active iFrame.`,
      type: 'info'
    });
  }

  // Ping Action for microservices
  pingService(svc: MicroserviceInstance) {
    this.playCrystallineChime();
    const start = Date.now();
    
    // Quick timeout simulation
    setTimeout(() => {
      const pingMs = Date.now() - start + Math.floor(Math.random() * 10) + 5;
      this.appwrite.addNotification({
        title: 'Microservice Ping Answered',
        message: `Status check for ${svc.name} on ${svc.endpoint} returned code 200 OK in ${pingMs}ms.`,
        type: 'success'
      });
    }, 250);
  }

  // Restart microservice
  restartService(svc: MicroserviceInstance) {
    this.playCrystallineChime();
    this.services.update(list => 
      list.map(s => s.id === svc.id ? { ...s, status: 'restarting', requestsHandled: 0 } : s)
    );

    setTimeout(() => {
      this.playSuccessHarmonic();
      this.services.update(list => 
        list.map(s => s.id === svc.id ? { ...s, status: 'active' } : s)
      );

      this.appwrite.addNotification({
        title: 'Microservice Hot Restarted',
        message: `Microservice instance ${svc.name} has rebooted gracefully. API endpoint paths are now active.`,
        type: 'success'
      });
    }, 2500);
  }

  // Spike load simulator
  spikeLoad(svc: MicroserviceInstance) {
    this.playCrystallineChime();
    this.services.update(list => 
      list.map(s => s.id === svc.id ? { ...s, requestsHandled: s.requestsHandled + 1500, avgResponseTime: s.avgResponseTime + 30 } : s)
    );

    this.appwrite.addNotification({
      title: 'Traffic Spike Dispatched',
      message: `Simulating a load spike of 1,500 requests to ${svc.name} (${svc.endpoint}). Monitoring proxy health indicators.`,
      type: 'warning'
    });
  }

  triggerMasterSync() {
    this.playSuccessHarmonic();
    this.appwrite.addNotification({
      title: 'Global Sync Dispatched',
      message: 'Broadcasting telemetry synchronization packet to all 3 microfrontend ports & 4 active microservice entrypoints.',
      type: 'info'
    });
  }

  copySchema() {
    this.playCrystallineChime();
    try {
      navigator.clipboard.writeText(this.getJSONSchema());
      alert('OpenAPI Swagger spec blueprint copied to clipboard!');
    } catch {
      // fallback
    }
  }

  getJSONSchema(): string {
    return `{
  "openapi": "3.0.0",
  "info": {
    "title": "Laevos Gateway API Proxy",
    "version": "1.0.0",
    "description": "API Gateway routing schema mapping internal Express microservices to Appwrite cloud nodes"
  },
  "servers": [
    { "url": "http://localhost:3000/api" }
  ],
  "paths": {
    "/leads": {
      "get": {
        "summary": "Retrieve registered CRM lead pipelines",
        "responses": { "200": { "description": "Success JSON list output" } }
      }
    },
    "/contracts": {
      "post": {
        "summary": "Initialize a new Gilded SLA agreement",
        "requestBody": { "required": true }
      }
    }
  }
}`;
  }

  // Synths
  private playCrystallineChime() {
    try {
      const WebContext = (window as unknown as { webkitAudioContext: typeof AudioContext })['webkitAudioContext'];
      const ctx = new (window.AudioContext || WebContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2800, ctx.currentTime + 0.12);
      
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      // Ignore
    }
  }

  private playSuccessHarmonic() {
    try {
      const WebContext = (window as unknown as { webkitAudioContext: typeof AudioContext })['webkitAudioContext'];
      const ctx = new (window.AudioContext || WebContext)();
      const now = ctx.currentTime;
      
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now); // E5
      gain1.gain.setValueAtTime(0.03, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(now + 0.25);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.08); // A5
      gain2.gain.setValueAtTime(0.03, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();
      osc2.stop(now + 0.35);
    } catch {
      // Ignore
    }
  }
}
