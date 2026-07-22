/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, inject, signal } from '@angular/core';
import { Appwrite } from './appwrite';

export interface Lead {
  $id?: string;
  name: string;
  email: string;
  phone?: string;
  source: string;
  status: string; // 'New', 'Contacted', 'Qualified', 'Closed'
  value: number;
  industry?: string;
  region?: string;
  aiInsights?: string;
  priority?: 'High' | 'Medium' | 'Low' | string;
  expectedCloseDate?: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LeadService {
  private appwrite = inject(Appwrite);
  
  leads = signal<Lead[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  private defaultMockLeads: Lead[] = [
    { $id: '1', name: 'John Doe', email: 'john@example.com', phone: '+1 555-0192', source: 'Website', status: 'New', value: 8500, priority: 'High', expectedCloseDate: '2026-08-15', industry: 'SaaS', region: 'North America', createdAt: '2026-07-01' },
    { $id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '+1 555-0144', source: 'Referral', status: 'Contacted', value: 24000, priority: 'Medium', expectedCloseDate: '2026-08-28', industry: 'FinTech', region: 'Europe', createdAt: '2026-07-05' },
    { $id: '3', name: 'Acme Corp', email: 'info@acme.com', phone: '+1 555-0188', source: 'Cold Call', status: 'Qualified', value: 65000, priority: 'High', expectedCloseDate: '2026-09-10', industry: 'Logistics', region: 'North America', aiInsights: 'High intent enterprise client looking for cloud-native deployment.', createdAt: '2026-07-10' },
    { $id: '4', name: 'Nexus Innovations', email: 'contact@nexus.io', phone: '+1 555-0172', source: 'Inbound', status: 'Qualified', value: 42000, priority: 'High', expectedCloseDate: '2026-08-20', industry: 'Healthcare', region: 'APAC', createdAt: '2026-07-12' },
    { $id: '5', name: 'Starlight Retail', email: 'buy@starlight.com', phone: '+1 555-0119', source: 'Website', status: 'New', value: 12500, priority: 'Low', expectedCloseDate: '2026-09-30', industry: 'E-Commerce', region: 'North America', createdAt: '2026-07-15' },
    { $id: '6', name: 'Apex Media', email: 'sales@apexmedia.net', phone: '+1 555-0163', source: 'LinkedIn', status: 'Closed', value: 38000, priority: 'Medium', expectedCloseDate: '2026-07-18', industry: 'Media', region: 'Europe', createdAt: '2026-06-20' },
    { $id: '7', name: 'Vanguard Systems', email: 'tech@vanguard.org', phone: '+1 555-0105', source: 'Partner', status: 'Contacted', value: 55000, priority: 'High', expectedCloseDate: '2026-08-05', industry: 'Cyber Security', region: 'North America', createdAt: '2026-07-08' },
    { $id: '8', name: 'Aether BioLab', email: 'info@aetherbio.com', phone: '+1 555-0131', source: 'Event', status: 'Closed', value: 95000, priority: 'High', expectedCloseDate: '2026-07-14', industry: 'Bio-Tech', region: 'APAC', createdAt: '2026-06-15' }
  ];

  async loadLeads() {
    if (typeof window === 'undefined') {
      this.leads.set(this.defaultMockLeads);
      return;
    }
    
    this.loading.set(true);
    this.error.set(null);
    try {
      const response = await fetch('/api/leads');
      if (!response.ok) {
        throw new Error('Failed to fetch leads');
      }
      const data = await response.json();
      const items: Lead[] = data.items || [];
      
      if (items.length === 0) {
        this.leads.set(this.defaultMockLeads);
      } else {
        // Merge optional missing properties with defaults if missing
        const merged = items.map(item => ({
          ...item,
          priority: item.priority || 'Medium',
          expectedCloseDate: item.expectedCloseDate || '2026-08-30'
        }));
        this.leads.set(merged);
      }
    } catch (e: any) {
      console.warn('Failed to load leads from backend, using fallbacks:', e);
      if (this.leads().length === 0) {
        this.leads.set(this.defaultMockLeads);
      }
    } finally {
      this.loading.set(false);
    }
  }

  async createLead(lead: Lead) {
    const team = this.appwrite.activeTeam();
    const payload = {
      ...lead,
      teamId: team?.$id || 'laevos-crm'
    };
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Failed to create lead');
      const doc = (await response.json()).item;
      this.leads.update(leads => [doc as unknown as Lead, ...leads]);
      return doc;
    } catch (e: any) {
      console.warn('Create lead failed on backend, saving locally:', e);
      // Fallback: create mock lead locally so the user experience isn't broken
      const mockDoc: Lead = {
        ...payload,
        $id: 'mock-' + Date.now()
      };
      this.leads.update(leads => [mockDoc, ...leads]);
      return mockDoc;
    }
  }

  async updateLead(id: string, updates: Partial<Lead>) {
    try {
      // If it's a mock/fallback lead, update locally only
      if (id.startsWith('mock-') || id === '1' || id === '2' || id === '3') {
        this.leads.update(leads => leads.map(l => l.$id === id ? { ...l, ...updates } : l));
        return { $id: id, ...updates };
      }
      const response = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update lead');
      const doc = (await response.json()).item;
      this.leads.update(leads => leads.map(l => l.$id === id ? { ...l, ...updates } : l));
      return doc;
    } catch (e: any) {
      console.warn('Update lead failed on backend, updating locally:', e);
      this.leads.update(leads => leads.map(l => l.$id === id ? { ...l, ...updates } : l));
      return { $id: id, ...updates };
    }
  }

  async deleteLead(id: string) {
    try {
      // If it's a mock/fallback lead, delete locally only
      if (id.startsWith('mock-') || id === '1' || id === '2' || id === '3') {
        this.leads.update(leads => leads.filter(l => l.$id !== id));
        return;
      }
      const response = await fetch(`/api/leads/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete lead');
      this.leads.update(leads => leads.filter(l => l.$id !== id));
    } catch (e: any) {
      console.warn('Delete lead failed on backend, deleting locally:', e);
      this.leads.update(leads => leads.filter(l => l.$id !== id));
    }
  }
}

