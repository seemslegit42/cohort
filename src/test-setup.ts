/* eslint-disable @typescript-eslint/no-explicit-any */
import { JSDOM } from 'jsdom';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

const jsdom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost',
});
globalThis.window = jsdom.window as any;
globalThis.document = jsdom.window.document;
globalThis.Node = jsdom.window.Node;
globalThis.navigator = jsdom.window.navigator;
globalThis.HTMLElement = jsdom.window.HTMLElement;
globalThis.Event = jsdom.window.Event as any;
globalThis.CustomEvent = jsdom.window.CustomEvent as any;
globalThis.MouseEvent = jsdom.window.MouseEvent as any;
globalThis.KeyboardEvent = jsdom.window.KeyboardEvent as any;
globalThis.FocusEvent = jsdom.window.FocusEvent as any;
globalThis.getComputedStyle = jsdom.window.getComputedStyle;

// Initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);
