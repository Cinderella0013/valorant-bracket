// ==========================================
// CONFIGURATION (ตั้งค่าที่นี่)
// ==========================================
const ADMIN_PASSWORD = "1234"; // เปลี่ยนรหัสผ่านของคุณที่นี่
const INITIAL_DATA = null;
// ==========================================
// SYSTEM LOGIC
// ==========================================

let teams = JSON.parse(localStorage.getItem('val_teams_data')) || (INITIAL_DATA ? INITIAL_DATA.teams : Array.from({length: 16}, (_, i) => ({
    id: `team-${i}`,
    name: `TEAM ${String(i+1).padStart(2, '0')}`,
    logo: `https://api.dicebear.com/7.x/identicon/svg?seed=${i}`
})));

// ตรวจสอบรหัสผ่านเมื่อเข้าโหมด Admin
function checkAdminAuth() {
    const urlParams = new URLSearchParams(window.location.search);
    const isAdminMode = urlParams.get('admin') === 'true';

    if (isAdminMode) {
        const password = prompt("กรุณาใส่รหัสผ่านแอดมินเพื่อเปิดการแก้ไข:");
        if (password === ADMIN_PASSWORD) {
            document.body.classList.add('admin-verified');
            return true;
        } else {
            alert("รหัสผ่านไม่ถูกต้อง! คุณจะเข้าสู่โหมดดูอย่างเดียว");
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
    return false;
}

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
    alert("คัดลอกข้อมูลสำเร็จ! นำไปวางใน INITIAL_DATA ในไฟล์ script.js");
}

function importJSON() {
    const dataStr = prompt("วางข้อมูล JSON ที่นี่:");
    if (dataStr) {
        try {
            const state = JSON.parse(dataStr);
            localStorage.setItem('val_teams_data', JSON.stringify(state.teams));
            localStorage.setItem('val_bracket_ui', JSON.stringify(state.ui));
            location.reload();
        } catch (e) { alert("ข้อมูลไม่ถูกต้อง!"); }
    }
}

function renderAdmin() {
    const list = document.getElementById('team-list');
    if (!list) return;
    list.innerHTML = '';
    teams.forEach((team, i) => {
        const div = document.createElement('div');
        div.className = 'input-card';
        div.innerHTML = `
            <p class="text-[10px] text-gray-500 mb-1 uppercase font-bold">Slot ${i+1}</p>
            <input type="text" value="${team.name}" onchange="updateTeamName(${i}, this.value)">
            <input type="file" accept="image/*" class="text-[10px] w-full mt-1" onchange="handleLogo(${i}, this)">
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
    const isVerified = document.body.classList.contains('admin-verified');
    document.querySelectorAll('.slot').forEach(el => {
        new Sortable(el, {
            group: 'bracket',
            animation: 150,
            disabled: !isVerified,
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
    checkAdminAuth();
    renderAdmin();
    loadAll();
    initSortable();

};

