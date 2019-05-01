import * as $ from "jquery";

function save_options() {
  var isEnabled = $("#enabled").prop("checked");
  chrome.storage.local.set(
    {
      isEnabled: isEnabled
    },
    function() {
      // Update status to let user know options were saved.
      var status = $("#status");
      status.text("Options saved.");
      setTimeout(function() {
        status.text("");
      }, 750);
    }
  );
}

function restore_options() {
  chrome.storage.local.get(
    {
      isEnabled: true
    },
    function(items: { isEnabled }) {
      console.log("Loaded");
      $("#enabled").prop("checked", items.isEnabled);
    }
  );
}

$("#save").click(save_options);
$(restore_options); // document.addEventListener('DOMContentLoaded', restore_options);
