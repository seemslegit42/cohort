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
  lat?: number;
  lng?: number;
  aiInsights?: string;
  priority?: 'High' | 'Medium' | 'Low' | string;
  expectedCloseDate?: string;
  createdAt?: string;
  companySize?: string;
  websiteActivity?: 'High' | 'Medium' | 'Low' | string;
  emailEngagement?: 'High' | 'Medium' | 'Low' | string;
  score?: number;
  scoreCategory?: 'Hot' | 'Warm' | 'Cold' | string;
  history?: { type: string, date: string, content: string }[];
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
    { $id: '1', name: 'John Doe', email: 'john@example.com', phone: '+1 555-0192', source: 'Website', status: 'New', value: 8500, priority: 'High', expectedCloseDate: '2026-08-15', industry: 'SaaS', region: 'North America', lat: 37.7749, lng: -122.4194, createdAt: '2026-07-01', companySize: 'Enterprise', websiteActivity: 'High', emailEngagement: 'High' },
    { $id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '+1 555-0144', source: 'Referral', status: 'Contacted', value: 24000, priority: 'Medium', expectedCloseDate: '2026-08-28', industry: 'FinTech', region: 'Europe', lat: 51.5074, lng: -0.1278, createdAt: '2026-07-05', companySize: 'Mid-Market', websiteActivity: 'Medium', emailEngagement: 'Medium' },
    { $id: '3', name: 'Acme Corp', email: 'info@acme.com', phone: '+1 555-0188', source: 'Cold Call', status: 'Qualified', value: 65000, priority: 'High', expectedCloseDate: '2026-09-10', industry: 'Logistics', region: 'North America', lat: 40.7128, lng: -74.0060, aiInsights: 'High intent enterprise client looking for cloud-native deployment.', createdAt: '2026-07-10', companySize: 'Enterprise', websiteActivity: 'Low', emailEngagement: 'High' },
    { $id: '4', name: 'Nexus Innovations', email: 'contact@nexus.io', phone: '+1 555-0172', source: 'Inbound', status: 'Qualified', value: 42000, priority: 'High', expectedCloseDate: '2026-08-20', industry: 'Healthcare', region: 'APAC', lat: 35.6762, lng: 139.6503, createdAt: '2026-07-12', companySize: 'Mid-Market', websiteActivity: 'High', emailEngagement: 'High' },
    { $id: '5', name: 'Starlight Retail', email: 'buy@starlight.com', phone: '+1 555-0119', source: 'Website', status: 'New', value: 12500, priority: 'Low', expectedCloseDate: '2026-09-30', industry: 'E-Commerce', region: 'North America', lat: 34.0522, lng: -118.2437, createdAt: '2026-07-15', companySize: 'Small Business', websiteActivity: 'Low', emailEngagement: 'Low' },
    { $id: '6', name: 'Apex Media', email: 'sales@apexmedia.net', phone: '+1 555-0163', source: 'LinkedIn', status: 'Closed', value: 38000, priority: 'Medium', expectedCloseDate: '2026-07-18', industry: 'Media', region: 'Europe', lat: 48.8566, lng: 2.3522, createdAt: '2026-06-20', companySize: 'Mid-Market', websiteActivity: 'Medium', emailEngagement: 'Low' },
    { $id: '7', name: 'Vanguard Systems', email: 'tech@vanguard.org', phone: '+1 555-0105', source: 'Partner', status: 'Contacted', value: 55000, priority: 'High', expectedCloseDate: '2026-08-05', industry: 'Cyber Security', region: 'North America', lat: 41.8781, lng: -87.6298, createdAt: '2026-07-08', companySize: 'Enterprise', websiteActivity: 'Medium', emailEngagement: 'High' },
    { $id: '8', name: 'Aether BioLab', email: 'info@aetherbio.com', phone: '+1 555-0131', source: 'Event', status: 'Closed', value: 95000, priority: 'High', expectedCloseDate: '2026-07-14', industry: 'Bio-Tech', region: 'APAC', lat: 1.3521, lng: 103.8198, createdAt: '2026-06-15', companySize: 'Enterprise', websiteActivity: 'High', emailEngagement: 'Medium' }
  ].map(lead => this.scoreLead(lead));

  calculateLeadScore(lead: Partial<Lead>): { score: number; scoreCategory: 'Hot' | 'Warm' | 'Cold' } {
    let score = 0;
    
    // Industry points
    if (lead.industry) {
      const highValueIndustries = ['SaaS', 'FinTech', 'Healthcare', 'Cyber Security', 'Bio-Tech'];
      if (highValueIndustries.includes(lead.industry)) score += 20;
      else score += 10;
    }
    
    // Company size points
    if (lead.companySize) {
      if (lead.companySize === 'Enterprise') score += 25;
      else if (lead.companySize === 'Mid-Market') score += 15;
      else score += 5;
    }
    
    // Website activity
    if (lead.websiteActivity === 'High') score += 25;
    else if (lead.websiteActivity === 'Medium') score += 10;
    
    // Email engagement
    if (lead.emailEngagement === 'High') score += 30;
    else if (lead.emailEngagement === 'Medium') score += 15;
    
    // Value bonus
    if (lead.value && lead.value > 50000) score += 20;
    
    // Cap at 100
    score = Math.min(100, score);
    
    let scoreCategory: 'Hot' | 'Warm' | 'Cold' = 'Cold';
    if (score >= 70) scoreCategory = 'Hot';
    else if (score >= 40) scoreCategory = 'Warm';
    
    return { score, scoreCategory };
  }

  scoreLead(lead: Lead): Lead {
    const { score, scoreCategory } = this.calculateLeadScore(lead);
    return { ...lead, score, scoreCategory };
  }

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
        const merged = items.map(item => this.scoreLead({
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
    const scoredLead = this.scoreLead(lead);
    const payload = {
      ...scoredLead,
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
      const finalDoc = this.scoreLead(doc as unknown as Lead);
      this.leads.update(leads => [finalDoc, ...leads]);
      return finalDoc;
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
        let updatedMock = { $id: id, ...updates } as Lead;
        this.leads.update(leads => leads.map(l => {
            if (l.$id === id) {
                updatedMock = this.scoreLead({ ...l, ...updates });
                return updatedMock;
            }
            return l;
        }));
        return updatedMock;
      }
      const response = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update lead');
      const doc = (await response.json()).item;
      let finalDoc = doc;
      this.leads.update(leads => leads.map(l => {
          if(l.$id === id) {
              finalDoc = this.scoreLead({ ...l, ...updates });
              return finalDoc;
          }
          return l;
      }));
      return finalDoc;
    } catch (e: any) {
      console.warn('Update lead failed on backend, updating locally:', e);
      let updatedMock = { $id: id, ...updates } as Lead;
      this.leads.update(leads => leads.map(l => {
          if (l.$id === id) {
              updatedMock = this.scoreLead({ ...l, ...updates });
              return updatedMock;
          }
          return l;
      }));
      return updatedMock;
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

