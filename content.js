let interactionData = [];
let typingTimer;
console.log("This is a popup!")
function captureInteraction(type, target) {
  interactionData.push({
    type: type,
    key: target.key ? target.key : false,
    target: {
        classList: target.classList ? Array.from(target.classList) : [],
        tagName: target.tagName,
        attributes: target.attributes ? Array.from(target.attributes).map(attr => ({ name: attr.name, value: attr.value })): []

    }
  });
}

function handleKeyDown(event) {
    // Clear the previous timer (if any)
    clearTimeout(typingTimer);

    // Set a new timer to execute after a specified delay
    typingTimer = setTimeout(function() {
        // Your code to handle the keydown event goes here
        captureInteraction('keydown', event);
    }, 300); // Adjust the delay (in milliseconds) as needed
}

function stopLogging() {
  chrome.storage.local.set({ interactionData: interactionData });
  interactionData = [];
  document.removeEventListener('click', function(event) {
    captureInteraction('click', event.target);
  });
  
  document.removeEventListener('keydown', function(event) {
    captureInteraction('keydown', event.key);
  });
}

function startLogging() {
    chrome.storage.local.set({ interactionData: [] });
    document.addEventListener('click', function(event) {
        captureInteraction('click', event.target);
      });
      
      document.addEventListener('keydown', handleKeyDown);
    console.log('started')
  }
  
