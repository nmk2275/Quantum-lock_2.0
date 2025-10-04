// Enhanced QKD Simulator JavaScript
// Message Encryption and Animation Functionality

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    
    // Enhanced Message Encryption Handler
    const encryptBtn = document.getElementById("encryptBtn");
    if (encryptBtn) {
        encryptBtn.onclick = async function() {
            const message = document.getElementById("userMessage").value;
            if (!message.trim()) {
                alert("Please enter a message to encrypt");
                return;
            }
            
            if (!window.lastExpData) {
                alert("Please run an experiment first to generate a quantum key");
                return;
            }
            
            const cryptoOutput = document.getElementById("cryptoOutput");
            cryptoOutput.innerHTML = "Encrypting message with quantum key...";
            
            try {
                const res = await fetch("/run/" + window.lastExpType, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: message })
                });
                const data = await res.json();
                
                if (data.error) {
                    cryptoOutput.innerHTML = 
                        `<div style="color:#ef4444;"><b>Error:</b> ${data.error}</div>`;
                } else {
                    cryptoOutput.innerHTML = 
                        `<div><b>Original Message:</b> ${data.original_message}</div>
                         <div style="margin-top:8px;"><b>Encrypted (hex):</b><br><span style="font-family:monospace; word-break:break-all; background:rgba(255,255,255,0.1); padding:4px; border-radius:4px;">${data.encrypted_message_hex}</span></div>
                         <div style="margin-top:8px;"><b>Decrypted:</b> <span style="color:#22d3ee;">${data.decrypted_message}</span></div>
                         <div style="margin-top:8px; font-size:12px; color:#10b981;"><b>✅ Success:</b> Message encrypted and decrypted using quantum key!</div>`;
                }
            } catch (error) {
                cryptoOutput.innerHTML = 
                    `<div style="color:#ef4444;"><b>Error:</b> ${error.message}</div>`;
            }
        };
    }
    
    // Capture experiment data when experiments are run
    const runExpButtons = document.querySelectorAll('button[onclick*="runExp"]');
    runExpButtons.forEach(button => {
        const originalOnClick = button.onclick;
        button.onclick = async function() {
            try {
                const result = await originalOnClick.call(this);
                // Store experiment data globally
                if (result && typeof result === 'object') {
                    window.lastExpData = result;
                    window.lastExpType = this.textContent.includes('1') ? 'exp1' : 
                                        this.textContent.includes('2') ? 'exp2' :
                                        this.textContent.includes('3') ? 'exp3' : 'exp4';
                }
            } catch (error) {
                console.log('Error capturing experiment data:', error);
            }
        };
    });

    // Simulation Animation Handler
    const simulationBtn = document.getElementById("simulationBtn");
    if (simulationBtn) {
        simulationBtn.onclick = function() {
            const Sender = nodes.find(n => n.type === 'Sender');
            const Receiver = nodes.find(n => n.type === 'Receiver');
            
            if (!Sender || !Receiver) {
                alert('Please place Sender and Receiver nodes on the canvas first');
                return;
            }
            
            const route = findRoute(Sender, Receiver);
            if (!route) {
                alert('Please connect Sender and Receiver with fiber (drag Fiber tool, then click Sender → Receiver)');
                return;
            }
            
            // Check if we have experiment data to use
            if (!window.lastExpData) {
                alert('Please run an experiment first to generate quantum data for simulation');
                return;
            }
            
            // Create side panel with logs and Bloch sphere
            createSidePanel();
            
            // Start simulation using actual experiment data
            startQuantumSimulation(route, window.lastExpData);
        };
    }
});

