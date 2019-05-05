import * as slack from "slack";
import { setTimeout } from "timers";

class SlackSession {
  _defaultToken: { token: string };
  _webSocket: WebSocket;
  _messageCallBack: messageCallBack;
  constructor(token: string) {
    this._defaultToken = { token: token };
  }
  async connect(): Promise<Boolean> {
    var connection = await slack.rtm.connect(this._defaultToken);
    this._webSocket = new WebSocket(connection.url);
    this._webSocket.onmessage = event => {
      var msg = JSON.parse(event.data) as slackMessage;
      console.log("Recieved", msg);
      if (msg.type == "message" && this._messageCallBack != null) {
        this._messageCallBack(new IncommingMessage(msg, this));
      }
    };
    return connection.ok;
  }
  onMessage(text: messageCallBack) {
    this._messageCallBack = text;
  }

  async post(text: string, channel: string): Promise<Boolean> {
    let result = await slack.chat.postMessage({
      ...this._defaultToken,
      text: text,
      channel: channel
    });
    return result.ok;
  }
}

async function main() {
  var slackToken = await readSlackToken;

  const defaultToken = {};

  var session = new SlackSession(slackToken);
  session.onMessage(m => {
    console.log("recieved", m);
    if (!m.isBot)
      setTimeout(() => session.post(`${m.text} < recieved`, m.channel), 5000);
  });
  await session.connect();
}
// Get the slack token
var readSlackToken = new Promise<string>(function(resolve, reject) {
  chrome.storage.local.get(
    {
      slackToken: ""
    },
    function(items: { slackToken: string }) {
      if (items.slackToken == null || items.slackToken.length < 10) {
        reject("Please add slack token to use slack bot integration.");
      }
      resolve(atob(items.slackToken));
    }
  );
});

type messageCallBack = (value: IncommingMessage) => void;

class IncommingMessage {
  _session: SlackSession;
  text: string;
  isBot: Boolean;
  channel: string;
  constructor(slackMessage: slackMessage, session: SlackSession) {
    this.text = slackMessage.text;
    this.channel = slackMessage.channel;
    this.isBot = slackMessage.bot_id != null;
    this._session = session;
  }

  async reply(text: string): Promise<Boolean> {
    let result = await this._session.post(text, this.channel);
    return result;
  }
}

interface slackMessage {
  client_msg_id: string;
  bot_id: string;
  suppress_notification: boolean;
  type: string;
  text: string;
  user: string;
  team: string;
  channel: string;
  event_ts: string;
  ts: string;
}

main();
