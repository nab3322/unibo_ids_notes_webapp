import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
  pure: true
})
export class TruncatePipe implements PipeTransform {
  transform(
    value: string | null | undefined, 
    limit: number = 100, 
    completeWords: boolean = false, 
    ellipsis: string = '...'
  ): string {
    // Handle null, undefined, or empty values
    if (!value) {
      return '';
    }

    // Convert to string if needed
    const text = String(value);

    // If text is shorter than limit, return as is
    if (text.length <= limit) {
      return text;
    }

    // If we want to complete words, find the last space within the limit
    if (completeWords) {
      const truncated = text.substring(0, limit);
      const lastSpaceIndex = truncated.lastIndexOf(' ');
      
      // If we found a space and it's not too far from the limit
      if (lastSpaceIndex > 0 && lastSpaceIndex > limit * 0.8) {
        return text.substring(0, lastSpaceIndex) + ellipsis;
      }
    }

    // Default truncation: cut at the exact limit
    return text.substring(0, limit) + ellipsis;
  }
}