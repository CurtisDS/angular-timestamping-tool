import { Component, HostListener, OnInit, OnDestroy, ViewChild} from '@angular/core';
import { TimesService } from './services/times.service';
import { ViewState, SortState, ViewStateService } from './services/view-state.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { YoutubeService } from './services/youtube.service';
import { YouTubePlayer } from '@angular/youtube-player';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-timestamps',
  templateUrl: './timestamps.component.html',
  styleUrls: ['./timestamps.component.css'],
})
export class TimestampsComponent implements OnInit, OnDestroy {
  constructor(
    public timeservice: TimesService,
    public viewstateservice: ViewStateService,
    private clipboard: Clipboard,
    private youtube: YoutubeService
  ) {}

  @ViewChild("player") player: YouTubePlayer;

  private youtubeServiceSubscription: Subscription;

  /** the heading of the app */
  name = 'Timestamps';

  youtubeApiLoaded = false;

  /** the {@link ViewStates ViewState} */
  get viewState(): ViewState {
    return this.viewstateservice.state;
  }

  /** {@link ViewState ViewState} enum */
  get ViewStates(): typeof ViewState {
    return ViewState;
  }

  /** the {@link SortStates SortState} */
  get sortState(): SortState {
    return this.viewstateservice.sort;
  }

  /** {@link SortState SortState} enum */
  get SortStates(): typeof SortState {
    return SortState;
  }

  /** get the youtube url from the youtube service */
  get youtubeURL(): string {
    return this.youtube.URL;
  }

  /** get the youtube panel view setting */
  get showYTPanel(): boolean {
    return this.youtube.showYTPanel;
  }

  get videoID(): string|null {
    if(this.youtube.URL) {
      const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
      const match = this.youtube.URL.match(regExp);
      const id = (match&&match[7].length==11)? match[7] : this.youtube.URL;
      return id;
    }
    return null;
  }

  get timeCode(): string {
    if(typeof this.player === "undefined" || this.player === null) return "";
    return this.convertSecondsToYTTimestring(this.player.getCurrentTime()) + "/" + this.convertSecondsToYTTimestring(this.player.getDuration());
  }

  convertSecondsToYTTimestring(seconds: number): string {
    const sec = Math.trunc(seconds);
    const min = Math.floor(sec / 60);
    const hour = Math.floor(min / 60);
    const day = Math.floor(hour / 24);
  
    const rSec = sec % 60;
    const rMin = min % 60;
    const rHour = hour % 24;
  
    let result = '';
    if (day > 0) result += `${day}:`;
    if (day > 0 || rHour > 0) result += `${rHour < 10 && day > 0 ? '0' + rHour : rHour}:`;
    result += `${rMin < 10 && (day > 0 || rHour > 0) ? '0' + rMin : rMin}:`;
    result += `${rSec < 10 ? '0' + rSec : rSec}`;
  
    return result;
  }

  ngOnInit() {
    if (!this.youtubeApiLoaded) {
      // This code loads the IFrame Player API code asynchronously, according to the instructions at
      // https://developers.google.com/youtube/iframe_api_reference#Getting_Started
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
      this.youtubeApiLoaded = true;
    }
    this.youtubeServiceSubscription = this.youtube.seekToObservable.subscribe(time => {
      this.player.seekTo(time, true);
      this.player.playVideo();
    });
  }

  ngOnDestroy() {
    this.youtubeServiceSubscription.unsubscribe();
  }

  /** covert a time split into a simple string */
  getTimeStampText(index: number, sortState = this.sortState): string {
    // if the sort is RevChron the index number is going to be upside down and needs to be normalized to a standard index number
    // for example if RevChron Index 0 is actually pointng to the last index of the array and needs to be adjusted
    // if it is sorted Chron take index as is
    index = sortState === SortState.RevChron ? this.timeservice.times.length - (1 * index + 1) : index;
    // get the time split from the times list
    let time = this.timeservice.times[index];
    // create a label if there isnt one set already based on the index value
    let label = time.label || `Split ${index+1}`;
    // create a string to represent the offset value. If above 60s convert and round to minutes. If above 60m convert and round to hours
    let adjusted = true ? "" : /* IGNORE THIS. Originally intended to show which timestamps were suspected to be inacurate but not used anymore*/
      typeof time.offsetSeconds === 'undefined' || time.offsetSeconds === null ||  time.offsetSeconds as any == ""
        ? ''
        : Math.abs(time.offsetSeconds) > 3600
        ? `*${time.offsetSeconds>0?'+':''}${Math.round(time.offsetSeconds / 3600)}h `
        : Math.abs(time.offsetSeconds) > 60
        ? `*${time.offsetSeconds>0?'+':''}${Math.round(time.offsetSeconds / 60)}m `
        : `*${time.offsetSeconds>0?'+':''}${time.offsetSeconds}s `;
    // get the adjusted time difference formated as a timestamp
    let dif = this.timeservice.getDiff(time).format('HH:mm:ss');
    // put everything together to make a single line for this split
    return `${dif} - ${adjusted}${label}`;
  }

  /** add the list of time splits as a simple text list to the clipboard */
  copyTimestamps() {
    let copyString = '';

    // for each time split convert the time to a timestamp string
    for(let i = 0; i < this.timeservice.times.length; i++) {
      copyString += this.getTimeStampText(i, SortState.Chron) + '\n';
    }

    // bigin adding text to clipboard
    const pending = this.clipboard.beginCopy(copyString);
    let remainingAttempts = 3;
    // create a method to attempt to add the text to the clipboard. This is needed if the text is large.
    const attempt = () => {
      const result = pending.copy();
      if (!result && --remainingAttempts) {
        setTimeout(attempt);
      } else {
        // Remember to destroy when you're done!
        pending.destroy();
      }
    };
    // run the attempts to add the text to the clipboard
    attempt();
  }

  // /** confirm the browser closing if there is existing time splits */
  // @HostListener('window:beforeunload', ['$event'])
  // beforeLeaveFn = (event: any) => {
  //   if(this.timeservice.times.length==0) {
  //     return undefined;
  //   }
  //   let confirmationMessage = 'It looks like you have a Timestamp session. '
  //                           + 'If you leave now you will lose your times.';

  //   (event || window.event).returnValue = confirmationMessage; //Gecko + IE
  //   return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
  // }
}
