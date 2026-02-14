import { 
  Directive, 
  ElementRef, 
  Output, 
  EventEmitter, 
  Input,
  OnInit,
  OnDestroy,
  NgZone
} from '@angular/core';

@Directive({
  selector: '[appInfiniteScroll]'
})
export class InfiniteScrollDirective implements OnInit, OnDestroy {
  @Output() appInfiniteScroll = new EventEmitter<void>();
  @Output() scrollPosition = new EventEmitter<number>();

  @Input() threshold: number = 100; // Distance from bottom to trigger (in pixels)
  @Input() debounceTime: number = 150; // Debounce time in milliseconds
  @Input() disabled: boolean = false;
  @Input() container: 'element' | 'window' = 'element';

  private observer?: IntersectionObserver;
  private scrollListener?: () => void;
  private debounceTimer?: number;
  private sentinelElement?: HTMLElement;

  constructor(
    private elementRef: ElementRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.setupInfiniteScroll();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private setupInfiniteScroll(): void {
    if (this.disabled) {
      return;
    }

    // Use Intersection Observer API if available (more performant)
    if ('IntersectionObserver' in window) {
      this.setupIntersectionObserver();
    } else {
      // Fallback to scroll event listener
      this.setupScrollListener();
    }
  }

  private setupIntersectionObserver(): void {
    // Create a sentinel element at the bottom
    this.createSentinelElement();

    this.observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !this.disabled) {
          this.ngZone.run(() => {
            this.emitScrollEvent();
          });
        }
      },
      {
        root: this.container === 'window' ? null : this.elementRef.nativeElement,
        rootMargin: `0px 0px ${this.threshold}px 0px`,
        threshold: 0
      }
    );

    if (this.sentinelElement) {
      this.observer.observe(this.sentinelElement);
    }
  }

  private createSentinelElement(): void {
    this.sentinelElement = document.createElement('div');
    this.sentinelElement.style.height = '1px';
    this.sentinelElement.style.width = '100%';
    this.sentinelElement.style.position = 'absolute';
    this.sentinelElement.style.bottom = '0';
    this.sentinelElement.style.pointerEvents = 'none';
    this.sentinelElement.setAttribute('data-infinite-scroll-sentinel', 'true');

    const targetElement = this.elementRef.nativeElement;
    if (targetElement) {
      // Ensure the container has relative positioning
      const computedStyle = window.getComputedStyle(targetElement);
      if (computedStyle.position === 'static') {
        targetElement.style.position = 'relative';
      }
      
      targetElement.appendChild(this.sentinelElement);
    }
  }

  private setupScrollListener(): void {
    this.scrollListener = () => {
      if (this.disabled) {
        return;
      }

      this.debounceScroll();
    };

    const scrollElement = this.container === 'window' 
      ? window 
      : this.elementRef.nativeElement;

    if (scrollElement) {
      this.ngZone.runOutsideAngular(() => {
        scrollElement.addEventListener('scroll', this.scrollListener!, { passive: true });
      });
    }
  }

  private debounceScroll(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = window.setTimeout(() => {
      this.checkScrollPosition();
    }, this.debounceTime);
  }

  private checkScrollPosition(): void {
    const element = this.container === 'window' 
      ? document.documentElement 
      : this.elementRef.nativeElement;

    if (!element) {
      return;
    }

    const scrollTop = this.container === 'window' 
      ? window.pageYOffset || document.documentElement.scrollTop
      : element.scrollTop;

    const scrollHeight = this.container === 'window'
      ? document.documentElement.scrollHeight
      : element.scrollHeight;

    const clientHeight = this.container === 'window'
      ? window.innerHeight
      : element.clientHeight;

    const scrollPosition = (scrollTop + clientHeight) / scrollHeight;

    // Emit scroll position
    this.ngZone.run(() => {
      this.scrollPosition.emit(scrollPosition);
    });

    // Check if we should trigger infinite scroll
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    
    if (distanceFromBottom <= this.threshold) {
      this.ngZone.run(() => {
        this.emitScrollEvent();
      });
    }
  }

  private emitScrollEvent(): void {
    if (!this.disabled) {
      this.appInfiniteScroll.emit();
    }
  }

  private cleanup(): void {
    // Clean up intersection observer
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }

    // Clean up scroll listener
    if (this.scrollListener) {
      const scrollElement = this.container === 'window' 
        ? window 
        : this.elementRef.nativeElement;

      if (scrollElement) {
        scrollElement.removeEventListener('scroll', this.scrollListener);
      }
      this.scrollListener = undefined;
    }

    // Clean up sentinel element
    if (this.sentinelElement && this.sentinelElement.parentNode) {
      this.sentinelElement.parentNode.removeChild(this.sentinelElement);
      this.sentinelElement = undefined;
    }

    // Clear debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }
  }

  // Public methods to control the directive
  public enable(): void {
    if (this.disabled) {
      this.disabled = false;
      this.setupInfiniteScroll();
    }
  }

  public disable(): void {
    this.disabled = true;
    this.cleanup();
  }

  public reset(): void {
    this.cleanup();
    if (!this.disabled) {
      this.setupInfiniteScroll();
    }
  }
}