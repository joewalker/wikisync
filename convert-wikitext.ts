
import Document = GoogleAppsScript.Document.Document;
import Element = GoogleAppsScript.Document.Element;
import ListItem = GoogleAppsScript.Document.ListItem;
import Paragraph = GoogleAppsScript.Document.Paragraph;

const { ElementType, ParagraphHeading } = DocumentApp;

export function documentToWikitext(document: Document): string {
  return 'wikitext is unsupported right now';

  /*
  const body = document.getBody();

  const allText: string[] = [];
  for (const element of getBodyElements(body)) {
    allText.push(elementToWikitext(element));
  }

  return allText.join('\n');
  */
}

export function elementToWikitext(element: Element): string {
  switch (element.getType()) {
    case ElementType.LIST_ITEM:
      return listItemToWikitext(element as unknown as ListItem);

    case ElementType.PARAGRAPH:
      return paragraphToWikitext(element as unknown as Paragraph);

    case ElementType.TABLE:
    case ElementType.TABLE_OF_CONTENTS:
      return '';

    default:
      return `Unknown element type ${element.getType()}`;
  }
}

export function listItemToWikitext(listItem: ListItem): string {
  return `* ${listItem.getText()}`;
}

const tagLookup = {
  [ParagraphHeading.NORMAL]:   { open: '',        close: '' },
  [ParagraphHeading.HEADING1]: { open: '# ',      close: '' },
  [ParagraphHeading.HEADING2]: { open: '## ',     close: '' },
  [ParagraphHeading.HEADING3]: { open: '### ',    close: '' },
  [ParagraphHeading.HEADING4]: { open: '#### ',   close: '' },
  [ParagraphHeading.HEADING5]: { open: '##### ',  close: '' },
  [ParagraphHeading.HEADING6]: { open: '###### ', close: '' },
  [ParagraphHeading.TITLE]:    { open: '',        close: '\n======\n' },
  [ParagraphHeading.SUBTITLE]: { open: '',        close: '\n------\n' },
};

export function paragraphToWikitext(para: Paragraph): string {
  const headingLevel = para.getHeading();
  const lookup = tagLookup[headingLevel];
  return `${lookup.open}${para.getText()}${lookup.close}`;
}
