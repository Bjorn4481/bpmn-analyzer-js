export default function CustomDisableModeling(
  eventBus,
  modeling,
  contextPad,
  directEditing,
  dragging
) {

  // Disable modeling actions
  eventBus.on("commandStack.preExecute", function (event) {
    event.preventDefault();
  });

  // Disable context pad
  contextPad.registerProvider(1000, {
    getContextPadEntries: function () {
      return {};
    },
  });

  // Prevent context pad actions
  eventBus.on("contextPad.create", function (event) {
    contextPad.remove();
    event.preventDefault();
  });

  // Disable direct editing
  directEditing.registerProvider(1000, {
    activate: function () {
      return false;
    },
  });

  // Disable dragging
  dragging.setOptions({ manual: true });
}

CustomDisableModeling.$inject = [
  "eventBus",
  "modeling",
  "contextPad",
  "directEditing",
  "dragging",
];
