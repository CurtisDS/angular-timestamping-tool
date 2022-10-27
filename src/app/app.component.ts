import { Component, HostListener } from '@angular/core';
import { TimesService } from './services/times.service';
import { ViewState, SortState, ViewStateService } from './services/view-state.service';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  constructor(
    public timeservice: TimesService,
    public viewstateservice: ViewStateService,
    private clipboard: Clipboard
  ) {}

  /** the heading of the app */
  name = 'Timestamps';

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

  /** covert a time split into a simple string */
  getTimeStampText(index: number, sortState = this.sortState): string {
    // if the sort is RevChron the index number is going to be upsidedown and needs to be normalized to a standard index number
    // for example if RevChron Index 0 is actually poing to the last index of the array and needs to be adjusted
    // if it is sorted Chron take index as is
    index = sortState === SortState.RevChron ? this.timeservice.times.length - (1 * index + 1) : index;
    // get the time split from the times list
    let time = this.timeservice.times[index];
    // create a label if there isnt one set already based on the index value
    let label = time.label || `Split ${index+1}`;
    // create a string to represent the offset value. If above 60s convert and round to minutes. If above 60m conveert and round to hours
    let adjusted =
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

  /** confirm the browser closing if there is existing time splits */
  @HostListener('window:beforeunload', ['$event'])
  beforeLeaveFn = (event: any) => {
    if(this.timeservice.times.length==0) {
      return undefined;
    }
    let confirmationMessage = 'It looks like you have a Timestamp session. '
                            + 'If you leave now you will lose your times.';

    (event || window.event).returnValue = confirmationMessage; //Gecko + IE
    return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
  }
}
