let currentAnalysis = null;
let currentBlueprint = null;
let currentFlow = null;
let currentRoadmap = null;
let lastAnalyzedIdea = "";
let savedIdeas = [];
let loadingInterval = null;

// === SIDEBAR FUNCTIONS ===
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar?.classList.toggle('active');
    overlay?.classList.toggle('active');
    document.body.classList.toggle('sidebar-open');
}

function openSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar?.classList.add('active');
    overlay?.classList.add('active');
    document.body.classList.add('sidebar-open');
}

function loadSavedIdeas() {
    const saved = localStorage.getItem('vibePilotSavedIdeas');
    if (saved) {
        try { savedIdeas = JSON.parse(saved); } catch (e) { savedIdeas = []; }
    }
    renderSavedIdeas();
}

function renderSavedIdeas() {
    const list = document.getElementById('savedIdeasList');
    if (!list) return;

    if (savedIdeas.length === 0) {
        list.innerHTML = '<div class="sidebar-empty">No saved ideas yet</div>';
        return;
    }

    list.innerHTML = savedIdeas.map((item, index) => `
        <div class="sidebar-item" onclick="restoreIdea(${index})">
            <div class="sidebar-item-content">
                <div class="sidebar-item-title">${item.title}</div>
                <div class="sidebar-item-score">Score: ${item.score}/100</div>
            </div>
            <div class="sidebar-item-actions" onclick="event.stopPropagation()">
                <button class="sidebar-action-btn" onclick="archiveIdea(${index})" title="Archive">📁</button>
                <button class="sidebar-action-btn delete" onclick="deleteIdea(${index})" title="Delete">🗑</button>
            </div>
        </div>
    `).join('');
}

function saveIdea(idea, analysis) {
    // Create short title from idea (first 40 chars)
    const title = idea.length > 40 ? idea.substring(0, 40) + '...' : idea;
    const score = analysis.overall_score || 0;

    savedIdeas.unshift({
        idea: idea,
        title: title,
        score: score,
        analysis: analysis,
        timestamp: Date.now()
    });

    localStorage.setItem('vibePilotSavedIdeas', JSON.stringify(savedIdeas));
    renderSavedIdeas();
}

function findDuplicateIdea(idea) {
    const normalized = idea.trim().toLowerCase();
    return savedIdeas.find(item => item.idea.trim().toLowerCase() === normalized);
}

function showDuplicateToast(existingItem) {
    const toast = document.createElement('div');
    toast.className = 'duplicate-toast';
    toast.innerHTML = `
        <div class="duplicate-toast-text">
            ✨ This idea has already been analyzed!<br>
            <small style="color: var(--text-muted);">Score: ${existingItem.score}/100</small>
        </div>
        <button class="duplicate-toast-btn" onclick="this.parentElement.remove(); restoreIdea(${savedIdeas.indexOf(existingItem)})">View Results</button>
        <button class="duplicate-toast-btn" style="background: transparent; border: 1px solid var(--border-subtle); color: var(--text-secondary); margin-left: 0.5rem;" onclick="this.parentElement.remove()">Dismiss</button>
    `;
    document.body.appendChild(toast);
}

function restoreIdea(index) {
    const item = savedIdeas[index];
    if (!item) return;

    // Open sidebar if not already
    openSidebar();

    // Set state
    currentAnalysis = item.analysis;
    lastAnalyzedIdea = item.idea;
    if (input) input.value = item.idea;

    // Hide ALL screens first (including welcome screen)
    const allScreens = ['welcomeScreen', 'analysisScreen', 'blueprintScreen', 'flowScreen', 'roadmapScreen', 'exportScreen', 'processingOverlay'];
    allScreens.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    // Now display analysis (this will show analysisScreen)
    displayAnalysis(item.analysis);
}

function archiveIdea(index) {
    // For now, archive just removes from active list (could add to separate archive later)
    const item = savedIdeas[index];
    if (!item) return;

    if (confirm(`Archive "${item.title}"?`)) {
        savedIdeas.splice(index, 1);
        localStorage.setItem('vibePilotSavedIdeas', JSON.stringify(savedIdeas));
        renderSavedIdeas();
    }
}

function deleteIdea(index) {
    const item = savedIdeas[index];
    if (!item) return;

    if (confirm(`Delete "${item.title}"? This cannot be undone.`)) {
        savedIdeas.splice(index, 1);
        localStorage.setItem('vibePilotSavedIdeas', JSON.stringify(savedIdeas));
        renderSavedIdeas();
    }
}

function clearSavedIdeas() {
    if (confirm('Clear all saved ideas?')) {
        savedIdeas = [];
        localStorage.removeItem('vibePilotSavedIdeas');
        renderSavedIdeas();
    }
}



// Matrix background animation
function initMatrixRain() {
    const container = document.getElementById('matrixRain');
    if (!container) return;
    const words = ['PROMPT', 'TOKEN', 'CONTEXT', 'AGENT', 'CODE', 'VISION', 'EXECUTE', 'BUILD', 'OPTIMIZE', 'DEPLOY'];

    for (let i = 0; i < 8; i++) {
        setTimeout(() => createFloatingWord(container, words, true), i * 200);
    }

    setInterval(() => createFloatingWord(container, words, false), 3000);
}

