// 1. จัดเตรียมข้อมูลทีม (โหลดจาก LocalStorage หรือสร้างใหม่)
let teams = JSON.parse(localStorage.getItem('val_teams_data')) || Array.from({length: 16}, (_, i) => ({
    id: `team-${i}`,
    name: `TEAM ${String(i+1).padStart(2, '0')}`,
    logo: `https://api.dicebear.com/7.x/identicon/svg?seed=${i}`
}));
// ฟังก์ชัน ซ่อน/แสดง เมนู
function toggleAdmin() {
    const panel = document.getElementById('admin-panel');
    const icon = document.getElementById('toggle-icon');
    panel.classList.toggle('hidden-panel');
    icon.innerText = panel.classList.contains('hidden-panel') ? '▶' : '◀';
}

// ฟังก์ชันสำหรับดึงข้อมูลทั้งหมดออกมาเป็นข้อความ (JSON)
function exportJSON() {
    const state = {
        teams: teams,
        ui: {}
    };
    document.querySelectorAll('.slot').forEach(slot => {
        state.ui[slot.id] = slot.innerHTML;
    });
    
    const dataStr = JSON.stringify(state);
    navigator.clipboard.writeText(dataStr);
    alert("คัดลอกข้อมูลสายการแข่งลง Clipboard แล้ว! คุณสามารถส่งข้อความนี้ให้เพื่อนได้");
}

// ฟังก์ชันสำหรับวางข้อมูลจากที่อื่นลงไป
function importJSON() {
    const dataStr = prompt("วางข้อมูล JSON ที่คัดลอกมาที่นี่:");
    if (dataStr) {
        try {
            const state = JSON.parse(dataStr);
            localStorage.setItem('val_teams_data', JSON.stringify(state.teams));
            localStorage.setItem('val_bracket_ui', JSON.stringify(state.ui));
            location.reload(); // รีโหลดเพื่อแสดงผลใหม่
        } catch (e) {
            alert("ข้อมูลไม่ถูกต้อง!");
        }
    }
}

// (ฟังก์ชัน saveAll, loadAll, refreshInitialSeeds อื่นๆ ยังคงเดิมตามที่ให้ไว้คราวก่อน)

// 2. ฟังก์ชันเรนเดอร์รายการทีมใน Admin Panel
function renderAdmin() {
    const list = document.getElementById('team-list');
    list.innerHTML = '';
    teams.forEach((team, i) => {
        const div = document.createElement('div');
        div.className = 'input-card';
        div.innerHTML = `
            <p class="text-[10px] text-gray-500 mb-1 uppercase font-bold">Slot ${i+1}</p>
            <input type="text" value="${team.name}" onchange="updateTeamName(${i}, this.value)" placeholder="ชื่อทีม">
            <label class="text-[10px] text-gray-400 block mb-1">เปลี่ยนโลโก้:</label>
            <input type="file" accept="image/*" class="text-[10px] w-full text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-[#ff4655] file:text-white" onchange="handleLogo(${i}, this)">
        `;
        list.appendChild(div);
    });
}

// 3. จัดการการอัปโหลดรูปภาพ
function handleLogo(index, input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            teams[index].logo = e.target.result; // เก็บเป็น Base64
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

// 4. แสดงผลทีมในรอบที่ 1
function refreshInitialSeeds() {
    for(let i=0; i<16; i++) {
        const slot = document.getElementById(`s${i+1}`);
        // อัปเดตเฉพาะถ้าช่องนั้นยังว่าง หรือเป็นการ์ดทีมเริ่มต้น
        if(slot && (slot.children.length === 0 || slot.querySelector('.team-card'))) {
            slot.innerHTML = createTeamHTML(teams[i]);
        }
    }
}

function createTeamHTML(team) {
    return `
        <div class="team-card" data-id="${team.id}">
            <img src="${team.logo}" draggable="false">
            <span>${team.name}</span>
        </div>
    `;
}

// 5. ระบบลากวาง (SortableJS)
function initSortable() {
    document.querySelectorAll('.slot').forEach(el => {
        new Sortable(el, {
            group: 'bracket',
            animation: 150,
            onEnd: () => {
                saveAll();
            }
        });
    });
}

// 6. ระบบบันทึกและล้างข้อมูล
function saveAll() {
    // บันทึกข้อมูลทีม
    localStorage.setItem('val_teams_data', JSON.stringify(teams));
    
    // บันทึกตำแหน่ง UI ล่าสุดในสายการแข่ง
    const state = {};
    document.querySelectorAll('.slot').forEach(slot => {
        state[slot.id] = slot.innerHTML;
    });
    localStorage.setItem('val_bracket_ui', JSON.stringify(state));
}

function loadAll() {
    const savedUI = JSON.parse(localStorage.getItem('val_bracket_ui'));
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
    if(confirm("คุณต้องการล้างข้อมูลการแข่งขันทั้งหมดใช่หรือไม่?")) {
        localStorage.clear();
        location.reload();
    }
}

// เริ่มต้นการทำงานเมื่อโหลดหน้าเว็บ
window.onload = () => {
    renderAdmin();
    loadAll();
    initSortable();
};