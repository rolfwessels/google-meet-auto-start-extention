import { readSlackToken, SlackSession, IWithResponse } from "./slackSession";
import { TabActions } from "./tabActions";
import { MessageParse } from "./messageParse";
let tabActions = new TabActions();
let overrideResponse = null;

async function main() {
  var settings = await readSlackToken();
  var session = new SlackSession(settings.token, settings.channel);
  tabActions.onMeetingStarted = room => {
    const text = `Meeting room ready: https://meet.google.com/${room}`;
    if (overrideResponse) {
      overrideResponse = null;
      session.post(text, overrideResponse);
    } else {
      session.postToDefaultChannel(text);
    }
  };

  session.onMessage(m => {
    if (!m.isBot) {
      let parser = new MessageParse();
      parser.onStart = () => {
        overrideResponse = m.channel;
        tabActions.startMeeting(m);
      };
      parser.onOpen = room => tabActions.openMeeting(room, m);
      parser.onClose = () => tabActions.closeMeetings(m);
      parser.parse(m.text, m);
    }
  });
  try {
    chrome.tabs.query({ url: "*://meet.google.com/*" }, function(tabs) {
      console.log("tabs", tabs);
    });

    await session.connect();
    console.log("Connected to slack...");
  } catch (e) {
    console.error(e);
  }
}

tabActions.listenToContentScript();

main();
