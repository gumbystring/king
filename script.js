// --- Dark Mode Logic ---
const themeToggleBtn = document.getElementById('themeToggle');
const htmlEl = document.documentElement;

const savedTheme = localStorage.getItem('theme');
const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    htmlEl.setAttribute('data-theme', 'dark');
    themeToggleBtn.textContent = '☀️';
}

themeToggleBtn.onclick = () => {
    const currentTheme = htmlEl.getAttribute('data-theme');
    if (currentTheme === 'dark') {
        htmlEl.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        themeToggleBtn.textContent = '🌙';
    } else {
        htmlEl.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        themeToggleBtn.textContent = '☀️';
    }
};

// --- Game definition ---
const HEART = '♥️';
const QUEEN = '👑';
const JACK = '🃏';
const PLUS = '➕';
const PASS = '❌';

const ROUNDS = [
    { type: 'king', title: 'King', icon: HEART, penalty: -40 },
    { type: 'king', title: 'King', icon: HEART, penalty: -40 },
    { type: 'king', title: 'King', icon: HEART, penalty: -40 },
    { type: 'multi', title: 'Queen', icon: QUEEN, penaltyPer: -10, total: 4 },
    { type: 'multi', title: 'Queen', icon: QUEEN, penaltyPer: -10, total: 4 },
    { type: 'multi', title: 'Queen', icon: QUEEN, penaltyPer: -10, total: 4 },
    { type: 'multi', title: 'Jack', icon: JACK, penaltyPer: -10, total: 4 },
    { type: 'multi', title: 'Jack', icon: JACK, penaltyPer: -10, total: 4 },
    { type: 'multi', title: 'Jack', icon: JACK, penaltyPer: -10, total: 4 },
    { type: 'multi', title: 'Hearts', icon: HEART, penaltyPer: -5, total: 8 },
    { type: 'multi', title: 'Hearts', icon: HEART, penaltyPer: -5, total: 8 },
    { type: 'multi', title: 'Hearts', icon: HEART, penaltyPer: -5, total: 8 },
    { type: 'multi', title: 'Pass', icon: PASS, penaltyPer: -4, total: 10 },
    { type: 'multi', title: 'Pass', icon: PASS, penaltyPer: -4, total: 10 },
    { type: 'multi', title: 'Pass', icon: PASS, penaltyPer: -4, total: 10 },
    { type: 'multi', title: 'Last', icon: '2', penaltyPer: -20, total: 2 },
    { type: 'multi', title: 'Last', icon: '2', penaltyPer: -20, total: 2 },
    { type: 'multi', title: 'Last', icon: '2', penaltyPer: -20, total: 2 },
    { type: 'multi', title: 'Plus', icon: PLUS, penaltyPer: +8, total: 10 },
    { type: 'multi', title: 'Plus', icon: PLUS, penaltyPer: +8, total: 10 },
    { type: 'multi', title: 'Plus', icon: PLUS, penaltyPer: +8, total: 10 },
    { type: 'multi', title: 'Plus', icon: PLUS, penaltyPer: +8, total: 10 },
    { type: 'multi', title: 'Plus', icon: PLUS, penaltyPer: +8, total: 10 },
    { type: 'multi', title: 'Plus', icon: PLUS, penaltyPer: +8, total: 10 },
    { type: 'multi', title: 'Plus', icon: PLUS, penaltyPer: +8, total: 10 },
    { type: 'multi', title: 'Plus', icon: PLUS, penaltyPer: +8, total: 10 },
    { type: 'multi', title: 'Plus', icon: PLUS, penaltyPer: +8, total: 10 },
];

// --- State ---
let players = ['Player A', 'Player B', 'Player C'];
let totals = [0, 0, 0];
let currentRound = 0;
let multiCounts = {};
let multiChosen = {};
let whoIndex = 0;
let history = [];
let restoring = false;

// --- DOM helpers ---
const $ = sel => document.querySelector(sel);
const el = (tag, opts = {}) => Object.assign(document.createElement(tag), opts);

// --- Elements ---
const subtitle = $('#subtitle');
const backBtn = $('#backBtn');
const setupCard = $('#setupCard');
const gameArea = $('#gameArea');
const thP1 = $('#thP1'), thP2 = $('#thP2'), thP3 = $('#thP3');
const tbody = $('#tbody');
const tot1 = $('#tot1'), tot2 = $('#tot2'), tot3 = $('#tot3');
const question = $('#question');
const buttonsRow = $('#buttonsRow');
const instruction = $('#instruction');
const status = $('#status');
const finishActions = $('#finishActions');
const startBtn = $('#startBtn');
const setupError = $('#setupError');
const modal = $('#modal');
const noQuit = $('#noQuit');
const yesQuit = $('#yesQuit');

