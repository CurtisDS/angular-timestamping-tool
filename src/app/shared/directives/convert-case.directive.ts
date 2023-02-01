import { Directive, HostListener, Input, ElementRef } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: 'textarea[convertCase]'
})
export class ConvertCaseDirective {
	constructor(private ngControl: NgControl, private el: ElementRef) {}

	@HostListener('keydown', ['$event'])
	onKeyDown(event: KeyboardEvent) {
		if (event.shiftKey) { return; }

		const textarea = event.target as HTMLTextAreaElement;
		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const selectedText = textarea.value.substring(start, end);

		if (typeof selectedText == "undefined" || selectedText.length == 0) { return; }

		switch (event.key) {
		case '[':
			textarea.value = textarea.value.substring(0, start) + selectedText.toLowerCase() + textarea.value.substring(end);
			break;
		case ']':
			textarea.value = textarea.value.substring(0, start) + selectedText.toLowerCase().replace(/(?<!\w\')\b\w/g, l => l.toUpperCase()) + textarea.value.substring(end);
			break;
		case '\\':
			textarea.value = textarea.value.substring(0, start) + selectedText.toUpperCase() + textarea.value.substring(end);
			break;
		default:
			return;
		}
		event.preventDefault();
		textarea.setSelectionRange(start, end);
		this.ngControl.control.setValue(textarea.value);
		this.ngControl.control.updateValueAndValidity();
	}
}
