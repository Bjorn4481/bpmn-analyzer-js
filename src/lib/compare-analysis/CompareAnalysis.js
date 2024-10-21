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
                                    executeNextStep(nextElement, [...eventLog], {...activeTokens}); // Continue with the next path
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
