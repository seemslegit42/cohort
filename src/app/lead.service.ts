/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, inject, signal } from '@angular/core';
import { Appwrite } from './appwrite';

export interface ScoreFactor {
  factor: string;
  points: number;
  type: 'demographic' | 'activity';
}

export interface LeadActivityEvent {
  id: string;
  type: 'website_visit' | 'pricing_view' | 'email_open' | 'email_click' | 'resource_download' | 'webinar_attend' | 'demo_request' | 'meeting_held';
  timestamp: string;
  detail: string;
  points: number;
}

export interface Lead {
  $id?: string;
  name: string;
  email: string;
  phone?: string;
  source: string;
  status: string; // 'New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed'
  value: number;
  industry?: string;
  company?: string;
  region?: string;
  jobTitle?: string;
  companySize?: 'Enterprise' | 'Mid-Market' | 'Small Business' | 'Startup' | string;
  annualRevenue?: number;
  budgetTier?: string;
  lat?: number;
  lng?: number;
  aiInsights?: string;
  priority?: 'High' | 'Medium' | 'Low' | string;
  expectedCloseDate?: string;
  createdAt?: string;
  websiteActivity?: 'High' | 'Medium' | 'Low' | string;
  emailEngagement?: 'High' | 'Medium' | 'Low' | string;
  websiteVisits?: number;
  emailOpens?: number;
  emailClicks?: number;
  downloads?: string[];
  webinarsAttended?: string[];
  activities?: LeadActivityEvent[];
  score?: number;
  demographicScore?: number;
  activityScore?: number;
  scoreCategory?: 'Hot' | 'Warm' | 'Cold' | string;
  grade?: 'A+' | 'A' | 'B' | 'C' | 'D';
  scoreFactors?: ScoreFactor[];
  history?: { type: string, date: string, content: string }[];
}

export interface ScoringWeights {
  // Demographic weights
  industryHighValue: number; // e.g. SaaS, FinTech, Healthcare
  industryStandard: number;
  enterpriseSize: number;
  midMarketSize: number;
  smallBizSize: number;
  cSuiteSeniority: number;
  vpDirectorSeniority: number;
  managerSeniority: number;
  dealValueOver50k: number;
  dealValueOver100k: number;
  
  // Activity weights
  websiteVisitPoint: number;
  pricingPagePoint: number;
  emailOpenPoint: number;
  emailClickPoint: number;
  resourceDownloadPoint: number;
  webinarAttendPoint: number;
  demoRequestPoint: number;
  
  // Thresholds
  hotThreshold: number;
  warmThreshold: number;
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  industryHighValue: 20,
  industryStandard: 10,
  enterpriseSize: 25,
  midMarketSize: 15,
  smallBizSize: 5,
  cSuiteSeniority: 20,
  vpDirectorSeniority: 15,
  managerSeniority: 10,
  dealValueOver50k: 15,
  dealValueOver100k: 25,
  websiteVisitPoint: 3,
  pricingPagePoint: 15,
  emailOpenPoint: 5,
  emailClickPoint: 12,
  resourceDownloadPoint: 18,
  webinarAttendPoint: 25,
  demoRequestPoint: 35,
  hotThreshold: 75,
  warmThreshold: 45
};

@Injectable({
  providedIn: 'root'
})
export class LeadService {
  private appwrite = inject(Appwrite);
  