// History Elements
const historyModal = $('#historyModal');
const historyBtn = $('#historyBtn');
const closeHistoryBtn = $('#closeHistoryBtn');
const clearHistoryBtn = $('#clearHistoryBtn');
const historyList = $('#historyList');

backBtn.style.display = 'none';

// --- Modals logic ---
backBtn.onclick = () => modal.classList.add('open');
noQuit.onclick = () => modal.classList.remove('open');
yesQuit.onclick = () => { modal.classList.remove('open'); goHome(); };

if (historyBtn) {
    historyBtn.onclick = () => {
        loadHistoryUI();
        historyModal.classList.add('open');
    };
}
if (closeHistoryBtn) {
    closeHistoryBtn.onclick = () => historyModal.classList.remove('open');
}
if (clearHistoryBtn) {
    clearHistoryBtn.onclick = () => {
        if (confirm("ნამდვილად გსურთ ისტორიის წაშლა?")) {
            localStorage.removeItem('kingGameHistory');
            loadHistoryUI();
        }
    };
}

// --- History Functions ---
function saveGameResult() {
    const existingHistory = JSON.parse(localStorage.getItem('kingGameHistory') || '[]');
    const gameRecord = {
        date: new Date().toLocaleString('ka-GE'),
        players: [...players],
        scores: [...totals]
    };
    existingHistory.unshift(gameRecord);
    localStorage.setItem('kingGameHistory', JSON.stringify(existingHistory));
}

function loadHistoryUI() {
    const historyData = JSON.parse(localStorage.getItem('kingGameHistory') || '[]');
    historyList.innerHTML = '';

    if (historyData.length === 0) {
        historyList.innerHTML = '<div class="muted" style="text-align:center; padding: 20px;">ისტორია ცარიელია</div>';
        return;
    }

    historyData.forEach(game => {
        const item = el('div', { className: 'card', style: 'padding: 12px; background: var(--bg); box-shadow: none; border: 1px solid var(--border);' });
        let scoresHtml = '';
        for (let i = 0; i < 3; i++) {
            scoresHtml += `<div class="row" style="justify-content: space-between;">
                <span>${game.players[i]}</span>
                <strong>${game.scores[i]}</strong>
            </div>`;
        }
        item.innerHTML = `
            <div class="muted" style="font-size: 12px; margin-bottom: 8px;">🕒 ${game.date}</div>
            <div class="col" style="gap: 4px;">${scoresHtml}</div>
        `;
        historyList.appendChild(item);
    });
}

// --- Start game ---
startBtn.onclick = () => {
    const p1 = $('#p1').value.trim();
    const p2 = $('#p2').value.trim();
    const p3 = $('#p3').value.trim();
    if (!p1 || !p2 || !p3) { setupError.textContent = 'თამაშის დასაწყებად აუცილებელია მოთამაშეების სახელების შევსება'; return; }
    const uniq = new Set([p1.toLowerCase(), p2.toLowerCase(), p3.toLowerCase()]);
    if (uniq.size !== 3) { setupError.textContent = 'სახელები უნდა განხავედებოდეს.'; return; }
    setupError.textContent = '';
    players = [p1, p2, p3];
    startGame();
};

function renderFinishActionsInCard() {
    if (!finishActions) return;
    finishActions.innerHTML = `
      <button id="startAgainBtn" class="btn secondary">თავიდან დაწყება</button>
      <button id="homeBtn" class="btn">მთავარი</button>
    `;
    const startAgainBtn = document.getElementById('startAgainBtn');
    const homeBtn = document.getElementById('homeBtn');
    if (startAgainBtn) startAgainBtn.onclick = startGame;
    if (homeBtn) homeBtn.onclick = goHome;
}

function goHome() {
    setupCard.style.display = '';
    gameArea.style.display = 'none';
    subtitle.textContent = 'თამაშის დასაწყებად ჩაწერეთ სახელები';
    backBtn.style.display = 'none';
}

