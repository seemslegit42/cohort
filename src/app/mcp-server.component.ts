import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { Appwrite } from './appwrite';

interface McpToolManifest {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties?: Record<string, { type?: string; description?: string; enum?: string[] }>;
    required?: string[];
  };
}

interface McpResourceManifest {
  uri: string;
  name: string;
  mimeType: string;
  description: string;
}

interface McpPromptManifest {
  name: string;
  description: string;
}

interface McpStatusResponse {
  server: {
    name: string;
    version: string;
    protocolVersion: string;
    status: string;
    instructions: string;
  };
  transports: string[];
  endpoints: {
    jsonRpc: string;
    sse: string;
    messages: string;
    status: string;
  };
  tools: McpToolManifest[];
  resources: McpResourceManifest[];
  prompts: McpPromptManifest[];
  serverUrl: string;
  uptimeSeconds: number;
  clientConfigurations: {
    claudeDesktop: {
      mcpServers: Record<string, { command: string; args: string[] }>;
    };
    claudeDesktopRemoteSse: {
      mcpServers: Record<string, { url: string }>;
    };
    cursor: {
      name: string;
      type: string;
      command: string;
    };
    curlExample: string;
  };
}

interface ExecutionLog {
  id: string;
  timestamp: string;
  toolName: string;
  arguments: Record<string, unknown>;
  latencyMs: number;
  status: 'success' | 'error';
  resultText: string;
}