function createFloatingWord(container, words, isInitial) {
    const element = document.createElement('div');
    element.className = 'matrix-word';
    element.style.left = `${5 + Math.random() * 90}%`;
    element.style.bottom = isInitial ? `${Math.random() * 80}%` : '0';

    const drift = (Math.random() - 0.5) * 100;
    element.style.setProperty('--drift', `${drift}px`);

    const duration = 20 + Math.random() * 15;
    element.style.animationDuration = `${duration}s`;

    const isBinary = Math.random() > 0.5;
    element.textContent = isBinary ?
        Array.from({ length: 4 + Math.floor(Math.random() * 5) }, () => Math.random() > 0.5 ? '1' : '0').join('') :
        words[Math.floor(Math.random() * words.length)];

    container.appendChild(element);

    const morphInterval = setInterval(() => {
        const isBinary = Math.random() > 0.5;
        element.textContent = isBinary ?
            Array.from({ length: 4 + Math.floor(Math.random() * 5) }, () => Math.random() > 0.5 ? '1' : '0').join('') :
            words[Math.floor(Math.random() * words.length)];
    }, 800 + Math.random() * 700);

    setTimeout(() => {
        clearInterval(morphInterval);
        element.remove();
    }, duration * 1000);
}

// Auto-resize textarea and handle input
const input = document.getElementById('userInput');
if (input) {
    input.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 150) + 'px';
    });

    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            analyzeIdea();
        }
    });
}

function useExample(text) {
    if (input) {
        input.value = text;
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 150) + 'px';
    }
}

async function analyzeIdea() {
    const input = document.getElementById('userInput');
    const idea = input.value.trim();
    if (!idea) return;



    // Check for duplicate first
    const duplicate = findDuplicateIdea(idea);
    if (duplicate) {
        showDuplicateToast(duplicate);
        return;
    }

    lastAnalyzedIdea = idea;

    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
        analyzeBtn.disabled = true;
        analyzeBtn.innerText = 'Analyzing...';
    }

    // Hide welcome, show overlay
    const welcomeScreen = document.getElementById('welcomeScreen');
    if (welcomeScreen) welcomeScreen.classList.add('hidden');
    const processingOverlay = document.getElementById('processingOverlay');
    if (processingOverlay) processingOverlay.classList.remove('hidden');
    updateNavButtons('analyzing');

    // START LOADING ANIMATION (Non-blocking)
    const stopLoading = startLoadingAnimation([
        { main: "Searching your million-dollar idea...", sub: "Scanning market databases" },
        { main: "Analyzing competitive landscape...", sub: "Cross-referencing 10,000+ startups" },
        { main: "Evaluating market feasibility...", sub: "Consulting industry reports" },
        { main: "Calculating growth potential...", sub: "Running predictive models" },
        { main: "Assessing technical complexity...", sub: "Reviewing tech stack options" },
        { main: "Determining monetization clarity...", sub: "Analyzing revenue models" },
        { main: "Finalizing feasibility report...", sub: "Preparing insights" }
    ]);

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idea })
        });

        // Wait for loading to finish visual sequence if barely started, 
        // OR if it's hanging at 90%, complete it now.
        await stopLoading();

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Analysis failed');
        currentAnalysis = data;

        // Save the idea to sidebar
        saveIdea(idea, data);

        displayAnalysis(data);
    } catch (error) {
        console.error('Error:', error);
        const overlay = document.getElementById('processingOverlay');
        if (overlay) overlay.classList.add('hidden');
        const welcomeScr = document.getElementById('welcomeScreen');
        if (welcomeScr) welcomeScr.classList.remove('hidden');
        if (loadingInterval) clearInterval(loadingInterval);

        let errorMsg = error.message;
        if (errorMsg.includes('timed out')) {
            errorMsg = "⏱️ Market research is taking too long. OpenRouter or IdeaBrowser might be slow right now. Please try again or simplify your idea.";
        }

        alert(`Analysis Error: ${errorMsg}`);
        if (analyzeBtn) {
            analyzeBtn.disabled = false;
            analyzeBtn.innerText = 'Analyze';
        }
    }
}

// ===== INTELLIGENT LOADING =====
// Returns a function that resolves when animation completes
function startLoadingAnimation(customMessages = []) {
    if (loadingInterval) clearInterval(loadingInterval);
    loadingInterval = null;

    const overlay = document.getElementById('processingOverlay');
    const status = document.getElementById('processingText');
    const subtext = document.getElementById('processingSubtext');

    if (overlay) overlay.classList.remove('hidden');

    const defaultMessages = [
        { main: "Initializing neural link...", sub: "Calibrating synaptic pathways" },
        { main: "Scanning market resonance...", sub: "Analyzing global trends" },
        { main: "Simulating VC rejection...", sub: "Optimizing pitch resistance" }
    ];

    let messages = (customMessages && customMessages.length) ?
        customMessages.map(m => typeof m === 'string' ? { main: m, sub: "Processing..." } : m) :
        defaultMessages;

    let messageIndex = 0;

    const updateMessage = () => {
        const msg = messages[messageIndex % messages.length];
        if (status) status.textContent = msg.main;
        if (subtext) subtext.textContent = msg.sub;
        messageIndex++;
    };

    updateMessage();
    loadingInterval = setInterval(updateMessage, 1800);

    // Return the "Complete" trigger
    return async function complete() {
        if (loadingInterval) {
            clearInterval(loadingInterval);
            loadingInterval = null;
        }
        if (status) status.textContent = 'FINALIZING...';
        if (subtext) subtext.textContent = 'COMPILING PROTOCOLS';

        await new Promise(resolve => setTimeout(resolve, 800));
        if (overlay) overlay.classList.add('hidden');
    };
}

