
import { getBodyElements, BodyElement, getIndent } from './util';

import Document = GoogleAppsScript.Document.Document;
import ListItem = GoogleAppsScript.Document.ListItem;
import Paragraph = GoogleAppsScript.Document.Paragraph;

const { ElementType, ParagraphHeading } = DocumentApp;

/**
 * Convert a GoogleAppsScript...Document to a Markdown formatted string
 */
export function documentToMarkdown(document: Document): string {
  const body = document.getBody();

  const allText: string[] = [];
  for (const element of getBodyElements(body)) {
    allText.push(elementToMarkdown(element));
  }

  return allText.join('\n');
}

export function elementToMarkdown(element: BodyElement): string {
  if (Array.isArray(element)) {
    return listItemsToMarkdown(element as Array<ListItem>);
  }
  else {
    switch (element.getType()) {
      case ElementType.PARAGRAPH:
        return paragraphToMarkdown(element as Paragraph);

      case ElementType.TABLE:
      case ElementType.TABLE_OF_CONTENTS:
        return '';

      default:
        return `Unknown element type ${element.getType()}`;
    }
  }
}

export function listItemsToMarkdown(listItems: Array<ListItem>): string {
  return listItems.map(item => {
    return Array.isArray(item) ?
            listItemsToMarkdown(item as Array<ListItem>) :
            `${getIndent(item)}* ${item.getText()}\n`;
  }).join('');
}

const markdownTags: { [tag: string]: (text: string) => string } = {
  [ParagraphHeading.NORMAL]:   text => `${text}\n`,
  [ParagraphHeading.HEADING1]: text => `# ${text}\n`,
  [ParagraphHeading.HEADING2]: text => `## ${text}\n`,
  [ParagraphHeading.HEADING3]: text => `### ${text}\n`,
  [ParagraphHeading.HEADING4]: text => `#### ${text}\n`,
  [ParagraphHeading.HEADING5]: text => `##### ${text}\n`,
  [ParagraphHeading.HEADING6]: text => `###### ${text}\n`,
  [ParagraphHeading.TITLE]:    text => `${text}\n${text.replace(/./g, '=')}\n`,
  [ParagraphHeading.SUBTITLE]: text => `${text}\n${text.replace(/./g, '-')}\n`,
};

export function paragraphToMarkdown(para: Paragraph): string {
  const headingLevel = para.getHeading();
  const lookup = markdownTags[headingLevel];
  return lookup(para.getText());
}
