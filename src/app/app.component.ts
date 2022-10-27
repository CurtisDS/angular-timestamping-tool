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
  name = 'Timestamps';

  constructor(
    public timeservice: TimesService,
    public viewstateservice: ViewStateService,
    private clipboard: Clipboard
  ) {}

  get viewState() {
    return this.viewstateservice.state;
  }

  get ViewStates() {
    return ViewState;
  }

  get sortState() {
    return this.viewstateservice.sort;
  }

  get SortStates() {
    return SortState;
  }

  getTimeStampText(index: number, sortState = this.sortState): string {
    index = sortState === SortState.RevChron ? this.timeservice.times.length - (1 * index + 1) : index;
    let time = this.timeservice.times[index];
    let label = time.label || `Split ${index+1}`;
    let adjusted =
      typeof time.offsetSeconds === 'undefined' || time.offsetSeconds === null ||  time.offsetSeconds as any == ""
        ? ''
        : Math.abs(time.offsetSeconds) > 3600
        ? `*${time.offsetSeconds>0?'+':''}${Math.round(time.offsetSeconds / 3600)}h `
        : Math.abs(time.offsetSeconds) > 60
        ? `*${time.offsetSeconds>0?'+':''}${Math.round(time.offsetSeconds / 60)}m `
        : `*${time.offsetSeconds>0?'+':''}${time.offsetSeconds}s `;
    let dif = this.timeservice.getDiff(time).format('HH:mm:ss');
    return `${dif} - ${adjusted}${label}`;
  }

  copyTimestamps() {
    let copyString = '';

    for(let i = 0; i < this.timeservice.times.length; i++) {
      copyString += this.getTimeStampText(i, SortState.Chron) + '\n';
    }

    const pending = this.clipboard.beginCopy(copyString);
    let remainingAttempts = 3;
    const attempt = () => {
      const result = pending.copy();
      if (!result && --remainingAttempts) {
        setTimeout(attempt);
      } else {
        // Remember to destroy when you're done!
        pending.destroy();
      }
    };
    attempt();
  }

  ngOnInit() {
  }

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
