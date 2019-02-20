
import Body = GoogleAppsScript.Document.Body;
import ElementType = GoogleAppsScript.Document.ElementType;
import Paragraph = GoogleAppsScript.Document.Paragraph;
import Table = GoogleAppsScript.Document.Table;
import ListItem = GoogleAppsScript.Document.ListItem;
import TableOfContents = GoogleAppsScript.Document.TableOfContents;
import Text = GoogleAppsScript.Document.Text;

import { stringRepeat } from './polyfill';

/*
// Things that we probably want as types

import Body = GoogleAppsScript.Document.Body;
import Element = GoogleAppsScript.Document.Element;
import ListItem = GoogleAppsScript.Document.ListItem;

// Things that we probably want as concrete values

const { ElementType, ParagraphHeading } = DocumentApp;
*/

/**
 * An extension of ElementType to allow us to express a sequence of ListItems
 * with nesting levels as a tree.
 */
export enum BodyElementType {
  // PARAGRAPH, (we use ElementType.PARAGRAPH)
  LIST_ITEM_TREE,
  // TABLE,     (we use ElementType.TABLE)
  // TOC,       (we use ElementType.TABLE_OF_CONTENTS)
}

/**
 * A BodyElement is roughly one of the 4 GoogleAppsScript...Elements which
 * exist at the top level. (i.e. it's the child of the Body).
 * However consecutive ListItems have been grouped together into a tree
 * (modelled as Array<ListItem | Array<...>>)
 * See https://developers.google.com/apps-script/guides/docs#structure_of_a_document
 */
export type BodyElement = Paragraph | Table | TableOfContents | ListItemTreeNode;

/**
 * An Array (nested, used to model a tree of ListItems) with a `getType()`
 * function so this can be used with other GoogleAppsScript...Elements.
 */
class ListItemTreeNode extends Array<ListItemTreeNode | ListItem> {
  constructor(element?: ListItemTreeNode | ListItem) {
    super();
    if (element != null) {
      this.push(element);
    }
  }
}

/**
 * Helper for getBodyElements. Given Array<BodyElement> find somewhere to
 * append a ListItem, either because there's a ListItemTreeNode at the end of
 * the list of by adding a new ListItemTreeNode to the end.
 */
function findOrCreateListItem(list: Array<BodyElement>): ListItemTreeNode {
  const previous = list[list.length - 1];
  if (Array.isArray(previous)) {
    return previous;
  }
  const newRoot = new ListItemTreeNode();
  list.push(newRoot);
  return newRoot;
}

/**
 * Get an Array<BodyElement> from a Document Body.
 * See notes on BodyElement for a description of
 */
export function getBodyElements(body?: Body): Array<BodyElement> {
  const reply: Array<BodyElement> = [];
  if (body != null) {
    let i = 0;
    while (i < body.getNumChildren()) {
      const element = body.getChild(i);
      switch (element.getType()) {
        case ElementType.LIST_ITEM:
          // Find (or create) the root of the ListItem tree to add to
          const root = findOrCreateListItem(reply);

          // Dig down to the needed depth
          let depth = element.asListItem().getNestingLevel();
          let parent = root;
          while (depth > 0) {
            parent = findOrCreateListItem(parent);
            depth--;
          }

          // Insert at the correct depth
          parent.push(element.asListItem());
          break;

        case ElementType.PARAGRAPH:
          reply.push(element.asParagraph());
          break;

        case ElementType.TABLE:
          reply.push(element.asTable());
          break;

        default:
          // Ignore element that we can't handle
          break;
      }

      i++;
    }
  }
  return reply;
}

/**
 * Quick helper to get the indent level of a ListItem assuming 2 space indents.
 * This is only a couple of lines but it helps when using template literals.
 */
export function getIndent(listItem: ListItem): string {
  const level = listItem.getNestingLevel();
  return stringRepeat('  ', level);
}

/**
 * Some <b>text</b> <i>and a <a href="https://example.com">Link</a></i>.
 *
 * {
 *   children: [
 *     {
 *       style: {},
 *       children: [ 'Some ' ],
 *     },
 *     {
 *       style: { weight: 700 },
 *       children: [ 'text' ],
 *     },
 *     {
 *       style: {},
 *       children: [ ' ' ],
 *     },
 *     {
 *       style: { italics: true },
 *       children: [
 *         {
 *           style: {},
 *           children: [ 'and a ' ],
 *         },
 *         {
 *           style: { url: 'https://example.com' },
 *           children: [ 'Link' ],
 *         },
 *       ],
 *     },
 *     {
 *       children: [ '.' ],
 *     },
 *   ]
 * }
 */

export interface TextStyle {
  readonly weight?: 400 | 700;
  readonly italics?: true;
  readonly strike?: true;
  readonly link?: string;
}

export interface NestedText {
  readonly attributes?: TextStyle;
  readonly children: Array<NestedText | string>;
}

/**
 * 
 */
export function getNestedText(text: Text): NestedText {
  const nestedText = {
    children: [ text.getText() ],
  };
  return nestedText;
}
