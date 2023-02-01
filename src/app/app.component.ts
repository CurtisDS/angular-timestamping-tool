import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  constructor() {}

  flip = false;
  showDocs = true;
  showTimes = true;

  ngOnInit() {
    
  }

  doFlip() {
    if (this.showDocs && this.showTimes) {
      this.flip = !this.flip;
    } else {
      this.showDocs = !this.showDocs;
      this.showTimes = !this.showTimes;
    }
  }
}
