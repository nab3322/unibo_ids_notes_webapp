import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeStyle, SafeScript, SafeUrl, SafeResourceUrl } from '@angular/platform-browser';

type SafeType = 'html' | 'style' | 'script' | 'url' | 'resourceUrl';

@Pipe({
  name: 'safeHtml',
  pure: true
})
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(
    value: string | null | undefined, 
    type: SafeType = 'html'
  ): SafeHtml | SafeStyle | SafeScript | SafeUrl | SafeResourceUrl | string {
    if (!value) {
      return '';
    }

    const htmlString = String(value);

    switch (type) {
      case 'html':
        return this.sanitizer.bypassSecurityTrustHtml(htmlString);
      case 'style':
        return this.sanitizer.bypassSecurityTrustStyle(htmlString);
      case 'script':
        return this.sanitizer.bypassSecurityTrustScript(htmlString);
      case 'url':
        return this.sanitizer.bypassSecurityTrustUrl(htmlString);
      case 'resourceUrl':
        return this.sanitizer.bypassSecurityTrustResourceUrl(htmlString);
      default:
        return this.sanitizer.bypassSecurityTrustHtml(htmlString);
    }
  }

  /**
   * Sanitize HTML by removing potentially dangerous elements and attributes
   */
  sanitizeHtml(value: string | null | undefined): SafeHtml {
    if (!value) {
      return this.sanitizer.bypassSecurityTrustHtml('');
    }

    // Use Angular's built-in sanitization
    const sanitized = this.sanitizer.sanitize(1, value); // 1 = SecurityContext.HTML
    return this.sanitizer.bypassSecurityTrustHtml(sanitized || '');
  }

  /**
   * Strip all HTML tags and return plain text
   */
  stripHtml(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    const htmlString = String(value);
    
    // Create a temporary DOM element to strip HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    
    // Return text content without HTML tags
    return tempDiv.textContent || tempDiv.innerText || '';
  }

  /**
   * Allow only specific HTML tags
   */
  allowOnlyTags(
    value: string | null | undefined, 
    allowedTags: string[] = ['b', 'i', 'u', 'strong', 'em', 'br', 'p']
  ): SafeHtml {
    if (!value) {
      return this.sanitizer.bypassSecurityTrustHtml('');
    }

    const htmlString = String(value);
    
    // Create regex pattern to match allowed tags
    const allowedTagsPattern = allowedTags.join('|');
    const allowedTagsRegex = new RegExp(`<(?!\/?(?:${allowedTagsPattern})(?:\s|>))[^>]+>`, 'gi');
    
    // Remove disallowed tags
    const cleanedHtml = htmlString.replace(allowedTagsRegex, '');
    
    return this.sanitizer.bypassSecurityTrustHtml(cleanedHtml);
  }
}