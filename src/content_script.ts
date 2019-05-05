import * as $ from "jquery";
import { TabActions } from "./tabActions";

const JQ_START_NEW_MEETING = "div:contains('Start a new meeting'):parent";
const JQ_MEETING_BUTTON = "[data-call-id]";
const JQ_JOIN_MEETING = "[aria-label='Join meeting. ']";
const JQ_START_MEETING = "[aria-label='Start meeting. ']";

const CURRENT_MEETING = "currentMeeting_1";
const SELECT_COLOR = "#6200EE";
type CallbackFunction = (value: any) => void;

class Meeting {
  constructor() {
    this.isNow = false;
    this.callId = "test";
  }

  public beginTime: number;
  public endTime: number;
  public eventId: string;
  public callId: string;
  public isNow: boolean;

  public toString() {
    return (
      " Meeting -  beginTime:" +
      this.beginTime +
      " endTime:" +
      this.endTime +
      " eventId:" +
      this.eventId +
      " callId:" +
      this.callId +
      " isNow:" +
      this.isNow
    );
  }
}
var loadedMeeting = new Meeting();
var listner = new TabActions();
listner.onOpenMeeting = (meeting, response) => {
  console.log("Request to open meeting " + meeting);
  response("Opening meeting " + meeting);
  setTimeout(
    () => (document.location.href = `https://meet.google.com/${meeting}`),
    1000
  );
};

listner.onStartMeeting = response => {
  var startButton = $(JQ_START_NEW_MEETING);
  if (startButton) {
    response("Starting session");
    startButton.click();
  } else {
    response("Hmmm.. call close to stop the current session");
  }
};
listner.onCloseMeeting = response => {
  response("Closing meetings");
  setTimeout(() => (document.location.href = "https://meet.google.com"), 1000);
};
listner.startListner();

function isDone(endTime: Date) {
  var timeSpan = <any>endTime - <any>new Date();
  const isDone = endTime < new Date();
  console.log(
    "Time till the meeting closes:",
    Math.round(timeSpan / 1000 / 60)
  );
  return isDone;
}

function locateMeeting(): number {
  var found = $(JQ_MEETING_BUTTON);
  console.log("Found meetings: " + found.length);
  found.each((c, element) => {
    var meeting = new Meeting();

    meeting.beginTime = parseInt(
      element.attributes.getNamedItem("data-begin-time").value
    );
    meeting.endTime = parseInt(
      element.attributes.getNamedItem("data-end-time").value
    );
    meeting.eventId = element.attributes.getNamedItem("data-event-id").value;
    meeting.callId = element.attributes.getNamedItem("data-call-id").value;
    meeting.isNow = element.attributes.getNamedItem("data-is-now") !== null;

    if (meeting.isNow) {
      if (loadedMeeting.eventId != meeting.eventId) {
        console.log("Connecting to meeting " + meeting.callId);
        loadedMeeting = meeting;
        store(CURRENT_MEETING, meeting, stored => {
          console.log("Saved meeting " + stored.callId);
          $(element).css("background-color", SELECT_COLOR);
          setTimeout(() => element.click(), 5000);
        });
      } else {
        console.log("Already loading");
      }
    }
  });
  return found.length;
}

function locateStartMeeting(): number {
  var found = $(`${JQ_START_MEETING}`);

  found.each((c, element) => {
    get(CURRENT_MEETING, new Meeting(), loadedMeeting => {
      console.log("Found meeting", loadedMeeting);
      if (loadedMeeting.eventId) {
        console.log("Clicking join meeting.... wait 5 seconds");
        $(element).css("background-color", SELECT_COLOR);
        setTimeout(() => element.click(), 5000);
      } else {
        console.log("Skip clicking.");
      }
    });
  });
  return found.length;
}

function locateJoinMeeting(): number {
  var found = $(JQ_JOIN_MEETING);

  found.each((c, element) => {
    get(CURRENT_MEETING, new Meeting(), loadedMeeting => {
      console.log("Found meeting", loadedMeeting);
      if (loadedMeeting.eventId) {
        console.log("Clicking join meeting.... wait 5 seconds");
        $(element).css("background-color", SELECT_COLOR);
        setTimeout(() => element.click(), 5000);
      } else {
        console.log("Skip clicking.");
      }
    });
  });
  return found.length;
}

function locateCloseMeeting(): number {
  var found = $("[aria-label='Leave call']");
  found.each((c, element) => {
    get(CURRENT_MEETING, new Meeting(), (loadedMeeting: Meeting) => {
      console.log("You are in meeting", loadedMeeting);
      if (isDone(new Date(loadedMeeting.endTime))) {
        store(CURRENT_MEETING, new Meeting(), () => {
          console.log("Clicked disconnect");
          setTimeout(() => element.click(), 1000);
          setTimeout(
            () => (document.location.href = "https://meet.google.com"),
            5000
          );
        });
      }
    });
  });
  return found.length;
}

function polling() {
  setTimeout(polling, 1000 * 8);
  chrome.storage.local.get({ isEnabled: true }, function(items: { isEnabled }) {
    if (items.isEnabled) {
      if (locateMeeting() == 0) {
        locateJoinMeeting();
        locateStartMeeting();
        locateCloseMeeting();
      }
    } else {
      console.log("Extention disabled.");
    }
  });
}

function store(key: string, value: any, action: CallbackFunction): any {
  var set = {};
  set[key] = value;
  chrome.storage.local.set(set, function() {
    action(value);
  });
}

function get(key: string, defaultValue: any, action: CallbackFunction) {
  chrome.storage.local.get([key], function(data) {
    action(data[key] || defaultValue);
  });
}
polling();
