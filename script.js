// บรรทัดนี้ใช้สำหรับฝังข้อมูลให้คนอื่นเห็น (นำ JSON ที่คัดลอกมาวางแทนที่ null)
const INITIAL_DATA = null; 

let teams = JSON.parse(localStorage.getItem('val_teams_data')) || (INITIAL_DATA ? INITIAL_DATA.teams : Array.from({length: 16}, (_, i) => ({
    id: `team-${i}`,
    name: `TEAM ${String(i+1).padStart(2, '0')}`,
    logo: `https://api.dicebear.com/7.x/identicon/svg?seed=${i}`
})));

function toggleAdmin() {
    const panel = document.getElementById('admin-panel');
    const icon = document.getElementById('toggle-icon');
    panel.classList.toggle('hidden-panel');
    icon.innerText = panel.classList.contains('hidden-panel') ? '▶' : '◀';
}

function exportJSON() {
    const state = { teams: teams, ui: {} };
    document.querySelectorAll('.slot').forEach(slot => {
        state.ui[slot.id] = slot.innerHTML;
    });
    const dataStr = JSON.stringify(state);
    navigator.clipboard.writeText(dataStr);
    alert("คัดลอกข้อมูลสายการแข่งแล้ว!");
}

function importJSON() {
    const dataStr = prompt("วางข้อมูล JSON ที่นี่:");
    if (dataStr) {
        try {
            const state = JSON.parse(dataStr);
            localStorage.setItem('val_teams_data', JSON.stringify(state.teams));
            localStorage.setItem('val_bracket_ui', JSON.stringify(state.ui));
            location.reload();
        } catch (e) { alert("ข้อมูลผิดพลาด!"); }
    }
}

function renderAdmin() {
    const list = document.getElementById('team-list');
    list.innerHTML = '';
    teams.forEach((team, i) => {
        const div = document.createElement('div');
        div.className = 'input-card';
        div.innerHTML = `
            <p class="text-[10px] text-gray-500 mb-1 uppercase font-bold">Slot ${i+1}</p>
            <input type="text" value="${team.name}" onchange="updateTeamName(${i}, this.value)">
            <input type="file" accept="image/*" class="text-[10px] w-full" onchange="handleLogo(${i}, this)">
        `;
        list.appendChild(div);
    });
}

function handleLogo(index, input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            teams[index].logo = e.target.result;
            refreshInitialSeeds();
            saveAll();
        };
        reader.readAsDataURL(file);
    }
}

function updateTeamName(index, value) {
    teams[index].name = value;
    refreshInitialSeeds();
    saveAll();
}

function refreshInitialSeeds() {
    for(let i=0; i<16; i++) {
        const slot = document.getElementById(`s${i+1}`);
        if(slot && (slot.children.length === 0 || slot.querySelector('.team-card'))) {
            slot.innerHTML = createTeamHTML(teams[i]);
        }
    }
}

function createTeamHTML(team) {
    return `<div class="team-card" data-id="${team.id}"><img src="${team.logo}" draggable="false"><span>${team.name}</span></div>`;
}

function initSortable() {
    const isViewOnly = window.location.href.includes('viewonly=true'); 
    document.querySelectorAll('.slot').forEach(el => {
        new Sortable(el, {
            group: 'bracket',
            animation: 150,
            disabled: isViewOnly,
            onEnd: () => saveAll()
        });
    });
}

function saveAll() {
    localStorage.setItem('val_teams_data', JSON.stringify(teams));
    const state = {};
    document.querySelectorAll('.slot').forEach(slot => {
        state[slot.id] = slot.innerHTML;
    });
    localStorage.setItem('val_bracket_ui', JSON.stringify(state));
}

function loadAll() {
    const savedUI = JSON.parse(localStorage.getItem('val_bracket_ui')) || (INITIAL_DATA ? INITIAL_DATA.ui : null);
    if(savedUI) {
        Object.keys(savedUI).forEach(id => {
            const slot = document.getElementById(id);
            if(slot) slot.innerHTML = savedUI[id];
        });
    } else {
        refreshInitialSeeds();
    }
}

function resetAll() {
    if(confirm("ล้างข้อมูลทั้งหมด?")) {
        localStorage.clear();
        location.reload();
    }
}

window.onload = () => {
    renderAdmin();
    loadAll();
    initSortable();
};