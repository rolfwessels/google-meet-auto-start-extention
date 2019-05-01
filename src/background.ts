function polling1() {
  console.log("pollin1g");
  setTimeout(polling, 1000 * 30);
}

polling1();
// When the browser-action button is clicked...
chrome.browserAction.onClicked.addListener(function(tab) {
  // ...check the URL of the active tab against our pattern and...
  console.log(tab.url);
});
