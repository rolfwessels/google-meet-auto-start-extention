import * as $ from "jquery";
const CURRENT_MEETING = "currentMeeting_1";
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

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  if (msg.color) {
    console.log("Receive color = " + msg.color);
    document.body.style.backgroundColor = msg.color;
    sendResponse("Change color to " + msg.color);
  } else {
    sendResponse("Color message is none.");
  }
  // If the received message has the expected format...
  if (msg.text === "report_back") {
    // Call the specified callback, passing
    // the web-page's DOM content as argument
    sendResponse(document.all[0].outerHTML);
  }
});

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
  var found = $("[data-call-id");
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
          setTimeout(() => element.click(), 5000);
        });
      } else {
        console.log("Already loading");
      }
    }
  });
  return found.length;
}

function locateJoinMeeting(): number {
  var found = $("[aria-label='Join meeting. ']");
  found.each((c, element) => {
    get(CURRENT_MEETING, new Meeting(), loadedMeeting => {
      console.log("Found meeting", loadedMeeting);
      if (loadedMeeting.eventId) {
        console.log("Clicking join meeting.... wait 5 seconds");
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
  console.log("Scanning:");
  if (locateMeeting() == 0) {
    locateJoinMeeting();
    locateCloseMeeting();
  }
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