function startGame() {
    totals = [0, 0, 0]; currentRound = 0; multiCounts = {}; multiChosen = {}; whoIndex = 0;
    history = [];
    updateUndoEnabled();

    setupCard.style.display = 'none';
    gameArea.style.display = '';
    backBtn.style.display = 'inline-block';
    renderInGameFooterActions();

    subtitle.textContent = '';
    thP1.textContent = players[0];
    thP2.textContent = players[1];
    thP3.textContent = players[2];

    tbody.innerHTML = '';
    ROUNDS.forEach((rd, idx) => {
        const tr = el('tr');
        tr.appendChild(el('th', { textContent: String(idx + 1) }));
        for (let i = 0; i < 3; i++) tr.appendChild(el('td', { id: `cell-${idx}-${i}` }));
        tr.appendChild(el('td', { textContent: `${rd.title} ${rd.icon}` }));
        tbody.appendChild(tr);
    });
    updateTotals();
    startRound();
}

function updateTotals() {
    tot1.textContent = totals[0];
    tot2.textContent = totals[1];
    tot3.textContent = totals[2];
}

function setCell(r, c, text) {
    const cell = document.getElementById(`cell-${r}-${c}`);
    if (cell) cell.textContent = text;
}

function updateRoundInstruction() {
    const rd = ROUNDS[currentRound];
    if (!rd) { instruction.textContent = ''; return; }

    // Your exact Georgian rules
    let customText = "";
    switch(rd.title) {
        case "King":
            customText = `KING ♥️-ის წაყვანის შემთხვევაში მოთამაშეს დაეწერება -40 ქულა.`;
            break;
        case "Queen":
            customText = `თითო წაყვანილ Queen ♛-ზე მოთამაშეს დაეწერება -10 ქულა.`;
            break;
        case "Jack":
            customText = `თითო წაყვანილ Jack 🂫-ზე მოთამაშეს დაეწერება -10 ქულა.`;
            break;
        case "Hearts":
            customText = `თითო წაყვანილ გულზე ♥️ მოთამაშეს დაეწერება -5 ქულა.`;
            break;
        case "Pass":
            customText = `ნებისმიერ წაყვანილ კარტზე მოთამაშეს დაეწერება -4 ქულა.`;
            break;
        case "Last":
            customText = `მოთამაშემ უნდა ეცადოს, რომ არ წაიყვანოს ბოლო 2 კარტი, ბოლო 2-დან წაღებულზე დაიწერება -20 ქულა.`;
            break;
        case "Plus":
            customText = `თითო წაყვანილ კარტზე მოთამაშეს ეწერება +8 ქულა.`;
            break;
        default:
            customText = `${rd.title} რაუნდი.`;
    }

    // Tracker for multi rounds (styled nicely with flexbox margins)
    let remainingText = "";
    if (rd.type === 'multi') {
        const taken = Object.values(multiCounts).reduce((a, b) => a + b, 0);
        const total = rd.total ?? 0;
        const remaining = Math.max(0, total - taken);
        remainingText = `
            <div style="margin-top: 14px; display: inline-block; font-weight: 700; color: var(--primary); background: rgba(88, 204, 2, 0.1); padding: 6px 12px; border-radius: 8px;">
                დარჩა ${remaining} / ${total}
            </div>
        `;
    }

    // Print it cleanly to the screen
    instruction.innerHTML = `
        <div style="line-height: 1.5; font-size: 15px;">${customText}</div>
        ${remainingText}
    `;
}