// Create side panel with tabs for logs and Bloch sphere
function createSidePanel() {
    let sidePanel = document.getElementById('sidePanel');
    if (!sidePanel) {
        sidePanel = document.createElement('div');
        sidePanel.id = 'sidePanel';
        sidePanel.style.cssText = `
            position: fixed;
            right: 0;
            top: 0;
            width: 400px;
            height: 100vh;
            background: linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0.005));
            border-left: 1px solid rgba(255,255,255,0.02);
            padding: 18px;
            z-index: 1000;
            overflow-y: auto;
        `;
        sidePanel.innerHTML = `
            <div class="side-panel-header">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h3 style="margin:0; color:#e9f7ff;">Quantum Analysis</h3>
                    <button id="closeSidePanel" style="background: rgba(255,255,255,0.1); border: none; color: #fff; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px;">×</button>
                </div>
                <div class="tab-buttons" style="display:flex; gap:8px; margin-bottom:16px;">
                    <button class="tab-btn active" onclick="switchTab('logs', this)" style="padding:8px 16px; border:none; border-radius:6px; background:linear-gradient(90deg,#10b981,#22d3ee); color:#fff; cursor:pointer;">Logs</button>
                    <button class="tab-btn" onclick="switchTab('bloch', this)" style="padding:8px 16px; border:none; border-radius:6px; background:rgba(255,255,255,0.05); color:#e9f7ff; cursor:pointer;">Bloch Sphere</button>
                </div>
            </div>
            <div id="logsTab" class="tab-content active">
                <h4 style="margin:0 0 8px 0; color:#c084fc;">⚛️ Quantum Measurement Logs</h4>
                <div id="measurementLogs" style="height:300px; background:rgba(0,0,0,0.3); border-radius:6px; padding:10px; overflow-y:auto; font-family:monospace; font-size:12px; color:#c084fc;"></div>
            </div>
            <div id="blochTab" class="tab-content" style="display:none;">
                <h4 style="margin:0 0 8px 0; color:#22d3ee;">🌀 Bloch Sphere</h4>
                <div id="blochSphere" style="height:300px; background:rgba(0,0,0,0.3); border-radius:6px; display:flex; align-items:center; justify-content:center; color:#22d3ee;">
                    <div style="text-align:center;">
                        <div style="font-size:48px; margin-bottom:8px;">⚛️</div>
                        <div>Quantum State Visualization</div>
                        <div style="font-size:12px; margin-top:8px; opacity:0.7;">Interactive Bloch sphere will appear here during simulation</div>
                    </div>
                </div>
            </div>
            <div style="margin-top:16px;">
                <h4 style="margin:0 0 8px 0; color:#10b981;">📊 Experiment Data</h4>
                <div id="experimentSummary" style="background:rgba(0,0,0,0.3); border-radius:6px; padding:10px; font-size:12px;"></div>
            </div>
        `;
        document.body.appendChild(sidePanel);
        
        // Adjust main content margin
        document.querySelector('.app').style.marginRight = '420px';
        
        // Add close button functionality
        document.getElementById('closeSidePanel').addEventListener('click', function() {
            document.getElementById('sidePanel').style.display = 'none';
            document.querySelector('.app').style.marginRight = '0';
            // Stop any ongoing animations
            if (window.animationInProgress) {
                window.animationInProgress = false;
            }
        });
    }
    sidePanel.style.display = 'block';
    
    // Clear previous logs
    const measurementLogs = document.getElementById('measurementLogs');
    measurementLogs.innerHTML = '<div style="color:#c084fc;">🚀 Starting quantum simulation with experiment data...<br><br></div>';
    
    // Initialize Bloch sphere
    setTimeout(() => {
        initializeBlochSphere();
        if (blochSphere) {
            addMeasurementLog("🌀 Bloch sphere initialized - ready for quantum state visualization!", "info");
        }
    }, 100);
}

// Add measurement log entry
function addMeasurementLog(message, type = 'info') {
    const logsEl = document.getElementById('measurementLogs');
    if (logsEl) {
        const colors = {
            'info': '#c084fc',
            'alice': '#22d3ee', 
            'bob': '#10b981',
            'eve': '#ef4444',
            'success': '#22c55e'
        };
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `<div style="color:${colors[type] || colors.info}; margin-bottom:4px;">[${timestamp}] ${message}</div>`;
        logsEl.innerHTML += logEntry;
        logsEl.scrollTop = logsEl.scrollHeight;
    }
}

// Tab switching function
function switchTab(tabName, clickedBtn) {
    // Update button states
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = 'rgba(255,255,255,0.05)';
        btn.style.color = '#e9f7ff';
    });
    clickedBtn.classList.add('active');
    clickedBtn.style.background = 'linear-gradient(90deg,#10b981,#22d3ee)';
    clickedBtn.style.color = '#fff';
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    document.getElementById(tabName + 'Tab').style.display = 'block';
}

