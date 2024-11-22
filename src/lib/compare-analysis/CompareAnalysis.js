// CompareAnalysis.js

export default class CompareAnalysis {
  constructor() {
    // Initialize if needed
  }

  /**
   * Main compare function
   * @param {BpmnJS} modeler - The first BPMN modeler instance
   * @param {BpmnJS} reference_modeler - The second BPMN modeler instance
   */
  async compare(modeler, reference_modeler) {
    try {
      // sent the modeler and reference_modeler with a GET request to the analysis server on localhost:8000
      // the server will return the similarity scores for the two models

      // convert the modeler and reference_modeler to XML
      const modelerXML = await modeler.saveXML({ format: true });
      const referenceModelerXML = await reference_modeler.saveXML({
        format: true,
      });

      const response = await fetch("http://localhost:8000/compare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          modeler: modelerXML,
          reference_modeler: referenceModelerXML,
        }),
      });
      const results = await response.json();
      // console.log(results);
      this.updateScores(results);
      this.updateC
      this.updateTaskColor(results["missing_tasks"]);
      this.updateFlowColor(results["correct_flows"]);
    } catch (error) {
      //console.error("Error during comparison:", error);
      // Clear the Structural-icon div in case of error
      const structuralDiv = document.getElementById("Structural-icon");
      if (structuralDiv) {
        structuralDiv.innerText = "";
      }
    }
  }

  /**
   * Method to calculate structural similarity between two BPMN diagrams
   * and display the result in the Structural-icon div
   * @param {BpmnJS} modeler - The first BPMN modeler instance
   * @param {BpmnJS} reference_modeler - The second BPMN modeler instance
   */
  async updateScores(results) {
    const structuralDiv = document.getElementById("Structural-icon");
    if (!structuralDiv) {
      console.error("Div with id 'Structural-icon' not found.");
      return;
    }

    try {
      if (results["similarity1"] !== undefined) {
        const similarity_score = (results["similarity1"] + results["similarity2"] + results["similarity3"]) / 3;
        // Convert similarity to percentage with three decimal places
        const similarityPercentage =
          (similarity_score * 100).toFixed(0) + "%";

        // Display the similarity percentage in the Structural-icon div
        structuralDiv.classList.remove("icon-question");
        structuralDiv.classList.remove("general-icon");
        structuralDiv.innerText = `${similarityPercentage}`;
        if (similarity_score >= 1.0) {
          structuralDiv.style.color = "green";
        } else if (similarity_score >= 0.5) {
          structuralDiv.style.color = "orange";
        } else {
          structuralDiv.style.color = "red";
        }
      }
      if (results["similarity2"] !== undefined) {
        // TODO: Display similarity2 in the UI
      }
      //console.log(`Structural Similarity (Level 1): ${similarityPercentage}`);
    } catch (error) {
      console.error("Error in simularityLevel1:", error);
      // Clear the Structural-icon div in case of error
      structuralDiv.innerText = "";
      if (
        !structuralDiv.classList.contains("icon-question") &&
        !structuralDiv.classList.contains("general-icon")
      ) {
        structuralDiv.classList.add("icon-question");
        structuralDiv.classList.add("general-icon");
      }
    }
  }
  
  async updateTaskColor(missing_tasks) {
    const missing_tasks_ids = [];
    for (let i = 0; i < missing_tasks.length; i++) {
      missing_tasks_ids.push(missing_tasks[i].id);
    }
    // Get all elements in the modeler
    const elements = document.getElementById("reference-canvas").querySelectorAll(".djs-element");
    // Iterate over all elements
    elements.forEach((element) => {
      // Get the element's ID
      const elementId = element.getAttribute("data-element-id");
      // Check if the element is a task
      if (elementId.startsWith("Activity_")) {
        // Check if the element's name is in the task_names array
        if (missing_tasks_ids.includes(elementId)) {
          // Change the color of the text to red
          element.querySelector(".djs-label").querySelector("tspan").style.fill = "red";
        }
        else {
          element.querySelector(".djs-label").querySelector("tspan").style.fill = "green";
        }
      }
    });
  }

  async updateFlowColor(correct_flows) {
    const correct_flows_ids = [];
    for (let i = 0; i < correct_flows.length; i++) {
      correct_flows_ids.push(correct_flows[i].id);
    }
    // Get all elements in the modeler
    const elements = document.getElementById("reference-canvas").querySelectorAll(".djs-element");
    // Iterate over all elements
    elements.forEach((element) => {
      // Get the element's ID
      const elementId = element.getAttribute("data-element-id");
      // Check if the element is a task
      if (elementId.startsWith("Flow_")) {
        // Check if the element's name is in the task_names array
        if (correct_flows_ids.includes(elementId)) {
          // Change the color of the text to red)
          const pathElements = element.querySelectorAll('g.djs-visual > path');
          pathElements.forEach(path => {
              path.style.stroke = 'rgb(0, 128, 0)'; // Change all to green
          });
        }
        else {
          const pathElements = element.querySelectorAll('g.djs-visual > path');
          pathElements.forEach(path => {
              path.style.stroke = 'rgb(222, 13, 13)'; // Change all to red
          });
        }
      }
    });
  }
}
