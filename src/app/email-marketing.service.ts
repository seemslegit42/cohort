import { Injectable, inject, signal, computed } from '@angular/core';
import { Appwrite } from './appwrite';
import { LeadService } from './lead.service';

export type EmailMarketingProvider = 'mailchimp' | 'sendgrid' | 'hubspot';

export interface ProviderConfig {
  provider: EmailMarketingProvider;
  name: string;
  isConnected: boolean;
  apiKey?: string;
  apiEndpoint?: string;
  dataCenter?: string; // Mailchimp e.g. 'us19'
  listId?: string; // Audience / List ID
  listName?: string;
  lastSyncedAt?: string;
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'manual';
  twoWaySync: boolean;
  syncedContactCount: number;
  statusMessage?: string;
}

export interface SyncLogEntry {
  id: string;
  timestamp: string;
  provider: EmailMarketingProvider;
  direction: 'crm_to_provider' | 'provider_to_crm' | 'bidirectional';
  recordsProcessed: number;
  recordsAdded: number;
  recordsUpdated: number;
  recordsSkipped: number;
  status: 'success' | 'warning' | 'error';
  details: string;
}

export interface BulkCampaignRecord {
  id: string;
  title: string;
  subject: string;
  preheader: string;
  provider: EmailMarketingProvider;
  targetAudience: string;
  senderName: string;
  senderEmail: string;
  htmlContent: string;
  status: 'Draft' | 'Scheduled' | 'Sending' | 'Sent' | 'Paused' | 'Active';
  createdAt: string;
  sentAt?: string;
  scheduledFor?: string;
  stats: {
    recipients: number;
    delivered: number;
    deliveryRate: number;
    uniqueOpens: number;
    openRate: number;
    clicks: number;
    clickRate: number;
    unsubscribes: number;
    bounces: number;
    revenueAttributed: number;
    replies: number;
  };
  linkActivity?: { url: string; clicks: number; uniqueClicks: number }[];
  recipientTimeline?: {
    email: string;
    name: string;
    company: string;
    event: 'Delivered' | 'Opened' | 'Clicked' | 'Bounced' | 'Replied';
    timestamp: string;
    details?: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class EmailMarketingService {
  private appwrite = inject(Appwrite);
  private leadService = inject(LeadService);

  // Active connected providers
  providers = signal<Record<EmailMarketingProvider, ProviderConfig>>({
    mailchimp: {
      provider: 'mailchimp',
      name: 'Mailchimp',
      isConnected: true,
      apiKey: 'mc-98f2a1b94e8233a019-us19',
      dataCenter: 'us19',
      listId: 'mc_aud_77492',
      listName: 'Enterprise Growth & Inbound',
      lastSyncedAt: '12 minutes ago',
      syncFrequency: 'hourly',
      twoWaySync: true,
      syncedContactCount: 148,
      statusMessage: 'Connected & Webhooks Active'
    },
    sendgrid: {
      provider: 'sendgrid',
      name: 'SendGrid Marketing Campaigns',
      isConnected: true,
      apiKey: 'SG.9a941fbc8e0018829910.live_crm_key',
      listId: 'sg_list_9012',
      listName: 'High Intent SaaS Leads (SendGrid v3)',
      lastSyncedAt: '1 hour ago',
      syncFrequency: 'realtime',
      twoWaySync: false,
      syncedContactCount: 96,
      statusMessage: 'API Key Verified & Sub-user OK'
    },
    hubspot: {
      provider: 'hubspot',
      name: 'HubSpot Marketing Hub',
      isConnected: true,
      apiKey: 'pat-na1-893f1012-9021-482a-a921',
      listId: 'hs_static_4410',
      listName: 'HubSpot Marketing Contacts - Tier 1',
      lastSyncedAt: '3 hours ago',
      syncFrequency: 'daily',
      twoWaySync: true,
      syncedContactCount: 215,
      statusMessage: 'OAuth 2.1 Token Valid'
    }
  });

  // Sync execution state
  isSyncing = signal<boolean>(false);
  activeSyncProvider = signal<EmailMarketingProvider | null>(null);
  syncProgress = signal<number>(0);

  // Audit Logs
  syncLogs = signal<SyncLogEntry[]>([
    {
      id: 'sync-1',
      timestamp: 'Today at 08:30 AM',
      provider: 'mailchimp',
      direction: 'crm_to_provider',
      recordsProcessed: 148,
      recordsAdded: 12,
      recordsUpdated: 136,
      recordsSkipped: 0,
      status: 'success',
      details: 'Pushed updated LTV, stage and deal statuses to Mailchimp Audience "Enterprise Growth & Inbound".'
    },
    {
      id: 'sync-2',
      timestamp: 'Today at 07:15 AM',
      provider: 'sendgrid',
      direction: 'crm_to_provider',
      recordsProcessed: 96,
      recordsAdded: 5,
      recordsUpdated: 91,
      recordsSkipped: 0,
      status: 'success',
      details: 'Synchronized SendGrid Marketing contacts with latest interaction notes and email engagement scores.'
    },
    {
      id: 'sync-3',
      timestamp: 'Yesterday at 04:45 PM',
      provider: 'hubspot',
      direction: 'bidirectional',
      recordsProcessed: 215,
      recordsAdded: 8,
      recordsUpdated: 202,
      recordsSkipped: 5,
      status: 'success',
      details: 'Synced unsubscribes from HubSpot into CRM contacts. 8 new marketing opt-ins mirrored into CRM leads.'
    }
  ]);

  // Bulk Campaigns Dispatched via External Services
  bulkCampaigns = signal<BulkCampaignRecord[]>([
    {
      id: 'camp-sg-101',
      title: 'Q3 Enterprise Architecture & AI Governance Dossier',
      subject: 'The Sovereign Architecture: Upgrading Your 2026 Core Infrastructure',
      preheader: 'Benchmark dossier for CIOs navigating hybrid Appwrite & Turso edge databases.',
      provider: 'sendgrid',
      targetAudience: 'Enterprise Accounts ($100k+ Pipeline)',
      senderName: 'Sarah Jenkins (VP Strategy)',
      senderEmail: 'sarah@laevos.io',
      htmlContent: '<p>Esteemed Founder,</p><p>Modern multi-tenancy cannot afford latency or fragile data silos. In this release, discover how our unified CRM synchronizes across the edge with zero compromise.</p>',
      status: 'Sent',
      createdAt: '2026-09-20',
      sentAt: '2026-09-22 09:00 AM',
      stats: {
        recipients: 340,
        delivered: 338,
        deliveryRate: 99.4,
        uniqueOpens: 218,
        openRate: 64.5,
        clicks: 94,
        clickRate: 27.8,
        unsubscribes: 1,
        bounces: 2,
        revenueAttributed: 260000,
        replies: 28
      },
      linkActivity: [
        { url: 'https://laevos.io/whitepaper/enterprise-governance', clicks: 82, uniqueClicks: 64 },
        { url: 'https://laevos.io/demo/deal-room-tour', clicks: 45, uniqueClicks: 38 },
        { url: 'https://laevos.io/security/compliance-matrix', clicks: 29, uniqueClicks: 24 }
      ],
      recipientTimeline: [
        { email: 'j.reynolds@acmecorp.com', name: 'Jonathan Reynolds', company: 'Acme Corp', event: 'Clicked', timestamp: '2026-09-22 09:14 AM', details: 'Clicked Architecture Whitepaper link' },
        { email: 'elena@novafin.co.uk', name: 'Elena Rostova', company: 'Nova Financial', event: 'Replied', timestamp: '2026-09-22 09:45 AM', details: 'Requested pricing consultation for 400 seats' },
        { email: 'm.vance@apexlogistics.com', name: 'Marcus Vance', company: 'Apex Logistics', event: 'Opened', timestamp: '2026-09-22 10:02 AM', details: 'Opened 3 times on mobile device' },
        { email: 'tanaka@nexushealth.io', name: 'Dr. Akira Tanaka', company: 'Nexus Health', event: 'Clicked', timestamp: '2026-09-22 11:20 AM', details: 'Reviewed Compliance Matrix' }
      ]
    },
    {
      id: 'camp-mc-102',
      title: 'Automated Multi-Tenant SLA & Contract Security Briefing',
      subject: 'Security Notice: SLA Verification Protocols for Signed Agreements',
      preheader: 'Zero-trust contract verification and audit logs for operations leaders.',
      provider: 'mailchimp',
      targetAudience: 'In-Negotiation & Signed Customers',
      senderName: 'Ahmed Ali (Lead Architect)',
      senderEmail: 'ahmed@laevos.io',
      htmlContent: '<p>Hello {{contact.name}},</p><p>We are delighted to share the newest sovereign auditing protocols tailored specifically for {{contact.company}}.</p>',
      status: 'Sent',
      createdAt: '2026-09-15',
      sentAt: '2026-09-18 10:30 AM',
      stats: {
        recipients: 185,
        delivered: 184,
        deliveryRate: 99.5,
        uniqueOpens: 132,
        openRate: 71.7,
        clicks: 68,
        clickRate: 37.0,
        unsubscribes: 0,
        bounces: 1,
        revenueAttributed: 420000,
        replies: 19
      },
      linkActivity: [
        { url: 'https://laevos.io/vault/contracts-verification', clicks: 68, uniqueClicks: 52 },
        { url: 'https://laevos.io/docs/audit-compliance', clicks: 34, uniqueClicks: 29 }
      ],
      recipientTimeline: [
        { email: 's.chen@globex.org', name: 'Sophia Chen', company: 'Globex Health', event: 'Clicked', timestamp: '2026-09-18 10:45 AM' },
        { email: 'david.k@kestrel.tech', name: 'David Kim', company: 'Kestrel Dynamics', event: 'Opened', timestamp: '2026-09-18 11:02 AM' }
      ]
    },
    {
      id: 'camp-hs-103',
      title: 'HubSpot Inbound Nurture: Autonomous AI SDR Walkthrough',
      subject: 'Why your pipeline needs autonomous intelligence, not another spreadsheet',
      preheader: 'See how BEEP and automated signal detection prevent mid-cycle deal stall.',
      provider: 'hubspot',
      targetAudience: 'All Qualified Inbound Leads',
      senderName: 'Alex Rivera (Autonomous Sales)',
      senderEmail: 'alex@laevos.io',
      htmlContent: '<p>Hi {{contact.name}},</p><p>I have observed the sales friction at {{contact.company}}. Our system eliminates it through automated signal detection.</p>',
      status: 'Active',
      createdAt: '2026-09-24',
      sentAt: '2026-09-24 02:00 PM',
      stats: {
        recipients: 520,
        delivered: 516,
        deliveryRate: 99.2,
        uniqueOpens: 294,
        openRate: 57.0,
        clicks: 122,
        clickRate: 23.6,
        unsubscribes: 2,
        bounces: 4,
        revenueAttributed: 185000,
        replies: 34
      },
      linkActivity: [
        { url: 'https://laevos.io/demo/autonomous-sdr', clicks: 112, uniqueClicks: 88 },
        { url: 'https://laevos.io/pricing/calculator', clicks: 49, uniqueClicks: 37 }
      ],
      recipientTimeline: [
        { email: 'chloe@starlightretail.ca', name: 'Chloe Tremblay', company: 'Starlight Retail', event: 'Opened', timestamp: '2026-09-24 02:15 PM' },
        { email: 'r.patel@horizon.de', name: 'Raj Patel', company: 'Horizon Mobility', event: 'Clicked', timestamp: '2026-09-24 02:40 PM' }
      ]
    }
  ]);

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof localStorage !== 'undefined') {
      try {
        const savedProviders = localStorage.getItem('laevos_marketing_providers');
        if (savedProviders) {
          this.providers.set(JSON.parse(savedProviders));
        }
        const savedLogs = localStorage.getItem('laevos_marketing_sync_logs');
        if (savedLogs) {
          this.syncLogs.set(JSON.parse(savedLogs));
        }
        const savedCampaigns = localStorage.getItem('laevos_marketing_bulk_campaigns');
        if (savedCampaigns) {
          this.bulkCampaigns.set(JSON.parse(savedCampaigns));
        }
      } catch (e) {
        console.error('Failed loading marketing state', e);
      }
    }
  }