// Start quantum simulation with animation using real experiment data
function startQuantumSimulation(route, expData) {
    // Display experiment summary
    updateExperimentSummary(expData);
    
    addMeasurementLog("🔬 Initializing BB84 Protocol Simulation with Real Quantum Data", "info");
    addMeasurementLog(`📡 Route: ${route.map(n => n.type).join(' → ')}`, "info");
    
    // Use actual experiment data instead of random generation
    const abits = expData.abits || expData.Sender_bits || [];
    const abase = expData.abase || expData.Sender_bases || [];
    const bbase = expData.bbase || expData.Receiver_bases || [];
    const bbits = expData.bbits || expData.Receiver_bits || [];
    
    // Eve detection - check multiple possible field names and structures
    let ebase = [];
    let ebits = [];
    
    // For exp3 (intercept-resend Eve)
    if (expData.Eve_bases) {
        ebase = expData.Eve_bases;
        ebits = expData.Eve_bits || [];
    }
    // For exp4 (partial Eve)
    else if (expData.eve_bases) {
        ebase = expData.eve_bases;
        ebits = expData.eve_bits || [];
    }
    // Legacy field names
    else if (expData.ebase) {
        ebase = expData.ebase;
        ebits = expData.ebits || [];
    }
    
    // Additional Eve detection based on QBER threshold
    const qber = expData.qber || (expData.loss * 100) || 0;
    const highQber = qber > 11; // Security threshold
    
    const numQubits = abits.length;
    let currentQubit = 0;
    
    addMeasurementLog(`🎯 Using ${numQubits} qubits from experiment data`, "info");
    
    // Enhanced Eve detection
    const evePresent = ebase.length > 0 || highQber;
    if (evePresent) {
        if (ebase.length > 0) {
            addMeasurementLog("⚠️ Eve detected in experiment data - will show interception", "eve");
        } else if (highQber) {
            addMeasurementLog(`🚨 High QBER (${qber.toFixed(1)}%) suggests Eve interference - simulating interception`, "eve");
            // Generate Eve data for simulation when QBER is high but no explicit Eve data
            ebase = Array(numQubits).fill(0).map(() => Math.random() < 0.5 ? 0 : 1);
            ebits = Array(numQubits).fill(0).map(() => Math.random() < 0.5 ? 0 : 1);
        }
    } else {
        addMeasurementLog("✅ No Eve detected - secure communication", "success");
    }
    
    // Convert bases to consistent format if needed
    const formatBase = (base) => {
        if (typeof base === 'number') return base === 0 ? '+' : 'x';
        return base;
    };
    
    const aliceBits = abits;
    const aliceBases = abase.map(formatBase);
    const bobBases = bbase.map(formatBase);
    const bobBits = bbits;
    const eveBases = ebase.map(formatBase);
    const eveBits = ebits;
    
    addMeasurementLog(`👩‍💻 Alice's bits: [${aliceBits.join(', ')}]`, "alice");
    addMeasurementLog(`👩‍💻 Alice's bases: [${aliceBases.join(', ')}]`, "alice");
    addMeasurementLog(`👨‍💻 Bob's bases: [${bobBases.join(', ')}]`, "bob");
    
    // Start qubit-by-qubit animation
    animateQuantumProtocol(route, aliceBits, aliceBases, bobBases, bobBits, eveBases, eveBits, 0);
}

// Update experiment summary display
function updateExperimentSummary(expData) {
    const summaryEl = document.getElementById('experimentSummary');
    if (summaryEl && expData) {
        let fidelity = expData.fidelity || 0;
        let qber = expData.qber || 0;
        
        // Handle both percentage and decimal formats
        if (fidelity > 1) {
            // Already in percentage format
            fidelity = fidelity;
        } else {
            // Convert decimal to percentage
            fidelity = fidelity * 100;
        }
        
        if (qber === 0 && expData.loss !== undefined) {
            // Use loss as QBER if QBER not provided
            qber = expData.loss > 1 ? expData.loss : expData.loss * 100;
        }
        
        // Enhanced Eve detection for summary
        let evePresent = false;
        if (expData.Eve_bases && expData.Eve_bases.length > 0) {
            evePresent = true;
        } else if (expData.eve_bases && expData.eve_bases.length > 0) {
            evePresent = true;
        } else if (expData.ebase && expData.ebase.length > 0) {
            evePresent = true;
        } else if (qber > 11) {
            evePresent = true; // High QBER suggests Eve
        }
        
        summaryEl.innerHTML = `
            <div style="color:#22d3ee; margin-bottom:8px;"><strong>Experiment Results</strong></div>
            <div style="color:#10b981;">Fidelity: ${fidelity.toFixed(1)}%</div>
            <div style="color:#ef4444;">QBER: ${qber.toFixed(1)}%</div>
            <div style="color:${evePresent ? '#ef4444' : '#10b981'};">
                Eve: ${evePresent ? 'Detected ⚠️' : 'Not Present ✅'}
            </div>
            <div style="color:#c084fc; margin-top:8px; font-size:11px;">
                Key Length: ${expData.agoodbits ? expData.agoodbits.length : 'N/A'} bits
            </div>
        `;
    }
}

