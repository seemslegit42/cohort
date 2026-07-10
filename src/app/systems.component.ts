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
            class="px-3 py-1 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border-transparent">
            <mat-icon class="text-[12px] h-3 w-3 animate-spin">sync</mat-icon>
            Force Sync
          </button>
        </div>
      </header>

      <!-- Navigation Tabs Selector -->
      <div class="flex items-center gap-1 border-b border-zinc-800/60 pb-px">
        <button 
          (click)="activeTab.set('orchestration')"
          [class]="activeTab() === 'orchestration' ? 'border-b-2 border-teal-500 text-teal-400 font-bold bg-teal-500/5' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'"
          class="px-5 py-3 text-xs uppercase tracking-wider font-mono font-bold transition-all flex items-center gap-2 cursor-pointer border-transparent rounded-t-xl">
          <mat-icon class="text-base">hub</mat-icon>
          Federation & Orchestration
        </button>
        <button 
          (click)="activeTab.set('postman')"
          [class]="activeTab() === 'postman' ? 'border-b-2 border-purple-500 text-purple-400 font-bold bg-purple-500/5' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'"
          class="px-5 py-3 text-xs uppercase tracking-wider font-mono font-bold transition-all flex items-center gap-2 cursor-pointer relative border-transparent rounded-t-xl">
          <mat-icon class="text-base">send</mat-icon>
          Postman API Client
          <span class="absolute top-2 right-2 flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
          </span>
        </button>
      </div>

      @if (activeTab() === 'orchestration') {
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
                      class="flex-1 py-1 px-2 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer border-transparent">
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
                      class="flex-1 py-1 px-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer border-transparent">
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
              class="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border-transparent">
              <mat-icon class="text-[12px]">content_copy</mat-icon>
              Copy Blueprint Specs
            </button>
          </div>

          <pre class="bg-zinc-950/90 border border-zinc-900/60 p-4 rounded-xl text-[10px] text-teal-400/90 font-mono overflow-x-auto max-h-[160px] custom-scrollbar">
{{ getJSONSchema() }}
          </pre>
        </footer>
      }

      <!-- Postman API Client Tab Section -->
      @if (activeTab() === 'postman') {
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in pb-12 relative z-10">
          
          <!-- Left Sidebar: Collections & Presets (4 cols) -->
          <aside class="lg:col-span-4 bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-5 space-y-6 relative overflow-hidden">
            <div class="absolute -left-10 -bottom-10 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full"></div>
            
            <!-- Sidebar Header -->
            <div class="border-b border-zinc-800 pb-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                    <mat-icon class="text-base">collections</mat-icon>
                  </div>
                  <div>
                    <h3 class="text-xs font-bold text-white uppercase tracking-wider font-mono">My API Collections</h3>
                    <p class="text-[9px] text-zinc-500 font-sans">Local presets and template configurations</p>
                  </div>
                </div>
                <button 
                  (click)="downloadPostmanCollection()"
                  title="Export to official Postman v2.1 format"
                  class="p-1 text-zinc-400 hover:text-orange-400 hover:bg-orange-500/10 rounded transition-all flex items-center gap-1 text-[10px] font-bold border border-transparent hover:border-orange-500/20 cursor-pointer">
                  <mat-icon class="text-sm w-3.5 h-3.5">download</mat-icon>
                  Export
                </button>
              </div>
            </div>

            <!-- Saved Collections -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-[9px] text-zinc-400 font-bold uppercase tracking-wider font-mono">Saved Presets</span>
                <span class="text-[9px] bg-zinc-950 px-1.5 py-0.5 rounded text-zinc-500 font-mono">{{ postmanSavedRequests().length }} items</span>
              </div>

              <div class="space-y-1.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                @for (saved of postmanSavedRequests(); track saved.id) {
                  <button 
                    (click)="loadSavedRequest(saved)"
                    class="w-full text-left bg-zinc-950/60 hover:bg-zinc-950 border border-zinc-900 hover:border-zinc-800 px-3 py-2.5 rounded-xl transition-all flex items-center justify-between group cursor-pointer border-transparent">
                    <div class="min-w-0 flex-1">
                      <p class="text-xs font-semibold text-zinc-200 group-hover:text-white truncate">{{ saved.name }}</p>
                      <div class="flex items-center gap-1.5 mt-1">
                        <span class="text-[8px] font-bold px-1 rounded font-mono"
                              [ngClass]="{
                                'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20': saved.method === 'GET',
                                'text-purple-400 bg-purple-500/10 border border-purple-500/20': saved.method === 'POST',
                                'text-blue-400 bg-blue-500/10 border border-blue-500/20': saved.method === 'PATCH',
                                'text-rose-400 bg-rose-500/10 border border-rose-500/20': saved.method === 'DELETE'
                              }">
                          {{ saved.method }}
                        </span>
                        <span class="text-[9px] text-zinc-500 truncate font-mono">{{ saved.url }}</span>
                      </div>
                    </div>
                    <mat-icon class="text-xs text-zinc-600 group-hover:text-zinc-400 transition-colors">keyboard_arrow_right</mat-icon>
                  </button>
                }
              </div>
            </div>

            <!-- Request History -->
            <div class="space-y-3 pt-4 border-t border-zinc-800/40">
              <div class="flex items-center justify-between">
                <span class="text-[9px] text-zinc-400 font-bold uppercase tracking-wider font-mono">Recent History</span>
                <button 
                  (click)="clearHistory()"
                  class="text-[9px] text-rose-400/80 hover:text-rose-400 font-bold uppercase tracking-wider cursor-pointer border-transparent">
                  Clear
                </button>
              </div>

              @if (postmanHistory().length === 0) {
                <div class="text-center py-6 bg-zinc-950/30 border border-zinc-900 border-dashed rounded-xl">
                  <mat-icon class="text-zinc-700 text-lg">history</mat-icon>
                  <p class="text-[10px] text-zinc-600 font-sans mt-1">No API requests recorded yet.</p>
                </div>
              } @else {
                <div class="space-y-1.5 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
                  @for (hist of postmanHistory(); track hist.id) {
                    <div 
                      (click)="loadSavedRequest({ id: hist.id, name: hist.method + ' ' + hist.url, method: hist.method, url: hist.url, headers: [], body: '' })"
                      (keyup.enter)="loadSavedRequest({ id: hist.id, name: hist.method + ' ' + hist.url, method: hist.method, url: hist.url, headers: [], body: '' })"
                      tabindex="0"
                      class="w-full text-left bg-zinc-950/20 hover:bg-zinc-950/60 px-2.5 py-1.5 rounded-lg transition-all flex items-center justify-between group cursor-pointer font-mono border border-transparent hover:border-zinc-900">
                      <div class="flex items-center gap-2 min-w-0">
                        <span class="text-[8px] font-bold w-10 text-center rounded py-0.5"
                              [ngClass]="{
                                'text-emerald-400 bg-emerald-500/10': hist.method === 'GET',
                                'text-purple-400 bg-purple-500/10': hist.method === 'POST',
                                'text-blue-400 bg-blue-500/10': hist.method === 'PATCH',
                                'text-rose-400 bg-rose-500/10': hist.method === 'DELETE'
                              }">
                          {{ hist.method }}
                        </span>
                        <span class="text-[9px] text-zinc-400 truncate">{{ hist.url }}</span>
                      </div>
                      <span class="text-[8px] text-zinc-600 select-none flex-shrink-0">{{ hist.timestamp }}</span>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Developer Notice -->
            <div class="bg-orange-500/5 border border-orange-500/10 p-3 rounded-xl text-[9px] text-orange-400/90 font-sans leading-relaxed">
              <div class="flex gap-2">
                <mat-icon class="text-sm">info</mat-icon>
                <span>
                  <strong>Appwrite Sandbox Gateway:</strong> Requests made to local endpoints starting with <code>/api</code> are proxied securely to the active Node.js server. External URLs (e.g., Appwrite services) require proper CORS configurations.
                </span>
              </div>
            </div>
          </aside>

          <!-- Right Content: Interactive Playground (8 cols) -->
          <div class="lg:col-span-8 space-y-6">
            
            <!-- Sandbox Main Terminal Window -->
            <div class="bg-zinc-950/60 border border-zinc-900 rounded-2xl overflow-hidden relative shadow-2xl">
              <div class="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent pointer-events-none"></div>

              <!-- Browser Style Terminal Header Bar -->
              <div class="bg-zinc-900/60 border-b border-zinc-900 px-4 py-3 flex items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                  <div class="flex gap-1.5">
                    <span class="w-2.5 h-2.5 rounded-full bg-rose-500/60"></span>
                    <span class="w-2.5 h-2.5 rounded-full bg-amber-500/60"></span>
                    <span class="w-2.5 h-2.5 rounded-full bg-teal-500/60"></span>
                  </div>
                  <div class="h-4 w-[1px] bg-zinc-800 mx-1"></div>
                  <div class="flex items-center gap-1.5">
                    <mat-icon class="text-zinc-500 text-sm">terminal</mat-icon>
                    <span class="text-[10px] font-mono text-zinc-400 tracking-wide">POSTMAN PLAYGROUND TERMINAL</span>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button 
                    (click)="saveCurrentRequest()"
                    class="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer border-transparent">
                    <mat-icon class="text-[11px] h-3 w-3">bookmark</mat-icon>
                    Save Request
                  </button>
                </div>
              </div>

              <!-- Request Input Section -->
              <div class="p-6 space-y-5">
                
                <!-- HTTP Method + URL Input Row -->
                <div class="flex flex-col sm:flex-row items-stretch gap-2.5">
                  
                  <!-- Method Selector Dropdown -->
                  <div class="relative flex-shrink-0">
                    <select 
                      [value]="requestMethod()"
                      (change)="onMethodChange($event)"
                      class="h-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 focus:border-purple-500/50 rounded-xl px-4 py-3 text-xs font-bold font-mono text-white focus:outline-none transition-all cursor-pointer">
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PATCH">PATCH</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>

                  <!-- URL Input Box -->
                  <div class="flex-1 relative group">
                    <input 
                      type="text" 
                      [value]="requestUrl()"
                      (input)="onUrlInput($event)"
                      placeholder="http://localhost:3000/api/leads" 
                      class="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-500/50 rounded-xl py-3 pl-4 pr-12 text-xs font-mono text-white placeholder-zinc-650 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all font-medium" />
                    <button 
                      (click)="requestUrl.set('/api/leads')"
                      title="Reset to default route"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer border-transparent">
                      <mat-icon class="text-sm">restart_alt</mat-icon>
                    </button>
                  </div>

                  <!-- Send Action Trigger -->
                  <button 
                    (click)="sendRequest()"
                    [disabled]="isRequesting()"
                    class="px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 active:scale-[0.98] cursor-pointer min-h-[44px] border-transparent">
                    @if (isRequesting()) {
                      <mat-icon class="text-sm animate-spin">autorenew</mat-icon>
                      Sending...
                    } @else {
                      <mat-icon class="text-sm">send</mat-icon>
                      Send
                    }
                  </button>

                </div>

                <!-- Tabs: Headers & Body -->
                <div class="space-y-3">
                  
                  <!-- Tabs Headers -->
                  <div class="flex border-b border-zinc-900">
                    <span class="px-4 py-2 border-b-2 border-purple-500 text-purple-400 font-bold text-[10px] uppercase tracking-wider font-mono">
                      Headers & Configuration
                    </span>
                  </div>

                  <!-- Key Value Headers Editor -->
                  <div class="bg-zinc-900/30 border border-zinc-900/60 rounded-xl p-4 space-y-2">
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-[9px] text-zinc-500 uppercase tracking-widest font-mono font-sans">Request Headers</span>
                      <button 
                        (click)="addHeader()"
                        class="text-[9px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer border-transparent bg-transparent">
                        <mat-icon class="text-xs">add</mat-icon>
                        Add Header
                      </button>
                    </div>

                    <div class="space-y-1.5">
                      @for (header of requestHeaders(); track $index) {
                        <div class="flex items-center gap-2">
                          <input 
                            type="text" 
                            [(ngModel)]="header.key"
                            placeholder="Key (e.g. Content-Type)" 
                            class="flex-1 bg-zinc-900/80 border border-zinc-850 rounded px-2 py-1 text-[10px] font-mono text-zinc-300 focus:outline-none focus:border-zinc-750 transition-all" />
                          <input 
                            type="text" 
                            [(ngModel)]="header.value"
                            placeholder="Value" 
                            class="flex-1 bg-zinc-900/80 border border-zinc-850 rounded px-2 py-1 text-[10px] font-mono text-zinc-300 focus:outline-none focus:border-zinc-750 transition-all" />
                          <button 
                            (click)="removeHeader($index)"
                            class="text-zinc-650 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer border-transparent bg-transparent">
                            <mat-icon class="text-sm">delete</mat-icon>
                          </button>
                        </div>
                      }
                    </div>
                  </div>

                  <!-- Request Body Container (only for POST/PATCH) -->
                  @if (requestMethod() === 'POST' || requestMethod() === 'PATCH') {
                    <div class="space-y-2 animate-fade-in">
                      <div class="flex items-center justify-between">
                        <span class="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Request Body (application/json)</span>
                        <button 
                          (click)="prettifyJSON()"
                          class="text-[9px] text-teal-400 hover:text-teal-300 font-bold flex items-center gap-0.5 cursor-pointer border-transparent bg-transparent">
                          <mat-icon class="text-xs">format_align_left</mat-icon>
                          Format JSON
                        </button>
                      </div>
                      <textarea 
                        [value]="requestBody()"
                        (input)="onBodyInput($event)"
                        rows="5"
                        class="w-full bg-zinc-900/90 border border-zinc-850 rounded-xl p-4 text-[11px] font-mono text-teal-400 focus:outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 transition-all"
                        placeholder="{&#10;  &quot;key&quot;: &quot;value&quot;&#10;}"></textarea>
                    </div>
                  }

                </div>

              </div>
            </div>

            <!-- Response Panel -->
            <div class="bg-zinc-950/60 border border-zinc-900 rounded-2xl overflow-hidden relative shadow-2xl">
              <div class="bg-zinc-900/40 border-b border-zinc-900 px-4 py-3.5 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <mat-icon class="text-purple-400 text-sm">dns</mat-icon>
                  <span class="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-bold">API Gateway Response</span>
                </div>

                @if (responseStatus() !== null) {
                  <div class="flex items-center gap-4 text-[10px] font-mono">
                    
                    <!-- Status Code Badge -->
                    <div class="flex items-center gap-1.5">
                      <span class="text-zinc-500">Status:</span>
                      <span class="px-2 py-0.5 rounded font-bold uppercase tracking-wider"
                            [ngClass]="{
                              'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20': responseStatus()! >= 200 && responseStatus()! < 300,
                              'bg-amber-500/10 text-amber-400 border border-amber-500/20': responseStatus()! >= 400 && responseStatus()! < 500,
                              'bg-rose-500/10 text-rose-400 border border-rose-500/20': responseStatus()! >= 500 || responseStatus()! === 0
                            }">
                        {{ responseStatus() }} {{ responseStatusText() }}
                      </span>
                    </div>

                    <!-- Response Time -->
                    <div class="flex items-center gap-1.5">
                      <span class="text-zinc-500">Time:</span>
                      <span class="text-teal-400 font-bold">{{ responseTime() }} ms</span>
                    </div>

                    <!-- Size -->
                    <div class="flex items-center gap-1.5">
                      <span class="text-zinc-500">Size:</span>
                      <span class="text-zinc-300 font-bold">{{ responseSize()! >= 1024 ? (responseSize()! / 1024 | number:'1.1-2') + ' KB' : responseSize() + ' B' }}</span>
                    </div>

                  </div>
                }
              </div>

              <!-- Response Output -->
              <div class="p-6">
                @if (responseStatus() === null) {
                  <div class="flex flex-col items-center justify-center py-12 text-center border border-zinc-900 border-dashed rounded-xl bg-zinc-950/20">
                    <mat-icon class="text-zinc-700 text-3xl mb-2 animate-bounce">settings_ethernet</mat-icon>
                    <p class="text-xs text-zinc-400 font-semibold">No response fetched yet</p>
                    <p class="text-[10px] text-zinc-650 max-w-sm mt-1">Configure your method, endpoint, headers, and click 'Send' to dispatch an HTTP request onto the routing gateway.</p>
                  </div>
                } @else {
                  <div class="space-y-4">
                    
                    <!-- Tabs Selection for Response Details (Body / Headers) -->
                    <div class="flex border-b border-zinc-900/60 pb-px text-[10px] font-mono">
                      <span class="px-4 py-2 border-b-2 border-teal-500 text-teal-400 font-bold uppercase tracking-wider">
                        Response Body
                      </span>
                    </div>

                    <!-- Colorized JSON Body Printout -->
                    <pre class="bg-zinc-950 border border-zinc-900/80 p-5 rounded-xl text-[11px] text-zinc-300 font-mono overflow-x-auto max-h-[350px] custom-scrollbar selection:bg-purple-500/30">
{{ responseBody() }}
                    </pre>

                    <!-- Response Headers list -->
                    @if (responseHeaders().length) {
                      <div class="space-y-2 pt-2 border-t border-zinc-900/30">
                        <span class="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Response Headers (CORS / Proxy Metadata)</span>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-mono">
                          @for (h of responseHeaders(); track h.key) {
                            <div class="bg-zinc-900/30 border border-zinc-900 px-3 py-1.5 rounded flex items-center justify-between">
                              <span class="text-zinc-500 truncate mr-2">{{ h.key }}</span>
                              <span class="text-zinc-300 font-bold truncate max-w-[150px]" [title]="h.value">{{ h.value }}</span>
                            </div>
                          }
                        </div>
                      </div>
                    }

                  </div>
                }
              </div>
            </div>

          </div>

        </div>
      }

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

  activeTab = signal<'orchestration' | 'postman'>('orchestration');

  // Postman Client signals
  requestMethod = signal<'GET' | 'POST' | 'PATCH' | 'DELETE'>('GET');
  requestUrl = signal<string>('/api/leads');
  requestBody = signal<string>('{\n  "name": "Jane Doe",\n  "company": "Stark Industries",\n  "value": 45000,\n  "status": "new"\n}');
  requestHeaders = signal<{ key: string; value: string }[]>([
    { key: 'Content-Type', value: 'application/json' },
    { key: 'Authorization', value: 'Bearer appwrite-cloud-session' }
  ]);
  
  responseStatus = signal<number | null>(null);
  responseStatusText = signal<string>('');
  responseTime = signal<number | null>(null);
  responseSize = signal<number | null>(null);
  responseBody = signal<string>('');
  responseHeaders = signal<{ key: string; value: string }[]>([]);
  isRequesting = signal<boolean>(false);

  postmanHistory = signal<{ id: string; method: 'GET' | 'POST' | 'PATCH' | 'DELETE'; url: string; timestamp: string }[]>([
    { id: 'h-1', method: 'GET', url: '/api/leads', timestamp: '10 mins ago' },
    { id: 'h-2', method: 'GET', url: '/api/contracts', timestamp: '22 mins ago' }
  ]);

  postmanSavedRequests = signal<{ id: string; name: string; method: 'GET' | 'POST' | 'PATCH' | 'DELETE'; url: string; headers: { key: string; value: string }[]; body: string }[]>([
    {
      id: 'saved-1',
      name: 'Fetch CRM Leads',
      method: 'GET',
      url: '/api/leads',
      headers: [{ key: 'Content-Type', value: 'application/json' }],
      body: ''
    },
    {
      id: 'saved-2',
      name: 'Create New Lead Record',
      method: 'POST',
      url: '/api/leads',
      headers: [{ key: 'Content-Type', value: 'application/json' }],
      body: '{\n  "name": "Bruce Wayne",\n  "company": "Wayne Enterprises",\n  "value": 120000,\n  "status": "qualified"\n}'
    },
    {
      id: 'saved-3',
      name: 'Fetch System Tasks',
      method: 'GET',
      url: '/api/tasks',
      headers: [{ key: 'Content-Type', value: 'application/json' }],
      body: ''
    },
    {
      id: 'saved-4',
      name: 'Simulate Microservice Transaction',
      method: 'POST',
      url: '/api/simulate-edit',
      headers: [{ key: 'Content-Type', value: 'application/json' }],
      body: '{\n  "source": "Postman Engine",\n  "payload": { "event": "transaction_completed" }\n}'
    }
  ]);

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
    try {
      const saved = localStorage.getItem('laevos_saved_requests');
      if (saved) {
        this.postmanSavedRequests.set(JSON.parse(saved) as typeof this.postmanSavedRequests extends import('@angular/core').WritableSignal<infer T> ? T : never);
      }
    } catch {
      // Ignore localStorage read errors
    }

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

  // Postman Handlers & Actions
  onMethodChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.requestMethod.set(select.value as 'GET' | 'POST' | 'PATCH' | 'DELETE');
  }

  onUrlInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.requestUrl.set(input.value);
  }

  onBodyInput(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    this.requestBody.set(textarea.value);
  }

  prettifyJSON() {
    try {
      const parsed = JSON.parse(this.requestBody());
      this.requestBody.set(JSON.stringify(parsed, null, 2));
    } catch {
      this.appwrite.addNotification({
        title: 'JSON Parse Error',
        message: 'The current request body contains invalid JSON characters.',
        type: 'warning'
      });
    }
  }

  addHeader() {
    this.requestHeaders.update(headers => [...headers, { key: '', value: '' }]);
  }

  removeHeader(index: number) {
    this.requestHeaders.update(headers => headers.filter((_, i) => i !== index));
  }

  loadSavedRequest(req: { id: string; name: string; method: 'GET' | 'POST' | 'PATCH' | 'DELETE'; url: string; headers?: { key: string; value: string }[]; body?: string }) {
    this.playCrystallineChime();
    this.requestMethod.set(req.method);
    this.requestUrl.set(req.url);
    if (req.headers && req.headers.length) {
      this.requestHeaders.set([...req.headers]);
    } else {
      this.requestHeaders.set([{ key: 'Content-Type', value: 'application/json' }]);
    }
    this.requestBody.set(req.body || '');
    this.appwrite.addNotification({
      title: 'Request Config Loaded',
      message: `Loaded template: ${req.name}`,
      type: 'info'
    });
  }

  saveCurrentRequest() {
    const name = prompt('Enter a name for this saved request:');
    if (!name) return;
    
    const req = {
      id: 'saved-' + Date.now(),
      name,
      method: this.requestMethod(),
      url: this.requestUrl(),
      headers: [...this.requestHeaders()],
      body: this.requestBody()
    };

    this.postmanSavedRequests.update(list => {
      const updated = [...list, req];
      try {
        localStorage.setItem('laevos_saved_requests', JSON.stringify(updated));
      } catch {
        // ignore localStorage write block
      }
      return updated;
    });

    this.appwrite.addNotification({
      title: 'Request Saved',
      message: `[${name}] saved to local collections.`,
      type: 'success'
    });
  }

  clearHistory() {
    this.postmanHistory.set([]);
  }

  private addToHistory(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', url: string) {
    this.postmanHistory.update(history => [
      {
        id: 'h-' + Date.now(),
        method,
        url,
        timestamp: 'Just Now'
      },
      ...history.slice(0, 19) // limit to 20 entries
    ]);
  }

  async sendRequest() {
    this.isRequesting.set(true);
    this.playCrystallineChime();
    const start = Date.now();
    
    try {
      const headersObj: Record<string, string> = {};
      this.requestHeaders().forEach(h => {
        if (h.key.trim()) {
          headersObj[h.key] = h.value;
        }
      });

      const options: RequestInit = {
        method: this.requestMethod(),
        headers: headersObj,
      };

      if (this.requestMethod() !== 'GET' && this.requestMethod() !== 'DELETE') {
        options.body = this.requestBody();
      }

      const res = await fetch(this.requestUrl(), options);
      const end = Date.now();
      
      this.responseStatus.set(res.status);
      this.responseStatusText.set(res.statusText);
      this.responseTime.set(end - start);

      const resHeaders: { key: string; value: string }[] = [];
      res.headers.forEach((val, key) => {
        resHeaders.push({ key, value: val });
      });
      this.responseHeaders.set(resHeaders);

      const text = await res.text();
      this.responseSize.set(text.length);
      
      try {
        const parsed = JSON.parse(text);
        this.responseBody.set(JSON.stringify(parsed, null, 2));
      } catch {
        this.responseBody.set(text);
      }

      this.playSuccessHarmonic();
      this.addToHistory(this.requestMethod(), this.requestUrl());

      const notifType: 'success' | 'warning' = res.ok ? 'success' : 'warning';
      this.appwrite.addNotification({
        title: 'API Request Completed',
        message: `${this.requestMethod()} ${this.requestUrl()} completed with status ${res.status} in ${end - start}ms`,
        type: notifType
      });
    } catch (err: unknown) {
      const end = Date.now();
      const errMsg = err instanceof Error ? err.message : String(err);
      this.responseStatus.set(0);
      this.responseStatusText.set('Error');
      this.responseTime.set(end - start);
      this.responseSize.set(0);
      this.responseBody.set(errMsg || 'Failed to execute fetch request. Check CORS settings or network connection.');
      this.responseHeaders.set([]);
      
      this.appwrite.addNotification({
        title: 'API Request Failed',
        message: errMsg || 'Network error occurred during API dispatch.',
        type: 'error'
      });
    } finally {
      this.isRequesting.set(false);
    }
  }

  downloadPostmanCollection() {
    this.playCrystallineChime();
    const collection = {
      info: {
        name: "Laevos CRM & Gateway Collection",
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
        description: "Automated API endpoints collection generated from Laevos Distributed Systems Gateway"
      },
      item: [
        {
          name: "Get Leads Pipeline",
          request: {
            method: "GET",
            header: [
              { key: "Content-Type", value: "application/json" }
            ],
            url: {
              raw: "{{base_url}}/api/leads",
              host: ["{{base_url}}"],
              path: ["api", "leads"]
            }
          }
        },
        {
          name: "Create CRM Lead",
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                name: "Bruce Wayne",
                company: "Wayne Enterprises",
                value: 120000,
                status: "qualified"
              }, null, 2)
            },
            url: {
              raw: "{{base_url}}/api/leads",
              host: ["{{base_url}}"],
              path: ["api", "leads"]
            }
          }
        },
        {
          name: "Get Contracts",
          request: {
            method: "GET",
            header: [
              { key: "Content-Type", value: "application/json" }
            ],
            url: {
              raw: "{{base_url}}/api/contracts",
              host: ["{{base_url}}"],
              path: ["api", "contracts"]
            }
          }
        },
        {
          name: "Create Contract SLA",
          request: {
            method: "POST",
            header: [
              { key: "Content-Type", value: "application/json" }
            ],
            body: {
              mode: "raw",
              raw: JSON.stringify({
                title: "Enterprise Licensing Agreement",
                client: "LexCorp",
                value: 85000,
                status: "Draft"
              }, null, 2)
            },
            url: {
              raw: "{{base_url}}/api/contracts",
              host: ["{{base_url}}"],
              path: ["api", "contracts"]
            }
          }
        }
      ]
    };

    const blob = new Blob([JSON.stringify(collection, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'laevos-collection.postman_collection.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.appwrite.addNotification({
      title: 'Collection Downloaded',
      message: 'Postman v2.1 collection exported! You can now import this file directly into the Postman Desktop App.',
      type: 'success'
    });
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