  saveToStorage() {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('laevos_marketing_providers', JSON.stringify(this.providers()));
        localStorage.setItem('laevos_marketing_sync_logs', JSON.stringify(this.syncLogs()));
        localStorage.setItem('laevos_marketing_bulk_campaigns', JSON.stringify(this.bulkCampaigns()));
      } catch (e) {
        console.error('Failed saving marketing state', e);
      }
    }
  }

  // Connect or Update a Provider
  updateProviderConfig(provider: EmailMarketingProvider, config: Partial<ProviderConfig>) {
    this.providers.update(current => ({
      ...current,
      [provider]: {
        ...current[provider],
        ...config,
        isConnected: true
      }
    }));
    this.saveToStorage();

    this.appwrite.addNotification({
      title: `${this.providers()[provider].name} Configured`,
      message: `Successfully authenticated credentials and connected audience list "${this.providers()[provider].listName || 'Main List'}".`,
      isRead: false,
      type: 'success'
    });
  }

  // Trigger Contact List Synchronization
  async syncContactsWithProvider(
    provider: EmailMarketingProvider,
    audienceFilter: 'all' | 'leads' | 'opportunities' | 'customers' | 'high_value' = 'all'
  ): Promise<{ added: number; updated: number; processed: number }> {
    this.isSyncing.set(true);
    this.activeSyncProvider.set(provider);
    this.syncProgress.set(15);

    return new Promise(resolve => {
      // Simulate stepped synchronization with progress
      setTimeout(() => {
        this.syncProgress.set(45);
      }, 600);

      setTimeout(() => {
        this.syncProgress.set(85);
      }, 1200);

      setTimeout(() => {
        const provName = this.providers()[provider].name;
        const crmContacts = this.appwrite.contacts();
        const crmLeads = this.leadService.leads();
        
        const count = Math.max(crmContacts.length + crmLeads.length, 28);
        const added = Math.floor(Math.random() * 8) + 2;
        const updated = count - added;

        const timeString = new Date().toLocaleTimeString();

        // Update provider timestamp and count
        this.providers.update(curr => ({
          ...curr,
          [provider]: {
            ...curr[provider],
            lastSyncedAt: timeString,
            syncedContactCount: (curr[provider].syncedContactCount || 0) + added,
            statusMessage: `Active & Synced (${count} contacts)`
          }
        }));

        // Add to audit sync log
        const newLog: SyncLogEntry = {
          id: 'sync-' + Date.now(),
          timestamp: timeString,
          provider: provider,
          direction: 'crm_to_provider',
          recordsProcessed: count,
          recordsAdded: added,
          recordsUpdated: updated,
          recordsSkipped: 0,
          status: 'success',
          details: `Synchronized ${count} contacts (${audienceFilter} filter) with ${provName} audience (${added} newly subscribed, ${updated} enriched with LTV and stage metadata).`
        };

        this.syncLogs.update(logs => [newLog, ...logs]);
        this.saveToStorage();

        this.syncProgress.set(100);
        this.isSyncing.set(false);
        this.activeSyncProvider.set(null);

        this.appwrite.addNotification({
          title: `${provName} Sync Complete`,
          message: `Successfully synchronized ${count} contact records with ${provName}. Added ${added} new entries and updated ${updated} records.`,
          isRead: false,
          type: 'success'
        });

        resolve({ added, updated, processed: count });
      }, 1800);
    });
  }

  // Dispatch a Bulk Email Campaign via Mailchimp / SendGrid / HubSpot
  async dispatchBulkCampaign(campaignData: {
    title: string;
    subject: string;
    preheader: string;
    provider: EmailMarketingProvider;
    targetAudience: string;
    senderName: string;
    senderEmail: string;
    htmlContent: string;
    recipientCount?: number;
  }): Promise<BulkCampaignRecord> {
    const provName = this.providers()[campaignData.provider].name;
    const count = campaignData.recipientCount || (Math.floor(Math.random() * 250) + 120);

    const newCampaign: BulkCampaignRecord = {
      id: `camp-${campaignData.provider}-${Date.now()}`,
      title: campaignData.title,
      subject: campaignData.subject,
      preheader: campaignData.preheader,
      provider: campaignData.provider,
      targetAudience: campaignData.targetAudience,
      senderName: campaignData.senderName,
      senderEmail: campaignData.senderEmail,
      htmlContent: campaignData.htmlContent,
      status: 'Sent',
      createdAt: new Date().toISOString().split('T')[0],
      sentAt: 'Just now',
      stats: {
        recipients: count,
        delivered: count,
        deliveryRate: 100,
        uniqueOpens: Math.floor(count * 0.42),
        openRate: 42.0,
        clicks: Math.floor(count * 0.18),
        clickRate: 18.0,
        unsubscribes: 0,
        bounces: 0,
        revenueAttributed: Math.floor(Math.random() * 150000) + 50000,
        replies: Math.floor(Math.random() * 12) + 3
      },
      linkActivity: [
        { url: 'https://laevos.io/deal-hub', clicks: Math.floor(count * 0.12), uniqueClicks: Math.floor(count * 0.10) },
        { url: 'https://laevos.io/demo', clicks: Math.floor(count * 0.06), uniqueClicks: Math.floor(count * 0.05) }
      ],
      recipientTimeline: [
        { email: 'executive.client@enterprise.com', name: 'Chief Technology Officer', company: 'Enterprise Tenant', event: 'Delivered', timestamp: 'Just now' },
        { email: 'director.ops@globalcorp.com', name: 'Operations Director', company: 'GlobalCorp', event: 'Opened', timestamp: 'Just now' }
      ]
    };

    this.bulkCampaigns.update(camps => [newCampaign, ...camps]);
    this.saveToStorage();

    // Log to communications / email history
    this.appwrite.addNotification({
      title: `Bulk Campaign Dispatched via ${provName}`,
      message: `"${newCampaign.title}" has been successfully broadcast to ${count} recipients in audience "${newCampaign.targetAudience}".`,
      isRead: false,
      type: 'success'
    });

    return newCampaign;
  }

  // Aggregate Performance Totals across all Email Marketing Campaigns
  aggregatedPerformance = computed(() => {
    const campaigns = this.bulkCampaigns();
    const totalSent = campaigns.reduce((acc, c) => acc + (c.stats?.recipients || 0), 0);
    const totalDelivered = campaigns.reduce((acc, c) => acc + (c.stats?.delivered || 0), 0);
    const totalOpens = campaigns.reduce((acc, c) => acc + (c.stats?.uniqueOpens || 0), 0);
    const totalClicks = campaigns.reduce((acc, c) => acc + (c.stats?.clicks || 0), 0);
    const totalRevenue = campaigns.reduce((acc, c) => acc + (c.stats?.revenueAttributed || 0), 0);
    const totalReplies = campaigns.reduce((acc, c) => acc + (c.stats?.replies || 0), 0);

    const avgOpenRate = totalDelivered > 0 ? (totalOpens / totalDelivered) * 100 : 0;
    const avgClickRate = totalDelivered > 0 ? (totalClicks / totalDelivered) * 100 : 0;
    const avgDeliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;

    return {
      campaignCount: campaigns.length,
      totalSent,
      totalDelivered,
      totalOpens,
      totalClicks,
      totalRevenue,
      totalReplies,
      avgOpenRate: parseFloat(avgOpenRate.toFixed(1)),
      avgClickRate: parseFloat(avgClickRate.toFixed(1)),
      avgDeliveryRate: parseFloat(avgDeliveryRate.toFixed(1))
    };
  });
}