// Animate quantum protocol step by step
function animateQuantumProtocol(route, aliceBits, aliceBases, bobBases, bobBits, eveBases, eveBits, qubitIndex) {
    // Set a flag to track if animation is in progress
    window.animationInProgress = true;
    
    if (qubitIndex >= aliceBits.length || !window.animationInProgress) {
        addMeasurementLog("✅ Quantum protocol simulation complete!", "success");
        window.animationInProgress = false;
        return;
    }
    
    const bit = aliceBits[qubitIndex];
    const aliceBase = aliceBases[qubitIndex];
    const bobBase = bobBases[qubitIndex];
    const bobBit = bobBits[qubitIndex];
    const evePresent = eveBases.length > 0;
    const eveBase = evePresent ? eveBases[qubitIndex] : null;
    const eveBit = evePresent ? eveBits[qubitIndex] : null;
    
    // Alice prepares and sends the qubit
    addMeasurementLog(`📡 Qubit ${qubitIndex + 1}: Alice sends |${bit}⟩ in ${aliceBase} basis`, "alice");
    
    // Update Bloch sphere to show Alice's prepared state
    if (blochSphere) {
        const aliceState = blochSphere.mapBasisBitToVector(aliceBase, bit);
        blochSphere.animateToVector(aliceState, 400);
    }
    
    // Create and animate the qubit on the canvas
    animateQubitOnCanvas(route, bit, aliceBase);
    
    // Show Eve interception if present
    if (evePresent) {
        setTimeout(() => {
            if (!window.animationInProgress) return;
            
            addMeasurementLog(`🔴 Eve intercepts and measures in ${eveBase} basis → ${eveBit}`, "eve");
            
            // Update Bloch sphere to show Eve's measurement result
            if (blochSphere) {
                const eveState = blochSphere.mapBasisBitToVector(eveBase, eveBit);
                blochSphere.animateToVector(eveState, 300);
            }
            
            // Visual indicator for Eve interception
            const eveNode = document.getElementById('node-eve');
            if (eveNode) {
                eveNode.style.boxShadow = '0 0 20px #ef4444';
                setTimeout(() => {
                    if (eveNode) eveNode.style.boxShadow = '0 10px 30px rgba(0,0,0,0.45)';
                }, 500);
            }
        }, 500);
    }
    
    // Bob's measurement
    setTimeout(() => {
        if (!window.animationInProgress) return;
        
        addMeasurementLog(`👨‍💻 Bob measures in ${bobBase} basis → ${bobBit}`, "bob");
        
        // Update Bloch sphere to show Bob's measurement result
        if (blochSphere) {
            const bobState = blochSphere.mapBasisBitToVector(bobBase, bobBit);
            blochSphere.animateToVector(bobState, 300);
        }
        
        // Check if bases match and show sifting result
        if (aliceBase === bobBase) {
            const match = bit === bobBit;
            const matchText = match ? "✅ Match" : "❌ Mismatch";
            const color = match ? "success" : "eve";
            addMeasurementLog(`🎯 Bases match (${aliceBase}): ${matchText}`, color);
        } else {
            addMeasurementLog(`🔄 Bases differ (${aliceBase} vs ${bobBase}): Discarded`, "info");
        }
        
        // Continue with next qubit - use a shorter delay for better performance
        setTimeout(() => {
            if (window.animationInProgress) {
                animateQuantumProtocol(route, aliceBits, aliceBases, bobBases, bobBits, eveBases, eveBits, qubitIndex + 1);
            }
        }, 200);
    }, evePresent ? 800 : 400);
}

