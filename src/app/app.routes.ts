import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'notifications',
    loadComponent: () => import('./notifications.component').then(m => m.NotificationsComponent)
  },
  {
    path: 'tasks',
    loadComponent: () => import('./tasks.component').then(m => m.TasksComponent)
  },
  {
    path: 'notes',
    loadComponent: () => import('./notes.component').then(m => m.NotesComponent)
  },
  {
    path: 'emails',
    loadComponent: () => import('./emails.component').then(m => m.EmailsComponent)
  },
  {
    path: 'reports',
    loadComponent: () => import('./reports.component').then(m => m.ReportsComponent)
  },
  {
    path: 'pipeline-signals',
    loadComponent: () => import('./pipeline-signals.component').then(m => m.PipelineSignalsComponent)
  },
  {
    path: 'automations',
    loadComponent: () => import('./automations.component').then(m => m.AutomationsComponent)
  },
  {
    path: 'workflows',
    loadComponent: () => import('./workflows.component').then(m => m.WorkflowsComponent)
  },
  {
    path: 'forecast',
    loadComponent: () => import('./forecast.component').then(m => m.ForecastComponent)
  },
  {
    path: 'clients',
    loadComponent: () => import('./clients.component').then(m => m.ClientsComponent)
  },
  {
    path: 'leads',
    loadComponent: () => import('./leads.component').then(m => m.LeadsComponent)
  },
  {
    path: 'contacts',
    loadComponent: () => import('./contacts.component').then(m => m.ContactsComponent)
  },
  {
    path: 'calendar',
    loadComponent: () => import('./calendar.component').then(m => m.CalendarComponent)
  },
  {
    path: 'deployment-checklist',
    loadComponent: () => import('./deployment-checklist.component').then(m => m.DeploymentChecklistComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./settings.component').then(m => m.SettingsComponent)
  },
  {
    path: 'systems',
    loadComponent: () => import('./systems.component').then(m => m.SystemsComponent)
  },
  {
    path: 'newsletter',
    loadComponent: () => import('./newsletter.component').then(m => m.NewsletterComponent)
  }
];
