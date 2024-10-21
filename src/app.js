import BpmnModeler from "bpmn-js/lib/Modeler";

import CustomDisableModeling from "./lib/custom-disable-modeling";

import emptyBoardXML from "../resources/empty.bpmn";

import AnalysisModule from "./lib/analysis/wasm"; // Analysis using WASM
// import AnalysisModule from "./lib/analysis/webclient"; // Analysis using a webservice (requires a running server on port 3001)
import AnalysisOverlaysModule from "./lib/analysis-overlays";
import QuickFixesModule from "./lib/quick-fixes";
import CounterExampleVisualizationModule from "./lib/counter-example-visualization";
import AnalysisExamplesModule from "./lib/analysis-examples";
import PropertiesSummaryModule from "./lib/properties-summary";
import TueLogo from "./img/tue.png";
import CompareAnalysis from "./lib/compare-analysis/CompareAnalysis";

// detect if user pressed collapse button
document.getElementById('collapse-reference-expanded').addEventListener('click', function () {
  // hide reference canvas
  document.getElementById('reference-canvas').style.display = 'none';
  // also hide <div id="reference-buttons-container" class="reference-buttons buttons">
  document.getElementById('reference-buttons-container').style.display = 'none';
  // set width of canvas to 100%
  document.getElementById('canvas').style.width = '100%';
  // hide collapse button
  document.getElementById('collapse-reference-expanded').style.display = 'none';
  // show expand button
  document.getElementById('collapse-reference-collapsed').style.display = 'block';
  // shift properties panel to the right
  document.getElementsByClassName('properties')[0].style.transform = 'translateX(0px)';
  document.getElementsByClassName('properties')[0].style.left = 'auto';
  document.getElementsByClassName('properties')[0].style.right = '15px';
  // hide no-reference-model div if it exists
  const noReferenceModelDiv = document.getElementById("no-reference-model");
  if (noReferenceModelDiv) {
    noReferenceModelDiv.style.display = 'none';
  }
  modeler.get("canvas").zoom("fit-viewport");
  modeler.get("canvas").zoom("fit-viewport");
});

// detect if user pressed expand button
document.getElementById('collapse-reference-collapsed').addEventListener('click', function () {
  // show reference canvas
  document.getElementById('reference-canvas').style.display = 'block';
  // also show <div id="reference-buttons-container" class="reference-buttons buttons">
  document.getElementById('reference-buttons-container').style.display = 'block';
  // set width of canvas to 50%
  document.getElementById('canvas').style.width = '50%';
  // show collapse button
  document.getElementById('collapse-reference-expanded').style.display = 'block';
  // hide expand button
  document.getElementById('collapse-reference-collapsed').style.display = 'none';
  // shift properties panel to the left
  document.getElementsByClassName('properties')[0].style.transform = 'translateX(-50%)';
  document.getElementsByClassName('properties')[0].style.left = '50%';
  document.getElementsByClassName('properties')[0].style.right = 'auto';
  // show no-reference-model div if it exists
  const noReferenceModelDiv = document.getElementById("no-reference-model");
  if (noReferenceModelDiv) {
    noReferenceModelDiv.style.display = 'block';
  }
  // zoom to fit-viewport
  reference_modeler.get("canvas").zoom("fit-viewport");
  modeler.get("canvas").zoom("fit-viewport");
  modeler.get("canvas").zoom("fit-viewport");
});

document.getElementById('tue-logo').innerHTML = `<img src="${TueLogo}" alt="TU/e logo" class="tue-logo-image" />`;
// modeler instance
const modeler = new BpmnModeler({
  container: "#canvas",
  width: "100%",
  height: "100%",
  additionalModules: [
    AnalysisModule,
    AnalysisOverlaysModule,
    PropertiesSummaryModule,
    QuickFixesModule,
    AnalysisExamplesModule,
    CounterExampleVisualizationModule,
  ],
  keyboard: {
    bindTo: window,
  },
});

const reference_modeler = new BpmnModeler({
  container: "#reference-canvas",
  width: "100%",
  height: "100%",
  additionalModules: [
    CustomDisableModeling,
  ],
  keyboard: {
    bindTo: window,
  },
});

/* screen interaction */
function enterFullscreen(element) {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  }
}

function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
}

const state = {
  fullScreen: false,
  keyboardHelp: false,
};
document
  .getElementById("js-toggle-fullscreen")
  .addEventListener("click", function () {
    state.fullScreen = !state.fullScreen;
    if (state.fullScreen) {
      enterFullscreen(document.documentElement);
    } else {
      exitFullscreen();
    }
  });
