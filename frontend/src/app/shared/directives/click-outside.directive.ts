import { 
  Directive, 
  ElementRef, 
  Output, 
  EventEmitter, 
  HostListener, 
  Input,
  OnInit,
  OnDestroy 
} from '@angular/core';

@Directive({
  selector: '[appClickOutside]'
})
export class ClickOutsideDirective implements OnInit, OnDestroy {
  @Output() appClickOutside = new EventEmitter<Event>();
  
  @Input() excludeSelectors: string[] = [];
  @Input() includeChildren: boolean = true;
  @Input() disabled: boolean = false;

  private initialized = false;

  constructor(private elementRef: ElementRef) {}

  ngOnInit(): void {
    // Small delay to ensure the directive is fully initialized
    setTimeout(() => {
      this.initialized = true;
    }, 0);
  }

  ngOnDestroy(): void {
    this.initialized = false;
  }

  @HostListener('document:click', ['$event'])
  @HostListener('document:touchstart', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.initialized || this.disabled) {
      return;
    }

    const target = event.target as Element;
    const element = this.elementRef.nativeElement;

    if (!target || !element) {
      return;
    }

    // Check if click is inside the element
    if (this.isInsideElement(target, element)) {
      return;
    }

    // Check if click is on an excluded element
    if (this.isExcludedElement(target)) {
      return;
    }

    // Emit the click outside event
    this.appClickOutside.emit(event);
  }

  private isInsideElement(target: Element, element: Element): boolean {
    if (target === element) {
      return true;
    }

    if (this.includeChildren && element.contains(target)) {
      return true;
    }

    return false;
  }

  private isExcludedElement(target: Element): boolean {
    if (this.excludeSelectors.length === 0) {
      return false;
    }

    return this.excludeSelectors.some(selector => {
      try {
        // Check if the target matches the selector
        if (target.matches(selector)) {
          return true;
        }

        // Check if the target is inside an element that matches the selector
        const excludedElement = document.querySelector(selector);
        if (excludedElement && excludedElement.contains(target)) {
          return true;
        }

        return false;
      } catch (error) {
        console.warn(`ClickOutside directive: Invalid selector "${selector}"`, error);
        return false;
      }
    });
  }
}