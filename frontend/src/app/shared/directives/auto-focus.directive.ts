import { Directive, ElementRef, AfterViewInit, Input, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appAutoFocus]'
})
export class AutoFocusDirective implements AfterViewInit, OnDestroy {
  @Input() appAutoFocus: boolean | string = true;
  @Input() delay: number = 0;
  @Input() selectText: boolean = false;

  private timeoutId?: number;

  constructor(private elementRef: ElementRef) {}

  ngAfterViewInit(): void {
    if (this.shouldFocus()) {
      this.timeoutId = window.setTimeout(() => {
        this.focusElement();
      }, this.delay);
    }
  }

  ngOnDestroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  private shouldFocus(): boolean {
    // If appAutoFocus is a string, check if it's not 'false'
    if (typeof this.appAutoFocus === 'string') {
      return this.appAutoFocus !== 'false';
    }
    
    // If it's a boolean, use its value directly
    return this.appAutoFocus === true;
  }

  private focusElement(): void {
    const element = this.elementRef.nativeElement;
    
    if (element && typeof element.focus === 'function') {
      try {
        element.focus();
        
        // If selectText is true and the element supports text selection
        if (this.selectText && element.select && typeof element.select === 'function') {
          element.select();
        }
      } catch (error) {
        console.warn('AutoFocus directive: Could not focus element', error);
      }
    }
  }
}