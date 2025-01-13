import { domify } from "min-dom";
import { ANALYSIS_NOTE_TYPE } from "../analysis-overlays/AnalysisOverlays";

const WARNING_BASE64 =
  "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgLTk2MCA5NjAgOTYwIiB3aWR0aD0iMjQiPg0KICA8cGF0aCBkPSJtNDAtMTIwIDQ0MC03NjAgNDQwIDc2MEg0MFptMTM4LTgwaDYwNEw0ODAtNzIwIDE3OC0yMDBabTMwMi00MHExNyAwIDI4LjUtMTEuNVQ1MjAtMjgwcTAtMTctMTEuNS0yOC41VDQ4MC0zMjBxLTE3IDAtMjguNSAxMS41VDQ0MC0yODBxMCAxNyAxMS41IDI4LjVUNDgwLTI0MFptLTQwLTEyMGg4MHYtMjAwaC04MHYyMDBabTQwLTEwMFoiIHN0cm9rZT0id2hpdGUiIGZpbGw9IndoaXRlIi8+DQo8L3N2Zz4NCg==";

export default function PropertiesSummary(
  eventBus,
  overlays,
  canvas,
  elementRegistry,
  bpmnFactory,
  bpmnjs,
) {
  eventBus.on("analysis.done", handleAnalysis);
  this._canvas = canvas;
  this._bpmnjs = bpmnjs;

  this._init();

  async function handleAnalysis(result) {
    if (result.unsupported_elements && result.unsupported_elements.length > 0) {
      //console.log("Unsupported elements found: ", result.unsupported_elements);
      //addWarningForUnsupportedElements(result);
      const modifiedXML = await createModifiedXML(result.unsupported_elements);
      eventBus.fire("analysis.start", { xml: modifiedXML });
      //return;
    }

    if (result.property_results.length !== 4) {
      resetPropertiesSummary();
    }

    for (const propertyResult of result.property_results) {
      setPropertyColorAndIcon(propertyResult);
    }
  }

  async function createModifiedXML(unsupportedElements) {
    const { xml } = await bpmnjs.saveXML({ format: true });
    const moddle = bpmnjs.get('moddle');
    const { rootElement } = await moddle.fromXML(xml);

    unsupportedElements.forEach(elementId => {
      const element = elementRegistry.get(elementId);
      if (element) {
        const incoming = element.incoming.slice();
        const outgoing = element.outgoing.slice();

        // Remove the unsupported element and its incoming/outgoing flows from the XML
        rootElement.rootElements[0].flowElements = rootElement.rootElements[0].flowElements.filter(child => {
          return child.id !== elementId && !incoming.some(flow => flow.id === child.id) && !outgoing.some(flow => flow.id === child.id);
        });

        // Connect incoming and outgoing connections in the XML
        incoming.forEach(incomingConnection => {
          outgoing.forEach(outgoingConnection => {
            const sequenceFlow = bpmnFactory.create('bpmn:SequenceFlow', {
              id: `Flow_${Math.random().toString(36).substring(2, 9)}`,
              sourceRef: incomingConnection.source,
              targetRef: outgoingConnection.target
            });
            rootElement.rootElements[0].flowElements.push(sequenceFlow);
          });
        });
      }
    });

    const { xml: modifiedXML } = await moddle.toXML(rootElement, { format: true, prettify: true });
    return modifiedXML;
  }

  function addWarningForUnsupportedElements(result) {
    for (const unsupported_id of result.unsupported_elements) {
      const element = elementRegistry.get(unsupported_id);
      overlays.add(unsupported_id, ANALYSIS_NOTE_TYPE, {
        position: {
          top: -45,
          left: element.width / 2 - 17,
        },
        html: `<div class="small-note tooltip warning-note">
                 <img alt="quick-fix" src="data:image/svg+xml;base64,${WARNING_BASE64}"/>
                 <span class="tooltipText">This element is currently unsupported by the analyzer.</span>
               </div>`,
      });
    }

    resetPropertiesSummary();
  }

  function resetPropertiesSummary() {
    const properties = [
      "Safeness",
      "OptionToComplete",
      "ProperCompletion",
      "NoDeadActivities",
    ];
    for (const property of properties) {
      const propertyElement = document.getElementById(property);
      propertyElement.classList.remove("violated", "fulfilled");

      const propertyIcon = document.getElementById(`${property}-icon`);
      propertyIcon.classList.add("icon-question");
      propertyIcon.classList.remove(
        "icon-check",
        "icon-xmark",
        "fulfilled",
        "violated",
      );
    }
  }

  function setPropertyColorAndIcon(propertyResult) {
    // Set the property somehow with jquery
    let elementById = document.getElementById(`${propertyResult.property}`);
    let elementIconById = document.getElementById(
      `${propertyResult.property}-icon`,
    );
    if (propertyResult.fulfilled) {
      elementById.classList.remove("violated");
      elementById.classList.add("fulfilled");

      elementIconById.classList.remove(
        "icon-question",
        "icon-xmark",
        "violated",
      );
      elementIconById.classList.add("icon-check", "fulfilled");
    } else {
      elementById.classList.remove("fulfilled");
      elementById.classList.add("violated");

      elementIconById.classList.remove(
        "icon-question",
        "icon-check",
        "fulfilled",
      );
      elementIconById.classList.add("icon-xmark", "violated");
    }
  }
}

