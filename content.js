let interactionData = [];
let interactionDataList = [];
let startingUrl;
let typingTimer;
let currentTry = 0;
let maxTry = 3;

function generatePDF() {
  return
}

function captureSnapShot() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var tab = tabs[0];
    chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" }, function (dataUrl) {
      // `dataUrl` contains the base64-encoded image data
      console.log(dataUrl);
  
      // You can save this data or use it as needed
    });
  });
}

function simulateKeypress(values, text) {
  // Simulate a click event
  simulateClick(values, 1, false);

  // If `text` is not provided, default to "Test"
  text = text || "Test";

  if (true) {
    // Simulate keypress event for input element
    // Trigger keydown event
    const keydownEvent = new KeyboardEvent("keydown", {
      key: text[text.length - 1],
    });
    values.dispatchEvent(keydownEvent);

    // Set value
    values.value = text;

    // Trigger keyup event
    const keyupEvent = new KeyboardEvent("keyup", {
      key: text[text.length - 1],
    });
    values.dispatchEvent(keyupEvent);

    // Trigger input event
    const inputEvent = new Event("input", { bubbles: true });
    values.dispatchEvent(inputEvent);
  }
  // else if (values.$element.tagName === "SELECT") {
  //     // Handle select element
  //     var options = values.$element.querySelectorAll("option");
  //     options.forEach(option => option.selected = false);

  //     var selectedOption = Array.from(options).find(option => option.value === text || option.innerText.trim() === text);

  //     if (!selectedOption && /^option\s+\d+$/.test(text)) {
  //         var position = parseInt(text.match(/\d+/)[0]);
  //         selectedOption = options[position - 1]; // Position is 1-based, options is 0-based
  //     }

  //     if (selectedOption) {
  //         selectedOption.selected = true;
  //     }

  //     // Simulate a click event for the select element
  //     values._click(values);

  //     // Trigger input event for situations where an `oninput` is defined
  //     values.$element.dispatchEvent(new Event('input'));
  // }
  else {
    // For other elements
    values.focus();
    values.dispatchEvent(new KeyboardEvent("keydown", { key: "_" }));
    values.textContent = text;
    values.dispatchEvent(new Event("input"));
    values.focus();
    values.dispatchEvent(new KeyboardEvent("keyup", { key: "_" }));
  }

  // Trigger a change event
  values.dispatchEvent(new Event("change"));
}

function simulateClick(values, nb, leave) {
  triggerMouseEvent(values, "mouseover");

  for (var i = 1; i <= (nb || 1); i++) {
    triggerMouseEvent(values, "mousedown");
    triggerMouseEvent(values, "mouseup");
    triggerMouseEvent(values, "click", i);

    if (i % 2 === 0) {
      triggerMouseEvent(values, "dblclick");
    }
  }

  if (leave !== false) {
    triggerMouseEvent(values, "mouseout");
    values.dispatchEvent(new Event("mouseleave"));
  }

  function triggerMouseEvent(element, type, count) {
    const rect = element.getBoundingClientRect();
    var event = document.createEvent("MouseEvents");
    event.initMouseEvent(
      type=type,
      canBubble=true,
      cancelable=true,
      view=window,
      detail = count || 0,
      screenX=rect.left + window.pageXOffset,
      screenY=rect.top + window.pageYOffset,
      clientX=rect.left,
      clientY=rect.top,
      ctrlKey=false,
      altKey=false,
      shiftKey=false,
      metaKey=false,
      button=0,
      // relatedTarget=element
    );
    element.dispatchEvent(event);
  }
}