// Animate a qubit on the canvas between nodes
function animateQubitOnCanvas(route, bit, basis) {
    if (!route || route.length < 2 || !window.animationInProgress) return;
    
    // Create animated qubit element
    const qubit = document.createElement('div');
    qubit.className = 'quantum-bit';
    qubit.style.cssText = 'position:absolute; width:40px; height:40px; border-radius:50%; background:linear-gradient(45deg, #22d3ee, #c084fc); display:flex; align-items:center; justify-content:center; color:white; font-weight:bold; font-size:14px; z-index:1000; box-shadow:0 0 20px rgba(34,211,238,0.6); transition: all 0.5s ease-in-out;';
    qubit.textContent = `${bit}${basis}`;
    
    document.body.appendChild(qubit);
    
    // Get start and end positions
    const startNode = route[0]; // Sender
    const endNode = route[route.length - 1]; // Receiver
    
    // Check if nodes have elements
    if (!startNode.el || !endNode.el) {
        qubit.remove();
        return;
    }
    
    const startRect = startNode.el.getBoundingClientRect();
    const endRect = endNode.el.getBoundingClientRect();
    
    // Set initial position
    qubit.style.left = (startRect.left + startRect.width / 2 - 20) + 'px';
    qubit.style.top = (startRect.top + startRect.height / 2 - 20) + 'px';
    
    // Animate to end position
    setTimeout(() => {
        if (!window.animationInProgress) {
            qubit.remove();
            return;
        }
        
        qubit.style.transition = 'all 1s ease-in-out';
        qubit.style.left = (endRect.left + endRect.width / 2 - 20) + 'px';
        qubit.style.top = (endRect.top + endRect.height / 2 - 20) + 'px';
        
        // Remove after animation completes
        setTimeout(() => {
            if (qubit.parentNode) qubit.remove();
        }, 1200);
    }, 100);
}

// Legacy function - kept for compatibility
function animateQuantumBit(index, route, bit, aliceBase, bobBase, isEvePresent, onComplete) {
    // Create animated qubit element
    const qubit = document.createElement('div');
    qubit.style.cssText = 'position:absolute; width:50px; height:50px; border-radius:50%; background:linear-gradient(45deg, #22d3ee, #c084fc); display:flex; align-items:center; justify-content:center; color:white; font-weight:bold; font-size:14px; z-index:1000; box-shadow:0 0 20px rgba(34,211,238,0.6);';
    qubit.textContent = `${bit}${aliceBase}`;
    
    document.body.appendChild(qubit);
    
    // Calculate path for animation
    const startNode = route[0];
    const startRect = startNode.el.getBoundingClientRect();
    
    // Set initial position
    qubit.style.left = (startRect.left + startRect.width / 2 - 25) + 'px';
    qubit.style.top = (startRect.top + startRect.height / 2 - 25) + 'px';
    
    // Animate along the route
    let currentRouteIndex = 0;
    
    function animateToNextNode() {
        if (currentRouteIndex >= route.length - 1) {
            // Reached Bob - perform measurement
            const measured = (aliceBase === bobBase) ? bit : Math.random() < 0.5 ? 0 : 1;
            const match = aliceBase === bobBase;
            
            addMeasurementLog(`📥 Qubit ${index + 1}: Bob measures with ${bobBase} → ${measured} ${match ? '✓' : '✗'}`, "bob");
            
            setTimeout(() => {
                if (qubit.parentNode) qubit.remove();
                onComplete();
            }, 500);
            return;
        }
        
        const nextNode = route[currentRouteIndex + 1];
        const nextRect = nextNode.el.getBoundingClientRect();
        
        // Handle Eve interception
        if (nextNode.type === 'eve' && isEvePresent) {
            const eveBase = Math.random() < 0.5 ? '+' : 'x';
            const eveMeasured = (aliceBase === eveBase) ? bit : Math.random() < 0.5 ? 0 : 1;
            
            addMeasurementLog(`🕵️ Eve intercepts Qubit ${index + 1}: measures with ${eveBase} → ${eveMeasured}`, "eve");
            
            // Change qubit appearance to show Eve's interference
            qubit.style.background = 'linear-gradient(45deg, #ef4444, #fb923c)';
            qubit.textContent = `${eveMeasured}${eveBase}`;
        } else if (nextNode.type === 'passive_eve') {
            addMeasurementLog(`👁️ Passive Eve observes Qubit ${index + 1}`, "eve");
        }
        
        // Animate to next node
        qubit.style.transition = 'all 0.8s ease-in-out';
        qubit.style.left = (nextRect.left + nextRect.width / 2 - 25) + 'px';
        qubit.style.top = (nextRect.top + nextRect.height / 2 - 25) + 'px';
        
        currentRouteIndex++;
        setTimeout(animateToNextNode, 900);
    }
    
    setTimeout(animateToNextNode, 200);
}