  leads = signal<Lead[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  
  scoringWeights = signal<ScoringWeights>(this.loadWeights());

  private defaultMockLeads: Lead[] = [
    {
      $id: '1',
      name: 'Jonathan Reynolds',
      email: 'j.reynolds@acmecorp.com',
      phone: '+1 555-0192',
      source: 'Website',
      status: 'Qualified',
      value: 125000,
      priority: 'High',
      expectedCloseDate: '2026-09-15',
      industry: 'SaaS',
      region: 'North America',
      jobTitle: 'Chief Information Officer',
      companySize: 'Enterprise',
      annualRevenue: 85000000,
      budgetTier: 'Tier 1 ($100k+)',
      websiteVisits: 14,
      emailOpens: 8,
      emailClicks: 5,
      downloads: ['2026 Enterprise Architecture Whitepaper', 'Cloud Security Compliance Guide'],
      webinarsAttended: ['Modernizing Data Pipelines in 2026'],
      websiteActivity: 'High',
      emailEngagement: 'High',
      createdAt: '2026-07-01',
      lat: 37.7749,
      lng: -122.4194,
      activities: [
        { id: 'act-1', type: 'demo_request', timestamp: '2026-08-20 14:20', detail: 'Requested custom sandbox walkthrough', points: 35 },
        { id: 'act-2', type: 'webinar_attend', timestamp: '2026-08-18 10:00', detail: 'Attended live Q&A in Data Pipelines webinar', points: 25 },
        { id: 'act-3', type: 'resource_download', timestamp: '2026-08-15 09:30', detail: 'Downloaded Enterprise Architecture Whitepaper', points: 18 },
        { id: 'act-4', type: 'email_click', timestamp: '2026-08-14 11:15', detail: 'Clicked Pricing matrix link in Outbox email', points: 12 }
      ]
    },
    {
      $id: '2',
      name: 'Elena Rostova',
      email: 'elena@novafin.co.uk',
      phone: '+44 20 7946 0912',
      source: 'Referral',
      status: 'Negotiation',
      value: 94000,
      priority: 'High',
      expectedCloseDate: '2026-08-28',
      industry: 'FinTech',
      region: 'Europe',
      jobTitle: 'VP of Engineering',
      companySize: 'Mid-Market',
      annualRevenue: 42000000,
      budgetTier: 'Tier 2 ($50k-$100k)',
      websiteVisits: 9,
      emailOpens: 6,
      emailClicks: 3,
      downloads: ['Cryptographic Audit Benchmark'],
      webinarsAttended: ['FinTech Multi-Tenancy Masterclass'],
      websiteActivity: 'Medium',
      emailEngagement: 'High',
      createdAt: '2026-07-05',
      lat: 51.5074,
      lng: -0.1278,
      activities: [
        { id: 'act-5', type: 'webinar_attend', timestamp: '2026-08-16 15:00', detail: 'Participated in Multi-Tenancy workshop', points: 25 },
        { id: 'act-6', type: 'email_click', timestamp: '2026-08-12 16:45', detail: 'Clicked Security Whitepaper link', points: 12 },
        { id: 'act-7', type: 'email_open', timestamp: '2026-08-10 09:12', detail: 'Opened Q3 Product Update newsletter', points: 5 }
      ]
    },
    {
      $id: '3',
      name: 'Marcus Vance',
      email: 'm.vance@apexlogistics.com',
      phone: '+1 555-0188',
      source: 'Inbound Demo',
      status: 'Proposal',
      value: 175000,
      priority: 'High',
      expectedCloseDate: '2026-09-10',
      industry: 'Logistics',
      region: 'North America',
      jobTitle: 'Chief Executive Officer',
      companySize: 'Enterprise',
      annualRevenue: 120000000,
      budgetTier: 'Tier 1 ($100k+)',
      websiteVisits: 11,
      emailOpens: 7,
      emailClicks: 4,
      downloads: ['Enterprise SLA Framework'],
      webinarsAttended: [],
      websiteActivity: 'High',
      emailEngagement: 'High',
      aiInsights: 'High intent enterprise client looking for cloud-native deployment with 99.99% uptime SLA.',
      createdAt: '2026-07-10',
      lat: 40.7128,
      lng: -74.0060,
      activities: [
        { id: 'act-8', type: 'demo_request', timestamp: '2026-08-19 11:30', detail: 'Requested executive pricing proposal', points: 35 },
        { id: 'act-9', type: 'pricing_view', timestamp: '2026-08-17 18:20', detail: 'Viewed Enterprise Custom SLA tiers 4 times', points: 15 },
        { id: 'act-10', type: 'email_click', timestamp: '2026-08-14 10:05', detail: 'Clicked Master Contract template', points: 12 }
      ]
    },
    {
      $id: '4',
      name: 'Dr. Akira Tanaka',
      email: 'tanaka@nexushealth.io',
      phone: '+81 3 5555 0172',
      source: 'Event',
      status: 'Qualified',
      value: 62000,
      priority: 'High',
      expectedCloseDate: '2026-09-20',
      industry: 'Healthcare',
      region: 'APAC',
      jobTitle: 'Director of Clinical Technology',
      companySize: 'Mid-Market',
      annualRevenue: 30000000,
      budgetTier: 'Tier 2 ($50k-$100k)',
      websiteVisits: 8,
      emailOpens: 5,
      emailClicks: 3,
      downloads: ['HIPAA & Zero-Trust Cloud Architecture'],
      webinarsAttended: ['Healthcare Data Encryption Trends'],
      websiteActivity: 'High',
      emailEngagement: 'High',
      createdAt: '2026-07-12',
      lat: 35.6762,
      lng: 139.6503,
      activities: [
        { id: 'act-11', type: 'webinar_attend', timestamp: '2026-08-11 14:00', detail: 'Attended Healthcare compliance webinar', points: 25 },
        { id: 'act-12', type: 'resource_download', timestamp: '2026-08-08 09:40', detail: 'Downloaded HIPAA Security Architecture', points: 18 }
      ]
    },
    {
      $id: '5',
      name: 'Chloe Tremblay',
      email: 'chloe@starlightretail.ca',
      phone: '+1 555-0119',
      source: 'Website',
      status: 'New',
      value: 14500,
      priority: 'Low',
      expectedCloseDate: '2026-10-30',
      industry: 'E-Commerce',
      region: 'North America',
      jobTitle: 'E-Commerce Specialist',
      companySize: 'Small Business',
      annualRevenue: 3500000,
      budgetTier: 'Tier 3 ($10k-$50k)',
      websiteVisits: 2,
      emailOpens: 1,
      emailClicks: 0,
      downloads: [],
      webinarsAttended: [],
      websiteActivity: 'Low',
      emailEngagement: 'Low',
      createdAt: '2026-07-15',
      lat: 34.0522,
      lng: -118.2437,
      activities: [
        { id: 'act-13', type: 'website_visit', timestamp: '2026-08-15 17:10', detail: 'Visited Homepage from organic search', points: 3 }
      ]
    },
    {
      $id: '6',
      name: 'Antoine Dupont',
      email: 'a.dupont@apexmedia.fr',
      phone: '+33 1 40 55 0163',
      source: 'LinkedIn',
      status: 'Contacted',
      value: 38000,
      priority: 'Medium',
      expectedCloseDate: '2026-09-18',
      industry: 'Media',
      region: 'Europe',
      jobTitle: 'Marketing Operations Manager',
      companySize: 'Mid-Market',
      annualRevenue: 18000000,
      budgetTier: 'Tier 3 ($10k-$50k)',
      websiteVisits: 5,
      emailOpens: 4,
      emailClicks: 1,
      downloads: ['RevOps Automation Playbook'],
      webinarsAttended: [],
      websiteActivity: 'Medium',
      emailEngagement: 'Medium',
      createdAt: '2026-06-20',
      lat: 48.8566,
      lng: 2.3522,
      activities: [
        { id: 'act-14', type: 'resource_download', timestamp: '2026-08-14 13:20', detail: 'Downloaded RevOps Playbook from LinkedIn campaign', points: 18 },
        { id: 'act-15', type: 'email_open', timestamp: '2026-08-12 11:00', detail: 'Opened outreach cadence touch #1', points: 5 }
      ]
    },
    {
      $id: '7',
      name: 'David Sterling',
      email: 'dsterling@vanguardsecurity.com',
      phone: '+1 555-0105',
      source: 'Partner',
      status: 'Proposal',
      value: 110000,
      priority: 'High',
      expectedCloseDate: '2026-09-05',
      industry: 'Cyber Security',
      region: 'North America',
      jobTitle: 'VP of Global Infrastructure',
      companySize: 'Enterprise',
      annualRevenue: 95000000,
      budgetTier: 'Tier 1 ($100k+)',
      websiteVisits: 12,
      emailOpens: 9,
      emailClicks: 6,
      downloads: ['Zero Trust Threat Intelligence', 'SLA Master Contract'],
      webinarsAttended: ['SOC2 Type II Cloud Readiness'],
      websiteActivity: 'High',
      emailEngagement: 'High',
      createdAt: '2026-07-08',
      lat: 41.8781,
      lng: -87.6298,
      activities: [
        { id: 'act-16', type: 'demo_request', timestamp: '2026-08-21 16:00', detail: 'Confirmed security compliance review call', points: 35 },
        { id: 'act-17', type: 'webinar_attend', timestamp: '2026-08-15 10:00', detail: 'Attended SOC2 Type II Cloud Readiness session', points: 25 },
        { id: 'act-18', type: 'email_click', timestamp: '2026-08-13 14:25', detail: 'Clicked SLA schedule review link', points: 12 }
      ]
    },
    {
      $id: '8',
      name: 'Dr. Seraphina Thorne',
      email: 'sthorne@aetherbiolab.sg',
      phone: '+65 6789 0131',
      source: 'Webinar',
      status: 'Qualified',
      value: 150000,
      priority: 'High',
      expectedCloseDate: '2026-09-14',
      industry: 'Bio-Tech',
      region: 'APAC',
      jobTitle: 'Head of Genomics Computing',
      companySize: 'Enterprise',
      annualRevenue: 150000000,
      budgetTier: 'Tier 1 ($100k+)',
      websiteVisits: 10,
      emailOpens: 8,
      emailClicks: 5,
      downloads: ['High-Throughput Genomic Data Storage'],
      webinarsAttended: ['Next-Gen Bio-Informatics Infrastructure', 'Cloud Pipelines in 2026'],
      websiteActivity: 'High',
      emailEngagement: 'High',
      createdAt: '2026-06-15',
      lat: 1.3521,
      lng: 103.8198,
      activities: [
        { id: 'act-19', type: 'webinar_attend', timestamp: '2026-08-19 16:30', detail: 'Attended Next-Gen Bio-Informatics live demo', points: 25 },
        { id: 'act-20', type: 'webinar_attend', timestamp: '2026-08-10 10:00', detail: 'Attended Cloud Pipelines in 2026', points: 25 },
        { id: 'act-21', type: 'resource_download', timestamp: '2026-08-05 08:45', detail: 'Downloaded Genomic Data Storage whitepaper', points: 18 }
      ]
    }
  ];

  constructor() {
    this.leads.set(this.defaultMockLeads.map(l => this.scoreLead(l)));
  }

  fetchLeads() {
    this.leads.set(this.defaultMockLeads.map(l => this.scoreLead(l)));
    return this.leads();
  }

  private loadWeights(): ScoringWeights {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('laevos_scoring_weights');
      if (saved) {
        try {
          return { ...DEFAULT_SCORING_WEIGHTS, ...JSON.parse(saved) };
        } catch {
          return DEFAULT_SCORING_WEIGHTS;
        }
      }
    }
    return DEFAULT_SCORING_WEIGHTS;
  }