async function getValueFromStorage(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, function (result) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result[key]);
      }
    });
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function triggerEvents(EventIndex) {
  console.log("Playing Steps...");
  let intractionData;
  if (EventIndex === undefined){
    intractionData = await getValueFromStorage("interactionData");
  }
  else {
    let intractionDataList = await getValueFromStorage("interactionDataList");
    intractionData = intractionDataList[EventIndex-1];
  }
  
  let events = _generateTourSteps(intractionData);
  let currentStep = 0;
  const element = document.getElementsByTagName("body")[0];
  element.classList.add("auto_play_enabled");

  async function triggerNextStep() {
    if (currentStep >= events.length) {
      console.log("All steps completed");
      const element = document.getElementsByTagName("body")[0];
      element.classList.remove("auto_play_enabled");
      return;
    }
    else if (currentStep === -1) {
      console.log("Maximux tries reached, Can not complete steps :( .");
      const element = document.getElementsByTagName("body")[0];
      element.classList.remove("auto_play_enabled");
      return;
    }

    const event = events[currentStep];
    const element = document.querySelector(event.trigger);

    if (element) {
      console.log(`Running step ${currentStep}...`);
      await wait(1000);
      if (event.run === "click") {
        simulateClick(element, 1, true);
      } else if (event.run.startsWith("text")) {
        const runAction = event.run;
        const runActionText = runAction.split(" ")[1];
        simulateKeypress(element, runActionText);
      }
      currentStep++;
      if (event.auto) {
        await wait(1000);
        triggerNextStep();
      }
    } else {
      console.log(`Element ${event.trigger} not found for step ${currentStep}`);
      console.log(`Trying again........Try ${currentTry+1}`);
      if (currentTry > maxTry) {
        currentTry = 0;
        currentStep = -1;
        triggerNextStep();
      }
      else {
        currentTry++;
        await wait(500);
        triggerNextStep();
      }
    }
  }

  triggerNextStep();
}

function _getUniqueSelector(element) {
  if (!(element instanceof Element)) return;

  const path = [];
  let currentElement = element;

  while (currentElement !== document.body) {
    let selector = currentElement.tagName.toLowerCase();

    if (currentElement.id & (element.tagName !== "INPUT")) {
      selector += `#${currentElement.id}`;
      path.unshift(selector);
      break;
    }

    const classes = Array.from(currentElement.classList)
      .filter(
        (className) =>
          className !== "focus" &&
          className !== "ui-state-active" &&
          className != "ui-state-focus"
      ) // Ignore .focus class
      .join(".");

    if (classes) selector += `.${classes}`;

    const parent = currentElement.parentElement;
    if (!parent) break;

    const siblings = parent.children;
    if (siblings.length > 1) {
      let index = Array.from(siblings).indexOf(currentElement) + 1;
      selector += `:nth-child(${index})`;
    }

    path.unshift(selector);
    currentElement = parent;
  }

  return path.join(" > ");
}

function _captureInteraction(type, target) {
  let uniqueSelector;
  uniqueSelector = _getUniqueSelector(target);
  // console.log(uniqueSelector);
  interactionData.push({
    type: type,
    key: target.key ? target.key : false,
    target: {
      classList: target.classList ? Array.from(target.classList) : [],
      attributes: target.attributes
        ? Array.from(target.attributes).map((attr) => ({
            name: attr.name,
            value: attr.value,
          }))
        : [],
    },
    tagName: target.tagName,
    uniqueSelector: uniqueSelector,
  });
}

function _generateTourSteps(interactionData) {
  const actions = [];
  let pendingClick = null; // Track pending click event
  let keydownValues = []; // Track keydown values
  interactionData.forEach((item) => {
    if (item.type === "click") {
      if (keydownValues.length > 0) {
        const combinedKeydownValues = keydownValues.join("");
        keydownValues = [];
        actions[actions.length - 1].run = `text ${combinedKeydownValues}`;
      }
      if (item.tagName === "BUTTON") {
        const editButtonClass =
          item.target.classList.includes("o_form_button_edit");
        const hasNameAttribute = item.target.attributes.some(
          (attr) => attr.name === "name"
        );
        if (editButtonClass) {
          actions.push({
            trigger: item.uniqueSelector,
            auto: true,
            run: "click",
            // run: `text ${combinedKeydownValues}`
          });
        } else {
          actions.push({
            trigger: item.uniqueSelector,
            auto: true,
            run: "click",
            // run: `text ${combinedKeydownValues}`
          });
        }
      } else if (item.target.classList.includes("o_field_widget")) {
        const hasFieldWidgetClass =
          item.target.classList.includes("o_field_widget");
        const hasNameAttribute = item.target.attributes.some(
          (attr) => attr.name === "name"
        );
        if (hasFieldWidgetClass && hasNameAttribute) {
          const triggerSelector = `.o_field_char[name='${
            item.target.attributes.find((attr) => attr.name === "name").value
          }']`;
          actions.push({
            trigger: item.uniqueSelector,
            auto: true,
            run: "click",
            // run: `text ${combinedKeydownValues}`
          });
        }
      } else {
        actions.push({
          trigger: item.uniqueSelector,
          auto: true,
          run: "click",
          // run: `text ${combinedKeydownValues}`
        });
      }
      if (item.uniqueSelector.includes("o_technical_modal")) {
        if (actions.length) {
          if (
            actions[actions.length - 1].trigger.includes("o_technical_modal")
          ) {
            actions[actions.length - 1].in_modal = false;
          }
        }
      }
    } else if ((item.type === "keydown") & (item.key !== "Backspace")) {
      keydownValues.push(item.key);
    }
  });
  if (keydownValues.length > 0) {
    const combinedKeydownValues = keydownValues.join("");
    keydownValues = [];
    actions[actions.length - 1].run = `text ${combinedKeydownValues}`;
  }
  return actions;
}

