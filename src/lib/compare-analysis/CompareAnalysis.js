export default class CompareAnalysis {
    constructor() {
        // initialize
    }

    // functions
    compare(modeler, reference_modeler) {
        this.simulateProcessWithModeler(modeler);
    }

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
                const executeNextStep = (currentElement, eventLog) => {
                    if (!currentElement || visited.has(currentElement.id)) {
                        // Add this event log to the collection of all variations
                        allEventLogs.push([...eventLog]); // Clone the log
                        return;
                    }

                    // Log the current event (store in the event log)
                    eventLog.push({
                        caseId: 'case_1',  // Default caseId for now
                        activity: currentElement.name || currentElement.id,
                        timestamp: getCurrentTimestamp(),
                    });

                    // Mark the element as visited
                    visited.add(currentElement.id);

                    // Check if the current element is a task or gateway
                    if (currentElement.$type === 'bpmn:ExclusiveGateway') {
                        //console.log(`Encountered gateway: ${currentElement.id}`);

                        // Find all outgoing flows from the gateway
                        const outgoingFlows = sequenceFlows.filter(flow => flow.sourceRef.id === currentElement.id);

                        // Explore each outgoing flow as a separate variation
                        outgoingFlows.forEach(flow => {
                            const nextElement = flowElements.find(el => el.id === flow.targetRef.id);
                            executeNextStep(nextElement, [...eventLog]); // Pass a copy of the current event log
                        });
                    } else {
                        // Find the next sequence flow (outgoing flow) and its target (tasks/events)
                        const outgoingFlow = sequenceFlows.find(flow => flow.sourceRef.id === currentElement.id);
                        if (outgoingFlow) {
                            const nextElement = flowElements.find(el => el.id === outgoingFlow.targetRef.id);
                            executeNextStep(nextElement, eventLog); // Continue the current event log
                        } else {
                            // If no outgoing flow, the path ends here
                            allEventLogs.push([...eventLog]); // Add the final log
                        }
                    }

                    visited.delete(currentElement.id);  // Unmark the element to allow revisiting in other variations
                };

                // Start the process simulation from the start event
                executeNextStep(startEvent, []);

                // Once all variations are explored, display the event logs in XES format
                this.displayAllXESLogs(allEventLogs);
            }).catch((err) => {
                console.error('Error importing BPMN XML:', err);
            });
        }).catch((err) => {
            console.error('Error saving BPMN XML:', err);
        });
    }

    // Function to display all event logs in XES format
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
                    <string key="concept:name" value="${event.activity}"/>
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
}