// ================== BLOCH SPHERE VISUALIZATION ==================

class BlochSphere {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.canvas = document.createElement('canvas');
        this.canvas.width = 300;
        this.canvas.height = 300;
        this.canvas.style.cssText = 'border-radius: 6px; background: rgba(0,0,0,0.2);';
        this.ctx = this.canvas.getContext('2d');
        
        // Current state vector
        this.currentVector = { x: 0, y: 0, z: 1 }; // Start at |0⟩
        this.targetVector = { x: 0, y: 0, z: 1 };
        this.animationProgress = 1;
        this.label = '|0⟩';
        
        // 3D rotation for better visualization
        this.rotationY = 0.3;
        this.rotationX = 0.2;
        
        this.setupCanvas();
        this.render();
        
        // Auto-rotation for better 3D effect
        this.startAutoRotation();
    }
    
    setupCanvas() {
        this.container.innerHTML = '';
        this.container.appendChild(this.canvas);
        
        // Add controls
        const controlDiv = document.createElement('div');
        controlDiv.style.cssText = 'margin-top: 8px; text-align: center; font-size: 12px;';
        controlDiv.innerHTML = `
            <div id="blochLabel" style="color: #22d3ee; font-weight: bold; margin-bottom: 4px;">${this.label}</div>
            <div style="color: #c084fc; opacity: 0.8;">Real-time Quantum State</div>
        `;
        this.container.appendChild(controlDiv);
        
        this.labelElement = document.getElementById('blochLabel');
    }
    
    // Map BB84 basis and bit to Bloch vector
    mapBasisBitToVector(basis, bit) {
        const numericBasis = typeof basis === 'number' ? basis : (basis === '+' ? 0 : 1);
        
        if (numericBasis === 0) { // Z-basis (+ basis)
            return bit === 0 ? 
                { x: 0, y: 0, z: 1, label: '|0⟩' } :   // |0⟩ state
                { x: 0, y: 0, z: -1, label: '|1⟩' };   // |1⟩ state
        } else { // X-basis (x basis)
            return bit === 0 ? 
                { x: 1, y: 0, z: 0, label: '|+⟩' } :   // |+⟩ state
                { x: -1, y: 0, z: 0, label: '|-⟩' };   // |-⟩ state
        }
    }
    
    // Animate to a new quantum state
    animateToVector(targetState, duration = 500) {
        this.targetVector = { x: targetState.x, y: targetState.y, z: targetState.z };
        this.label = targetState.label;
        this.animationProgress = 0;
        
        const startTime = Date.now();
        const startVector = { ...this.currentVector };
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            this.animationProgress = Math.min(elapsed / duration, 1);
            
            // Smooth interpolation with easing
            const t = this.easeInOutCubic(this.animationProgress);
            
            this.currentVector.x = startVector.x + (this.targetVector.x - startVector.x) * t;
            this.currentVector.y = startVector.y + (this.targetVector.y - startVector.y) * t;
            this.currentVector.z = startVector.z + (this.targetVector.z - startVector.z) * t;
            
            this.render();
            
            if (this.animationProgress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.labelElement.textContent = this.label;
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    startAutoRotation() {
        let lastTime = Date.now();
        
        const rotate = () => {
            const currentTime = Date.now();
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;
            
            // Slow auto-rotation for better 3D visualization
            this.rotationY += deltaTime * 0.0002;
            this.render();
            
            requestAnimationFrame(rotate);
        };
        
        requestAnimationFrame(rotate);
    }
    
    render() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = 80;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // 3D projection matrices
        const cosY = Math.cos(this.rotationY);
        const sinY = Math.sin(this.rotationY);
        const cosX = Math.cos(this.rotationX);
        const sinX = Math.sin(this.rotationX);
        
        // Project 3D point to 2D
        const project = (x, y, z) => {
            // Rotate around Y axis
            const x1 = x * cosY - z * sinY;
            const z1 = x * sinY + z * cosY;
            
            // Rotate around X axis
            const y2 = y * cosX - z1 * sinX;
            const z2 = y * sinX + z1 * cosX;
            
            return {
                x: centerX + x1 * radius,
                y: centerY - y2 * radius,
                z: z2
            };
        };
        
        // Draw sphere outline (wire frame)
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)';
        ctx.lineWidth = 1;
        
        // Draw meridians and equator
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            const angle = (i * Math.PI) / 4;
            
            for (let t = 0; t <= Math.PI * 2; t += 0.1) {
                const x = Math.cos(t) * Math.cos(angle);
                const y = Math.cos(t) * Math.sin(angle);
                const z = Math.sin(t);
                
                const projected = project(x, y, z);
                
                if (t === 0) {
                    ctx.moveTo(projected.x, projected.y);
                } else {
                    ctx.lineTo(projected.x, projected.y);
                }
            }
            ctx.stroke();
        }
        
        // Draw coordinate axes
        this.drawAxis(project, ctx, centerX, centerY, radius);
        
        // Draw state vector
        this.drawStateVector(project, ctx, centerX, centerY, radius);
    }
    
    drawAxis(project, ctx, centerX, centerY, radius) {
        // X axis (red)
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const xStart = project(-1.2, 0, 0);
        const xEnd = project(1.2, 0, 0);
        ctx.moveTo(xStart.x, xStart.y);
        ctx.lineTo(xEnd.x, xEnd.y);
        ctx.stroke();
        
        // Y axis (green)
        ctx.strokeStyle = '#22c55e';
        ctx.beginPath();
        const yStart = project(0, -1.2, 0);
        const yEnd = project(0, 1.2, 0);
        ctx.moveTo(yStart.x, yStart.y);
        ctx.lineTo(yEnd.x, yEnd.y);
        ctx.stroke();
        
        // Z axis (blue)
        ctx.strokeStyle = '#3b82f6';
        ctx.beginPath();
        const zStart = project(0, 0, -1.2);
        const zEnd = project(0, 0, 1.2);
        ctx.moveTo(zStart.x, zStart.y);
        ctx.lineTo(zEnd.x, zEnd.y);
        ctx.stroke();
        
        // Axis labels
        ctx.fillStyle = '#e5f6ff';
        ctx.font = '12px Arial';
        ctx.fillText('X', xEnd.x + 5, xEnd.y);
        ctx.fillText('Y', yEnd.x + 5, yEnd.y);
        ctx.fillText('Z', zEnd.x + 5, zEnd.y);
    }
    
    drawStateVector(project, ctx, centerX, centerY, radius) {
        // Project current vector
        const vectorEnd = project(this.currentVector.x, this.currentVector.y, this.currentVector.z);
        const vectorStart = project(0, 0, 0);
        
        // Draw vector arrow
        ctx.strokeStyle = '#fbbf24';
        ctx.fillStyle = '#fbbf24';
        ctx.lineWidth = 3;
        
        // Vector line
        ctx.beginPath();
        ctx.moveTo(vectorStart.x, vectorStart.y);
        ctx.lineTo(vectorEnd.x, vectorEnd.y);
        ctx.stroke();
        
        // Arrow head
        const angle = Math.atan2(vectorEnd.y - vectorStart.y, vectorEnd.x - vectorStart.x);
        const arrowLength = 8;
        
        ctx.beginPath();
        ctx.moveTo(vectorEnd.x, vectorEnd.y);
        ctx.lineTo(
            vectorEnd.x - arrowLength * Math.cos(angle - Math.PI / 6),
            vectorEnd.y - arrowLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            vectorEnd.x - arrowLength * Math.cos(angle + Math.PI / 6),
            vectorEnd.y - arrowLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
        
        // State point
        ctx.beginPath();
        ctx.arc(vectorEnd.x, vectorEnd.y, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Global Bloch sphere instance
let blochSphere = null;

// Initialize Bloch sphere when side panel is created
function initializeBlochSphere() {
    if (!blochSphere && document.getElementById('blochSphere')) {
        blochSphere = new BlochSphere('blochSphere');
        window.blochSphere = blochSphere; // For debugging
    }
}