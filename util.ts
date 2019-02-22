
import Body = GoogleAppsScript.Document.Body;
import ElementType = GoogleAppsScript.Document.ElementType;
import Paragraph = GoogleAppsScript.Document.Paragraph;
import Table = GoogleAppsScript.Document.Table;
import ListItem = GoogleAppsScript.Document.ListItem;
import TableOfContents = GoogleAppsScript.Document.TableOfContents;
import Text = GoogleAppsScript.Document.Text;

import { stringRepeat, toStringArray } from './polyfill';

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

/**
 * We don't support very rich styling ATM
 */
export interface TextStyle {
  readonly weight?: 400 | 700;
  readonly italics?: true;
  readonly strike?: true;
  readonly link?: string;
}

/**
 * NestedText is something of a misnomer in that the implementation doesn't
 * support nesting however the data structure does. NestedText is so called in
 * opposition to Text which supports overlapping non-nested formatting.
 */
export interface NestedText {
  readonly attributes?: TextStyle;
  readonly children: Array<NestedText | string>;
}

/**
 * A GDocs Document supports overlapping non-nested formatting; HTML doesn't.
 * We're going further in simplifying things by not supporting nested styling.
 * Patches welcome.
 */
export function getNestedText(source: Text): NestedText {
  const text = source.getText();

  if (text.length === 0) {
    return { children: [] };
  }

  // Simplification of NestedText
  interface TempText { attributes?: TextStyle, child: string };

  // One NestedText entry per char in the input string
  const individualCharStyles: Array<TempText> = toStringArray(text).map((char, i) => {
    return {
      attributes: getStyleAt(source, i),
      child: char,
    }
  });

  // Defrag
  const children: Array<NestedText> = [
    {
      attributes: individualCharStyles[0].attributes,
      children: [ individualCharStyles[0].child ],
    }
  ];

  for (let i = 1; i < individualCharStyles.length; i++) {
    const charStyles = individualCharStyles[i];
    const last = children[children.length - 1];

    if (areTextStylesEqual(charStyles.attributes, last.attributes)) {
      const prevText = last.children;
      children[children.length - 1] = {
        attributes: last.attributes,
        children: [ prevText + charStyles.child ],
      };
    }
    else {
      children.push({
        attributes: charStyles.attributes,
        children: [ charStyles.child ],
      });
    }
  }

  return { children };
}

/**
 * Return a simplified one-style-only representation of the style at a
 * given location.
 */
function getStyleAt(source: Text, position: number): TextStyle {
  const link = source.getLinkUrl(position);
  if (link != null) {
    return { link };
  }

  if (source.isBold(position)) {
    return { weight: 700 }
  }

  if (source.isItalic(position)) {
    return { italics: true }
  }

  if (source.isStrikethrough(position)) {
    return { strike: true }
  }

  return {};
}

/**
 * Simple comparision of 2 TextStyle objects that ignores styles that are
 * not known.
 */
function areTextStylesEqual(s1: TextStyle, s2: TextStyle): boolean {
  return (s1.link === s2.link &&
          s1.weight === s2.weight &&
          s1.italics === s2.italics &&
          s1.strike === s2.strike);
}
