
import { getBodyElements, BodyElement, getIndent } from './util';
import { stringRepeat } from './polyfill';

import Document = GoogleAppsScript.Document.Document;
import ListItem = GoogleAppsScript.Document.ListItem;
import Paragraph = GoogleAppsScript.Document.Paragraph;

const { ElementType, ParagraphHeading } = DocumentApp;

export function documentToHTML(document: Document): string {
  const body = document.getBody();

  const allText: string[] = [];
  for (const element of getBodyElements(body)) {
    allText.push(elementToHTML(element));
  }

  return allText.join('\n');
}

/**
 *
 */
export function elementToHTML(element: BodyElement): string {
  if (Array.isArray(element)) {
    return listItemsToHTML(element as Array<ListItem>) + '\n';
  }
  else {
    switch (element.getType()) {
      case ElementType.PARAGRAPH:
        return paragraphToHTML(element as Paragraph);

      case ElementType.TABLE:
      case ElementType.TABLE_OF_CONTENTS:
        return '';

      default:
        return `Unknown element type ${element.getType()}`;
    }
  }
}

/**
 *
 */
export function listItemsToHTML(listItems: Array<ListItem>): string {
  const listIndent = stringRepeat('  ', listItems[0].getNestingLevel());
  return `${listIndent}<ul>\n` + listItems.map(item => {
    return Array.isArray(item) ?
            listItemsToHTML(item as Array<ListItem>) + '\n' :
            `${getIndent(item)}  <li>${item.getText()}</li>\n`;
  }).join('') + `${listIndent}</ul>`;
}

const htmlTags = {
  [ParagraphHeading.NORMAL]:   { open: '<p>',  close: '</p>\n'  },
  [ParagraphHeading.HEADING1]: { open: '<h1>', close: '</h1>\n' },
  [ParagraphHeading.HEADING2]: { open: '<h2>', close: '</h2>\n' },
  [ParagraphHeading.HEADING3]: { open: '<h3>', close: '</h3>\n' },
  [ParagraphHeading.HEADING4]: { open: '<h4>', close: '</h4>\n' },
  [ParagraphHeading.HEADING5]: { open: '<h5>', close: '</h5>\n' },
  [ParagraphHeading.HEADING6]: { open: '<h6>', close: '</h6>\n' },
  [ParagraphHeading.TITLE]:    { open: '<div class="title">',    close: '</div>\n' },
  [ParagraphHeading.SUBTITLE]: { open: '<div class="subtitle">', close: '</div>\n' },
};

export function paragraphToHTML(para: Paragraph): string {
  const headingLevel = para.getHeading();
  const lookup = htmlTags[headingLevel];
  return `${lookup.open}${para.getText()}${lookup.close}`;
}
