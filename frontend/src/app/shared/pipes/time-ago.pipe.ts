import { Pipe, PipeTransform, OnDestroy } from '@angular/core';
import { Observable, interval, map, startWith } from 'rxjs';

@Pipe({
  name: 'timeAgo',
  pure: false // Set to false to enable automatic updates
})
export class TimeAgoPipe implements PipeTransform, OnDestroy {
  private timer?: Observable<string>;
  private updateInterval = 60000; // Update every minute

  ngOnDestroy(): void {
    // Cleanup is handled automatically by the async pipe
  }

  transform(
    value: string | number | Date | null | undefined,
    updateInterval?: number,
    locale: string = 'it'
  ): Observable<string> | string {
    if (!value) {
      return '';
    }

    // Set custom update interval if provided
    if (updateInterval !== undefined) {
      this.updateInterval = updateInterval;
    }

    const targetDate = this.parseDate(value);
    if (!targetDate || isNaN(targetDate.getTime())) {
      return '';
    }

    // If update interval is 0 or negative, return static result
    if (this.updateInterval <= 0) {
      return this.calculateTimeAgo(targetDate, locale);
    }

    // Return observable that updates at specified intervals
    this.timer = interval(this.updateInterval).pipe(
      startWith(0),
      map(() => this.calculateTimeAgo(targetDate, locale))
    );

    return this.timer;
  }

  private parseDate(value: string | number | Date): Date {
    if (value instanceof Date) {
      return value;
    }

    if (typeof value === 'number') {
      return new Date(value);
    }

    if (typeof value === 'string') {
      // Try to parse ISO string or other common formats
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }

      // Try parsing timestamp
      const timestamp = parseInt(value, 10);
      if (!isNaN(timestamp)) {
        return new Date(timestamp);
      }
    }

    return new Date(value);
  }

  private calculateTimeAgo(date: Date, locale: string): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // Future dates
    if (diffInSeconds < 0) {
      return this.formatFutureTime(Math.abs(diffInSeconds), locale);
    }

    // Past dates
    return this.formatPastTime(diffInSeconds, locale);
  }

  private formatPastTime(seconds: number, locale: string): string {
    const intervals = this.getTimeIntervals(locale);

    // Less than a minute
    if (seconds < 60) {
      return intervals.justNow;
    }

    // Minutes
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return this.formatInterval(minutes, intervals.minute, intervals.minutes);
    }

    // Hours
    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return this.formatInterval(hours, intervals.hour, intervals.hours);
    }

    // Days
    if (seconds < 2592000) { // 30 days
      const days = Math.floor(seconds / 86400);
      return this.formatInterval(days, intervals.day, intervals.days);
    }

    // Months
    if (seconds < 31536000) { // 365 days
      const months = Math.floor(seconds / 2592000);
      return this.formatInterval(months, intervals.month, intervals.months);
    }

    // Years
    const years = Math.floor(seconds / 31536000);
    return this.formatInterval(years, intervals.year, intervals.years);
  }

  private formatFutureTime(seconds: number, locale: string): string {
    const intervals = this.getFutureTimeIntervals(locale);

    // Less than a minute
    if (seconds < 60) {
      return intervals.inMoments;
    }

    // Minutes
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return this.formatFutureInterval(minutes, intervals.inMinute, intervals.inMinutes);
    }

    // Hours
    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return this.formatFutureInterval(hours, intervals.inHour, intervals.inHours);
    }

    // Days
    if (seconds < 2592000) { // 30 days
      const days = Math.floor(seconds / 86400);
      return this.formatFutureInterval(days, intervals.inDay, intervals.inDays);
    }

    // Months
    if (seconds < 31536000) { // 365 days
      const months = Math.floor(seconds / 2592000);
      return this.formatFutureInterval(months, intervals.inMonth, intervals.inMonths);
    }

    // Years
    const years = Math.floor(seconds / 31536000);
    return this.formatFutureInterval(years, intervals.inYear, intervals.inYears);
  }

  private formatInterval(value: number, singular: string, plural: string): string {
    return value === 1 ? `${value} ${singular}` : `${value} ${plural}`;
  }

  private formatFutureInterval(value: number, singular: string, plural: string): string {
    return value === 1 ? singular.replace('{0}', '1') : plural.replace('{0}', value.toString());
  }

  private getTimeIntervals(locale: string) {
    const translations: { [key: string]: any } = {
      'it': {
        justNow: 'proprio ora',
        minute: 'minuto fa',
        minutes: 'minuti fa',
        hour: 'ora fa',
        hours: 'ore fa',
        day: 'giorno fa',
        days: 'giorni fa',
        month: 'mese fa',
        months: 'mesi fa',
        year: 'anno fa',
        years: 'anni fa'
      },
      'en': {
        justNow: 'just now',
        minute: 'minute ago',
        minutes: 'minutes ago',
        hour: 'hour ago',
        hours: 'hours ago',
        day: 'day ago',
        days: 'days ago',
        month: 'month ago',
        months: 'months ago',
        year: 'year ago',
        years: 'years ago'
      }
    };

    return translations[locale] || translations['en'];
  }

  private getFutureTimeIntervals(locale: string) {
    const translations: { [key: string]: any } = {
      'it': {
        inMoments: 'tra pochi istanti',
        inMinute: 'tra {0} minuto',
        inMinutes: 'tra {0} minuti',
        inHour: 'tra {0} ora',
        inHours: 'tra {0} ore',
        inDay: 'tra {0} giorno',
        inDays: 'tra {0} giorni',
        inMonth: 'tra {0} mese',
        inMonths: 'tra {0} mesi',
        inYear: 'tra {0} anno',
        inYears: 'tra {0} anni'
      },
      'en': {
        inMoments: 'in a few moments',
        inMinute: 'in {0} minute',
        inMinutes: 'in {0} minutes',
        inHour: 'in {0} hour',
        inHours: 'in {0} hours',
        inDay: 'in {0} day',
        inDays: 'in {0} days',
        inMonth: 'in {0} month',
        inMonths: 'in {0} months',
        inYear: 'in {0} year',
        inYears: 'in {0} years'
      }
    };

    return translations[locale] || translations['en'];
  }
}