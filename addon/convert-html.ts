
import { getBodyElements, BodyElement, getIndent, getNestedText, NestedText } from './util';
import { stringRepeat } from './polyfill';

import Document = GoogleAppsScript.Document.Document;
import ListItem = GoogleAppsScript.Document.ListItem;
import Paragraph = GoogleAppsScript.Document.Paragraph;
import Text = GoogleAppsScript.Document.Text;

const { ElementType, ParagraphHeading } = DocumentApp;

/**
 * Convert a GDoc document to HTML
 */
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
            `${getIndent(item)}  <li>${blockToHTML(item)}</li>\n`;
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

/**
 *
 */
export function paragraphToHTML(para: Paragraph): string {
  const headingLevel = para.getHeading();
  const lookup = htmlTags[headingLevel];
  return `${lookup.open}${blockToHTML(para)}${lookup.close}`;
}

/**
 * 
 */
export function blockToHTML(block: Paragraph | ListItem): string {
  const allText: string[] = [];
  for (let i = 0; i < block.getNumChildren(); i++) {
    const child = block.getChild(i);
    switch (child.getType()) {
      case ElementType.TEXT:
        const nestedText = getNestedText(child as unknown as Text);
        return nestedTextToHTML(nestedText);

      case ElementType.HORIZONTAL_RULE:
      case ElementType.PAGE_BREAK:
        return '<hr/>';

      default:
      return `Elements of type ${child.getType()} are not supported`;
    }
  }
  return allText.join('');
}


/**
 *
 */
export function nestedTextToHTML(source: NestedText): string {
  const output = [];
  for (const child of source.children) {
    const part = (typeof child === 'string') ?
            child :
            nestedTextToHTML(child);

    output.push(part);
  }

  const unstyled = output.join('');
  if (source.attributes == null) {
    return unstyled;
  }

  if (typeof source.attributes.link === 'string') {
    return `<a href="${source.attributes.link}">${unstyled}]</a>`;
  }
  if (source.attributes.weight > 400) {
    return `<b>${unstyled}</b>`;
  }
  if (source.attributes.italics) {
    return `<i>${unstyled}</i>`;
  }
  if (source.attributes.strike) {
    return `<strike>${unstyled}</strike>`;
  }
  return unstyled;
}
