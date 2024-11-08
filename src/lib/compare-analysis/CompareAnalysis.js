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
      console.log(results);
      this.updateScores(results);
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
        const similarity1 = results["similarity1"];
        // Convert similarity to percentage with three decimal places
        const similarityPercentage =
          (similarity1 * 100).toFixed(0) + "%";

        // Display the similarity percentage in the Structural-icon div
        structuralDiv.classList.remove("icon-question");
        structuralDiv.classList.remove("general-icon");
        structuralDiv.innerText = `${similarityPercentage}`;
        if (similarity1 >= 1.0) {
          structuralDiv.style.color = "green";
        } else if (similarity1 >= 0.5) {
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
}
