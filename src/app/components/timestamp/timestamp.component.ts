import { Component, Input, OnInit } from '@angular/core';
import { SavedTime, TimesService } from '../../services/times.service';

@Component({
  selector: 'app-timestamp',
  templateUrl: './timestamp.component.html',
  styleUrls: ['./timestamp.component.css'],
})
export class TimestampComponent implements OnInit {
  @Input() timestampIndex: number;

  constructor(private timeservice: TimesService) {}

  savedTime: SavedTime;

  ngOnInit() {
    this.savedTime = this.timeservice.times[this.timestampIndex];
  }

  getMin() {
    if (this.timestampIndex > 0) {
      return this.timeservice.times[this.timestampIndex - 1]
        .getAdjustedTime()
        .diff(this.savedTime.value, 'seconds');
    }
    return null;
  }

  getMax() {
    if (this.timeservice.times?.length - 1 > this.timestampIndex) {
      return this.timeservice.times[this.timestampIndex + 1]
        .getAdjustedTime()
        .diff(this.savedTime.value, 'seconds');
    }
    return null;
  }

  get diffString(): string {
    let dif = this.timeservice.getDiff(this.savedTime);
    return dif.format('HH:mm:ss');
  }

  get dateString(): string {
    return this.savedTime.getAdjustedTime().format('MMM DD HH:mm:ss');
  }

  get canDelete() {
    return this.timeservice.times?.length > 1 && this.timestampIndex !== 0;
  }

  delete() {
    if (this.canDelete) {
      this.timeservice.deleteTime(this.timestampIndex);
    }
  }
}
