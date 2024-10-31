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
            await this.simularityLevel1(modeler, reference_modeler);
        } catch (error) {
            console.error("Error during comparison:", error);
            // Clear the Structural-icon div in case of error
            const structuralDiv = document.getElementById("Structural-icon");
            if (structuralDiv) {
                structuralDiv.innerText = '';
            }
        }
    }

    /**
     * Method to calculate structural similarity between two BPMN diagrams
     * and display the result in the Structural-icon div
     * @param {BpmnJS} modeler - The first BPMN modeler instance
     * @param {BpmnJS} reference_modeler - The second BPMN modeler instance
     */
    async simularityLevel1(modeler, reference_modeler) {
        const structuralDiv = document.getElementById("Structural-icon");
        if (!structuralDiv) {
            console.error("Div with id 'Structural-icon' not found.");
            return;
        }

        try {
            // Extract XML from both modelers
            const [xml1Result, xml2Result] = await Promise.all([
                modeler.saveXML({ format: true }),
                reference_modeler.saveXML({ format: true })
            ]);

            const xml1 = xml1Result.xml;
            const xml2 = xml2Result.xml;

            // Parse both XMLs to extract sequence flows
            const graph1 = new BpmnDiagramGraph();
            graph1.loadDiagramFromXmlString(xml1);

            const graph2 = new BpmnDiagramGraph();
            graph2.loadDiagramFromXmlString(xml2);

            // Calculate similarity
            const similarityCalculator = new BpmnSimilarity();
            const similarity = similarityCalculator.calculateStructureSimilarity(graph1, graph2);

            // Convert similarity to percentage with three decimal places
            const similarityPercentage = (similarity * 100).toFixed(0) + '%';

            // Display the similarity percentage in the Structural-icon div        
            structuralDiv.classList.remove("icon-question");
            structuralDiv.classList.remove("general-icon");
            structuralDiv.innerText = `${similarityPercentage}`;
            if (similarity >= 1.0) {
                structuralDiv.style.color = 'green';
            } else if (similarity >= 0.5) {
                structuralDiv.style.color = 'orange';
            } else {
                structuralDiv.style.color = 'red';
            }
            //console.log(`Structural Similarity (Level 1): ${similarityPercentage}`);
        } catch (error) {
            //console.error("Error in simularityLevel1:", error);
            // Clear the Structural-icon div in case of error
            structuralDiv.innerText = '';
            if (!structuralDiv.classList.contains("icon-question") && !structuralDiv.classList.contains("general-icon")) {
                structuralDiv.classList.add("icon-question");
                structuralDiv.classList.add("general-icon");
            }
        }
    }

    /**
     * Existing method: Simulates the BPMN process and generates event logs in XES format
     * @param {BpmnJS} modeler - The BPMN modeler instance
     */
    simulateProcessWithModeler(modeler) {
        modeler.saveXML({ format: true }).then((result) => {
            const { xml } = result;

            // Parse the XML to get BPMN definitions
            modeler.importXML(xml).then(() => {
                // Access the definitions and elements
                const definitions = modeler.getDefinitions();
                const process = definitions.rootElements.find(el => el.$type === 'bpmn:Process');
                const flowElements = process.flowElements;

                // Extract activities (tasks, events) and sequence flows
                const activities = flowElements.filter(el => el.$type === 'bpmn:Task' || el.$type === 'bpmn:StartEvent' || el.$type === 'bpmn:EndEvent');
                const sequenceFlows = flowElements.filter(el => el.$type === 'bpmn:SequenceFlow');
                const gateways = flowElements.filter(el => el.$type === 'bpmn:ExclusiveGateway');

                // Initialize event log array for all variations
                const allEventLogs = [];

                // Function to generate a timestamp
                const getCurrentTimestamp = () => {
                    return new Date().toISOString();
                };

                // Simulate the process for all paths (variations)
                console.log('Starting process simulation...');
                let startEvent = activities.find(el => el.$type === 'bpmn:StartEvent');  // Find the start event
                const visited = new Set();  // Keep track of visited elements to prevent infinite loops

                // Recursive function to explore all paths
                const executeNextStep = (currentElement, eventLog, activeTokens) => {
                    if (!currentElement || visited.has(currentElement.id)) {
                        console.log('Invalid element:', currentElement);
                        return;
                    }
                
                    // Log the current event (store in the event log)
                    eventLog.push({
                        caseId: 1,
                        activity: currentElement.name || currentElement.id,
                        timestamp: getCurrentTimestamp(),
                    });
                
                    // Mark the element as visited
                    visited.add(currentElement.id);
            
                
                    // Handle Exclusive Gateway (one token follows one path)
                    if (currentElement.$type === 'bpmn:ExclusiveGateway') {
                        const outgoingFlows = sequenceFlows.filter(flow => flow.sourceRef.id === currentElement.id);
                        if (outgoingFlows.length > 0) {
                            // Explore each outgoing flow as a separate trace (one token follows one path)
                            outgoingFlows.forEach(flow => {
                                const nextElement = flowElements.find(el => el.id === flow.targetRef.id);
                                if (nextElement) {
                                    console.log('Following path:', currentElement.name || currentElement.id, '->', nextElement.name || nextElement.id);
                                    executeNextStep(nextElement, [...eventLog], { ...activeTokens }); // Continue with the next path
                                }
                            });
                        }
                        return; // Stop further execution after following one path
                    }
                
                    // Handle Parallel Gateway (split into multiple tokens)
                    if (currentElement.$type === 'bpmn:ParallelGateway') {
                        const outgoingFlows = sequenceFlows.filter(flow => flow.sourceRef.id === currentElement.id);
                        const nextElements = outgoingFlows.map(flow => flowElements.find(el => el.id === flow.targetRef.id));
                
                        // Increase the token count to track how many tokens are now active
                        activeTokens.count += nextElements.length - 1; // Increase by number of new tokens, minus 1 for the current token
                
                        nextElements.forEach(nextElement => {
                            const currentLog = eventLog; // Clone the current log for each parallel path
                            executeNextStep(nextElement, currentLog, activeTokens); // Continue each path in parallel
                        });
                        return; // Stop this path after creating tokens
                    }
                
                    // Handle normal sequence flows (tasks/events)
                    const outgoingFlow = sequenceFlows.find(flow => flow.sourceRef.id === currentElement.id);
                    if (outgoingFlow) {
                        const nextElement = flowElements.find(el => el.id === outgoingFlow.targetRef.id);
                        if (nextElement) {
                            executeNextStep(nextElement, eventLog, activeTokens); // Continue the trace
                        }
                    }
                    else {
                        activeTokens.count--;
                        console.log('Token reached end:', currentElement.name || currentElement.id);
                        
                        // Only push the log to allEventLogs when all tokens have reached the end
                        if (activeTokens.count === 0) {
                            allEventLogs.push([...eventLog]); // Push the completed log to allEventLogs
                            console.log('All tokens reached end. Log:', eventLog);
                        }
                        return; // Stop this path
                    }
                
                    visited.delete(currentElement.id); // Unmark to allow revisiting in other variations
                };                

                // Start the process simulation from the start event
                if (startEvent) {
                    const activeTokens = { count: 1 }; // Initially, there is 1 active token
                    executeNextStep(startEvent, [], activeTokens);
                }

                // Once all variations are explored, display the event logs in XES format
                this.displayAllXESLogs(allEventLogs);
            }).catch((err) => {
                console.error('Error importing BPMN XML:', err);
            });
        }).catch((err) => {
            console.error('Error saving BPMN XML:', err);
        });
    }

    /**
     * Function to display all event logs in XES format
     * @param {Array<Array<Object>>} allEventLogs - Array of event logs
     */
    displayAllXESLogs(allEventLogs) {
        const xesHeader = `
        <log xes.version="1.0" xes.features="nested-attributes" openxes.version="1.0RC7" xmlns="http://www.xes-standard.org/">
        <extension name="Time" prefix="time" uri="http://www.xes-standard.org/time.xesext"/>
        <extension name="Concept" prefix="concept" uri="http://www.xes-standard.org/concept.xesext"/>
        <extension name="Lifecycle" prefix="lifecycle" uri="http://www.xes-standard.org/lifecycle.xesext"/>
        <extension name="Organizational" prefix="org" uri="http://www.xes-standard.org/org.xesext"/>
        <global scope="trace">
            <string key="concept:name" value="case_id"/>
        </global>
        <global scope="event">
            <string key="concept:name" value="activity"/>
            <date key="time:timestamp" value="timestamp"/>
        </global>
        <classifier name="Activity classifier" keys="concept:name"/>
        `;

        const xesFooter = `</log>`;

        // Convert each event log variation into XES trace format
        const xesTraces = allEventLogs.map((eventLog, index) => {
            const traceEvents = eventLog.map(event => `
                <event>
                    <string key="concept:name" value="${this.escapeXml(event.activity)}"/>
                    <date key="time:timestamp" value="${event.timestamp}"/>
                </event>
            `).join('');

            return `
            <trace>
                <string key="concept:name" value="case_${index + 1}"/>
                ${traceEvents}
            </trace>`;
        }).join('');

        const xesLog = `${xesHeader}${xesTraces}${xesFooter}`;
        console.log('XES Log:\n', xesLog);
    }

    /**
     * Utility function to escape XML special characters
     * @param {string} unsafe - The string to escape
     * @returns {string} - Escaped string
     */
    escapeXml(unsafe) {
        return unsafe.replace(/[<>&'"]/g, function (c) {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
            }
        });
    }

    /**
     * Utility function to generate all permutations of an array
     * @param {Array} elements - The array to permute
     * @returns {Array<Array>} - Array of all permutations
     */
    generatePermutations(elements) {
        if (elements.length <= 1) {
            return [elements];
        }
    
        const permutations = [];
        elements.forEach((el, i) => {
            const remaining = [...elements.slice(0, i), ...elements.slice(i + 1)];
            const remainingPermutations = this.generatePermutations(remaining);
            remainingPermutations.forEach(permutation => {
                permutations.push([el, ...permutation]);
            });
        });
    
        return permutations;
    }
}

