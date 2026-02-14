import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'highlight',
  pure: true
})
export class HighlightPipe implements PipeTransform {
  transform(
    text: string | null | undefined,
    searchTerm: string | null | undefined,
    caseSensitive: boolean = false,
    highlightClass: string = 'highlight',
    wholeWords: boolean = false
  ): string {
    // Handle null, undefined, or empty values
    if (!text || !searchTerm) {
      return text || '';
    }

    const textStr = String(text);
    const searchStr = String(searchTerm).trim();

    // If search term is empty, return original text
    if (!searchStr) {
      return textStr;
    }

    try {
      // Escape special regex characters in search term
      const escapedSearchTerm = this.escapeRegExp(searchStr);
      
      // Build regex pattern
      let pattern = escapedSearchTerm;
      
      // Add word boundaries if wholeWords is true
      if (wholeWords) {
        pattern = `\\b${pattern}\\b`;
      }

      // Create regex with appropriate flags
      const flags = caseSensitive ? 'g' : 'gi';
      const regex = new RegExp(pattern, flags);

      // Replace matches with highlighted version
      return textStr.replace(regex, (match) => {
        return `<span class="${highlightClass}">${match}</span>`;
      });

    } catch (error) {
      // If regex fails (invalid pattern), return original text
      console.warn('HighlightPipe: Invalid search pattern', error);
      return textStr;
    }
  }

  /**
   * Alternative transform method for multiple search terms
   */
  transformMultiple(
    text: string | null | undefined,
    searchTerms: string[] | null | undefined,
    caseSensitive: boolean = false,
    highlightClass: string = 'highlight',
    wholeWords: boolean = false
  ): string {
    if (!text || !searchTerms || searchTerms.length === 0) {
      return text || '';
    }

    let result = String(text);

    for (const term of searchTerms) {
      result = this.transform(result, term, caseSensitive, highlightClass, wholeWords);
    }

    return result;
  }

  /**
   * Transform method with custom highlight wrapper
   */
  transformWithWrapper(
    text: string | null | undefined,
    searchTerm: string | null | undefined,
    openTag: string = '<mark>',
    closeTag: string = '</mark>',
    caseSensitive: boolean = false,
    wholeWords: boolean = false
  ): string {
    // Handle null, undefined, or empty values
    if (!text || !searchTerm) {
      return text || '';
    }

    const textStr = String(text);
    const searchStr = String(searchTerm).trim();

    if (!searchStr) {
      return textStr;
    }

    try {
      const escapedSearchTerm = this.escapeRegExp(searchStr);
      let pattern = escapedSearchTerm;
      
      if (wholeWords) {
        pattern = `\\b${pattern}\\b`;
      }

      const flags = caseSensitive ? 'g' : 'gi';
      const regex = new RegExp(pattern, flags);

      return textStr.replace(regex, (match) => {
        return `${openTag}${match}${closeTag}`;
      });

    } catch (error) {
      console.warn('HighlightPipe: Invalid search pattern', error);
      return textStr;
    }
  }

  /**
   * Escape special regex characters
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}