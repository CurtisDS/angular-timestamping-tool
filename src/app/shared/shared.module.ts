import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ConvertCaseDirective } from './directives/convert-case.directive';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [ ConvertCaseDirective ],
  exports: [ ConvertCaseDirective ]
})
export class SharedModule { }