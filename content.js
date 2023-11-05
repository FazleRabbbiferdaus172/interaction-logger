let interactionData = [];
let interactionDataList = [];
let typingTimer;

function _getUniqueSelector(element) {
  if (!(element instanceof Element)) return;

  const path = [];
  let currentElement = element;

  while (currentElement.parentNode) {
    let selector = currentElement.tagName.toLowerCase();

    if (currentElement.id) {
      selector += `#${currentElement.id}`;
      path.unshift(selector);
      break;
    } else if (currentElement.className) {
      selector += `.${currentElement.className.trim().replace(/\s+/g, '.')}`;
    } else {
      const siblings = Array.from(currentElement.parentNode.children);
      const index = siblings.indexOf(currentElement);
      selector += `:nth-child(${index + 1})`;
    }

    if (currentElement.dataset.menuXmlid) {
      selector += `[data-menu-xmlid="${currentElement.dataset.menuXmlid}"]`;
      path.unshift(selector);
    }

    path.unshift(selector);
    currentElement = currentElement.parentNode;

    if (currentElement.previousElementSibling) {
      let prevSelector = currentElement.tagName.toLowerCase();

      if (currentElement.previousElementSibling.className) {
        prevSelector += `.${currentElement.previousElementSibling.className.trim().replace(/\s+/g, '.')}`;
      } else {
        prevSelector += `:nth-child(${Array.from(currentElement.parentNode.children).indexOf(currentElement) + 1})`;
      }

      if (currentElement.previousElementSibling.dataset.menuXmlid) {
        prevSelector += `[data-menu-xmlid="${currentElement.previousElementSibling.dataset.menuXmlid}"]`;
      }

      path.unshift(prevSelector);
    }
  }

  return path.join(' > ');
}

function _captureInteraction(type, target) {
  let uniqueSelector;
  uniqueSelector = _getUniqueSelector(target);
  console.log(uniqueSelector);
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
    uniqueSelector: uniqueSelector
  });
}

function _generateTourSteps(interactionData) {
  const actions = [];
  let pendingClick = null; // Track pending click event
  let keydownValues = []; // Track keydown values
  interactionData.forEach((item) => {
    if (item.type === "click") {
      if (item.tagName === "BUTTON") {
        const editButtonClass =
          item.target.classList.includes("o_form_button_edit");
        const hasNameAttribute = item.target.attributes.some(
          (attr) => attr.name === "name"
        );
        if (editButtonClass) {
          actions.push({
            trigger: ".o_form_button_edit",
            auto: true,
            run: "click",
            // run: `text ${combinedKeydownValues}`
          });
        }
      } else {
        const hasFieldWidgetClass =
          item.target.classList.includes("o_field_widget");
        const hasNameAttribute = item.target.attributes.some(
          (attr) => attr.name === "name"
        );
        if (keydownValues.length > 0) {
          const combinedKeydownValues = keydownValues.join("");
          keydownValues = [];
          actions[actions.length - 1].run = `text ${combinedKeydownValues}`;
        }
        if (hasFieldWidgetClass && hasNameAttribute) {
          const triggerSelector = `.o_field_char[name='${
            item.target.attributes.find((attr) => attr.name === "name").value
          }']`;
          actions.push({
            trigger: triggerSelector,
            extra_trigger: ".o_td_label",
            auto: true,
            run: "click",
            // run: `text ${combinedKeydownValues}`
          });
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
    interactionDataList,
    interactionDataList,
  });
  interactionData = [];
  document.removeEventListener("click", function (event) {
    _captureInteraction("click", event.target);
  });

  document.removeEventListener("keydown", _handleKeyDown);
}

function startLogging() {
  chrome.storage.local.set({ interactionData: [] });
  document.addEventListener(
    "click",
    function (event) {
      _captureInteraction("click", event.target);
    },
    { capture: true }
  );

  document.addEventListener("keydown", _handleKeyDown, { capture: true });
  console.log("started");
}

function downloadLog() {
  chrome.storage.local.get(["interactionData"], function (result) {
    const interactions = result.interactionData || [];
    actions = _generateTourSteps(interactions);
    let currentUrl = window.location.toString();
    const urlObject = new URL(currentUrl);
    const pathAndQuery = urlObject.pathname + urlObject.search + urlObject.hash;
    tour_des = {
      url: pathAndQuery,
      sequence: 40,
    };
    tour = { tour_description: tour_des, steps: actions };
    const jsonContent = JSON.stringify(tour, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "interaction_data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });
  chrome.storage.local.set({ interactionData: [] });
}

function printLogList() {
  stopLogging();
  chrome.storage.local.get(["interactionDataList"], function (result) {
    const interactionDataList = result.interactionDataList || [];
    console.log(interactionDataList);
  });
}
