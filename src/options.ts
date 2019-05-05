import * as $ from "jquery";
import { Settings } from "./settings";
import { TabActions } from "./tabActions";

export class OptionSettings {
  isEnabled: boolean;
  slackToken: string;
  slackChannel: string;
  constructor() {
    this.isEnabled = true;
    this.slackToken = "";
    this.slackChannel = "meetingroom";
  }
}
var settings = new Settings<OptionSettings>();

function save_options() {
  settings.get(new OptionSettings()).then(before => {
    const saveSetting = new OptionSettings();
    saveSetting.isEnabled = $("#enabled").prop("checked");
    const token = $("#slackToken").val() as string;
    saveSetting.slackToken = btoa(token);
    saveSetting.slackChannel = $("#slackChannel").val() as string;
    if (token != "" && token != null && !token.startsWith("xoxb-")) {
      showStatus(
        "Slack token should start with `xoxb-`.",
        4000,
        "#statusFailed"
      );
    } else {
      settings.store(saveSetting).then(function() {
        showStatus("Stored.", 1500);
        var actions = new TabActions();
        actions.optionsChanged(before, saveSetting);
      });
    }
  });
}

function showStatus(text: string, timeout: number, id: string = "#status") {
  var status = $(id);
  status.show();
  status.text(text);
  setTimeout(function() {
    status.text("");
    status.hide("slow");
  }, timeout);
}

function restore_options() {
  settings.get(new OptionSettings()).then(items => {
    console.log("Options loaded");
    $("#enabled").prop("checked", items.isEnabled);
    $("#slackChannel").val(items.slackChannel);
    $("#slackToken").val(atob(items.slackToken));
  });
}

$("#save").click(save_options);
$("#status").hide();
$("#statusFailed").hide();
$(restore_options); // document.addEventListener('DOMContentLoaded', restore_options);