  saveWeights(weights: ScoringWeights) {
    this.scoringWeights.set(weights);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('laevos_scoring_weights', JSON.stringify(weights));
    }
    // Recalculate all lead scores immediately
    this.leads.update(list => list.map(l => this.scoreLead(l)));
  }

  resetWeights() {
    this.saveWeights(DEFAULT_SCORING_WEIGHTS);
  }

  /**
   * Advanced Scoring Engine: Calculates precise Demographic and Activity Scores
   */
  calculateLeadScore(lead: Partial<Lead>): {
    score: number;
    demographicScore: number;
    activityScore: number;
    scoreCategory: 'Hot' | 'Warm' | 'Cold';
    grade: 'A+' | 'A' | 'B' | 'C' | 'D';
    priority: 'High' | 'Medium' | 'Low';
    scoreFactors: ScoreFactor[];
  } {
    const w = this.scoringWeights();
    let demoPoints = 0;
    let actPoints = 0;
    const scoreFactors: ScoreFactor[] = [];

    // --- 1. DEMOGRAPHIC & FIRMOGRAPHIC SCORING ---
    // Industry
    if (lead.industry) {
      const highValueIndustries = ['SaaS', 'FinTech', 'Healthcare', 'Cyber Security', 'Bio-Tech'];
      if (highValueIndustries.includes(lead.industry)) {
        demoPoints += w.industryHighValue;
        scoreFactors.push({ factor: `Tier-1 Industry Sector (${lead.industry})`, points: w.industryHighValue, type: 'demographic' });
      } else {
        demoPoints += w.industryStandard;
        scoreFactors.push({ factor: `Standard Industry Fit (${lead.industry})`, points: w.industryStandard, type: 'demographic' });
      }
    }

    // Company Size
    if (lead.companySize === 'Enterprise') {
      demoPoints += w.enterpriseSize;
      scoreFactors.push({ factor: 'Enterprise Account Fit (500+ employees)', points: w.enterpriseSize, type: 'demographic' });
    } else if (lead.companySize === 'Mid-Market') {
      demoPoints += w.midMarketSize;
      scoreFactors.push({ factor: 'Mid-Market Account Fit (100-499 employees)', points: w.midMarketSize, type: 'demographic' });
    } else if (lead.companySize === 'Small Business' || lead.companySize === 'Startup') {
      demoPoints += w.smallBizSize;
      scoreFactors.push({ factor: 'Small Business / Early Stage', points: w.smallBizSize, type: 'demographic' });
    }

    // Job Title / Seniority Fit
    if (lead.jobTitle) {
      const titleLower = lead.jobTitle.toLowerCase();
      if (titleLower.includes('chief') || titleLower.includes('cio') || titleLower.includes('cto') || titleLower.includes('ceo') || titleLower.includes('ciso') || titleLower.includes('cro') || titleLower.includes('c-level')) {
        demoPoints += w.cSuiteSeniority;
        scoreFactors.push({ factor: `C-Level Executive Decision Maker (${lead.jobTitle})`, points: w.cSuiteSeniority, type: 'demographic' });
      } else if (titleLower.includes('vp') || titleLower.includes('vice president') || titleLower.includes('director') || titleLower.includes('head of')) {
        demoPoints += w.vpDirectorSeniority;
        scoreFactors.push({ factor: `VP / Director Level Influence (${lead.jobTitle})`, points: w.vpDirectorSeniority, type: 'demographic' });
      } else if (titleLower.includes('manager') || titleLower.includes('lead')) {
        demoPoints += w.managerSeniority;
        scoreFactors.push({ factor: `Operational Leadership (${lead.jobTitle})`, points: w.managerSeniority, type: 'demographic' });
      }
    }

    // Deal Value / Budget Tier
    if (lead.value) {
      if (lead.value >= 100000) {
        demoPoints += w.dealValueOver100k;
        scoreFactors.push({ factor: `Major Deal Pipeline ($${(lead.value / 1000).toFixed(0)}k ARR)`, points: w.dealValueOver100k, type: 'demographic' });
      } else if (lead.value >= 50000) {
        demoPoints += w.dealValueOver50k;
        scoreFactors.push({ factor: `Strong Deal Pipeline ($${(lead.value / 1000).toFixed(0)}k ARR)`, points: w.dealValueOver50k, type: 'demographic' });
      }
    }

    // --- 2. BEHAVIORAL & ACTIVITY SCORING ---
    // Website activity
    const websiteVisits = lead.websiteVisits ?? (lead.websiteActivity === 'High' ? 10 : lead.websiteActivity === 'Medium' ? 5 : 1);
    if (websiteVisits > 0) {
      const pts = Math.min(25, websiteVisits * w.websiteVisitPoint);
      actPoints += pts;
      scoreFactors.push({ factor: `${websiteVisits} Verified Website Sessions`, points: pts, type: 'activity' });
    }

    // Email engagement
    const emailOpens = lead.emailOpens ?? (lead.emailEngagement === 'High' ? 6 : lead.emailEngagement === 'Medium' ? 3 : 1);
    if (emailOpens > 0) {
      const pts = Math.min(20, emailOpens * w.emailOpenPoint);
      actPoints += pts;
      scoreFactors.push({ factor: `${emailOpens} Marketing Email Opens`, points: pts, type: 'activity' });
    }

    const emailClicks = lead.emailClicks ?? (lead.emailEngagement === 'High' ? 4 : lead.emailEngagement === 'Medium' ? 2 : 0);
    if (emailClicks > 0) {
      const pts = Math.min(25, emailClicks * w.emailClickPoint);
      actPoints += pts;
      scoreFactors.push({ factor: `${emailClicks} High-Intent Link Clicks`, points: pts, type: 'activity' });
    }

    // Downloads / Resources
    if (lead.downloads && lead.downloads.length > 0) {
      const pts = lead.downloads.length * w.resourceDownloadPoint;
      actPoints += pts;
      scoreFactors.push({ factor: `${lead.downloads.length} Gated Whitepaper / Guide Downloads`, points: pts, type: 'activity' });
    }

    // Webinar attendance
    if (lead.webinarsAttended && lead.webinarsAttended.length > 0) {
      const pts = lead.webinarsAttended.length * w.webinarAttendPoint;
      actPoints += pts;
      scoreFactors.push({ factor: `${lead.webinarsAttended.length} Live Webinar Session Attendances`, points: pts, type: 'activity' });
    }

    // Direct explicit activities if logged
    if (lead.activities && lead.activities.length > 0) {
      lead.activities.forEach(act => {
        if (act.type === 'demo_request') {
          actPoints += w.demoRequestPoint;
          scoreFactors.push({ factor: `Explicit Inbound Demo Request (${act.detail})`, points: w.demoRequestPoint, type: 'activity' });
        }
      });
    }

    // Combine and Normalize
    const demographicScore = Math.min(50, Math.round(demoPoints * 0.5));
    const activityScore = Math.min(50, Math.round(actPoints * 0.5));
    const totalScore = Math.min(100, Math.max(5, demographicScore + activityScore));

    let scoreCategory: 'Hot' | 'Warm' | 'Cold' = 'Cold';
    let priority: 'High' | 'Medium' | 'Low' = 'Low';
    let grade: 'A+' | 'A' | 'B' | 'C' | 'D' = 'D';

    if (totalScore >= w.hotThreshold) {
      scoreCategory = 'Hot';
      priority = 'High';
      grade = totalScore >= 90 ? 'A+' : 'A';
    } else if (totalScore >= w.warmThreshold) {
      scoreCategory = 'Warm';
      priority = 'Medium';
      grade = totalScore >= 60 ? 'B' : 'C';
    } else {
      scoreCategory = 'Cold';
      priority = 'Low';
      grade = 'D';
    }

    return {
      score: totalScore,
      demographicScore,
      activityScore,
      scoreCategory,
      grade,
      priority,
      scoreFactors
    };
  }

  scoreLead(lead: Lead): Lead {
    const calculation = this.calculateLeadScore(lead);
    return {
      ...lead,
      score: calculation.score,
      demographicScore: calculation.demographicScore,
      activityScore: calculation.activityScore,
      scoreCategory: calculation.scoreCategory,
      grade: calculation.grade,
      priority: calculation.priority,
      scoreFactors: calculation.scoreFactors
    };
  }

  /**
   * Log an activity event for a lead (e.g., opened email, attended webinar, downloaded resource)
   * and automatically trigger real-time score re-evaluation.
   */
  async recordLeadActivity(leadId: string, eventType: LeadActivityEvent['type'], detail: string, points?: number) {
    const currentLeads = this.leads();
    const lead = currentLeads.find(l => l.$id === leadId);
    if (!lead) return;

    const w = this.scoringWeights();
    let pts = points;
    if (pts === undefined) {
      switch (eventType) {
        case 'website_visit': pts = w.websiteVisitPoint; break;
        case 'pricing_view': pts = w.pricingPagePoint; break;
        case 'email_open': pts = w.emailOpenPoint; break;
        case 'email_click': pts = w.emailClickPoint; break;
        case 'resource_download': pts = w.resourceDownloadPoint; break;
        case 'webinar_attend': pts = w.webinarAttendPoint; break;
        case 'demo_request': pts = w.demoRequestPoint; break;
        default: pts = 10;
      }
    }

    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newActivity: LeadActivityEvent = {
      id: 'act-' + Date.now(),
      type: eventType,
      timestamp: timeStr,
      detail,
      points: pts
    };

    const updatedActivities = [newActivity, ...(lead.activities || [])];
    const updatedVisits = eventType === 'website_visit' || eventType === 'pricing_view' ? (lead.websiteVisits || 0) + 1 : lead.websiteVisits;
    const updatedOpens = eventType === 'email_open' ? (lead.emailOpens || 0) + 1 : lead.emailOpens;
    const updatedClicks = eventType === 'email_click' ? (lead.emailClicks || 0) + 1 : lead.emailClicks;
    const updatedDownloads = eventType === 'resource_download' ? [...(lead.downloads || []), detail] : lead.downloads;
    const updatedWebinars = eventType === 'webinar_attend' ? [...(lead.webinarsAttended || []), detail] : lead.webinarsAttended;

    const updatedLeadData: Lead = {
      ...lead,
      activities: updatedActivities,
      websiteVisits: updatedVisits,
      emailOpens: updatedOpens,
      emailClicks: updatedClicks,
      downloads: updatedDownloads,
      webinarsAttended: updatedWebinars,
      websiteActivity: (updatedVisits || 0) > 8 ? 'High' : (updatedVisits || 0) > 3 ? 'Medium' : 'Low',
      emailEngagement: (updatedOpens || 0) > 5 ? 'High' : (updatedOpens || 0) > 2 ? 'Medium' : 'Low'
    };

    const scored = this.scoreLead(updatedLeadData);

    this.leads.update(list => list.map(l => l.$id === leadId ? scored : l));

    // Also trigger notification
    this.appwrite.addNotification({
      title: `Lead Activity Recorded: ${lead.name}`,
      message: `${detail} (+${pts} pts). New Score: ${scored.score}/100 (${scored.scoreCategory} - Grade ${scored.grade}).`,
      type: scored.scoreCategory === 'Hot' ? 'success' : 'info'
    });

    return scored;
  }

  async loadLeads() {
    if (typeof window === 'undefined') {
      this.leads.set(this.defaultMockLeads.map(l => this.scoreLead(l)));
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
        this.leads.set(this.defaultMockLeads.map(l => this.scoreLead(l)));
      } else {
        const merged = items.map(item => this.scoreLead({
          ...item,
          priority: item.priority || 'Medium',
          expectedCloseDate: item.expectedCloseDate || '2026-09-30'
        }));
        this.leads.set(merged);
      }
    } catch (e: any) {
      console.warn('Failed to load leads from backend, using fallbacks:', e);
      if (this.leads().length === 0) {
        this.leads.set(this.defaultMockLeads.map(l => this.scoreLead(l)));
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
      const mockDoc: Lead = {
        ...payload,
        $id: 'mock-' + Date.now()
      };
      const finalDoc = this.scoreLead(mockDoc);
      this.leads.update(leads => [finalDoc, ...leads]);
      return finalDoc;
    }
  }

  async updateLead(id: string, updates: Partial<Lead>) {
    try {
      if (id.startsWith('mock-') || id === '1' || id === '2' || id === '3' || id === '4' || id === '5' || id === '6' || id === '7' || id === '8') {
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
          if (l.$id === id) {
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
      if (id.startsWith('mock-') || id === '1' || id === '2' || id === '3' || id === '4' || id === '5' || id === '6' || id === '7' || id === '8') {
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