async function showBlueprint() {
    const analysisScreen = document.getElementById('analysisScreen');
    if (analysisScreen) analysisScreen.classList.add('hidden');

    const finishLoading = startLoadingAnimation([
        { main: "Architecting database schema...", sub: "Building SQL definitions" },
        { main: "Selecting optimal tech stack...", sub: "Comparing library performance" },
        { main: "Designing API endpoints...", sub: "Mapping REST interfaces" },
        { main: "Configuring serverless functions...", sub: "Optimizing cold starts" },
        { main: "Dockerizing container specs...", sub: "Layering image assets" }
    ]);

    const processingText = document.getElementById('processingText');
    if (processingText) processingText.textContent = 'Generating technical blueprint...';

    try {
        const response = await fetch('/api/blueprint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idea: lastAnalyzedIdea })
        });

        await finishLoading();

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Blueprint failed');
        currentBlueprint = data;
        displayBlueprint(data);
    } catch (error) {
        console.error('Error:', error);
        alert(`Failed to generate blueprint: ${error.message}`);
        const overlay = document.getElementById('processingOverlay');
        if (overlay) overlay.classList.add('hidden');
        if (loadingInterval) clearInterval(loadingInterval);
        const analysisScreen = document.getElementById('analysisScreen');
        if (analysisScreen) analysisScreen.classList.remove('hidden');
    }
}

async function showUserFlow() {
    const blueprintScreen = document.getElementById('blueprintScreen');
    if (blueprintScreen) blueprintScreen.classList.add('hidden');

    const finishLoading = startLoadingAnimation([
        { main: "Mapping user journey...", sub: "Visualizing touchpoints" },
        { main: "Identifying pain points...", sub: "Running friction analysis" },
        { main: "Optimizing conversion funnel...", sub: "Smoothing entry points" },
        { main: "Designing edge case states...", sub: "Building error resilience" },
        { main: "Polishing interactions...", sub: "Adding kinetic feedback" }
    ]);

    try {
        const response = await fetch('/api/flow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idea: lastAnalyzedIdea })
        });

        await finishLoading();

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Flow generation failed');
        currentFlow = data;
        displayUserFlow(data);
    } catch (error) {
        console.error('Error:', error);
        alert(`Failed to generate user flow: ${error.message}`);
        const overlay = document.getElementById('processingOverlay');
        if (overlay) overlay.classList.add('hidden');
        if (loadingInterval) clearInterval(loadingInterval);
        const blueprintScreen = document.getElementById('blueprintScreen');
        if (blueprintScreen) blueprintScreen.classList.remove('hidden');
    }
}



document.addEventListener('DOMContentLoaded', () => {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const input = document.getElementById('userInput');

    // Override Analyze Button
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', (e) => {
            // KINETIC EFFECTS
            triggerHaptic('heavy');

            // Create particles centered on button
            const rect = analyzeBtn.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            // Ensure createParticleBurst is available or fail gracefully
            if (typeof createParticleBurst === 'function') {
                createParticleBurst(centerX, centerY);
            }

            analyzeIdea();
        });
    }


});

async function showRoadmap() {
    const flowScreen = document.getElementById('flowScreen');
    if (flowScreen) flowScreen.classList.add('hidden');

    const finishLoading = startLoadingAnimation([
        { main: "Breaking down tasks...", sub: "Creating atomic units" },
        { main: "Estimating efforts...", sub: "Calculating story points" },
        { main: "Assigning priority levels...", sub: "Mapping critical path" },
        { main: "Scheduling sprints...", sub: "Organizing time blocks" },
        { main: "Calculating velocity...", sub: "Estimating burn rate" }
    ]);

    try {
        const response = await fetch('/api/roadmap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idea: lastAnalyzedIdea })
        });

        await finishLoading();

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Roadmap generation failed on server');

        currentRoadmap = data;
        displayRoadmap(data);
    } catch (error) {
        console.error('Roadmap Error:', error);
        alert(`Roadmap Error: ${error.message}`);
        const overlay = document.getElementById('processingOverlay');
        if (overlay) overlay.classList.add('hidden');
        if (loadingInterval) {
            clearInterval(loadingInterval);
            loadingInterval = null;
        }
        const flowScreen = document.getElementById('flowScreen');
        if (flowScreen) flowScreen.classList.remove('hidden');
    }
}