PropertiesSummary.prototype._init = function () {
  const html = domify(`
      <div class="properties">
      <!-- Other Property Elements -->
      
      <div id="Safeness" class="hint-container" data-hint="Ensures that tasks are properly synchronized to avoid conflicts">Synchronization</div>
      <div id="Safeness-icon" class="icon-question general-icon"></div>
      
      <div id="OptionToComplete" class="hint-container" data-hint="Ensures that all processes have a clear path to completion">Guaranteed termination</div>
      <div id="OptionToComplete-icon" class="icon-question general-icon"></div>
      
      <div id="ProperCompletion" class="hint-container" data-hint="Ensures that the process ends with a single, well-defined end event">Unique end event execution</div>
      <div id="ProperCompletion-icon" class="icon-question general-icon"></div>
      
      <div id="NoDeadActivities" class="hint-container" data-hint="Ensures that all tasks in the process are executable and none are left idle">No dead activities</div>
      <div id="NoDeadActivities-icon" class="icon-question general-icon"></div>
      
      <!-- Line Break -->
      <div class="linebreak"><hr></div>
      <div id="LineBreak-icon"></div>
      
      <div id="StructuralScore" class="hint-container" data-hint="Combined score for the structure of your BPMN model">Structural Score</div>
      <div id="StructuralScore-icon" class="icon-question general-icon"></div>
      
      <!-- Line Break -->
      <div class="linebreak"><hr></div>
      <div id="LineBreak-icon"></div>
      
      <div id="Semantic" class="hint-container" data-hint="Uses a LLM model to compare the names of tasks in both models">Semantic similarity</div>
      <div id="Semantic-icon" class="icon-question general-icon"></div>

      
      
      <div id="Structural" class="hint-container" data-hint="Compares the structures of both BPMN models">Structural similarity</div>
      <div id="Structural-icon" class="icon-question general-icon"></div>
      
      <div id="Behavioral" class="hint-container" data-hint="Coming soon...">Behavioral similarity</div>
      <div id="Behavioral-icon" class="icon-question general-icon"></div>
      
      <!-- Line Break -->
      <div class="linebreak"><hr></div>
      <div id="LineBreak-icon"></div>
      
      <div id="ComparisonScore" class="hint-container" data-hint="Combined score for the comparison between both BPMN models">Comparison Score</div>
      <div id="ComparisonScore-icon" class="icon-question general-icon"></div>
      
      <!-- Line Break -->
      <div class="linebreak"><hr></div>
      <div id="LineBreak-icon"></div>
      
      <div id="TotalScore" class="hint-container" data-hint="Combined structural and comparison score of your BPMN model">Total Score</div>
      <div id="TotalScore-icon" class="icon-question general-icon"></div>
      
      <!-- Line Break -->
      <div class="linebreak"><hr></div>
      <div id="LineBreak-icon"></div>
      </div>
  `);

  document.body.appendChild(html);
};


PropertiesSummary.$inject = [
  "eventBus",
  "overlays",
  "canvas",
  "elementRegistry",
  "bpmnFactory",
  "bpmnjs",
];