document
  .getElementById("js-toggle-keyboard-help")
  .addEventListener("click", function () {
    state.keyboardHelp = !state.keyboardHelp;
    let displayProp = "none";
    if (state.keyboardHelp) {
      displayProp = "block";
    }
    document.getElementById("io-dialog-main").style.display = displayProp;
  });
document
  .getElementById("io-dialog-main")
  .addEventListener("click", function () {
    state.keyboardHelp = !state.keyboardHelp;
    let displayProp = "none";
    if (!state.keyboardHelp) {
      document.getElementById("io-dialog-main").style.display = displayProp;
    }
  });

/* delete only the second elementbyclass "djs-palette open" */
document.getElementsByClassName("djs-palette open")[1].remove();


/* file functions */
function openFile(file, callback) {
  // check file api availability
  if (!window.FileReader) {
    return window.alert(
      "Looks like you use an older browser that does not support drag and drop. " +
        "Try using a modern browser such as Chrome, Firefox or Internet Explorer > 10.",
    );
  }

  // no file chosen
  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.onload = function (e) {
    const xml = e.target.result;

    callback(xml);
  };

  reader.readAsText(file);
}

const fileInput = document.createElement("input");
fileInput.setAttribute("type", "file");
fileInput.style.display = "none";
document.body.appendChild(fileInput);
fileInput.addEventListener("change", function (e) {
  openFile(e.target.files[0], openBoard);
});

const referenceFileInput = document.createElement("input");
referenceFileInput.setAttribute("type", "file");
referenceFileInput.style.display = "none";
document.body.appendChild(referenceFileInput);
referenceFileInput.addEventListener("change", function (e) {
  openFile(e.target.files[0], openReferenceBoard);
});

function openBoard(xml) {
  // import board
  modeler.importXML(xml).then(function () {
    modeler.get("canvas").zoom("fit-viewport");
  }).catch(function (err) {
    if (err) {
      return console.error("could not import xml", err);
    }
  });
}

function openReferenceBoard(xml) {
  // import board
  hideLoadReferenceModelText();
  reference_modeler.importXML(xml).then(function () {
    reference_modeler.get("canvas").zoom("fit-viewport");
  }).catch(function (err) {
    if (err) {
      return console.error("could not import xml", err);
    }
  });
}

function hideLoadReferenceModelText() {
  const noReferenceModelDiv = document.getElementById("no-reference-model");
  if (noReferenceModelDiv) {
    noReferenceModelDiv.remove();
  }
}

function saveSVG() {
  return modeler.saveSVG();
}

function saveBoard() {
  return modeler.saveXML({ format: true });
}

// bootstrap board functions
const downloadLink = document.getElementById("js-download-board");
const downloadSvgLink = document.getElementById("js-download-svg");

const openNew = document.getElementById("js-open-new");
const openExistingBoard = document.getElementById("js-open-board");
const openExistingReferenceBoard = document.getElementById("js-open-reference-board");

function setEncoded(link, name, data) {
  const encodedData = encodeURIComponent(data);

  if (data) {
    link.classList.add("active");
    link.setAttribute(
      "href",
      "data:application/xml;charset=UTF-8," + encodedData,
    );
    link.setAttribute("download", name);
  } else {
    link.classList.remove("active");
  }
}

const exportArtifacts = debounce(function () {
  saveSVG().then(function (result) {
    setEncoded(downloadSvgLink, "bpmn.svg", result.svg);
  });

  saveBoard().then(function (result) {
    setEncoded(downloadLink, "bpmn.bpmn", result.xml);
    modeler._emit("analysis.start", result);
  });
}, 500);

modeler.on("commandStack.changed", exportArtifacts);
modeler.on("import.done", exportArtifacts);
modeler.on("example.import", (data) => openBoard(data.xml));

reference_modeler.on("example.import", (data) => openReferenceBoard(data.xml));

openNew.addEventListener("click", function () {
  openBoard(emptyBoardXML);
});

openExistingBoard.addEventListener("click", function () {
  // clear input so that previously selected file can be reopened
  fileInput.value = "";
  fileInput.click();
});

openExistingReferenceBoard.addEventListener("click", function () {
  // clear input so that previously selected file can be reopened
  referenceFileInput.value = "";
  referenceFileInput.click();
});

modeler._emit("example.init", {});

// Load the empty board (BJORN: I added this line)
openBoard(emptyBoardXML);

// helpers //////////////////////

function debounce(fn, timeout) {
  let timer;

  return function () {
    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(fn, timeout);
  };
}

// Create compare analysis instance
const compareAnalysis = new CompareAnalysis();

// TEST button event listener
document.getElementById("test").addEventListener("click", function () {
  compareAnalysis.compare(modeler, reference_modeler);
});