/**
 * Helper class to represent a BPMN Diagram Graph
 * It parses the BPMN XML and extracts nodes and sequence flows (edges)
 */
class BpmnDiagramGraph {
    constructor() {
        this.nodes = [];
        this.edges = [];
    }

    /**
     * Loads and parses the BPMN diagram from an XML string
     * @param {string} xmlString - The BPMN XML as a string
     */
    loadDiagramFromXmlString(xmlString) {
        // Parse the XML string using DOMParser
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

        // Check for XML parsing errors
        const parserError = xmlDoc.getElementsByTagName('parsererror');
        if (parserError.length > 0) {
            throw new Error('Error parsing XML: ' + parserError[0].textContent);
        }

        // Define the BPMN namespace
        const bpmnNamespace = 'http://www.omg.org/spec/BPMN/20100524/MODEL';

        // Extract tasks, start events, and end events (nodes)
        const tasks = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'task');
        const startEvents = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'startEvent');
        const endEvents = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'endEvent');

        // Helper function to extract IDs from elements
        const extractIds = (elements) => {
            for (let elem of elements) {
                const id = elem.getAttribute('id');
                if (id) {
                    this.nodes.push(id);
                }
            }
        };

        extractIds(tasks);
        extractIds(startEvents);
        extractIds(endEvents);

        // Extract sequence flows (edges)
        const sequenceFlows = xmlDoc.getElementsByTagNameNS(bpmnNamespace, 'sequenceFlow');
        for (let flow of sequenceFlows) {
            const source = flow.getAttribute('sourceRef');
            const target = flow.getAttribute('targetRef');
            if (source && target) {
                this.edges.push([source, target]);
            }
        }
    }

    /**
     * Returns the list of node IDs
     * @returns {Array<string>}
     */
    getNodes() {
        return this.nodes;
    }

    /**
     * Returns the list of edges as [source, target] pairs
     * @returns {Array<Array<string>>}
     */
    getEdges() {
        return this.edges;
    }
}

/**
 * Helper class to calculate BPMN similarity
 */
class BpmnSimilarity {
    /**
     * Calculates the structural similarity between two BPMN diagrams
     * @param {BpmnDiagramGraph} bpmn1 - First BPMN Diagram
     * @param {BpmnDiagramGraph} bpmn2 - Second BPMN Diagram
     * @returns {number} - Similarity score between 0 and 1
     */
    calculateStructureSimilarity(bpmn1, bpmn2) {
        const edges1 = bpmn1.getEdges();
        const edges2 = bpmn2.getEdges();

        const totalEdges = Math.max(edges1.length, edges2.length);
        if (totalEdges === 0) return 0;

        // Convert edges to strings for easy comparison
        const set1 = new Set(edges1.map(edge => edge.join('->')));
        const set2 = new Set(edges2.map(edge => edge.join('->')));

        // Calculate intersection
        let matchingEdges = 0;
        for (let edge of set1) {
            if (set2.has(edge)) {
                matchingEdges += 1;
            }
        }

        // Calculate similarity
        const similarity = matchingEdges / totalEdges;
        return similarity;
    }
}
