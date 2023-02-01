import { Component, ElementRef, HostListener, ViewChild, OnInit } from '@angular/core';
import { ViewState, ViewStateService } from './services/view-state.service';

@Component({
  selector: 'app-docs',
  templateUrl: './docs.component.html',
  styleUrls: ['./docs.component.css']
})
export class DocsComponent implements OnInit {
  constructor(public viewstateservice: ViewStateService) {}

  /** an observer that watches for an element to come into the view */
  private observer:IntersectionObserver;
  /** the current active topic */
  private activeTopic: ElementRef;
  /** the button element that will scroll the user back to the active topic */
  private jumpToActiveTopicBtn: ElementRef;
  /** the text area element used for the document manual edit */
  private docInputTextArea: ElementRef;
  /** a timer to be used for saving after a number of seconds of inactivity */
  private saveTimer: any;

  /** sets the active topic based on the view child and connects an observer to watch if it goes on/off screen */
  @ViewChild('activeTopic', { read: ElementRef }) set activeTopicViewChild(topic: ElementRef) {
    // set the topic
    this.activeTopic = topic;
    // remove any old active observers
    this.observer.disconnect();
    if(this.activeTopic) {
      // if isnt undefined add the native element to the observer
      this.observer.observe(this.activeTopic.nativeElement);
    }
  }

  /** set the jump to active button element based on the view child */
  @ViewChild('jumpToActiveBtn', { read: ElementRef }) set jumpToActiveTopicBtnViewChild(btn: ElementRef) {
    // set the button
    this.jumpToActiveTopicBtn = btn;
  }

  /** set the text area from view child */
  @ViewChild('docInput', { read: ElementRef }) set docInputTextAreaViewChild(textarea: ElementRef) {
    // set the textarea
    this.docInputTextArea = textarea;
    if(this.docInputTextArea) {
      // get the native element
      let el = this.docInputTextArea.nativeElement;
      // add event listener to text area
      el.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "Tab") {
          // tab was pressed, prevent default an insert \t to field
          e.preventDefault();
          // get caret position/selection
          let val = el.value;
          let start = el.selectionStart;
          let end = el.selectionEnd;

          // set textarea value to: text before caret + tab + text after caret
          el.value = val.substring(0, start) + '\t' + val.substring(end);

          // put caret at right position again
          el.selectionStart = el.selectionEnd = start + 1;
        }
      });
    }
  }

  /** the heading of the app */
  name = 'Show Docs';

  /** the {@link ViewStates ViewState} */
  get viewState(): ViewState {
    return this.viewstateservice.state;
  }

  /** {@link ViewState ViewState} enum */
  get ViewStates(): typeof ViewState {
    return ViewState;
  }

  /** run code on init of component */
  ngOnInit(): void {
    // initialize options for an intersection observer
    // to track if the Scroll To Active Topic button should be shown
    let options = {
      root: null,
      rootmargin: '0px',
      threshold: 0.01
    };

    // create the observer
    this.observer = new IntersectionObserver((entries) => {
      if(this.activeTopic) {
        // if it is intersecting that means the active topic is visible and we dont need to show the button
        if (entries[0].isIntersecting) {
          this.jumpToActiveTopicBtn.nativeElement.classList.add("hideButton");
        } else {
          // show the button to scroll back to the active topic
          this.jumpToActiveTopicBtn.nativeElement.classList.remove("hideButton");
        }
      }
    }, options);
  }

  // /** confirm the browser closing if there are existing topics */
  // @HostListener('window:beforeunload', ['$event'])
  // beforeLeaveFn = (event: any) => {
  //   if(typeof this.viewstateservice.docArray === "undefined" || this.viewstateservice.docArray.length==0) {
  //     return undefined;
  //   }
  //   let confirmationMessage = 'You may lose data if you leave. Are you sure?';

  //   (event || window.event).returnValue = confirmationMessage; //Gecko + IE
  //   return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
  // }

  /** scroll to active topic */
  jumpToActiveTopic() {
    this.activeTopic.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /** save docstring to localstorage after set number of milliseconds. Interupts previous calls
   * @param time_ms - the time in milliseconds to set the timer for
   */
  save(time_ms: number) {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.viewstateservice.saveDocStringToLocalStorage();
    }, time_ms);
  }
}
