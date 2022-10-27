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
/** a custom component that is basically a wrapper for input field to have a number iput that also supports simple math operations in the field */
export class SpinnerComponent implements OnInit, ControlValueAccessor {
  constructor() {}

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

  isPointerFine = true; // assume the pointer is a mouse
  isPointerCoarse = false; // assume the pointer is a mouse
  inputType = "text"; // with mouse input use text input type

  disabled: boolean;

  get valueNum(): number {
    return this.ngModel;
  };

  set valueNum(val: number) {
    this.ngModel = val;
  }

  getReadonly(): boolean|null|undefined|string {
    return (this.readonly as any)===true||this.readonly==='readonly'||this.readonly==='';
  }
  getRequired(): boolean|null|undefined|string {
    return (this.required as any)===true||this.required==='readonly'||this.required==='';
  }

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
    // get what type of pointer the user has
    this.isPointerFine = matchMedia('(pointer:fine)').matches
    this.isPointerCoarse = matchMedia('(pointer:coarse)').matches

    // if the user is not using a mouse, set the input type to number to allow the platform to aid the user with input instead of using the custom spinner button because they are hard to touch on mobile
    if(!this.isPointerFine) {
      // this will prevent the simple math support of the component but its a better trade off to have native support of number input on mobile devices
      this.inputType = "number";
    }

    // if a value attribute was used to give data to this component set the value (ngModel) to the given value
    if(typeof this.value != "undefined" && this.value != null) {
      this.valueNum = parseFloat(this.value);
    }
  }

  /** key listener for the input field */
  numberKeyListener(e: KeyboardEvent) {
    const keyCode = e.key;
    // if up or down arrow is pressed
    if (keyCode == "ArrowUp" || keyCode == "ArrowDown") {
      // initialize value if its not
      if(this.valueNum == null) this.valueNum = 0;

      // get the html element of the input field
      const elem:HTMLInputElement = e.target as HTMLInputElement;

      // make sure its not read only or disabled
      if (elem.readOnly || elem.disabled) return false;

      // initialize step if its not already set
      const step:number = this.step || 1;

      // remove non number values from the value and parse the string
      let val = parseFloat(this.valueNum.toString().replace(/[^\d\.\-eE+]/g, ''));

      // if its not a valid number set it to 0
      if (isNaN(val)) {
        val = 0;
      }

      if (keyCode == "ArrowUp") {
        // if up is pressed increase value by step amount
        val += step;
      } else if (keyCode == "ArrowDown") {
        // if down is pressed decrease value by step amount
        val -= step;
      }

      // prevent default
      e.preventDefault();
      // normalize the value (make sure its not over the max etc)
      this.normalizeValue(val, elem);
      return false;
    }
  }

  change(e: Event) {
    if(this.valueNum != null && typeof this.valueNum != "undefined" && (this.valueNum as any) != "") {
      // if there is a valid value get the target input
      const elem:HTMLInputElement = e.target as HTMLInputElement;
      // remove non number characters not includeing math symbols
      let valString: string = this.valueNum.toString().replace(/[^0-9\*\-\/\^\+\.\e\E\(\)\%]/g, '');
      // eval the text string, this adds simple math support to the input field
      let evaled: any;
      try {
        evaled = eval(valString);
      } catch(e) {
        // if the eval fails just set the value to 0
        evaled = "0";
      }
      // parse the evaluated string to a float
      let val: number = parseFloat(evaled);
      // normalize the new value (make sure its not over the max etc)
      this.normalizeValue(val, elem);
    } else {
      // if the value is null/not set emit model changes event
      this.ngModelChange.emit(this.valueNum);
    }
    
    // call the onChange callback meathod
    this.onChange(this.valueNum);
  }

  blur(e: FocusEvent) {
    // if the input loses focus mark as touched
    this.onTouched(true);
  }

  /** normalize a value by applying specific rules to the value */
  normalizeValue(val: number, elem:HTMLInputElement) {
    if(val !== null || typeof val !== "undefined") {
      // initialize the value to 0 if its not a number
      if(isNaN(val)) val = 0;

      // get min
      const min = typeof this.min === "undefined" || this.min === null ? -1000000000000 : this.min;
      // get max
      const max = typeof this.max === "undefined" || this.max === null ? 1000000000000 : this.max;

      if (val < min) {
        // if value is below min, set to min
        val = min;
      }
      if (val > max) {
        // if value is above max, set to max
        val = max;
      }
      // round to 6 digits this helps (but does not solve) with floating point math issues
      this.valueNum = Math.round(val * 1000000) / 1000000;
      
      if(this.inputType==="text") {
        // change the caret to the end of the input
        // type="number" doesnt allow selection range so only do this for type="text"
        const end = this.valueNum.toString.length;
        elem.setSelectionRange(end, end);
      }
    } else {
      // if the val is null just accept the value
      this.valueNum = val;
    }
    // emit a change event
    this.ngModelChange.emit(this.ngModel);
  }

  /** step up button event handler */
  stepUp(elem:HTMLInputElement) {
    // initialize value if its not
    if(this.valueNum == null) this.valueNum = 0;

    // make sure its not read only or disabled
    if (elem.readOnly || elem.disabled) return false;

    // initialize step if its not already set
    const step:number = this.step || 1;

    // remove non number values from the value and parse the string
    let val = parseFloat(this.valueNum.toString().replace(/[^\d\.\-eE+]/g, ''));

    // if its not a valid number set it to 0
    if (isNaN(val)) {
      val = 0;
    }

    // increase value by step amount
    val += step;

    // normalize the value (make sure its not over the max etc)
    this.normalizeValue(val, elem);
    return false;
  }

  /** step down button event handler */
  stepDown(elem:HTMLInputElement) {
    // initialize value if its not
    if(this.valueNum == null) this.valueNum = 0;

    // make sure its not read only or disabled
    if (elem.readOnly || elem.disabled) return false;

    // initialize step if its not already set
    const step:number = this.step || 1;

    // remove non number values from the value and parse the string
    let val = parseFloat(this.valueNum.toString().replace(/[^\d\.\-eE+]/g, ''));

    // if its not a valid number set it to 0
    if (isNaN(val)) {
      val = 0;
    }

    // decrease value by step amount
    val -= step;

    // normalize the value (make sure its not over the max etc)
    this.normalizeValue(val, elem);
    return false;
  }
}