function startRound() {
    Array.from(tbody.children).forEach((tr, idx) => {
        if (idx === currentRound) {
            tr.classList.add('current-row');
            tr.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            tr.classList.remove('current-row');
        }
    });

    // Clear highlight at the start of a round
    [thP1, thP2, thP3].forEach(th => th.classList.remove('active-player'));

    if (currentRound >= ROUNDS.length) {
        subtitle.textContent = 'Finished';

        saveGameResult(); 

        const maxScore = Math.max(...totals);
        const winners = players.filter((_, i) => totals[i] === maxScore);
        let winnerText;
        if (winners.length > 1) {
            winnerText = "🏆 გამარჯვებულები: " + winners.join(', ');
        } else {
            winnerText = "🥇 გამარჯვებული: " + winners[0];
        }
        question.textContent = winnerText;

        buttonsRow.innerHTML = '';
        status.textContent = `ქულები — ${players[0]}: ${totals[0]}, ${players[1]}: ${totals[1]}, ${players[2]}: ${totals[2]}`;

        const instructionCard = instruction ? instruction.closest('.card') : null;
        if (instructionCard) instructionCard.style.display = 'none';

        const footerHost = document.getElementById('footerActions');
        if (footerHost) footerHost.innerHTML = '';

        renderFinishActionsInCard();
        return;
    }

    const rd = ROUNDS[currentRound];
    subtitle.textContent = `რაუნდი ${currentRound + 1} • ${rd.title} ${rd.icon}`;
    status.textContent = '';
    buttonsRow.innerHTML = '';
    renderInGameFooterActions();

    const instructionCard = instruction ? instruction.closest('.card') : null;
    if (instructionCard) instructionCard.style.display = '';

    if (finishActions) finishActions.innerHTML = '';
    updateRoundInstruction();

    if (rd.type === 'king') {
        question.innerHTML = `რაუნდი ${currentRound + 1}<br>ვინ წაიღო ${rd.title} ${rd.icon}?`;
        players.forEach((p, idx) => {
            const b = el('button', { className: 'btn small', textContent: p });
            b.onclick = () => assignKingPenalty(idx);
            buttonsRow.appendChild(b);
        });
    } else {
        if (!restoring) {
            multiCounts = {};
            multiChosen = {};
            players.forEach(p => { multiCounts[p] = 0; multiChosen[p] = false; });
            whoIndex = 0;
        }
        askNextMulti();
        restoring = false;
    }
}

function assignKingPenalty(playerIdx) {
    pushSnapshot();
    const rd = ROUNDS[currentRound];
    totals[playerIdx] += rd.penalty; setCell(currentRound, playerIdx, String(rd.penalty));
    for (let i = 0; i < players.length; i++) {
        if (i !== playerIdx) {
            setCell(currentRound, i, '0');
        }
    }
    updateTotals();
    status.textContent = `${players[playerIdx]} takes the ${rd.title} ${rd.icon} (${rd.penalty}).`;
    currentRound++; startRound();
}

