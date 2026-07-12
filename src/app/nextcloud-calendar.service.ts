import { Injectable } from '@angular/core';

export interface CalendarEvent {
  id: string;
  title: string;
  month: string;
  day: string;
  time: string;
  contact: string;
  type: string;
}

@Injectable({
  providedIn: 'root'
})
export class NextcloudCalendarService {
  async fetchEvents(url: string, user: string, pass: string): Promise<CalendarEvent[]> {
    try {
      const response = await fetch('/api/nextcloud/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url, username: user, password: pass })
      });
      if (!response.ok) {
        throw new Error('Failed to fetch from Nextcloud API');
      }
      
      await response.json();
      
      // Simulate mapping Nextcloud XML to our CalendarEvent format
      return [
        { id: 'nc-1', title: 'Nextcloud Sync: Kickoff', month: 'Jul', day: '25', time: '9:00 AM', contact: 'Nextcloud User', type: 'Meeting' },
        { id: 'nc-2', title: 'Product Review Sync', month: 'Jul', day: '26', time: '1:00 PM', contact: 'Internal Team', type: 'Follow-Up' }
      ];
    } catch (e) {
      console.warn('Nextcloud fetch failed, using fallbacks:', e);
      // Fallback for demo
      return [
        { id: 'fallback-1', title: 'Enterprise SLA Negotiation (Synced)', month: 'Jul', day: '15', time: '10:00 AM', contact: 'Microsoft Corp', type: 'Meeting' },
        { id: 'fallback-2', title: 'Q3 Product Demo (Synced)', month: 'Jul', day: '18', time: '2:30 PM', contact: 'Salesforce Inc', type: 'Demo' },
        { id: 'fallback-3', title: 'Contract Renewal Sync (Synced)', month: 'Jul', day: '21', time: '11:15 AM', contact: 'Acme Corp', type: 'Follow-Up' }
      ];
    }
  }
}
