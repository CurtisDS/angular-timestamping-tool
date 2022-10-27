import { Component, EventEmitter, forwardRef, Input, OnInit, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.css'],
  providers: [{
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SpinnerComponent),
      multi: true
  }]
})
export class SpinnerComponent implements OnInit, ControlValueAccessor {
  
  @Input() min!: number;
  @Input() max!: number;
  @Input() step!: number;
  @Input() id!: string;
  @Input() label!: string;
  @Input() value!: string;

  @Input() placeholder!: string;
  @Input() readonly!: string;
  @Input() required!: string;
  @Input() name!: string;
  @Input() size!: string;
  @Input() maxlength!: string;
  @Input() title!: string;


  @Input()  ngModel!: number;
  @Output() ngModelChange = new EventEmitter<number>();

  isPointerFine = true;
  isPointerCoarse = false;
  inputType = "text";

  disabled: boolean;

  get valueNum():number {
    return this.ngModel;
  };

  set valueNum(val: number) {
    this.ngModel = val;
  }

  getReadonly() {
    return (this.readonly as any)===true||this.readonly==='readonly'||this.readonly==='';
  }
  getRequired() {
    return (this.required as any)===true||this.required==='readonly'||this.required==='';
  }

  constructor() {}

  onChange = (event: number) => { };
  onTouched = (event: boolean) => { };

  writeValue(obj: any): void {
    this.valueNum = obj;
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  ngOnInit() {
    this.isPointerFine = matchMedia('(pointer:fine)').matches
    this.isPointerCoarse = matchMedia('(pointer:coarse)').matches

    if(!this.isPointerFine) {
      this.inputType = "number";
    }

    if(typeof this.value != "undefined" && this.value != null) {
      this.valueNum = parseFloat(this.value);
    }
  }

  numberKeyListener(e: KeyboardEvent) {
    const keyCode = e.key;
    if (keyCode == "ArrowUp" || keyCode == "ArrowDown") {
      if(this.valueNum == null) this.valueNum = 0;

      const elem:HTMLInputElement = e.target as HTMLInputElement;

      if (elem.readOnly || elem.disabled) return false;

      const step:number = this.step || 1;

      let val = parseFloat(this.valueNum.toString().replace(/[^\d\.\-eE+]/g, ''));

      if (isNaN(val)) {
        val = 0;
      }

      if (keyCode == "ArrowUp") {
        val += step;
      } else if (keyCode == "ArrowDown") {
        val -= step;
      }

      e.preventDefault();
      this.normalizeValue(val, elem);
      return false;
    }
  }

  change(e: Event) {
    if(this.valueNum != null && typeof this.valueNum != "undefined" && (this.valueNum as any) != "") {
      const elem:HTMLInputElement = e.target as HTMLInputElement;
      let valString: string = this.valueNum.toString().replace(/[^0-9\*\-\/\^\+\.\e\E\(\)\%]/g, '');
      let val: number = parseFloat(eval(valString));
      this.normalizeValue(val, elem);
    } else {
      this.ngModelChange.emit(this.valueNum);
    }
    
    this.onChange(this.valueNum);
  }

  blur(e: FocusEvent) {
    this.onTouched(true);
  }

  normalizeValue(val: number, elem:HTMLInputElement) {
    if(val !== null || typeof val !== "undefined") {
      if(isNaN(val)) val = 0;

      const min = typeof this.min === "undefined" || this.min === null ? -1000000000000 : this.min;
      const max = typeof this.max === "undefined" || this.max === null ? 1000000000000 : this.max;

      if (val < min) {
        val = min;
      }
      if (val > max) {
        val = max;
      }
      this.valueNum = Math.round(val * 1000000) / 1000000;
      
      if(this.inputType==="text") {
        const end = this.valueNum.toString.length;
        elem.setSelectionRange(end, end);
      }
    } else {
      this.valueNum = val;
    }
    this.ngModelChange.emit(this.ngModel);
  }

  stepUp(elem:HTMLInputElement) {
    if(this.valueNum == null) this.valueNum = 0;

    if (elem.readOnly || elem.disabled) return false;

    const step:number = this.step || 1;

    let val = parseFloat(this.valueNum.toString().replace(/[^\d\.\-eE+]/g, ''));

    if (isNaN(val)) {
      val = 0;
    }

    val += step;

    this.normalizeValue(val, elem);
    return false;
  }

  stepDown(elem:HTMLInputElement) {
    if(this.valueNum == null) this.valueNum = 0;

    if (elem.readOnly || elem.disabled) return false;

    const step:number = this.step || 1;

    let val = parseFloat(this.valueNum.toString().replace(/[^\d\.\-eE+]/g, ''));

    if (isNaN(val)) {
      val = 0;
    }

    val -= step;

    this.normalizeValue(val, elem);
    return false;
  }
}
