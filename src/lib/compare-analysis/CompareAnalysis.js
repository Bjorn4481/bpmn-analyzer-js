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
      this.updateTaskColor(results["correct_tasks"], results["missing_tasks"]);
      this.updateFlowColor(results["correct_flows"], results["incorrect_flows"]);
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
    const semanticDiv = document.getElementById("Semantic-icon");
    const structuralDiv = document.getElementById("Structural-icon");
    if (!structuralDiv) {
      console.error("Div with id 'Structural-icon' not found.");
      return;
    }
    if (!semanticDiv) {
      console.error("Div with id 'Semantic-icon' not found.");
      return;
    }

    try {
      // Semantic similarity
      let global_semantic_score = results["bert_similarity"]["Global Similarity"];
      global_semantic_score = Math.max(Math.min(1, global_semantic_score),0);
      const semanticPercentage = Math.floor(global_semantic_score * 100) + "%";
      semanticDiv.classList.remove("icon-question");
      semanticDiv.classList.remove("general-icon");
      semanticDiv.innerText = `${semanticPercentage}`;
      if (global_semantic_score >= 1.0) {
        semanticDiv.style.color = "green";
      } else if (global_semantic_score >= 0.5) {
        semanticDiv.style.color = "orange";
      } else {
        semanticDiv.style.color = "red";
      }

      
      

      // Structural Similarity
      if (results["similarity1"] !== undefined) {
        let similarity_score;
        if (results["similarity2"] !== null) {
          similarity_score = (results["similarity1"] + results["similarity2"] + results["similarity3"]) / 3;
        } else {
          similarity_score = (results["similarity1"] + results["similarity3"]) / 2;
        }
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

      // Clear the Semantic-icon div in case of error
      semanticDiv.innerText = "";
      if (
        !semanticDiv.classList.contains("icon-question") &&
        !semanticDiv.classList.contains("general-icon")
      ) {
        semanticDiv.classList.add("icon-question");
        semanticDiv.classList.add("general-icon");
      }

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

    // Update the Comparison Score
    updateComparisonScore();
  }
  
  async updateTaskColor(correct_tasks, missing_tasks) {
    const correct_tasks_ids = [];
    for (let i = 0; i < correct_tasks.length; i++) {
      correct_tasks_ids.push(correct_tasks[i].id);
    }
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
      // Check if the element's name is in the task_names array
      if (correct_tasks_ids.includes(elementId)) {
        // Change the color of the text to red
        element.querySelectorAll(".djs-label tspan").forEach(tspan => {
          tspan.style.fill = "green";
        });
      }
      else if (missing_tasks_ids.includes(elementId)) {
        element.querySelectorAll(".djs-label tspan").forEach(tspan => {
          tspan.style.fill = "red";
        });
      }
    });
  }

  async updateFlowColor(correct_flows, incorrect_flows) {
    const correct_flows_ids = [];
    for (let i = 0; i < correct_flows.length; i++) {
      correct_flows_ids.push(correct_flows[i].id);
    }
    const incorrect_flows_ids = [];
    for (let i = 0; i < incorrect_flows.length; i++) {
      incorrect_flows_ids.push(incorrect_flows[i].id);
    }

    // Get all elements in the modeler
    const elements = document.getElementById("reference-canvas").querySelectorAll(".djs-element");
    // Iterate over all elements
    elements.forEach((element) => {
      // Get the element's ID
      const elementId = element.getAttribute("data-element-id");
      // Check if the element is a task
      if (correct_flows_ids.includes(elementId)) {
        // Change the color of the text to red)
        const pathElements = element.querySelectorAll('g.djs-visual > path');
        pathElements.forEach(path => {
            path.style.stroke = 'rgb(0, 128, 0)'; // Change all to green
        });
      }
      else if (incorrect_flows_ids.includes(elementId)) {
        const pathElements = element.querySelectorAll('g.djs-visual > path');
        pathElements.forEach(path => {
            path.style.stroke = 'rgb(222, 13, 13)'; // Change all to red
        });
      }
    });
  }
}

