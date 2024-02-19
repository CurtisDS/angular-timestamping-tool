import { Injectable } from '@angular/core';
import { DEBUG } from '../../app.module';
import { TEST_DATA } from './test-data.service';

export enum ViewState {
  Edit = 1,
  Code = 2
}

/** an array of characters that denote either a main topic or a subtopic */
export const StartChars = ['-','–','—','−','⸺','—','∟','+'];

/** an array of characters that denote a subtopic */
export const SubTitleChars = ['∟','+'];

export class LineObj {

  /** the source line */
  private _line: string;

  /** the title text */
  public title: string;
  /** the character to denote a topic or subtopic */
  public topicChar: string;
  /** the depth of the subtoic, will be 0 if not a subtopic */
  public depth: number;

  constructor(line: string, depth: number) {
    // save the original line
    this._line = line;
    // if this is a topic remove the first character and set as title otherwise use entire line
    this.title = this.isTopic ? this._line.substring(1).trim() : this._line.trim();
    // if this is a topic set to the first character of the line
    this.topicChar = this.isTopic ? this.isSubtopic ? '∟' : '–' : '';
    // set the depth of the subtopic. If its not a subtopic the depth is always 0
    this.depth = this.isSubtopic ? depth : 0;
  }

  get isTopic() {
    return StartChars.includes(this._line.charAt(0));
  }

  get isSubtopic() {
    return SubTitleChars.includes(this._line.charAt(0));
  }

  /** recombine the elements of this topic into a full source line */
  get line() {
    let out = [];
    if(this.isTopic) {
      out.push(this.topicChar);
    }
    out.push(this.title);
    return '\t'.repeat(this.depth) + out.join(' ');
  }
}

@Injectable({
  providedIn: 'root',
 })
export class ViewStateService {

  /** the {@link ViewState} */
  private _viewstate: ViewState;

  /** Get the number of leading tabs */
  private getTabCount(text: string) {
    let count = 0;
    let index = 0;
    do {
      var char = text.charAt(index++);
      if(char === "\t") count++;
    } while (char === "\t" || char === " ")
    return count;
  }

  /** the text representation of the doc */
  docString: string;

  /** the doc parsed into objects for each topic */
  docArray: LineObj[];

  /** the last copied topic index */
  activeIndex = 0;

  constructor() {
    // if we are in debug mode use the test data from the test data service for the document
    this.docString = DEBUG ? TEST_DATA : "";

    // initialize the default view state and sort state
    this._viewstate = ViewState.Edit;

    // if the browser supports local storage
    if (typeof(Storage) !== "undefined") {
      // check local storage to see if there was a previous view state and use that if it exists
      if (localStorage.lastShowDocViewState) {
        this._viewstate = ViewState[ViewState[localStorage.lastShowDocViewState]];
      }
      // check local storage to see if there was a previous docstring and use that if it exists
      if (localStorage.lastShowDoc) {
        this.docString = localStorage.lastShowDoc;
      }
    }
  }

  /** the current {@link ViewState} */
  get state(): ViewState {
    return this._viewstate;
  }

  /** update the current {@link ViewState} to a new state */
  updateViewState(state: ViewState) {
    // update the local copy of the view state
    this._viewstate = state;
    // if the browser supports local storage
    if (typeof(Storage) !== "undefined") {
      // save the view state in local storage so the next time the page loads the setting will be consistant
      localStorage.setItem("lastShowDocViewState", this._viewstate as any);
    }
  }

  /** save the doc string to local storage */
  saveDocStringToLocalStorage() {
    // if the browser supports local storage
    if (typeof(Storage) !== "undefined") {
      // save the show doc incase browser crashes
      localStorage.setItem("lastShowDoc", this.docString);
    }
  }

  /** Convert and save the {@link docArray} back into a {@link docString} */
  updateDocString() {
    this.docString = this.docArray.map(lineObj => lineObj.line).join('\n');
  }

  /** Convert a {@link docString} into a {@link docArray} and save it */
  generateDocArray() {
    // replace weird quotes, convert 3 spaces to tabs and split the string for ever new line
    let lines = this.docString.replace(/[“”]/g,'"').replace(/[‘’]/g,"'").replace(/   /g,"\t").split("\n");
    // try to remove blank or otherwise empty lines
    lines = lines.filter(line => {
      let trimmed = line.trim();
      let isTopic = StartChars.includes(trimmed.charAt(0));
      return trimmed.length > 0 && !isTopic || (isTopic && trimmed.length > 1);
    });
    // convert the strings to LineObj
    this.docArray = lines.map(line => 
      new LineObj(line.trim(), this.getTabCount(line))
    );
    // join the lines back and replace the docString after filtering the string
    this.updateDocString();
  }

  clearDoc() {
    this.docString = "";
    this.docArray = [];
  }
}