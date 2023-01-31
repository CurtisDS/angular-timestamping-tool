import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appDraggable]'
})
export class DraggableDirective {

  private isDragging = false;
  private startX: number;
  private startY: number;

  constructor(private el: ElementRef) {}

  @HostListener('mousedown', ['$event']) onMouseDown(event: MouseEvent) {
    const computedStyle = window.getComputedStyle(this.el.nativeElement);
    if (computedStyle.position === 'fixed' || computedStyle.position === 'absolute') {
      this.isDragging = true;
      this.startX = event.clientX - this.el.nativeElement.offsetLeft;
      this.startY = event.clientY - this.el.nativeElement.offsetTop;
    }
  }

  @HostListener('document:mouseup') onMouseUp() {
    this.isDragging = false;
  }

  @HostListener('document:mousemove', ['$event']) onMouseMove(event: MouseEvent) {
    if (this.isDragging) {
      let top = event.clientY - this.startY;
      let left = (event.clientX - this.startX) / window.innerWidth * 100;
      let windowWidth = window.innerWidth - this.el.nativeElement.offsetWidth;
      let windowHeight = window.innerHeight - this.el.nativeElement.offsetHeight;
      
      if (top < 0) {
        top = 0;
      } else if (top > windowHeight) {
        top = windowHeight;
      }
      
      if (left < 0) {
        left = 0;
      } else if (left > 100) {
        left = 100;
      }
      
      this.el.nativeElement.style.bottom = 'unset';
      this.el.nativeElement.style.right = 'unset';
      this.el.nativeElement.style.top = top + 'px';
      this.el.nativeElement.style.left = 'min( calc(100vw - ' + this.el.nativeElement.offsetWidth + 'px), ' + left + '%)';
    }
  }

}
