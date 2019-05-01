import * as $ from "jquery";
const CURRENT_MEETING = "currentMeeting";
type CallbackFunction = (value: any) => void;

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

var stopScanningJoinButton: boolean = false;

function locateMeeting(): number {
  var found = $("[data-call-id");
  console.log("Found meetings: " + found.length);
  found.each((c, element) => {
    var meeting = new Meeting();

    meeting.beginTime = element.attributes.getNamedItem(
      "data-begin-time"
    ).value;
    meeting.endTime = element.attributes.getNamedItem("data-end-time").value;
    meeting.eventId = element.attributes.getNamedItem("data-event-id").value;
    meeting.callId = element.attributes.getNamedItem("data-call-id").value;
    meeting.isNow = element.attributes.getNamedItem("data-is-now") !== null;

    if (meeting.isNow) {
      get(CURRENT_MEETING, new Meeting(), loadedMeeting => {
        console.log("loadedMeeting", loadedMeeting);
        if (loadedMeeting.eventId != meeting.eventId) {
          console.log("Connecting to meeting " + meeting.callId);
          store(CURRENT_MEETING, meeting, stored => {
            console.log("Saved meeting " + stored.callId);
            get(CURRENT_MEETING, new Meeting(), found => {
              console.log("FOUND :::: ", found);
              //setTimeout(() => element.click(), 5000);
            });
          });
        } else {
          console.log("Already loading");
        }
      });
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
        stopScanningJoinButton = true;
        setTimeout(() => element.click(), 5000);
      } else {
        console.log("Skip clicking.");
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
  }
}

function store(key: string, value: any, action: CallbackFunction): any {
  chrome.storage.local.set({ key: value }, function() {
    console.log("Stored: " + key, value);
    action(value);
  });
}

function get(key: string, defaultValue: any, action: CallbackFunction) {
  chrome.storage.local.get([key], function(data) {
    console.log(key, data);
    console.log("defaultValue", defaultValue);
    action(data[key] || defaultValue);
  });
}
class Meeting {
  constructor() {
    this.isNow = false;
    this.callId = "test";
  }
  public beginTime: string;
  public endTime: string;
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
polling();
