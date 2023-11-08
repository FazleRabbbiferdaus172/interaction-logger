console.log("This is a popup!")
document.getElementById('startLogging').addEventListener('click', function() {
    chrome.tabs.executeScript({
      code: 'startLogging()'
    });
  });
  
  document.getElementById('stopLogging').addEventListener('click', function() {
    chrome.tabs.executeScript({
      code: 'stopLogging()'
    });
  });

  document.getElementById('downloadJson').addEventListener('click', function() {
    chrome.tabs.executeScript({
      code: 'downloadLog()'
    });
  });

  document.getElementById('printLog').addEventListener('click', function() {
    chrome.tabs.executeScript({
      code: 'printLogList()'
    });
  });

  document.getElementById('injectScript').addEventListener('click', function() {
    chrome.tabs.executeScript({
      code: 'injectScript()'
    });
  });

  document.getElementById('triggerEvents').addEventListener('click', function() {
    chrome.tabs.executeScript({
      code: 'triggerEvents()'
    });
  });

  function generateTourSteps(interactionData) {
    const actions = [];
    let pendingClick = null; // Track pending click event
    let keydownValues = []; // Track keydown values
    interactionData.forEach(item => {
        if (item.type === 'click') {
            const hasFieldWidgetClass = item.target.classList.includes('o_field_widget');
            const hasNameAttribute = item.target.attributes.some(attr => attr.name === 'name');
    
            if (hasFieldWidgetClass && hasNameAttribute) {
                if (keydownValues.length > 0) {
                    const combinedKeydownValues = keydownValues.join('');
                    keydownValues = [];
                    actions[actions.length - 1].run =  `text <${combinedKeydownValues}>`;
                }
                const triggerSelector = `.o_field_char[name="${item.target.attributes.find(attr => attr.name === 'name').value}"]`;
                actions.push({
                    trigger: triggerSelector,
                    extra_trigger: '.o_td_label',
                    auto: true,
                    run: 'click'
                    // run: `text <${combinedKeydownValues}>`
                });
            }
        } else if (item.type === 'keydown' && pendingClick) {
            keydownValues.push(item.key);
        }
    });
    return actions 
  }

  