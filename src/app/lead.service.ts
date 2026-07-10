/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, inject, signal } from '@angular/core';
import { Appwrite } from './appwrite';
import { ID, Query } from 'appwrite';

export interface Lead {
  $id?: string;
  name: string;
  email: string;
  phone?: string;
  source: string;
  status: string; // 'New', 'Contacted', 'Qualified', 'Closed'
  value: number;
}

@Injectable({
  providedIn: 'root'
})
export class LeadService {
  private appwrite = inject(Appwrite);
  
  leads = signal<Lead[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  async loadLeads() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const conf = this.appwrite.config();
      if (!this.appwrite.isConnected()) {
        throw new Error('Appwrite not connected');
      }
      const response = await this.appwrite.databases.listDocuments(
        conf.databaseId,
        conf.leadsCollectionId,
        [Query.orderDesc('$createdAt')] // recent leads first
      );
      this.leads.set(response.documents as unknown as Lead[]);
    } catch (e: any) {
      console.error('Failed to load leads', e);
      this.error.set(e.message || 'Failed to load leads');
      
      // Fallback for UI if appwrite not initialized yet
      if (this.leads().length === 0) {
        this.leads.set([
           { $id: '1', name: 'John Doe', email: 'john@example.com', source: 'Website', status: 'New', value: 5000 },
           { $id: '2', name: 'Jane Smith', email: 'jane@example.com', source: 'Referral', status: 'Contacted', value: 12000 },
           { $id: '3', name: 'Acme Corp', email: 'info@acme.com', source: 'Cold Call', status: 'Qualified', value: 45000 },
        ]);
      }
    } finally {
      this.loading.set(false);
    }
  }

  async createLead(lead: Lead) {
    const conf = this.appwrite.config();
    const team = this.appwrite.activeTeam();
    const payload = {
      ...lead,
      teamId: team?.$id || 'laevos-crm'
    };
    try {
      const doc = await this.appwrite.databases.createDocument(
        conf.databaseId,
        conf.leadsCollectionId,
        ID.unique(),
        payload
      );
      this.leads.update(leads => [doc as unknown as Lead, ...leads]);
      return doc;
    } catch (e: any) {
      console.error('Create lead failed', e);
      throw e;
    }
  }

  async updateLead(id: string, updates: Partial<Lead>) {
    const conf = this.appwrite.config();
    try {
      const doc = await this.appwrite.databases.updateDocument(
        conf.databaseId,
        conf.leadsCollectionId,
        id,
        updates
      );
      this.leads.update(leads => leads.map(l => l.$id === id ? { ...l, ...updates } : l));
      return doc;
    } catch (e: any) {
      console.error('Update lead failed', e);
      throw e;
    }
  }

  async deleteLead(id: string) {
    const conf = this.appwrite.config();
    try {
      await this.appwrite.databases.deleteDocument(
        conf.databaseId,
        conf.leadsCollectionId,
        id
      );
      this.leads.update(leads => leads.filter(l => l.$id !== id));
    } catch (e: any) {
      console.error('Delete lead failed', e);
      throw e;
    }
  }
}