function updateComparisonScore() {
  try {
    // Define the IDs of the four icon divs to check
    const iconIds = [
        'Semantic-icon',
        'Structural-icon',
        'Behavioral-icon'
    ];

    let total = iconIds.length;
    let scores = 0;

    // Iterate over each icon ID
    iconIds.forEach(id => {
        const iconElement = document.getElementById(id);
        if (iconElement) {
            // Check if the icon has both 'icon-check' and 'fulfilled' classes
            if (!iconElement.classList.contains('icon-question')) {
                scores += parseFloat(iconElement.innerText) / 100;
            }
            else {
              total -= 1;
            }
        } else {
            console.warn(`Icon with ID '${id}' not found.`);
        }
    });

    // Calculate percentage
    let scorePercentage = 0;
    if (total > 0) {
        scorePercentage = (scores / total) * 100;
    }
    else{
      throw new Error("No comparison scores");
    }

    // Update the ComparisonScore-icon div
    const scoreDiv = document.getElementById('ComparisonScore-icon');
    if (scoreDiv) {
        scoreDiv.classList.remove("icon-question");
        scoreDiv.classList.remove("general-icon");
        scoreDiv.innerText = `${scorePercentage.toFixed(0)}%`;
        if (scorePercentage >= 100) {
            scoreDiv.style.color = 'green';
        } else if (scorePercentage > 50) {
          scoreDiv.style.color = 'orange';
        }
        else {
          scoreDiv.style.color = 'red';
        }
    }
  } catch (error) {
    // console.error("Error calculating Structural Score:", error);
    // Clear the ComparisonScore-icon div in case of error
    const scoreDiv = document.getElementById('ComparisonScore-icon');
    if (scoreDiv) {
        scoreDiv.innerText = '';
        if (!scoreDiv.classList.contains("icon-question") && !scoreDiv.classList.contains("general-icon")) {
            scoreDiv.classList.add("icon-question");
            scoreDiv.classList.add("general-icon");
        }
    }
  }
  updateTotalScore();
}

function updateTotalScore() {
  try {
    // Define the IDs of the four icon divs to check
    const iconIds = [
        'StructuralScore-icon',
        'ComparisonScore-icon'
    ];

    let total = iconIds.length;
    let scores = 0;

    // Iterate over each icon ID
    iconIds.forEach(id => {
        const iconElement = document.getElementById(id);
        if (iconElement) {
            // Check if the icon has both 'icon-check' and 'fulfilled' classes
            if (!iconElement.classList.contains('icon-question')) {
                scores += parseFloat(iconElement.innerText) / 100;
            }
            else {
              total -= 1;
            }
        } else {
            console.warn(`Icon with ID '${id}' not found.`);
        }
    });

    // Calculate percentage
    let scorePercentage = 0;
    if (total > 0) {
        scorePercentage = (scores / total) * 100;
    }

    // Update the TotalScore-icon div
    const scoreDiv = document.getElementById('TotalScore-icon');
    if (scoreDiv) {
        scoreDiv.classList.remove("icon-question");
        scoreDiv.classList.remove("general-icon");
        scoreDiv.innerText = `${scorePercentage.toFixed(0)}%`;
        if (scorePercentage >= 100) {
            scoreDiv.style.color = 'green';
        } else if (scorePercentage > 50) {
          scoreDiv.style.color = 'orange';
        }
        else {
          scoreDiv.style.color = 'red';
        }
    }
} catch (error) {
    console.error("Error calculating Total Score:", error);
    // Clear the TotalScore-icon div in case of error
    const scoreDiv = document.getElementById('TotalScore-icon');
    if (scoreDiv) {
        scoreDiv.innerText = '';
        if (!scoreDiv.classList.contains("icon-question") && !scoreDiv.classList.contains("general-icon")) {
            scoreDiv.classList.add("icon-question");
            scoreDiv.classList.add("general-icon");
        }
    }
}
}