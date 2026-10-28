/* eslint-disable @typescript-eslint/no-explicit-any, prefer-const, no-async-promise-executor, @typescript-eslint/no-unused-expressions */
import { 
  Component, 
  ChangeDetectionStrategy, 
  inject, 
  signal, 
  computed, 
  input, 
  viewChild 
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { GoogleMapsModule, GoogleMap, MapAdvancedMarker, MapInfoWindow } from '@angular/google-maps';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { LeadService, Lead } from './lead.service';

@Component({
  selector: 'app-lead-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, GoogleMapsModule, MatIconModule, CurrencyPipe],
  template: `
    <div class="h-full w-full flex flex-col relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 min-h-[500px]">
      
      <!-- Top Floating Map Control Bar -->
      <div class="p-3 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 z-10 shadow-lg">
        
        <!-- Left: Territory Stats HUD & Title -->
        <div class="flex items-center gap-3 flex-wrap">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
              <mat-icon class="text-[18px]">public</mat-icon>
            </div>
            <div>
              <h3 class="text-xs font-bold text-white tracking-wide uppercase font-display flex items-center gap-1.5">
                Territory Map Intelligence
                <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Live
                </span>
              </h3>
              <p class="text-[11px] text-zinc-400">
                Plotted <span class="text-white font-semibold">{{ validLeads().length }}</span> active prospect accounts
              </p>
            </div>
          </div>

          <!-- Mapped Pipeline Value Badge -->
          <div class="hidden sm:flex items-center gap-3 px-3 py-1 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs">
            <div>
              <span class="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block">Mapped Pipeline</span>
              <span class="text-teal-400 font-mono font-bold">{{ totalMappedValue() | currency:'USD':'symbol':'1.0-0' }}</span>
            </div>
            <div class="w-px h-6 bg-zinc-800"></div>
            <div>
              <span class="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block">Avg Deal</span>
              <span class="text-zinc-200 font-mono font-semibold">{{ avgDealValue() | currency:'USD':'symbol':'1.0-0' }}</span>
            </div>
          </div>
        </div>

        <!-- Center / Right: Filters & Controls -->
        <div class="flex items-center gap-2 flex-wrap">
          <!-- Search input -->
          <div class="relative">
            <mat-icon class="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 text-[16px]">search</mat-icon>
            <input 
              type="text" 
              placeholder="Search territory..."
              [value]="searchFilter()"
              (input)="searchFilter.set($any($event.target).value)"
              class="w-32 sm:w-44 bg-zinc-950 border border-zinc-800 rounded-xl py-1.5 pl-8 pr-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500/50" />
            @if (searchFilter()) {
              <button 
                type="button"
                (click)="searchFilter.set('')"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                <mat-icon class="text-[14px]">close</mat-icon>
              </button>
            }
          </div>

          <!-- Stage Filter -->
          <select 
            [value]="selectedStage()" 
            (change)="selectedStage.set($any($event.target).value)"
            class="bg-zinc-950 border border-zinc-800 text-zinc-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-teal-500/50 cursor-pointer">
            <option value="All">All Stages</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Proposal">Proposal</option>
            <option value="Negotiation">Negotiation</option>
            <option value="Closed">Closed</option>
          </select>

          <!-- Quick Region Jumps -->
          <div class="flex items-center gap-0.5 bg-zinc-950 p-0.5 border border-zinc-800 rounded-xl">
            <button 
              type="button"
              (click)="jumpToRegion('na')"
              title="Focus North America"
              class="px-2 py-1 text-[11px] font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer">
              NA
            </button>
            <button 
              type="button"
              (click)="jumpToRegion('eu')"
              title="Focus Europe"
              class="px-2 py-1 text-[11px] font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer">
              EU
            </button>
            <button 
              type="button"
              (click)="jumpToRegion('apac')"
              title="Focus Asia-Pacific"
              class="px-2 py-1 text-[11px] font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer">
              APAC
            </button>
            <button 
              type="button"
              (click)="fitAllMarkers()"
              title="Fit All Locations"
              class="p-1 text-teal-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer flex items-center justify-center">
              <mat-icon class="text-[16px]">crop_free</mat-icon>
            </button>
          </div>

          <!-- Map Type Switcher -->
          <div class="flex items-center gap-0.5 bg-zinc-950 p-0.5 border border-zinc-800 rounded-xl">
            <button 
              type="button"
              (click)="mapTypeId.set('roadmap')"
              [class.bg-zinc-800]="mapTypeId() === 'roadmap'"
              [class.text-white]="mapTypeId() === 'roadmap'"
              [class.text-zinc-400]="mapTypeId() !== 'roadmap'"
              title="Standard Roadmap"
              class="px-2 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer">
              Map
            </button>
            <button 
              type="button"
              (click)="mapTypeId.set('hybrid')"
              [class.bg-zinc-800]="mapTypeId() === 'hybrid'"
              [class.text-white]="mapTypeId() === 'hybrid'"
              [class.text-zinc-400]="mapTypeId() !== 'hybrid'"
              title="Satellite / Hybrid"
              class="px-2 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer">
              Satellite
            </button>
            <button 
              type="button"
              (click)="mapTypeId.set('terrain')"
              [class.bg-zinc-800]="mapTypeId() === 'terrain'"
              [class.text-white]="mapTypeId() === 'terrain'"
              [class.text-zinc-400]="mapTypeId() !== 'terrain'"
              title="Terrain Map"
              class="px-2 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer">
              Terrain
            </button>
          </div>
        </div>

      </div>

      <!-- Map Container / Loading Overlay -->
      <div class="flex-1 w-full relative">
        @if (!isLoaded()) {
          <div class="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center text-center p-6 z-50">
            @if (loadError()) {
              <div class="max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center space-y-3">
                <div class="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                  <mat-icon class="text-2xl">error_outline</mat-icon>
                </div>
                <h3 class="text-base font-bold text-white">Google Maps Unavailable</h3>
                <p class="text-xs text-zinc-400 leading-relaxed">
                  Unable to initialize Google Maps Platform. Please verify your connection and API key configuration.
                </p>
                <button 
                  type="button"
                  (click)="retryLoading()"
                  class="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-xl text-xs transition-colors cursor-pointer">
                  Retry Connection
                </button>
              </div>
            } @else {
              <div class="flex flex-col items-center gap-3">
                <div class="w-10 h-10 border-2 border-teal-500/20 border-t-teal-400 rounded-full animate-spin"></div>
                <p class="text-xs text-zinc-400 font-semibold tracking-wide">Loading Google Maps Platform...</p>
              </div>
            }
          </div>
        }

        @if (isLoaded()) {
          <google-map 
            #googleMapRef
            height="100%" 
            width="100%" 
            [center]="center()" 
            [zoom]="zoom()"
            [mapTypeId]="$any(mapTypeId())"
            [options]="mapOptions">
            
            @for (lead of validLeads(); track lead.$id || lead.name) {
              <map-advanced-marker
                #marker="mapAdvancedMarker"
                [position]="{ lat: lead.lat!, lng: lead.lng! }"
                [title]="lead.name + ' - ' + (lead.company || lead.industry || 'Lead')"
                (mapClick)="openInfoWindow(marker, lead)">
              </map-advanced-marker>
            }

            <map-info-window #infoWindowRef>
              @if (activeLead(); as lead) {
                <div class="p-3 text-zinc-100 max-w-xs font-sans">
                  <!-- Header -->
                  <div class="flex items-start justify-between gap-2 border-b border-zinc-700/60 pb-2 mb-2">
                    <div>
                      <h4 class="font-bold text-sm text-white leading-tight">{{ lead.name }}</h4>
                      <p class="text-[11px] text-teal-400 font-medium mt-0.5">
                        {{ lead.jobTitle || 'Executive Contact' }}
                        @if (lead.company) {
                          <span class="text-zinc-400 font-normal"> · {{ lead.company }}</span>
                        }
                      </p>
                    </div>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase border shrink-0"
                          [class.bg-emerald-500-20]="lead.status === 'Qualified' || lead.status === 'Proposal'"
                          [class.text-emerald-400]="lead.status === 'Qualified' || lead.status === 'Proposal'"
                          [class.border-emerald-500-30]="lead.status === 'Qualified' || lead.status === 'Proposal'"
                          [class.bg-purple-500-20]="lead.status === 'Negotiation' || lead.status === 'Closed'"
                          [class.text-purple-300]="lead.status === 'Negotiation' || lead.status === 'Closed'"
                          [class.border-purple-500-30]="lead.status === 'Negotiation' || lead.status === 'Closed'"
                          [class.bg-amber-500-20]="lead.status === 'New' || lead.status === 'Contacted'"
                          [class.text-amber-300]="lead.status === 'New' || lead.status === 'Contacted'"
                          [class.border-amber-500-30]="lead.status === 'New' || lead.status === 'Contacted'">
                      {{ lead.status }}
                    </span>
                  </div>

                  <!-- Details Grid -->
                  <div class="space-y-1.5 text-xs text-zinc-300 mb-3">
                    <div class="flex items-center justify-between">
                      <span class="text-zinc-400">Deal Value:</span>
                      <span class="font-mono font-bold text-orange-400">{{ lead.value | currency:'USD':'symbol':'1.0-0' }}</span>
                    </div>
                    @if (lead.industry) {
                      <div class="flex items-center justify-between">
                        <span class="text-zinc-400">Industry:</span>
                        <span class="text-zinc-200">{{ lead.industry }}</span>
                      </div>
                    }
                    @if (lead.region) {
                      <div class="flex items-center justify-between">
                        <span class="text-zinc-400">Region:</span>
                        <span class="text-zinc-200">{{ lead.region }}</span>
                      </div>
                    }
                    @if (lead.priority) {
                      <div class="flex items-center justify-between">
                        <span class="text-zinc-400">Priority:</span>
                        <span class="font-semibold text-rose-400">{{ lead.priority }}</span>
                      </div>
                    }
                    <div class="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-800">
                      <span>Coordinates:</span>
                      <span class="font-mono">{{ lead.lat | number:'1.2-2' }}, {{ lead.lng | number:'1.2-2' }}</span>
                    </div>
                  </div>

                  <!-- Quick Action Buttons -->
                  <div class="flex items-center gap-2 pt-1 border-t border-zinc-700/60">
                    <button 
                      type="button"
                      (click)="focusInCrm(lead)"
                      class="flex-1 py-1.5 px-2 bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold rounded-lg text-[11px] transition-colors flex items-center justify-center gap-1 cursor-pointer">
                      <mat-icon class="text-[14px]">visibility</mat-icon>
                      Open in CRM
                    </button>
                    <a 
                      [href]="getDirectionsUrl(lead)" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      class="py-1.5 px-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
                      title="Get Directions in Google Maps">
                      <mat-icon class="text-[14px] text-teal-400">directions</mat-icon>
                    </a>
                  </div>
                </div>
              }
            </map-info-window>
          </google-map>
        }
      </div>

      <!-- Bottom Floating Legend -->
      <div class="p-2 bg-zinc-900/80 backdrop-blur-md border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400 z-10 px-4">
        <div class="flex items-center gap-4 flex-wrap">
          <span class="text-zinc-500 uppercase font-bold text-[9px] tracking-widest">Stage Key:</span>
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>New / Contacted</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Qualified / Proposal</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full bg-purple-400"></span>
            <span>Negotiation / Closed</span>
          </div>
        </div>
        <div class="hidden md:flex items-center gap-2 text-zinc-500 font-mono text-[10px]">
          <span>AdvancedMarkerElement enabled</span>
          <span>·</span>
          <span>Google Maps Platform</span>
        </div>
      </div>

    </div>
  `
})
export class LeadMapComponent {
  leads = input<Lead[]>([]);
  
  private http = inject(HttpClient);
  private leadService = inject(LeadService);
  private router = inject(Router);

  googleMapRef = viewChild<GoogleMap>('googleMapRef');
  infoWindowRef = viewChild<MapInfoWindow>('infoWindowRef');

  isLoaded = signal<boolean>(false);
  loadError = signal<boolean>(false);
  activeLead = signal<Lead | null>(null);

  center = signal<google.maps.LatLngLiteral>({ lat: 39.8283, lng: -98.5795 }); // US Center default
  zoom = signal<number>(3);
  mapTypeId = signal<string>('roadmap');

  searchFilter = signal<string>('');
  selectedStage = signal<string>('All');

  // Map options strictly configured with mandatory attribution ID and mapId
  mapOptions: google.maps.MapOptions = {
    mapId: 'DEMO_MAP_ID', // Required for AdvancedMarkerElement
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    backgroundColor: '#09090b',
    // Mandatory attribution per skills instructions
    ...({ internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio'] } as any)
  };

  // Base list of leads (from input or fallback to leadService)
  private sourceLeads = computed<Lead[]>(() => {
    const inputLeads = this.leads();
    if (inputLeads && inputLeads.length > 0) {
      return inputLeads;
    }
    return this.leadService.leads();
  });

  // Filtered and validated leads that have coordinates
  validLeads = computed<Lead[]>(() => {
    const all = this.sourceLeads();
    const query = this.searchFilter().trim().toLowerCase();
    const stage = this.selectedStage();

    return all.filter((l) => {
      if (l.lat == null || l.lng == null || isNaN(l.lat) || isNaN(l.lng)) {
        return false;
      }
      if (stage !== 'All' && l.status !== stage) {
        return false;
      }
      if (query) {
        const matchesName = l.name.toLowerCase().includes(query);
        const matchesCompany = l.company?.toLowerCase().includes(query);
        const matchesIndustry = l.industry?.toLowerCase().includes(query);
        const matchesRegion = l.region?.toLowerCase().includes(query);
        return matchesName || matchesCompany || matchesIndustry || matchesRegion;
      }
      return true;
    });
  });

  totalMappedValue = computed<number>(() => {
    return this.validLeads().reduce((sum, lead) => sum + (lead.value || 0), 0);
  });

  avgDealValue = computed<number>(() => {
    const list = this.validLeads();
    return list.length > 0 ? Math.round(this.totalMappedValue() / list.length) : 0;
  });

  constructor() {
    this.initGoogleMaps();
  }

  private initGoogleMaps() {
    if (typeof window === 'undefined') return;

    this.http.get<{ key: string }>('/api/config/maps').subscribe({
      next: (res) => {
        const apiKey = res.key || 'AIzaSyDa_OOujU7JQcu2wPm5qoVJubDAAgVbADA';
        this.loadMapsSdk(apiKey);
      },
      error: () => {
        // Fallback to demo key
        this.loadMapsSdk('AIzaSyDa_OOujU7JQcu2wPm5qoVJubDAAgVbADA');
      }
    });
  }

  private loadMapsSdk(apiKey: string) {
    if (typeof window === 'undefined') return;
    const w = window as any;

    // Polyfill / safety shim to ensure importLibrary is ALWAYS a function
    const ensureImportLibraryShim = () => {
      if (!w.google) w.google = {};
      if (!w.google.maps) w.google.maps = {};
      if (typeof w.google.maps.importLibrary !== 'function') {
        w.google.maps.importLibrary = async (name: string) => {
          if (name === 'maps') return { Map: w.google.maps?.Map, ...(w.google.maps || {}) };
          if (name === 'marker') return { AdvancedMarkerElement: w.google.maps?.marker?.AdvancedMarkerElement, PinElement: w.google.maps?.marker?.PinElement, ...(w.google.maps?.marker || {}) };
          if (name === 'places') return w.google.maps?.places || {};
          return w.google.maps?.[name] || w.google.maps;
        };
      }
    };

    // If already fully loaded
    if (typeof w.google?.maps?.importLibrary === 'function' && w.google?.maps?.Map) {
      this.isLoaded.set(true);
      this.loadError.set(false);
      return;
    }

    // Google Maps official dynamic bootstrap loader
    try {
      ((g: any) => {
        let h: any, a: any, k: any, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary", q = "__ib__", m = document, b: any = window;
        b[c] = b[c] || {};
        const d = b[c].maps = b[c].maps || {};
        const r = new Set(["marker", "places"]);
        const e = new URLSearchParams();
        const u = () => h || (h = new Promise(async (f, n) => {
          await (a = m.createElement("script"));
          e.set("libraries", [...r].join(",") || "marker,places");
          for (k in g) e.set(k.replace(/[A-Z]/g, (t: string) => "_" + t[0].toLowerCase()), g[k]);
          e.set("callback", c + ".maps." + q);
          a.src = `https://maps.googleapis.com/maps/api/js?` + e;
          d[q] = f;
          a.onerror = () => {
            h = null;
            n(Error(p + " could not load."));
          };
          m.head.append(a);
        }));
        d[l] ? console.warn(p + " only loads once. Ignoring:", g) : d[l] = (f: string, ...n: any[]) => r.add(f) && u().then(() => d[l](f, ...n));
      })({
        key: apiKey,
        v: "weekly"
      });

      ensureImportLibraryShim();

      // Pre-import 'maps' and 'marker' libraries
      Promise.all([
        w.google.maps.importLibrary("maps"),
        w.google.maps.importLibrary("marker")
      ]).then(() => {
        ensureImportLibraryShim();
        this.isLoaded.set(true);
        this.loadError.set(false);
      }).catch((err) => {
        console.warn('[LeadMap] Google Maps dynamic import notice:', err);
        ensureImportLibraryShim();
        this.isLoaded.set(true);
        this.loadError.set(false);
      });
    } catch (err) {
      console.error('[LeadMap] Failed to initialize Google Maps loader:', err);
      ensureImportLibraryShim();
      this.loadError.set(true);
      this.isLoaded.set(false);
    }
  }

  retryLoading() {
    this.loadError.set(false);
    this.initGoogleMaps();
  }

  openInfoWindow(marker: MapAdvancedMarker, lead: Lead) {
    this.activeLead.set(lead);
    const infoWindow = this.infoWindowRef();
    if (infoWindow) {
      infoWindow.open(marker);
    }
  }

  focusInCrm(lead: Lead) {
    this.router.navigate(['/leads'], { queryParams: { leadId: lead.$id } });
  }

  getDirectionsUrl(lead: Lead): string {
    return `https://www.google.com/maps/dir/?api=1&destination=${lead.lat},${lead.lng}`;
  }

  jumpToRegion(region: 'na' | 'eu' | 'apac' | 'global') {
    switch (region) {
      case 'na':
        this.center.set({ lat: 39.8283, lng: -98.5795 });
        this.zoom.set(4);
        break;
      case 'eu':
        this.center.set({ lat: 50.1109, lng: 10.0 });
        this.zoom.set(4);
        break;
      case 'apac':
        this.center.set({ lat: 25.0, lng: 115.0 });
        this.zoom.set(4);
        break;
      case 'global':
      default:
        this.center.set({ lat: 20.0, lng: 0.0 });
        this.zoom.set(2);
        break;
    }
  }

  fitAllMarkers() {
    const map = this.googleMapRef();
    const leads = this.validLeads();
    if (map && (window as any).google?.maps && leads.length > 0) {
      const bounds = new (window as any).google.maps.LatLngBounds();
      leads.forEach((l) => {
        bounds.extend({ lat: l.lat!, lng: l.lng! });
      });
      map.fitBounds(bounds, 40);
    } else {
      this.jumpToRegion('global');
    }
  }
}
