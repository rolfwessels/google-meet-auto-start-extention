import { SlackSession } from "./slackSession";
import { TabActions } from "./tabActions";
import { MessageParse } from "./messageParse";
import { OptionSettings } from "./options";
import { Settings } from "./settings";

let tabActions = new TabActions();
let overrideResponse = null;
var settings = new Settings<OptionSettings>();
var _session: SlackSession = null;

async function main() {
  var options = await settings.get(new OptionSettings());
  if (_session) {
    console.log("Connected to slack...");
    _session.close();
    _session = null;
  }
  if (options.slackToken) {
    _session = await connecToSlack(options);
  } else {
    console.error("Add slack token to settings to connect to slack.");
  }
}

async function connecToSlack(options: OptionSettings) {
  var session = new SlackSession(
    atob(options.slackToken),
    options.slackChannel
  );
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
  return session;
}

tabActions.onSettingsUpdated = () => main();
tabActions.listenToContentScript();
main();
