let interactionData = [];
let interactionDataList = [];
let typingTimer;
console.log("This is a popup!")
function captureInteraction(type, target) {
  interactionData.push({
    type: type,
    key: target.key ? target.key : false,
    target: {
        classList: target.classList ? Array.from(target.classList) : [],
        attributes: target.attributes ? Array.from(target.attributes).map(attr => ({ name: attr.name, value: attr.value })): []

    },
    tagName: target.tagName,
  });
}

function generateTourSteps(interactionData) {
    const actions = [];
    let pendingClick = null; // Track pending click event
    let keydownValues = []; // Track keydown values
    interactionData.forEach(item => {
        if (item.type === 'click') {
            if (item.tagName === "BUTTON") {
                const editButtonClass = item.target.classList.includes("o_form_button_edit");
                const hasNameAttribute = item.target.attributes.some(attr => attr.name === 'name');
                if (editButtonClass) {
                    actions.push({
                        trigger: ".o_form_button_edit",
                        auto: true,
                        run: 'click'
                        // run: `text ${combinedKeydownValues}`
                    });
                }
            } 
            else {
                const hasFieldWidgetClass = item.target.classList.includes('o_field_widget');
                const hasNameAttribute = item.target.attributes.some(attr => attr.name === 'name');
                if (keydownValues.length > 0) {
                    const combinedKeydownValues = keydownValues.join('');
                    keydownValues = [];
                    actions[actions.length - 1].run =  `text ${combinedKeydownValues}`;
                }
                if (hasFieldWidgetClass && hasNameAttribute) {
                    const triggerSelector = `.o_field_char[name='${item.target.attributes.find(attr => attr.name === 'name').value}']`;
                    actions.push({
                        trigger: triggerSelector,
                        extra_trigger: '.o_td_label',
                        auto: true,
                        run: 'click'
                        // run: `text ${combinedKeydownValues}`
                    });
                }
            }
        } else if (item.type === 'keydown' & item.key !== 'Backspace') {
            keydownValues.push(item.key);
        }
    });
    if (keydownValues.length > 0) {
        const combinedKeydownValues = keydownValues.join('');
        keydownValues = [];
        actions[actions.length - 1].run =  `text ${combinedKeydownValues}`;
    }
    return actions 
  }

function handleKeyDown(event) {
    // Clear the previous timer (if any)
    clearTimeout(typingTimer);

    // Set a new timer to execute after a specified delay
    typingTimer = setTimeout(function() {
        // Your code to handle the keydown event goes here
        captureInteraction('keydown', event);
    }, 100); // Adjust the delay (in milliseconds) as needed
}

function stopLogging() {
  interactionDataList.push(interactionData)
  chrome.storage.local.set({ interactionData: interactionData, interactionDataList, interactionDataList });
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
  
  function downloadLog() {
    chrome.storage.local.get(['interactionData'], function(result) {
      const interactions = result.interactionData || [];
      actions = generateTourSteps(interactions);
      let currentUrl = window.location.toString()
      const urlObject = new URL(currentUrl);
      const pathAndQuery = urlObject.pathname + urlObject.search + urlObject.hash;
      tour_des = {
        url: pathAndQuery,
        sequence: 40,
      }
      tour = {tour_description: tour_des,
              steps: actions
        }
      const jsonContent = JSON.stringify(tour, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'interaction_data.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
    chrome.storage.local.set({ interactionData: [] });
  }

  function printLogList() {
    chrome.storage.local.get(['interactionDataList'], function(result) {
      const interactionDataList = result.interactionDataList || [];
      console.log(interactionDataList)
    });
  }
