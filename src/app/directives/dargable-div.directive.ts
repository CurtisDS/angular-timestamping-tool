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
    this.isDragging = true;
    this.startX = event.clientX - this.el.nativeElement.offsetLeft;
    this.startY = event.clientY - this.el.nativeElement.offsetTop;
  }

  @HostListener('document:mouseup') onMouseUp() {
    this.isDragging = false;
  }

  @HostListener('document:mousemove', ['$event']) onMouseMove(event: MouseEvent) {
    if (this.isDragging) {
      this.el.nativeElement.style.top = (event.clientY - this.startY) + 'px';
      this.el.nativeElement.style.left = (event.clientX - this.startX) + 'px';
    }
  }

}