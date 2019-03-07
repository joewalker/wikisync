
import { getBodyElements, BodyElement, getIndent, getNestedText, NestedText } from './util';

import Document = GoogleAppsScript.Document.Document;
import ListItem = GoogleAppsScript.Document.ListItem;
import Paragraph = GoogleAppsScript.Document.Paragraph;
import Text = GoogleAppsScript.Document.Text;

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

/**
 *
 */
export function listItemsToMarkdown(listItems: Array<ListItem>): string {
  return listItems.map(item => {
    return Array.isArray(item) ?
            listItemsToMarkdown(item as Array<ListItem>) :
            `${getIndent(item)}* ${blockToMarkdown(item)}\n`;
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

/**
 *
 */
export function paragraphToMarkdown(para: Paragraph): string {
  const headingLevel = para.getHeading();
  const lookup = markdownTags[headingLevel];
  return lookup(blockToMarkdown(para));
}

/**
 * 
 */
export function blockToMarkdown(block: Paragraph | ListItem): string {
  const allText: string[] = [];
  for (let i = 0; i < block.getNumChildren(); i++) {
    const child = block.getChild(i);
    switch (child.getType()) {
      case ElementType.TEXT:
        const nestedText = getNestedText(child as unknown as Text);
        return nestedTextToMarkdown(nestedText);

      case ElementType.HORIZONTAL_RULE:
      case ElementType.PAGE_BREAK:
        return '\n\n';

      default:
      return `Elements of type ${child.getType()} are not supported`;
    }
  }
  return allText.join('');
}


/**
 *
 */
export function nestedTextToMarkdown(source: NestedText): string {
  const output = [];
  for (const child of source.children) {
    const part = (typeof child === 'string') ?
            child :
            nestedTextToMarkdown(child);

    output.push(part);
  }

  const unstyled = output.join('');
  if (source.attributes == null) {
    return unstyled;
  }

  if (typeof source.attributes.link === 'string') {
    return `[${unstyled}](${source.attributes.link})`;
  }
  if (source.attributes.weight > 400) {
    return `**${unstyled}**`;
  }
  if (source.attributes.italics) {
    return `*${unstyled}*`;
  }
  if (source.attributes.strike) {
    return `~~${unstyled}~~`;
  }
  return unstyled;
}