function askNextMulti() {
    // Highlight active player
    [thP1, thP2, thP3].forEach((th, i) => {
        if (i === whoIndex) th.classList.add('active-player');
        else th.classList.remove('active-player');
    });

    const rd = ROUNDS[currentRound];
    const totalRequired = rd.total ?? 4;
    const player = players[whoIndex];
    const takenSoFar = Object.values(multiCounts).reduce((a, b) => a + b, 0);
    const remaining = totalRequired - takenSoFar;

    if (remaining <= 0) { finalizeMulti(); return; }

    // Logic for auto-assigning the last player
    if (whoIndex === players.length - 1 && !restoring) {
        pushSnapshot();
        multiCounts[player] = remaining;
        multiChosen[player] = true;
        updateProvisionalMultiCells();
        updateRoundInstruction();
        status.textContent = `${player} - ავტომატურად დაეწერა ${remaining}.`;
        finalizeMulti(); 
        return;
    }

    // Dynamic UI Text
    question.innerHTML = `<span style="color: var(--muted); font-weight: 400;">რაუნდი ${currentRound + 1}</span><br>${player} - რამდენი წაიღო?`;
    
    updateRoundInstruction();
    buttonsRow.innerHTML = '';

    const cap = Math.min(10, remaining);

    // If it's the last player but we're in manual/restoring mode
    if (whoIndex === players.length - 1) {
        const b = el('button', { className: 'btn small', textContent: String(remaining) });
        b.style.gridColumn = "span 2"; // Make the final button bigger
        b.onclick = () => setMultiCount(player, remaining);
        buttonsRow.appendChild(b);
    } else {
        // Create score buttons 0 through X
        for (let n = 0; n <= cap; n++) {
            const b = el('button', { className: 'btn small', textContent: String(n) });
            b.onclick = () => setMultiCount(player, n);
            buttonsRow.appendChild(b);
        }
    }

    updateProvisionalMultiCells();
    updateRoundInstruction();

    // This creates a clean vertical stack for the round number and player name
question.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 4px;">
        <div style="color: var(--muted); font-size: 14px; font-weight: 400;">რაუნდი ${currentRound + 1}</div>
        <div style="font-size: 20px; font-weight: 800;">${player} - რამდენი წაიღო?</div>
    </div>
`;
}

    question.innerHTML = `რაუნდი ${currentRound + 1}<br>${rd.title} — რამდენი წაიყვანა ${player}?`;
    updateRoundInstruction();
    buttonsRow.innerHTML = '';

    const cap = Math.min(10, remaining);

    if (whoIndex === players.length - 1) {
        const b = el('button', { className: 'btn small', textContent: String(remaining) });
        b.onclick = () => setMultiCount(player, remaining);
        buttonsRow.appendChild(b);
    } else {
        for (let n = 0; n <= cap; n++) {
            const b = el('button', { className: 'btn small', textContent: String(n) });
            b.onclick = () => setMultiCount(player, n);
            buttonsRow.appendChild(b);
        }
    }

    updateProvisionalMultiCells();
    updateRoundInstruction();

function setMultiCount(player, count) {
    pushSnapshot();
    const rd = ROUNDS[currentRound];
    const totalRequired = rd.total ?? 4;
    const takenSoFar = Object.values(multiCounts).reduce((a, b) => a + b, 0);
    const remaining = totalRequired - takenSoFar;
    const safe = Math.max(0, Math.min(count, remaining));
    multiCounts[player] = safe;
    multiChosen[player] = true;
    updateRoundInstruction();
    updateProvisionalMultiCells();

    if (safe === totalRequired) {
        players.forEach(p => { if (p !== player) multiCounts[p] = 0; });
        finalizeMulti(); return;
    }

    const newTotal = Object.values(multiCounts).reduce((a, b) => a + b, 0);
    if (newTotal >= totalRequired) { finalizeMulti(); return; }

    whoIndex++; askNextMulti();
}

function finalizeMulti() {
    const rd = ROUNDS[currentRound];
    const totalRequired = rd.total ?? 4;
    const sum = Object.values(multiCounts).reduce((a, b) => a + b, 0);
    if (sum < totalRequired) {
        const lastIdx = Math.min(whoIndex, players.length - 1);
        multiCounts[players[lastIdx]] += (totalRequired - sum);
    }
    players.forEach((p, idx) => {
        const count = multiCounts[p] || 0;
        const delta = (rd.penaltyPer || 0) * count;
        totals[idx] += delta; setCell(currentRound, idx, String(delta));
    });
    updateTotals();
    const summary = players.map(p => `${p}:${multiCounts[p] || 0}`).join(', ');
    status.textContent = `${rd.title} taken — ${summary} (each ${rd.penaltyPer || 0}).`;
    multiChosen = {};
    currentRound++; startRound();
}

function updateProvisionalMultiCells() {
    const rd = ROUNDS[currentRound];
    if (!rd || rd.type !== 'multi') return;
    players.forEach((p, idx) => {
        const chosen = !!multiChosen[p];
        const count = multiCounts[p] || 0;
        if (chosen) {
            const delta = (rd.penaltyPer || 0) * count;
            setCell(currentRound, idx, String(delta));
        } else {
            setCell(currentRound, idx, '');
        }
    });
}

function updateUndoEnabled() {
    const btn = document.getElementById('undoBtn');
    if (btn) {
        btn.disabled = history.length === 0;
        btn.onclick = restoreSnapshot;
    }
}

function renderInGameFooterActions() {
    const host = document.getElementById('footerActions');
    if (!host) return;
    host.innerHTML = '<button id="undoBtn" class="btn secondary">ჩასწორება</button>';
    updateUndoEnabled();
}

function pushSnapshot() {
    const rowCells = [0, 1, 2].map(i =>
        (document.getElementById(`cell-${currentRound}-${i}`)?.textContent) || ""
    );
    history.push({
        currentRound,
        totals: totals.slice(),
        multiCounts: { ...multiCounts },
        multiChosen: { ...multiChosen },
        whoIndex,
        rowCells
    });
    updateUndoEnabled();
}

function restoreSnapshot() {
    if (!history.length) return;
    const snap = history.pop();
    currentRound = snap.currentRound;
    totals = snap.totals.slice();
    multiCounts = { ...snap.multiCounts };
    multiChosen = { ...snap.multiChosen };
    whoIndex = snap.whoIndex;

    for (let i = 0; i < 3; i++) setCell(currentRound, i, snap.rowCells[i]);
    updateTotals();
    restoring = true;
    startRound();
    updateUndoEnabled();
}

subtitle.textContent = 'კინგის აპლიკაცია - ©JANO v1.3';
updateUndoEnabled();

// --- Device Check for Install Prompts ---
function checkDeviceAndShowPrompt() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) {
        return;
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    if (isIOS) {
        document.getElementById('ios-install-popup').style.display = 'block';
    } else if (isAndroid) {
        document.getElementById('android-install-popup').style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', checkDeviceAndShowPrompt);
