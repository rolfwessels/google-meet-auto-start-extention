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
    if (overrideResponse != null) {
      session.post(text, overrideResponse);
      overrideResponse = null;
    } else {
      session.postToDefaultChannel(text);
    }
  };

  session.onMessage(m => {
    if (m.isSpeakingToMe || m.isOnMyChannel) {
      let parser = new MessageParse();
      parser.onStart = () => {
        overrideResponse = m.channel;
        tabActions.startMeeting(m);
      };
      parser.onOpen = room => tabActions.openMeeting(room, m);
      parser.onClose = () => {
        overrideResponse = null;
        tabActions.closeMeetings(m);
      };
      parser.parse(m.text, m, !m.isSpeakingToMe && m.isOnMyChannel);
    }
  });
  try {
    await session.connect();
    console.log("Connected to slack...");
    session.postToDefaultChannel("Check format");
  } catch (e) {
    console.error(e);
  }
}

tabActions.listenToContentScript();

main();