@Component({
  selector: 'app-mcp-server',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <div class="min-h-full p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      
      <!-- Top Banner / Hero -->
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 border border-zinc-800/80 p-6 shadow-2xl">
        <div class="absolute -right-12 -top-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -left-12 -bottom-12 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div class="space-y-2">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 shadow-inner">
                <mat-icon class="text-2xl">hub</mat-icon>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h1 class="text-2xl font-bold text-white tracking-tight font-display">Model Context Protocol (MCP) Server</h1>
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    ACTIVE / READY
                  </span>
                </div>
                <p class="text-xs text-zinc-400">
                  Connect Claude Desktop, Cursor, and AI agents directly to Leadwave CRM via JSON-RPC 2.0 and Stdio.
                </p>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <button
              (click)="runHealthCheck()"
              [disabled]="isTesting()"
              class="px-3.5 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-zinc-700/80 flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50">
              <mat-icon [class.animate-spin]="isTesting()" class="text-base text-teal-400">sync</mat-icon>
              <span>{{ isTesting() ? 'Checking...' : 'Run Diagnostics' }}</span>
            </button>
            <button
              (click)="activeTab.set('config')"
              class="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-xs font-bold text-zinc-950 flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-teal-500/20 active:scale-95">
              <mat-icon class="text-base">code</mat-icon>
              <span>Client Setup Guide</span>
            </button>
          </div>
        </div>

        <!-- Telemetry Stats Strip -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-zinc-800/70">
          <div class="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-3">
            <p class="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Protocol Version</p>
            <p class="text-base font-bold text-white font-mono mt-0.5">{{ serverInfo()?.protocolVersion || '2024-11-05' }}</p>
          </div>
          <div class="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-3">
            <p class="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Available Tools</p>
            <p class="text-base font-bold text-teal-400 font-mono mt-0.5">{{ tools().length || 12 }} Tools</p>
          </div>
          <div class="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-3">
            <p class="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Resources / Prompts</p>
            <p class="text-base font-bold text-purple-400 font-mono mt-0.5">{{ resources().length }} Res / {{ prompts().length }} Prompts</p>
          </div>
          <div class="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-3">
            <p class="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Session Invocations</p>
            <p class="text-base font-bold text-emerald-400 font-mono mt-0.5">{{ executionLogs().length }} Executed</p>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          (click)="activeTab.set('playground')"
          [class]="activeTab() === 'playground' ? 'bg-zinc-800 text-white font-bold border-zinc-700' : 'text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-zinc-900/50'"
          class="px-4 py-2 rounded-xl text-xs border flex items-center gap-2 transition-all cursor-pointer">
          <mat-icon class="text-sm text-teal-400">play_arrow</mat-icon>
          <span>Tool Playground</span>
        </button>
        <button
          (click)="activeTab.set('resources')"
          [class]="activeTab() === 'resources' ? 'bg-zinc-800 text-white font-bold border-zinc-700' : 'text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-zinc-900/50'"
          class="px-4 py-2 rounded-xl text-xs border flex items-center gap-2 transition-all cursor-pointer">
          <mat-icon class="text-sm text-purple-400">folder_open</mat-icon>
          <span>Resources & Prompts</span>
        </button>
        <button
          (click)="activeTab.set('config')"
          [class]="activeTab() === 'config' ? 'bg-zinc-800 text-white font-bold border-zinc-700' : 'text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-zinc-900/50'"
          class="px-4 py-2 rounded-xl text-xs border flex items-center gap-2 transition-all cursor-pointer">
          <mat-icon class="text-sm text-amber-400">terminal</mat-icon>
          <span>Connect Clients</span>
        </button>
        <button
          (click)="activeTab.set('logs')"
          [class]="activeTab() === 'logs' ? 'bg-zinc-800 text-white font-bold border-zinc-700' : 'text-zinc-400 hover:text-zinc-200 border-transparent hover:bg-zinc-900/50'"
          class="px-4 py-2 rounded-xl text-xs border flex items-center gap-2 transition-all cursor-pointer">
          <mat-icon class="text-sm text-sky-400">receipt_long</mat-icon>
          <span>Call Logs ({{ executionLogs().length }})</span>
        </button>
      </div>

      <!-- TAB 1: TOOL PLAYGROUND -->
      @if (activeTab() === 'playground') {
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <!-- Left: Tool Selector & Arguments -->
          <div class="lg:col-span-5 space-y-4">
            <div class="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
              <div>
                <label for="mcp-tool-select" class="block text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Select MCP Tool</label>
                <select
                  id="mcp-tool-select"
                  [ngModel]="selectedToolName()"
                  (ngModelChange)="onSelectTool($event)"
                  class="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500 font-mono">
                  @for (t of tools(); track t.name) {
                    <option [value]="t.name">{{ t.name }}</option>
                  }
                </select>
              </div>

              @if (currentTool(); as tool) {
                <div class="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3.5 space-y-1.5">
                  <p class="text-[11px] font-semibold text-teal-300 font-mono">{{ tool.name }}</p>
                  <p class="text-xs text-zinc-400 leading-relaxed">{{ tool.description }}</p>
                </div>

                <div class="space-y-3 pt-2">
                  <div class="flex items-center justify-between">
                    <label for="mcp-args-input" class="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Arguments (JSON format)</label>
                    <button
                      (click)="fillSampleArgs()"
                      class="text-[11px] text-teal-400 hover:text-teal-300 font-semibold cursor-pointer">
                      Pre-fill Sample
                    </button>
                  </div>

                  <textarea
                    id="mcp-args-input"
                    [(ngModel)]="toolArgsInput"
                    rows="7"
                    class="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 leading-relaxed"
                    placeholder="{}">
                  </textarea>
                  @if (jsonParseError()) {
                    <p class="text-[11px] text-rose-400 font-mono">{{ jsonParseError() }}</p>
                  }
                </div>

                <button
                  (click)="executeSelectedTool()"
                  [disabled]="isExecuting()"
                  class="w-full py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-teal-500/20 active:scale-[0.99] disabled:opacity-50">
                  <mat-icon [class.animate-spin]="isExecuting()" class="text-base">
                    {{ isExecuting() ? 'hourglass_top' : 'bolt' }}
                  </mat-icon>
                  <span>{{ isExecuting() ? 'Invoking MCP Tool...' : 'Execute Tool via JSON-RPC 2.0' }}</span>
                </button>
              }
            </div>
          </div>

          <!-- Right: Result & Protocol Inspector -->
          <div class="lg:col-span-7 space-y-4">
            <div class="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 space-y-4 flex flex-col h-full min-h-[420px]">
              <div class="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-white uppercase tracking-wider font-mono">Response Payload</span>
                  @if (lastExecutionLatency()) {
                    <span class="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      {{ lastExecutionLatency() }}ms
                    </span>
                  }
                </div>

                <div class="flex items-center gap-2">
                  <button
                    (click)="showRawJsonRpc.set(!showRawJsonRpc())"
                    class="text-[11px] font-mono text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-800 border border-zinc-700 transition-colors">
                    {{ showRawJsonRpc() ? 'Show Tool Output' : 'View Raw JSON-RPC' }}
                  </button>
                  <button
                    (click)="copyResult()"
                    class="text-[11px] font-mono text-teal-400 hover:text-teal-300 px-2 py-1 rounded bg-teal-500/10 border border-teal-500/20 transition-colors">
                    {{ isCopied() ? 'Copied!' : 'Copy' }}
                  </button>
                </div>
              </div>

              <!-- Output Display -->
              <div class="flex-1 overflow-y-auto max-h-[500px] custom-scrollbar bg-zinc-950 rounded-xl p-4 border border-zinc-800/80">
                @if (executionResult()) {
                  <pre class="text-xs font-mono text-zinc-200 whitespace-pre-wrap leading-relaxed">{{ executionResult() }}</pre>
                } @else {
                  <div class="flex flex-col items-center justify-center h-full py-16 text-center text-zinc-500 space-y-2">
                    <mat-icon class="text-3xl text-zinc-600">terminal</mat-icon>
                    <p class="text-xs">Select a tool on the left and click "Execute Tool" to inspect the JSON-RPC response.</p>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      }

      <!-- TAB 2: RESOURCES & PROMPTS -->
      @if (activeTab() === 'resources') {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <!-- Resources Column -->
          <div class="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <mat-icon class="text-base">folder_open</mat-icon>
              </div>
              <div>
                <h3 class="text-sm font-bold text-white">Registered Resources ({{ resources().length }})</h3>
                <p class="text-[11px] text-zinc-400">Read-only context providers accessible via <code class="text-purple-300">resources/read</code></p>
              </div>
            </div>

            <div class="space-y-3">
              @for (r of resources(); track r.uri) {
                <div class="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-white font-mono">{{ r.name }}</span>
                    <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">{{ r.mimeType }}</span>
                  </div>
                  <p class="text-xs text-zinc-400">{{ r.description }}</p>
                  <div class="flex items-center justify-between pt-1">
                    <code class="text-[10px] text-zinc-500 font-mono">{{ r.uri }}</code>
                    <button
                      (click)="readResource(r.uri)"
                      class="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] font-semibold text-zinc-200 border border-zinc-700 transition-colors cursor-pointer">
                      Read Resource
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Prompts Column -->
          <div class="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <mat-icon class="text-base">chat_bubble</mat-icon>
              </div>
              <div>
                <h3 class="text-sm font-bold text-white">Prompt Templates ({{ prompts().length }})</h3>
                <p class="text-[11px] text-zinc-400">Templated prompt workflows accessible via <code class="text-indigo-300">prompts/get</code></p>
              </div>
            </div>

            <div class="space-y-3">
              @for (p of prompts(); track p.name) {
                <div class="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 space-y-2">
                  <span class="text-xs font-bold text-white font-mono">{{ p.name }}</span>
                  <p class="text-xs text-zinc-400">{{ p.description }}</p>
                  <div class="flex items-center justify-end pt-1">
                    <button
                      (click)="getPrompt(p.name)"
                      class="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] font-semibold text-zinc-200 border border-zinc-700 transition-colors cursor-pointer">
                      Generate Prompt
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- TAB 3: CLIENT CONFIGURATION GUIDE -->
      @if (activeTab() === 'config') {
        <div class="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-6 space-y-6">
          <div>
            <h2 class="text-base font-bold text-white tracking-tight">Connect AI Clients to Leadwave MCP</h2>
            <p class="text-xs text-zinc-400 mt-1">Configure your favorite desktop assistant or IDE to talk to Leadwave CRM.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Claude Desktop Config -->
            <div class="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">C</div>
                  <h3 class="text-xs font-bold text-white">Claude Desktop (Local Stdio)</h3>
                </div>
                <button
                  (click)="copyClaudeConfig()"
                  class="text-[11px] font-mono text-teal-400 hover:text-teal-300 px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20">
                  Copy Config
                </button>
              </div>
              <p class="text-[11px] text-zinc-400 leading-relaxed">
                Add to <code class="text-zinc-300 font-mono">claude_desktop_config.json</code> in your Claude configuration folder:
              </p>
              <pre class="bg-zinc-900 rounded-lg p-3 text-[11px] font-mono text-zinc-200 overflow-x-auto">{{ claudeSnippet() }}</pre>
            </div>

            <!-- Cursor / Windsurf Config -->
            <div class="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-3">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">⚙</div>
                  <h3 class="text-xs font-bold text-white">Cursor / Windsurf / Remote SSE</h3>
                </div>
                <button
                  (click)="copySseConfig()"
                  class="text-[11px] font-mono text-teal-400 hover:text-teal-300 px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20">
                  Copy URL
                </button>
              </div>
              <p class="text-[11px] text-zinc-400 leading-relaxed">
                Use the Remote MCP SSE Endpoint or direct command for IDE integrations:
              </p>
              <pre class="bg-zinc-900 rounded-lg p-3 text-[11px] font-mono text-zinc-200 overflow-x-auto">{{ sseSnippet() }}</pre>
            </div>
          </div>

          <!-- cURL / HTTP Direct Interface -->
          <div class="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-xs font-bold text-white font-mono">cURL / HTTP JSON-RPC 2.0 Direct Testing</h3>
              <button
                (click)="copyCurl()"
                class="text-[11px] font-mono text-teal-400 hover:text-teal-300 px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20">
                Copy cURL
              </button>
            </div>
            <pre class="bg-zinc-900 rounded-lg p-3 text-[11px] font-mono text-teal-300 overflow-x-auto">{{ curlSnippet() }}</pre>
          </div>
        </div>
      }

      <!-- TAB 4: CALL LOGS -->
      @if (activeTab() === 'logs') {
        <div class="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-5 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-bold text-white">Live Execution History</h3>
            <button
              (click)="executionLogs.set([])"
              class="text-xs text-zinc-400 hover:text-zinc-200">
              Clear Logs
            </button>
          </div>

          @if (executionLogs().length === 0) {
            <p class="text-xs text-zinc-500 py-8 text-center">No tool calls recorded in this session yet.</p>
          } @else {
            <div class="space-y-2.5">
              @for (log of executionLogs(); track log.id) {
                <div class="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3.5 space-y-2">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2 font-mono text-xs">
                      <span [class]="log.status === 'success' ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'" class="px-2 py-0.5 rounded font-bold">
                        {{ log.status }}
                      </span>
                      <span class="text-white font-bold">{{ log.toolName }}</span>
                    </div>
                    <div class="text-[10px] font-mono text-zinc-500">
                      {{ log.timestamp }} · <span class="text-teal-400">{{ log.latencyMs }}ms</span>
                    </div>
                  </div>
                  <pre class="text-[11px] font-mono text-zinc-400 max-h-32 overflow-y-auto custom-scrollbar bg-zinc-900/70 p-2.5 rounded-lg">{{ log.resultText }}</pre>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 5px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 5px; }
  `]
})
export class MCPServerComponent implements OnInit {
  private http = inject(HttpClient);
  private appwrite = inject(Appwrite);

  activeTab = signal<'playground' | 'resources' | 'config' | 'logs'>('playground');
  serverInfo = signal<McpStatusResponse['server'] | null>(null);
  tools = signal<McpToolManifest[]>([]);
  resources = signal<McpResourceManifest[]>([]);
  prompts = signal<McpPromptManifest[]>([]);
  selectedToolName = signal<string>('get_lead_summaries');
  toolArgsInput = '{\n  "status": "Qualified",\n  "limit": 5\n}';
  jsonParseError = signal<string | null>(null);

  isExecuting = signal<boolean>(false);
  isTesting = signal<boolean>(false);
  executionResult = signal<string>('');
  lastExecutionLatency = signal<number | null>(null);
  showRawJsonRpc = signal<boolean>(false);
  isCopied = signal<boolean>(false);

  executionLogs = signal<ExecutionLog[]>([]);

  currentTool = computed(() => {
    return this.tools().find(t => t.name === this.selectedToolName()) || this.tools()[0] || null;
  });

  claudeSnippet = computed(() => {
    return JSON.stringify({
      mcpServers: {
        'leadwave-crm': {
          command: 'npx',
          args: ['-y', 'tsx', `${typeof window !== 'undefined' ? window.location.origin : ''}/scripts/mcp-server.ts`]
        }
      }
    }, null, 2);
  });

  sseSnippet = computed(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    return JSON.stringify({
      mcpServers: {
        'leadwave-remote': {
          url: `${origin}/api/mcp/sse`
        }
      }
    }, null, 2);
  });

  curlSnippet = computed(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    return `curl -X POST ${origin}/api/mcp \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get_lead_summaries",
      "arguments": { "status": "Qualified", "limit": 5 }
    }
  }'`;
  });

  ngOnInit() {
    this.fetchManifest();
  }

  fetchManifest() {
    this.http.get<McpStatusResponse>('/api/mcp/status').subscribe({
      next: (res) => {
        this.serverInfo.set(res.server);
        this.tools.set(res.tools || []);
        this.resources.set(res.resources || []);
        this.prompts.set(res.prompts || []);
        if (res.tools && res.tools.length > 0 && !this.tools().some(t => t.name === this.selectedToolName())) {
          this.selectedToolName.set(res.tools[0].name);
        }
      },
      error: () => {
        // Fallback default manifest
        this.tools.set([
          {
            name: 'get_lead_summaries',
            description: 'Retrieve structured summaries of leads in Leadwave CRM pipeline.',
            inputSchema: { type: 'object', properties: { status: { type: 'string' }, limit: { type: 'number' } } }
          },
          {
            name: 'get_task_lists',
            description: 'Retrieve strategic task lists and action items.',
            inputSchema: { type: 'object', properties: { status: { type: 'string' }, priority: { type: 'string' } } }
          },
          {
            name: 'get_note_contents',
            description: 'Retrieve formatted knowledge notes and meeting debriefs.',
            inputSchema: { type: 'object', properties: { tag: { type: 'string' }, searchQuery: { type: 'string' } } }
          }
        ]);
        this.resources.set([
          { uri: 'leadwave://leads', name: 'Leadwave Pipeline Leads', mimeType: 'application/json', description: 'Pipeline leads dataset' },
          { uri: 'leadwave://tasks', name: 'Leadwave Task Backlog', mimeType: 'application/json', description: 'Active strategic tasks' },
          { uri: 'leadwave://notes', name: 'Leadwave Knowledge Base Notes', mimeType: 'application/json', description: 'Knowledge base entries' }
        ]);
        this.prompts.set([
          { name: 'leadwave_pipeline_review', description: 'Executive pipeline review prompt' }
        ]);
      }
    });
  }

  onSelectTool(name: string) {
    this.selectedToolName.set(name);
    this.fillSampleArgs();
  }

  fillSampleArgs() {
    const name = this.selectedToolName();
    let sample: Record<string, unknown> = {};

    if (name === 'get_lead_summaries' || name === 'crm_list_leads') {
      sample = { status: 'Qualified', limit: 5 };
    } else if (name === 'get_lead_details' || name === 'crm_get_lead') {
      sample = { id: '1' };
    } else if (name === 'get_task_lists' || name === 'crm_list_tasks') {
      sample = { priority: 'High', status: 'all' };
    } else if (name === 'get_note_contents' || name === 'crm_list_notes') {
      sample = { tag: 'Strategy', searchQuery: 'enterprise' };
    } else if (name === 'create_leadwave_task' || name === 'crm_create_task') {
      sample = { title: 'Review SLA terms with enterprise buyer', priority: 'High', dueDate: '2026-10-15' };
    } else if (name === 'create_leadwave_note' || name === 'crm_create_note') {
      sample = { title: 'Q4 Account Review Notes', content: 'Key objectives: 99.99% SLA, latency under 40ms.', tags: ['Q4', 'Enterprise'] };
    } else if (name === 'crm_score_lead') {
      sample = { id: '1' };
    } else if (name === 'crm_generate_sales_email') {
      sample = { leadId: '1', emailType: 'initial_outreach' };
    } else if (name === 'crm_search_crm') {
      sample = { query: 'Acme' };
    }

    this.toolArgsInput = JSON.stringify(sample, null, 2);
    this.jsonParseError.set(null);
  }

  executeSelectedTool() {
    let parsedArgs: Record<string, unknown> = {};
    try {
      parsedArgs = this.toolArgsInput.trim() ? JSON.parse(this.toolArgsInput) : {};
      this.jsonParseError.set(null);
    } catch {
      this.jsonParseError.set('Invalid JSON syntax in arguments textarea.');
      return;
    }

    this.isExecuting.set(true);
    const start = Date.now();
    const payload = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: this.selectedToolName(),
        arguments: parsedArgs
      }
    };

    this.http.post<Record<string, unknown>>('/api/mcp', payload).subscribe({
      next: (res) => {
        const latency = Date.now() - start;
        this.isExecuting.set(false);
        this.lastExecutionLatency.set(latency);

        let formatted = '';
        if (this.showRawJsonRpc()) {
          formatted = JSON.stringify(res, null, 2);
        } else {
          // Extract content from result
          const result = (res['result'] as { content?: { text?: string }[] }) || {};
          const content = result.content?.[0]?.text;
          if (content) {
            try {
              formatted = JSON.stringify(JSON.parse(content), null, 2);
            } catch {
              formatted = content;
            }
          } else {
            formatted = JSON.stringify(res, null, 2);
          }
        }

        this.executionResult.set(formatted);

        // Record execution log
        this.executionLogs.update(logs => [
          {
            id: 'log-' + Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            toolName: this.selectedToolName(),
            arguments: parsedArgs,
            latencyMs: latency,
            status: 'success',
            resultText: formatted
          },
          ...logs
        ]);
      },
      error: (err) => {
        const latency = Date.now() - start;
        this.isExecuting.set(false);
        this.lastExecutionLatency.set(latency);
        const errorText = JSON.stringify(err.error || { error: err.message }, null, 2);
        this.executionResult.set(errorText);

        this.executionLogs.update(logs => [
          {
            id: 'log-' + Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            toolName: this.selectedToolName(),
            arguments: parsedArgs,
            latencyMs: latency,
            status: 'error',
            resultText: errorText
          },
          ...logs
        ]);
      }
    });
  }

  readResource(uri: string) {
    this.activeTab.set('playground');
    this.isExecuting.set(true);
    const start = Date.now();
    const payload = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'resources/read',
      params: { uri }
    };

    this.http.post<Record<string, unknown>>('/api/mcp', payload).subscribe({
      next: (res) => {
        this.isExecuting.set(false);
        this.lastExecutionLatency.set(Date.now() - start);
        this.executionResult.set(JSON.stringify(res, null, 2));
      },
      error: (err) => {
        this.isExecuting.set(false);
        this.executionResult.set(JSON.stringify(err.error || { error: err.message }, null, 2));
      }
    });
  }

  getPrompt(name: string) {
    this.activeTab.set('playground');
    this.isExecuting.set(true);
    const start = Date.now();
    const payload = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'prompts/get',
      params: { name, arguments: {} }
    };

    this.http.post<Record<string, unknown>>('/api/mcp', payload).subscribe({
      next: (res) => {
        this.isExecuting.set(false);
        this.lastExecutionLatency.set(Date.now() - start);
        this.executionResult.set(JSON.stringify(res, null, 2));
      },
      error: (err) => {
        this.isExecuting.set(false);
        this.executionResult.set(JSON.stringify(err.error || { error: err.message }, null, 2));
      }
    });
  }

  runHealthCheck() {
    this.isTesting.set(true);
    this.http.get<McpStatusResponse>('/api/mcp/status').subscribe({
      next: (res) => {
        this.isTesting.set(false);
        this.serverInfo.set(res.server);
        this.tools.set(res.tools || []);
        this.appwrite.addNotification({
          title: 'MCP Diagnostics Passed',
          message: `Server active with ${res.tools?.length || 0} tools and ${res.resources?.length || 0} resources.`,
          type: 'success'
        });
      },
      error: () => {
        this.isTesting.set(false);
        this.appwrite.addNotification({
          title: 'MCP Server Offline',
          message: 'Could not connect to /api/mcp/status.',
          type: 'error'
        });
      }
    });
  }

  copyResult() {
    if (typeof navigator !== 'undefined' && this.executionResult()) {
      navigator.clipboard.writeText(this.executionResult());
      this.isCopied.set(true);
      setTimeout(() => this.isCopied.set(false), 2000);
    }
  }

  copyClaudeConfig() {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(this.claudeSnippet());
      this.appwrite.addNotification({ title: 'Copied Claude Config', message: 'Ready to paste into claude_desktop_config.json', type: 'success' });
    }
  }

  copySseConfig() {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(this.sseSnippet());
      this.appwrite.addNotification({ title: 'Copied Remote SSE Config', message: 'Ready for Cursor or Claude Remote Connector', type: 'success' });
    }
  }

  copyCurl() {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(this.curlSnippet());
      this.appwrite.addNotification({ title: 'Copied cURL Command', message: 'Paste into your terminal to test /api/mcp', type: 'success' });
    }
  }
}
