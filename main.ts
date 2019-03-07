
import { documentToHTML } from './convert-html';
import { documentToMarkdown } from './convert-markdown';
import { documentToWikitext } from './convert-wikitext';
import { objectAssign } from './polyfill';

import Document = GoogleAppsScript.Document.Document;

const convert: { [key: string]: (doc: Document) => string } = {
  html: documentToHTML,
  markdown: documentToMarkdown,
  wikitext: documentToWikitext,
};

/**
 * Called when this addon is initially installed in a document
 */
export function onInstall(ev: Event): void {
  onOpen(ev);
}

/**
 * 'Main' function that adds menu items to the Addons menu
 */
export function onOpen(ev: Event): void {
  const ui = DocumentApp.getUi();
  ui.createAddonMenu()
      .addItem('Sync Now', syncToWikiMo.name)
      .addToUi();
}

/**
 * Show the sidebar making sync with various wikis easy
 */
function syncToWikiMo(): void {
  const props = PropertiesService.getDocumentProperties();

  const template = HtmlService.createTemplateFromFile('sidebar');
  const format = props.getProperty('format') || 'html';

  const doc = DocumentApp.getActiveDocument();
  const converter = convert[format];
  const markup = converter(doc)

  const link = props.getProperty('link') || '';

  objectAssign(template, { format, markup, link });

  const html = template.evaluate().setTitle('Wiki Sync');

  DocumentApp.getUi().showSidebar(html);
}

/**
 * Called by the sidebar when we finished editing the link
 */
export function destinationSave(link: string): void {
  const props = PropertiesService.getDocumentProperties();
  props.setProperty('link', link);
}

/**
 * Called by the sidebar when we select a new format option
 */
export function changeFormat(format: string): string {
  Logger.log('changeFormat', format);

  const doc = DocumentApp.getActiveDocument();
  const converter = convert[format];

  if (converter == null) {
    throw new Error(`Missing format: '${format}'`);
  }

  const props = PropertiesService.getDocumentProperties();
  props.setProperty('format', format);

  return converter(doc)
}