function _handleKeyDown(event) {
  // Clear the previous timer (if any)
  clearTimeout(typingTimer);

  // Set a new timer to execute after a specified delay
  typingTimer = setTimeout(function () {
    // Your code to handle the keydown event goes here
    _captureInteraction("keydown", event);
  }, 100); // Adjust the delay (in milliseconds) as needed
}

function stopLogging() {
  interactionDataList.push(interactionData);
  chrome.storage.local.set({
    interactionData: interactionData,
    interactionDataList: interactionDataList,
  });
  interactionData = [];
  // startingUrl = null;
  document.removeEventListener("click", function (event) {
    _captureInteraction("click", event.target);
  });

  document.removeEventListener("keydown", _handleKeyDown);
  const element = document.getElementsByTagName("body")[0];
  element.classList.remove("recording_enabled");
  console.log("Stoped Recording...");
}

function startLogging() {
  const urlObject = new URL(window.location.toString());
  startingUrl = urlObject.pathname + urlObject.search + urlObject.hash;
  chrome.storage.local.set({ interactionData: [] });
  document.addEventListener(
    "click",
    function (event) {
      _captureInteraction("click", event.target);
    },
    { capture: true }
  );

  document.addEventListener("keydown", _handleKeyDown, { capture: true });
  const element = document.getElementsByTagName("body")[0];
  element.classList.add("recording_enabled");
  console.log("Started Recording...");
}

// following method returns a tour of current interaction data that can be pasted in tour of odoo, currently do not need this any more
// function downloadLog() {
//   console.log("Downloading Actions...");
//   chrome.storage.local.get(["interactionData"], function (result) {
//     const interactions = result.interactionData || [];
//     actions = _generateTourSteps(interactions);
//     let currentUrl = window.location.toString();
//     const urlObject = new URL(currentUrl);
//     let pathAndQuery = urlObject.pathname + urlObject.search + urlObject.hash;
//     if (startingUrl) {
//       pathAndQuery = startingUrl;
//     }
//     // console.log(startingUrl);
//     tour_des = {
//       url: pathAndQuery,
//       sequence: 40,
//     };
//     tour = { tour_description: tour_des, steps: actions };
//     const jsonContent = JSON.stringify(tour, null, 2);
//     const blob = new Blob([jsonContent], { type: "application/json" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = "interaction_data.json";
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//   });
//   chrome.storage.local.set({ interactionData: [] });
// }

function downloadLog() {
  console.log("Downloading Interaction Data...");
  chrome.storage.local.get(["interactionDataList", "interactionDataTitleList"], function (result) {
    const interactionDataList = result.interactionDataList || [];
    const interactionDataTitleList = result.interactionDataTitleList || [];
  
    const mappedData = interactionDataList.map((data, index) => ({
      interactionData: data,
      interactionDataTitle: interactionDataTitleList[index] || false
    }));
    
    const jsonContent = JSON.stringify(mappedData, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "interaction_data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });
}

function printLogList() {
  // stopLogging();
  chrome.storage.local.get(["interactionDataList"], function (result) {
    const interactionDataList = result.interactionDataList || [];
    console.log(interactionDataList);
  });
}
