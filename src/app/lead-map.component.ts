import { Component, ChangeDetectionStrategy, inject, signal, effect, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { GoogleMapsModule } from '@angular/google-maps';
import { Lead } from './lead.service';

@Component({
  selector: 'app-lead-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, GoogleMapsModule],
  template: `
    <div class="h-full w-full relative rounded-2xl overflow-hidden border border-zinc-800/80">
      @if (!isLoaded()) {
        <div class="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center text-center p-6 z-50">
          @if (!hasKey()) {
            <div class="max-w-md">
              <h2 class="text-xl font-display font-bold text-white mb-2">Google Maps API Key Required</h2>
              <p class="text-zinc-400 text-sm mb-4">To view lead locations on the map, you need to provide a Google Maps Platform API key.</p>
              <div class="text-left bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50 text-sm text-zinc-300 space-y-2">
                <p><strong>Step 1:</strong> Get an API Key from Google Cloud Console.</p>
                <p><strong>Step 2:</strong> Add your key as a secret in AI Studio:</p>
                <ul class="list-disc pl-5 space-y-1 mt-2 text-xs">
                  <li>Open <strong>Settings</strong> (⚙️ gear icon, top-right)</li>
                  <li>Select <strong>Secrets</strong></li>
                  <li>Type <code>GOOGLE_MAPS_PLATFORM_KEY</code> as the secret name, press Enter</li>
                  <li>Paste your API key as the value, press Enter</li>
                </ul>
              </div>
            </div>
          } @else {
            <div class="animate-pulse text-zinc-500 font-medium">Loading Map...</div>
          }
        </div>
      }

      @if (isLoaded()) {
        <google-map 
          height="100%" 
          width="100%" 
          [center]="center()" 
          [zoom]="zoom()"
          [options]="mapOptions">
          
          @for (lead of mapLeads(); track lead.$id) {
            <map-advanced-marker
              [position]="{ lat: lead.lat!, lng: lead.lng! }"
              [title]="lead.name">
            </map-advanced-marker>
          }
        </google-map>
      }
    </div>
  `
})
export class LeadMapComponent {
  leads = input<Lead[]>([]);
  
  http = inject(HttpClient);
  
  isLoaded = signal<boolean>(false);
  hasKey = signal<boolean>(true);
  
  center = signal<google.maps.LatLngLiteral>({ lat: 39.8283, lng: -98.5795 }); // US Center
  zoom = signal<number>(3);
  
  mapOptions: google.maps.MapOptions = {
    mapId: 'LEAD_MAP_ID', // Requires mapId for Advanced Markers
    disableDefaultUI: true,
    zoomControl: true,
    backgroundColor: '#09090b',
  };

  mapLeads = signal<Lead[]>([]);

  constructor() {
    effect(() => {
      // Filter leads that have lat/lng
      const validLeads = this.leads().filter(l => l.lat != null && l.lng != null);
      this.mapLeads.set(validLeads);
      
      // Auto-center based on leads if available
      if (validLeads.length > 0 && this.isLoaded()) {
        let latSum = 0;
        let lngSum = 0;
        validLeads.forEach(l => {
          latSum += l.lat!;
          lngSum += l.lng!;
        });
        this.center.set({
          lat: latSum / validLeads.length,
          lng: lngSum / validLeads.length
        });
      }
    }, { allowSignalWrites: true });
    
    // Load config and script
    this.http.get<{key: string}>('/api/config/maps').subscribe({
      next: (res) => {
        if (res.key && res.key !== 'YOUR_API_KEY') {
          this.loadGoogleMaps(res.key);
        } else {
          this.hasKey.set(false);
        }
      },
      error: () => this.hasKey.set(false)
    });
  }
  
  private loadGoogleMaps(apiKey: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).google && (window as any).google.maps) {
      this.isLoaded.set(true);
      return;
    }
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&v=weekly&libraries=marker`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      this.isLoaded.set(true);
    };
    
    document.head.appendChild(script);
  }
}