function displayAnalysis(analysis) {
    const overlay = document.getElementById('processingOverlay');
    if (overlay) overlay.classList.add('hidden');
    const analysisScreen = document.getElementById('analysisScreen');
    if (analysisScreen) analysisScreen.classList.remove('hidden');
    updateNavButtons('analysis');
    triggerHaptic('success');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const scoreEl = document.getElementById('overallScore');
    scoreEl.textContent = analysis.overall_score;
    scoreEl.style.color = getScoreColor(analysis.overall_score);
    scoreEl.style.textShadow = `0 0 30px ${getScoreColor(analysis.overall_score)}`;

    const verdictEl = document.getElementById('verdict');
    verdictEl.textContent = analysis.verdict;
    verdictEl.style.background = getVerdictColor(analysis.verdict);
    verdictEl.style.color = 'var(--bg-void)';

    const grid = document.getElementById('pillarsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    // Dynamically render pillars from AI
    analysis.pillars.forEach(pillar => {
        const card = document.createElement('div');
        card.className = 'pillar-card'; // Removed fade-in, handled by GSAP
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <span style="font-size: 1.5rem;">${pillar.icon || '📍'}</span>
                    <span style="font-size: 0.875rem; font-weight: 600; text-transform: capitalize;">${pillar.name}</span>
                </div>
                <span style="font-size: 2rem; font-weight: 700; color: ${getScoreColor(pillar.score)}; font-family: 'Space Mono', monospace;">${pillar.score}</span>
            </div>
            <div class="progress-bar"><div class="progress-fill" style="width: ${pillar.score}%; background: ${getScoreColor(pillar.score)}; box-shadow: 0 0 10px ${getScoreColor(pillar.score)};"></div></div>
            <p class="pillar-reasoning" style="font-size: 0.8125rem; color: var(--text-secondary); line-height: 1.6;"></p>
        `;
        grid.appendChild(card);
        const reasoningEl = card.querySelector('.pillar-reasoning');
        typeWriter(reasoningEl, pillar.reasoning);
    });

    // SENSORY REVEAL (GSAP Stagger)
    if (window.gsap) {
        gsap.from("#pillarsGrid .pillar-card", {
            y: 50,
            opacity: 0,
            duration: 0.8,
            stagger: 0.2,
            ease: "power3.out",
            onStart: () => triggerHaptic('light')
        });
    }

    // Display search insights if available
    if (analysis.search_insights && analysis.search_insights.length > 0) {
        const insightsDiv = document.createElement('div');
        insightsDiv.className = 'fade-in';
        insightsDiv.style.cssText = 'margin-top: 2rem; padding: 1.5rem; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-left: 3px solid var(--accent-cyan); border-radius: 4px; grid-column: 1 / -1;';
        insightsDiv.innerHTML = `
            <div style="color: var(--accent-cyan); font-size: 0.75rem; text-transform: uppercase; margin-bottom: 1rem; font-weight: 600;">🔍 Grounded Search Insights</div>
            <ul style="list-style: none; padding: 0; margin-bottom: 1.5rem;">
                ${analysis.search_insights.map(s => `<li style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: 0.5rem; display: flex; gap: 0.5rem;"><span style="color: var(--accent-cyan);">•</span>${s}</li>`).join('')}
            </ul>
        `;

        // NEW: Display Source Bubbles
        if (analysis.sources && analysis.sources.length > 0) {
            const sourcesContainer = document.createElement('div');
            sourcesContainer.className = 'sources-container';
            sourcesContainer.innerHTML = `<div class="sources-label">Research Sources:</div>`;

            analysis.sources.forEach(src => {
                const bubble = document.createElement('a');
                bubble.href = src.url;
                bubble.target = '_blank';
                bubble.className = `source-bubble source-type-${src.type}`;
                bubble.setAttribute('data-tooltip', src.name);

                let icon = '🔗';
                if (src.type === 'reddit') icon = '';
                else if (src.type === 'x') icon = '𝕏';
                else if (src.type === 'wikipedia') icon = '';
                else if (src.type === 'ideabrowser') icon = '💡';

                bubble.innerHTML = `<span style="font-family: 'Font Awesome 6 Brands', 'Space Mono', sans-serif;">${icon}</span>`;
                sourcesContainer.appendChild(bubble);
            });
            insightsDiv.appendChild(sourcesContainer);
        }

        grid.appendChild(insightsDiv);
    }
    saveState();
}

function displayBlueprint(blueprint) {
    const overlay = document.getElementById('processingOverlay');
    if (overlay) overlay.classList.add('hidden');
    const blueprintScreen = document.getElementById('blueprintScreen');
    if (blueprintScreen) blueprintScreen.classList.remove('hidden');
    updateNavButtons('blueprint');
    triggerHaptic('success');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const techGrid = document.getElementById('techStackGrid');
    if (!techGrid) return;
    techGrid.innerHTML = '';

    ['frontend', 'backend', 'database', 'infrastructure'].forEach(section => {
        const data = blueprint.tech_stack[section];
        const card = document.createElement('div');
        card.className = 'fade-in';
        card.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <div style="color: var(--accent-cyan); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">${section}</div>
                ${Object.entries(data).filter(([key]) => key !== 'reasoning').map(([key, value]) => `
                    <div style="margin-bottom: 0.5rem;">
                        <span style="color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase;">${key}:</span>
                        <div style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem;">${value}</div>
                    </div>
                `).join('')}
            </div>
        <div style="padding-top: 1rem; border-top: 1px solid var(--border-subtle);">
            <div style="color: var(--text-muted); font-size: 0.75rem; margin-bottom: 0.5rem;">WHY?</div>
            <div style="color: var(--text-secondary); font-size: 0.8125rem; line-height: 1.6;">${data.reasoning}</div>
        </div>
    `;
        techGrid.appendChild(card);
    });

    const pricingDiv = document.getElementById('pricingTiers');
    if (!pricingDiv) return;
    pricingDiv.innerHTML = '';

    // Display dynamic pricing tiers
    blueprint.pricing.tiers.forEach((tier, index) => {
        const card = document.createElement('div');
        card.className = 'fade-in';
        card.style.cssText = `background: var(--bg-elevated); border: ${tier.price.toString().includes('0') ? '1px solid var(--border-subtle)' : '2px solid var(--accent-cyan)'}; border-radius: 8px; padding: 1.5rem; transition: all 0.3s;`;
        card.innerHTML = `
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <div style="font-size: 0.875rem; font-weight: 600; color: var(--text-primary); text-transform: uppercase; margin-bottom: 0.5rem;">${tier.name}</div>
                <div style="font-size: 2.5rem; font-weight: 700; color: var(--accent-cyan); font-family: 'Space Mono', monospace;">${tier.price}</div>
            </div>
            <ul style="list-style: none; padding: 0; margin-bottom: 1.5rem; min-height: 100px;">
                ${tier.features?.map(f => `<li style="padding: 0.4rem 0; color: var(--text-secondary); font-size: 0.8125rem; display: flex; gap: 0.5rem;"><span style="color: var(--accent-cyan);">✓</span><span>${f}</span></li>`).join('') || ''}
            </ul>
            <div style="font-size: 0.75rem; color: var(--text-muted); padding-top: 1rem; border-top: 1px solid var(--border-subtle);">${tier.limits || ''}</div>
    `;
        pricingDiv.appendChild(card);
    });

    const metaDiv = document.getElementById('pricingMeta');
    if (metaDiv) {
        metaDiv.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
            ${blueprint.pricing.business_meta.map(m => `
                    <div>
                        <div style="color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; margin-bottom: 0.5rem;">${m.label}</div>
                        <div style="color: var(--text-secondary); font-size: 0.9375rem;">${m.value}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    const mvpList = document.getElementById('mvpScope');
    if (mvpList) {
        mvpList.innerHTML = '';
        blueprint.mvp_scope.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'fade-in';
            li.style.cssText = 'padding: 0.75rem 0; display: flex; gap: 1rem; align-items: start;';
            li.innerHTML = `
                <span style="color: var(--accent-purple); font-weight: 700; font-family: 'Space Mono', monospace; min-width: 2rem;">${(index + 1).toString().padStart(2, '0')}</span>
                <span style="color: var(--text-secondary); font-size: 0.875rem; line-height: 1.6;">${item}</span>
            `;
            mvpList.appendChild(li);
        });
    }
    saveState();
}

function showExport() {
    console.log("--- SHOW EXPORT CALLED ---");
    try {
        const roadmap = document.getElementById('roadmapScreen');
        const exportScr = document.getElementById('exportScreen');

        if (!roadmap || !exportScr) {
            console.error("Missing screen elements:", { roadmap, exportScr });
            return;
        }

        roadmap.classList.add('hidden');
        exportScr.classList.remove('hidden');
        updateNavButtons('export');
        triggerHaptic('success');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        const promptContent = document.getElementById('goldenPromptContent');
        if (!promptContent) {
            console.error("Missing goldenPromptContent element");
            return;
        }

        const memoryBankMarkdown = generateMemoryBankMarkdown();
        const goldenPrompt = generateGoldenPrompt(memoryBankMarkdown);

        promptContent.textContent = goldenPrompt;
        console.log("Export screen content populated");
    } catch (e) {
        console.error("Error in showExport:", e);
    }
    saveState();
}

async function copyTechStack() {
    const techGrid = document.getElementById('techStackGrid');
    if (!techGrid) return;

    // Simple text extraction for tech stack
    const text = Array.from(techGrid.querySelectorAll('div')).map(el => el.innerText).join('\n');
    try {
        await navigator.clipboard.writeText(text);
        alert('Tech stack copied to clipboard!');
    } catch (err) {
        console.error('Failed to copy tech stack:', err);
    }
}

function generateGoldenPrompt(memoryBankText) {
    const idea = lastAnalyzedIdea;
    const tech = currentBlueprint?.tech_stack;
    const verdict = currentAnalysis?.verdict || "PROCEED";

    return `# 🚀 PROJECT CONTEXT FOR AI CODING AGENT

## 📜 VISION STATEMENT

${idea}

---

## 🎯 PROJECT OVERVIEW

**Verdict**: ${verdict}
**Core Tech**: ${tech?.frontend?.framework} / ${tech?.backend?.runtime}
**Architecture**: ${tech?.frontend?.styling}, ${tech?.backend?.auth}, ${tech?.database?.primary}

---

## 🤖 HOW TO USE THIS CONTEXT

1. I am attaching a file called \`project-memory.md\` which contains the complete technical blueprint, user flow, and development roadmap for this project.
2. **Action**: Please read \`project-memory.md\` thoroughly to understand the full context.
3. **Goal**: Let's start building the MVP based on the Phase 1 tasks defined in the Roadmap board within that file.

---

## 📦 MEMORY BANK (FULL CONTEXT)

${memoryBankText}`;
}

function generateMemoryBankMarkdown() {
    let md = `# 🧠 VIBE-PILOT MEMORY BANK: ${lastAnalyzedIdea}\n\n`;

    if (currentAnalysis) {
        md += `## 📊 FEASIBILITY ANALYSIS\n`;
        md += `**Overall Score**: ${currentAnalysis.overall_score}/100\n`;
        md += `**Verdict**: ${currentAnalysis.verdict}\n\n`;
        md += `### Pillars\n`;
        currentAnalysis.pillars.forEach(p => {
            md += `- **${p.name}** (${p.score}): ${p.reasoning}\n`;
        });
        md += `\n`;
    }

    if (currentBlueprint) {
        md += `## 🏗️ TECHNICAL BLUEPRINT\n\n`;
        md += `### Tech Stack\n`;
        Object.entries(currentBlueprint.tech_stack).forEach(([key, val]) => {
            md += `#### ${key.toUpperCase()}\n`;
            Object.entries(val).forEach(([k, v]) => {
                md += `- **${k}**: ${v}\n`;
            });
            md += `\n`;
        });

        md += `### Pricing Strategy\n`;
        md += `- **Model**: ${currentBlueprint.pricing.model_type}\n`;
        currentBlueprint.pricing.tiers.forEach(t => {
            md += `- **${t.name}** (${t.price}): ${t.features.join(', ')}\n`;
        });
        md += `\n`;

        md += `### MVP Scope\n`;
        currentBlueprint.mvp_scope.forEach(s => md += `- ${s}\n`);
        md += `\n`;
    }

    if (currentFlow) {
        md += `## 🗺️ USER FLOW\n`;
        md += `*${currentFlow.journey_narrative}*\n\n`;
        currentFlow.pages.forEach(p => {
            md += `### ${p.name} (${p.type})\n`;
            md += `- ${p.description}\n`;
            md += `- Elements: ${p.elements.join(', ')}\n\n`;
        });
    }

    if (currentRoadmap) {
        md += `## 🎯 DEVELOPMENT ROADMAP\n\n`;
        currentRoadmap.columns.forEach(col => {
            md += `### Phase: ${col.name}\n`;
            col.tasks.forEach(t => {
                md += `- [ ] **${t.title}** (${t.priority}) - ${t.estimate}\n  *${t.description}*\n`;
            });
            md += `\n`;
        });
    }

    return md;
}

async function copyToClipboard(elementId) {
    const text = document.getElementById(elementId).textContent;
    try {
        await navigator.clipboard.writeText(text);
        const btn = document.querySelector('.btn-copy');
        if (btn) {
            const originalText = btn.textContent;
            btn.textContent = '✅ COPIED!';
            setTimeout(() => btn.textContent = originalText, 2000);
        }
    } catch (err) {
        console.error('Failed to copy:', err);
    }
}

function downloadMemoryBank() {
    const content = generateMemoryBankMarkdown();
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project-memory.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function displayUserFlow(flow) {
    const overlay = document.getElementById('processingOverlay');
    if (overlay) overlay.classList.add('hidden');
    const flowScreen = document.getElementById('flowScreen');
    if (flowScreen) flowScreen.classList.remove('hidden');
    updateNavButtons('flow');
    triggerHaptic('success');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    document.getElementById('journeyNarrative').textContent = flow.journey_narrative;

    const canvas = document.getElementById('flowCanvas');
    if (!canvas) return;
    canvas.innerHTML = '';

    // Simple vertical layout for pages
    flow.pages.forEach((page, index) => {
        const node = document.createElement('div');
        node.className = 'fade-in';
        node.style.cssText = `position: relative; display: block; margin: 0 auto 3rem; width: 300px; background: var(--bg-elevated); border: 2px solid ${page.type === 'auth' ? 'var(--accent-purple)' : page.type === 'private' ? 'var(--accent-pink)' : 'var(--accent-cyan)'}; border-radius: 8px; padding: 1.5rem; text-align: left;`;
        node.innerHTML = `
            <div style="font-size: 0.6875rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.5rem;">${page.type}</div>
            <div style="font-size: 1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem;">${page.name}</div>
            <p style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: 1rem;">${page.description}</p>
            <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
                ${page.elements?.map(e => `<span style="font-size: 0.6875rem; background: var(--bg-surface); padding: 0.2rem 0.6rem; border-radius: 2px; color: var(--text-muted); border: 1px solid var(--border-subtle);">${e}</span>`).join('') || ''}
            </div>
        `;
        canvas.appendChild(node);

        if (index < flow.pages.length - 1) {
            const arrow = document.createElement('div');
            arrow.style.cssText = 'width: 2px; height: 3rem; background: var(--accent-cyan); margin: -3rem auto 0; opacity: 0.3;';
            canvas.appendChild(arrow);
        }
    });
    saveState();
}

function displayRoadmap(Roadmap) {
    if (!Roadmap || !Roadmap.columns || !Array.isArray(Roadmap.columns)) {
        console.error('Invalid Roadmap data:', Roadmap);
        alert("AI returned an invalid roadmap structure. Please try again.");
        return;
    }

    const overlay = document.getElementById('processingOverlay');
    if (overlay) overlay.classList.add('hidden');

    const roadmapScreen = document.getElementById('roadmapScreen');
    if (roadmapScreen) {
        roadmapScreen.classList.remove('hidden');
        updateNavButtons('roadmap');
    }
    triggerHaptic('success');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const totalTasks = Roadmap.columns.reduce((acc, col) => acc + (col.tasks ? col.tasks.length : 0), 0);
    const totalTasksEl = document.getElementById('totalTasks');
    if (totalTasksEl) totalTasksEl.textContent = totalTasks;

    // Reset columns
    const columnsContainer = document.getElementById('roadmapColumns');
    if (!columnsContainer) {
        console.warn('Roadmap columns container not found');
        return;
    }
    columnsContainer.innerHTML = ''; // Clear all columns

    Roadmap.columns.forEach(col => {
        const colDiv = document.createElement('div');
        colDiv.style.cssText = 'background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 1.5rem;';
        colDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-subtle);">
                <div style="width: 8px; height: 8px; background: var(--accent-cyan); border-radius: 50%;"></div>
                <span style="font-size: 0.875rem; font-weight: 600; color: var(--text-primary); text-transform: uppercase;">${col.name}</span>
                <span style="margin-left: auto; font-size: 0.75rem; color: var(--text-muted);">${col.tasks.length}</span>
            </div>
            <div class="tasks-container" style="display: flex; flex-direction: column; gap: 0.75rem; min-height: 200px;"></div>
        `;

        const tasksDiv = colDiv.querySelector('.tasks-container');
        col.tasks.forEach(task => {
            const card = document.createElement('div');
            card.className = 'fade-in';
            card.style.cssText = `background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-left: 3px solid ${task.priority === 'high' ? 'var(--accent-pink)' : 'var(--accent-cyan)'}; border-radius: 4px; padding: 1rem;`;
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                    <div style="font-size: 0.875rem; color: var(--text-primary); font-weight: 600;">${task.title}</div>
                    <span style="font-size: 0.6rem; text-transform: uppercase; color: var(--text-muted);">${task.estimate || ''}</span>
                </div>
                <p style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.4;">${task.description}</p>
            `;
            tasksDiv.appendChild(card);
        });

        columnsContainer.appendChild(colDiv);
    });
    saveState();
}

function getScoreColor(score) { return score >= 75 ? 'var(--accent-cyan)' : (score >= 50 ? 'var(--accent-purple)' : 'var(--accent-pink)'); }
function getVerdictColor(verdict) { return verdict === 'BUILD IT' ? 'var(--accent-cyan)' : (verdict === 'PROCEED WITH CAUTION' ? 'var(--accent-purple)' : 'var(--accent-pink)'); }

function updateNavButtons(screen) {
    const backBtn = document.getElementById('backBtn'), homeBtn = document.getElementById('homeBtn');
    if (!backBtn || !homeBtn) return;
    if (screen === 'input') { backBtn.style.display = 'none'; homeBtn.style.display = 'none'; }
    else { backBtn.style.display = (['blueprint', 'flow', 'roadmap', 'export'].includes(screen)) ? 'inline-block' : 'none'; homeBtn.style.display = 'inline-block'; }

    // Show/hide homepage sections based on current screen
    const homepageSections = document.querySelectorAll('.homepage-section, .site-footer');
    homepageSections.forEach(section => {
        section.style.display = (screen === 'input') ? '' : 'none';
    });
}

function goBack() {
    const screens = ['exportScreen', 'roadmapScreen', 'flowScreen', 'blueprintScreen', 'analysisScreen'];

    // special case: if on analysis screen, go home
    const analysisScreen = document.getElementById('analysisScreen');
    if (analysisScreen && !analysisScreen.classList.contains('hidden')) {
        goHome();
        return;
    }

    for (let i = 0; i < screens.length - 1; i++) {
        const el = document.getElementById(screens[i]);
        if (el && !el.classList.contains('hidden')) {
            el.classList.add('hidden');
            const prevScreenId = screens[i + 1];
            document.getElementById(prevScreenId)?.classList.remove('hidden');
            updateNavButtons(prevScreenId.replace('Screen', ''));
            triggerHaptic('light');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
    }
}

function goHome() {
    // Stop any in-progress loading animation
    if (loadingInterval) { clearInterval(loadingInterval); loadingInterval = null; }

    ['analysisScreen', 'blueprintScreen', 'flowScreen', 'roadmapScreen', 'exportScreen', 'processingOverlay'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    document.getElementById('welcomeScreen')?.classList.remove('hidden');

    // Reset analyze button state
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) { analyzeBtn.disabled = false; analyzeBtn.innerText = 'Analyze'; }

    const userInput = document.getElementById('userInput');
    if (userInput) { userInput.value = ''; userInput.style.height = 'auto'; }
    updateNavButtons('input');
    triggerHaptic('light');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    saveState();
}

async function typeWriter(element, text, speed = 15) {
    element.textContent = '';
    for (let i = 0; i < text.length; i++) {
        element.textContent += text.charAt(i);
        if (i % 3 === 0) await new Promise(resolve => setTimeout(resolve, speed));
    }
}

// Persistence Logic
function saveState() {
    const activeScreen = ['analysisScreen', 'blueprintScreen', 'flowScreen', 'roadmapScreen', 'exportScreen']
        .find(id => {
            const el = document.getElementById(id);
            return el && !el.classList.contains('hidden');
        });

    const state = {
        currentAnalysis,
        currentBlueprint,
        currentFlow,
        currentRoadmap,
        lastAnalyzedIdea,
        currentView: activeScreen || 'welcomeScreen'
    };
    localStorage.setItem('vibePilotState', JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem('vibePilotState');
    if (!saved) return;
    try {
        const state = JSON.parse(saved);
        // Only restore data, NOT the view - always start on homepage
        lastAnalyzedIdea = state.lastAnalyzedIdea || "";
        currentAnalysis = state.currentAnalysis;
        currentBlueprint = state.currentBlueprint;
        currentFlow = state.currentFlow;
        currentRoadmap = state.currentRoadmap;
        // Don't restore view - user always starts at homepage
    } catch (e) {
        console.error("Failed to load state", e);
    }
}

// ===== LIVE TICKER =====
function initLiveTicker() {
    const tickerText = document.getElementById('tickerText');
    if (!tickerText) return;

    const messages = [
        "LIVE: NEURAL GRID ACTIVE",
        "JUST VALIDATED: 'AI PLANT WHISPERER' (94%)",
        "TRENDING: 'HYPER-LOCAL DATING' (88%)",
        "AGENT 042: OPTIMIZING DATABASE SHARDS",
        "JUST VALIDATED: 'VR MEDITATION PODS' (91%)"
    ];

    let index = 0;
    setInterval(() => {
        index = (index + 1) % messages.length;
        tickerText.style.opacity = 0;
        setTimeout(() => {
            tickerText.textContent = messages[index];
            tickerText.style.opacity = 1;
        }, 300);
    }, 4000);
}

window.addEventListener('load', () => {
    window.scrollTo(0, 0); // Always start at top
    initMatrixRain();
    loadSavedIdeas();
    loadState();
    initLiveTicker();
});


// ===== KINETIC FX =====
function createParticleBurst(x, y) {
    const particleCount = 30;
    const colors = ['var(--accent-cyan)', '#ffffff', 'var(--accent-purple)'];

    for (let i = 0; i < particleCount; i++) {
        const shard = document.createElement('div');
        shard.className = 'particle-shard';
        shard.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

        // Random initial position offset
        const xOffset = (Math.random() - 0.5) * 20;
        const yOffset = (Math.random() - 0.5) * 20;

        shard.style.left = `${x + xOffset}px`;
        shard.style.top = `${y + yOffset}px`;

        // Random rotation
        shard.style.transform = `rotate(${Math.random() * 360}deg)`;

        document.body.appendChild(shard);

        // Physics animation with GSAP
        const angle = Math.random() * Math.PI * 2;
        const velocity = 50 + Math.random() * 150;
        const duration = 0.5 + Math.random() * 0.5;

        gsap.to(shard, {
            x: Math.cos(angle) * velocity,
            y: Math.sin(angle) * velocity,
            opacity: 0,
            rotation: Math.random() * 720,
            scale: 0,
            duration: duration,
            ease: "power2.out",
            onComplete: () => shard.remove()
        });
    }
}

// Updated Trigger with distinct patterns
function triggerHaptic(type = 'light') {
    if (!navigator.vibrate) return;

    switch (type) {
        case 'heavy':
            navigator.vibrate([50]); // Thump
            break;
        case 'success':
            navigator.vibrate([30, 50, 30]);
            break;
        case 'light':
        default:
            navigator.vibrate(10);
    }
}



// Global Haptic Listener for all interactive elements
document.addEventListener('click', (e) => {
    // Check if clicked element is interactive
    // expanded selector to include more UI elements
    const target = e.target.closest('button, a, .interactive, .sidebar-item, .feature-card, .platform-logo, input, textarea, .pillar-card, .example-card');

    if (target) {
        // Don't trigger light haptic if it's the analyze button (handled separately with heavy haptic)
        if (target.id !== 'analyzeBtn') {
            triggerHaptic('light');
        }
    }
});

