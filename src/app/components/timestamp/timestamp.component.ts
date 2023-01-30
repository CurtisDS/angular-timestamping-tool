import { Component, Input, OnInit } from '@angular/core';
import { SavedTime, TimesService } from '../../services/times.service';
import moment from 'moment';
import { YoutubeService } from '../../services/youtube.service';

@Component({
  selector: 'app-timestamp',
  templateUrl: './timestamp.component.html',
  styleUrls: ['./timestamp.component.css'],
})
export class TimestampComponent implements OnInit {
  constructor(private timeservice: TimesService, private youtube: YoutubeService) {}

  /** the index of this timestamp */
  @Input() timestampIndex: number;

  /** the {@link SavedTime split} data for this timestamp */
  savedTime: SavedTime;

  ngOnInit() {
    // get the split data from the timeservice for this timestamp index
    this.savedTime = this.timeservice.times[this.timestampIndex];
  }

  playAtTimestamp() {
    this.youtube.seekTo(7);
  }

  /** return the min value for the offset input control */
  getMin(): number|null {
    // if there is a previous timestamp
    if (this.timestampIndex > 0) {
      // check its adjusted value and return a min value that will prevent overlapping that timestamp
      return this.timeservice.times[this.timestampIndex - 1]
        .getAdjustedTime()
        .diff(this.savedTime.value, 'seconds');
    }
    return null;
  }

  /** return the max value for the offset input control */
  getMax(): number|null {
    // create a moment to act as a limit. Default it to the current time.
    let limit = moment();
    // if there is a timestamp after this one use that timestamp instead
    if (this.timeservice.times?.length - 1 > this.timestampIndex) {
      // get its adjusted value
      limit = this.timeservice.times[this.timestampIndex + 1].getAdjustedTime();
    }
    // return a max value that will prevent overlapping either now or the next timestamp
    return limit.diff(this.savedTime.value, 'seconds');
  }

  /** get the adjusted difference between this timestamp and the starting timestamp formated as HH:mm:ss */
  get diffString(): string {
    let dif = this.timeservice.getDiff(this.savedTime);
    return dif.format('HH:mm:ss');
  }

  /** get the adjusted timestamp formated as a date string */
  get dateString(): string {
    return this.savedTime.getAdjustedTime().format('MMM DD HH:mm:ss');
  }

  /** @returns {boolean} true if timestampIndex !== 0 */
  get canDelete(): boolean {
    return this.timestampIndex !== 0;
  }

  /** delete this timestamp from the list of timestamps */
  delete() {
    if (this.canDelete) {
      this.timeservice.deleteTime(this.timestampIndex);
    }
  }
}
