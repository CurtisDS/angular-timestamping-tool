import { Component, HostBinding, Input, OnInit } from '@angular/core';
import { ViewStateService, LineObj } from '../../services/view-state.service';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
  selector: 'app-topic',
  templateUrl: './topic.component.html',
  styleUrls: ['./topic.component.css']
})
export class TopicComponent implements OnInit {
  constructor(
    public viewservice: ViewStateService,
    private clipboard: Clipboard
  ) { }

  /** the index of this topic */
  @Input() lineIndex: number;

  /** the main object for the topic */
  lineObj: LineObj

  @HostBinding('class.topic') topicClass: boolean = false;
  @HostBinding('class.subtopic') subtopicClass: boolean = false;
  @HostBinding('class.heading') headingClass: boolean = false;
  @HostBinding('attr.topicchar') startChar: string = '';
  @HostBinding('style.padding-left') paddingLeft: string = '';

  @HostBinding('class.activeIndex') get currentIndex(): boolean {
    return this.viewservice.activeIndex === this.lineIndex;
  };

  @HostBinding('class.covered') get covered(): boolean {
    return this.viewservice.activeIndex > this.lineIndex;
  };

  @HostBinding('class.upcoming') get upcoming(): boolean {
    return this.viewservice.activeIndex < this.lineIndex;
  };

  /** get the button color based on if this is before or after the active index */
  get btnColor() {
    if(this.upcoming)
      return 'accent';
    if(this.currentIndex)
      return 'primary';
    return 'none';
  }

  /** initialize classes and attributes */
  ngOnInit() {
    this.lineObj = this.viewservice.docArray[this.lineIndex];
    this.paddingLeft = this.lineObj.depth > 0 ? this.lineObj.depth + 'em' : '0.5em';
    this.topicClass = this.lineObj.isTopic;
    this.subtopicClass = this.lineObj.isSubtopic;
    this.headingClass = !this.lineObj.isTopic && !this.lineObj.isSubtopic;
    this.startChar = this.lineObj.topicChar;
  }

  /** copy the title to clipboard and set this topic as active index */
  copyClick() {
    this.viewservice.activeIndex = this.lineIndex;
    this.copyString(this.lineObj.title);
  }

  /** copy string to clipboard */
  copyString(copyString: string) {
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

  /** save the docstring to localstorage */
  save() {
    this.viewservice.updateDocString();
    this.viewservice.saveDocStringToLocalStorage();
  }
}