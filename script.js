// 1. Data Papan Skor & Log Riwayat
let teams = [
    { id: 'timA', name: 'Tim A', score: 0, rank: 0 },
    { id: 'timB', name: 'Tim B', score: 0, rank: 0 },
    { id: 'timC', name: 'Tim C', score: 0, rank: 0 },
    { id: 'timD', name: 'Tim D', score: 0, rank: 0 }
];
let scoreHistory = []; 


// Fungsi untuk mendapatkan urutan tim berdasarkan skor (untuk ranking)
function getRankedTeams() {
    let rankedTeams = [...teams];
    rankedTeams.sort((a, b) => b.score - a.score);
    return rankedTeams;
}

// 2. Fungsi Penggantian Nama Tim
function renderNameInputs() {
    const nameInputsEl = document.getElementById('name-inputs');
    nameInputsEl.innerHTML = teams.map(team => `
        <div class="team-control-button name-input-item">
            <label for="${team.id}-name">${team.id.toUpperCase()}:</label>
            <input type="text" id="${team.id}-name" value="${team.name}" placeholder="Masukkan Nama ${team.id.toUpperCase()}">
        </div>
    `).join('');
}

function saveTeamNames() {
    teams.forEach(team => {
        const input = document.getElementById(`${team.id}-name`);
        if (input && input.value.trim() !== '') {
            team.name = input.value.trim();
        }
    });
    // Render ulang papan skor untuk menampilkan nama baru
    updateScoreboard(); 
    alert("Nama tim berhasil diperbarui!");
}


// 3. Fungsi Utama: Update Papan Skor dan Ranking
function updateScoreboard() {
    // A. Tentukan Ranking (TETAP SAMA)
    let rankedTeams = getRankedTeams();

    rankedTeams.forEach((team, index) => {
        let rank;
        if (index > 0 && team.score === rankedTeams[index - 1].score) {
            rank = rankedTeams[index - 1].rank;
        } else {
            rank = index + 1;
        }
        
        const originalTeam = teams.find(t => t.id === team.id);
        if (originalTeam) {
            originalTeam.rank = rank;
        }
    });

    // B. Render Scoreboard (PAPAN UTAMA + KONTROL)
    const scoreboardEl = document.getElementById('scoreboard');
    scoreboardEl.innerHTML = teams.map(team => `
        <div class="team-card" id="card-${team.id}"> 
            <div class="team-name">${team.name}</div>
            <div class="team-score" id="score-${team.id}">${team.score}</div>
            <div class="team-rank rank-${team.rank}">Peringkat: ${team.rank}</div> 

            <div class="team-score-controls">
                <button class="add-btn" onclick="updateScore('${team.id}', 'add')">+ Tambah</button>
                <button class="subtract-btn" onclick="updateScore('${team.id}', 'subtract')">- Kurangi</button>
            </div>
        </div>
    `).join('');
    
    // C. Render Input Poin Universal (HANYA SEKALI)
    const universalInputContainer = document.getElementById('universal-input-container');
    
    const controlsContainer = document.querySelector('.controls.universal-controls-only');
    if (controlsContainer && !controlsContainer.querySelector('h2')) {
        controlsContainer.innerHTML = `<h2>Poin</h2>` + controlsContainer.innerHTML;
    }

    if (universalInputContainer && universalInputContainer.children.length === 0) {
        universalInputContainer.innerHTML = `
            <div class="universal-control plus-input">
                <label for="universal-plus-input">Penambahan Poin</label>
                <input type="number" id="universal-plus-input" class="score-input" placeholder="10" value="10">
            </div>
            <div class="universal-control minus-input">
                <label for="universal-minus-input">Pengurangan Poin</label>
                <input type="number" id="universal-minus-input" class="score-input" placeholder="5" value="5">
            </div>
        `;
    }

    // D. Render Riwayat Skor
    renderHistory();
}

// 4. Fungsi Pencatatan Riwayat (Log)
function logScore(teamName, points, operation, newScore) {
    const timestamp = new Date().toLocaleTimeString();
    const action = operation === 'add' ? `+${points}` : `-${points}`;

    // Ambil skor saat ini dari semua tim
    const currentScores = {};
    teams.forEach(t => {
        // Gunakan newScore untuk tim yang diubah, dan score saat ini untuk tim lainnya
        currentScores[t.id] = (t.name === teamName) ? newScore : t.score; 
    });

    const logEntry = {
        timestamp: new Date(),
        waktu: timestamp,
        tim: teamName,
        aksi: action,
        poin_berubah: points,
        score_akhir: newScore,
        
        // Simpan skor semua tim
        scoreA: currentScores.timA,
        scoreB: currentScores.timB,
        scoreC: currentScores.timC,
        scoreD: currentScores.timD
    };
    scoreHistory.push(logEntry);
}


// 5. Fungsi Input dan Kalkulasi (Mengambil nilai dari input plus/minus terpisah)
function updateScore(teamId, operation) {
    let points;
    let inputElement;

    if (operation === 'add') {
        inputElement = document.getElementById('universal-plus-input'); 
    } else if (operation === 'subtract') {
        inputElement = document.getElementById('universal-minus-input');
    }
    
    points = parseInt(inputElement.value);

    // Validasi input
    if (isNaN(points) || points <= 0) {
        alert(`Masukkan nilai poin yang valid (angka positif) di kolom Set Poin ${operation === 'add' ? '+Tambah' : '-Kurang'}.`);
        return;
    }

    const team = teams.find(t => t.id === teamId);

    if (team) {
        let newScore;
        if (operation === 'add') {
            newScore = team.score + points;
        } else if (operation === 'subtract') {
            newScore = Math.max(0, team.score - points);
        }
        
        // Catat riwayat
        logScore(team.name, points, operation, newScore);
        
        // Terapkan perubahan skor
        team.score = newScore;

        updateScoreboard();
    }
}

// 6. Fungsi Export ke Excel (Menggunakan Sheet.js/xlsx)
function exportToExcel() {
    if (scoreHistory.length === 0) {
        alert("Tidak ada riwayat skor untuk diunduh.");
        return;
    }

    // Siapkan data untuk Sheet, menambahkan kolom skor tim terpisah
    const dataForExport = scoreHistory.map(log => ({
        Waktu: log.timestamp.toLocaleString(),
        Tim_Beraksi: log.tim,
        Aksi_Poin: log.aksi,
        Poin_Berubah: log.poin_berubah,
        
        // Kolom Skor Akhir Per Tim
        Skor_Tim_A: log.scoreA,
        Skor_Tim_B: log.scoreB,
        Skor_Tim_C: log.scoreC,
        Skor_Tim_D: log.scoreD,
    }));

    const ws = XLSX.utils.json_to_sheet(dataForExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Riwayat_Score");

    const fileName = `Riwayat_CerdasCermat_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
}

// 7. Fungsi Reset
function resetScores() {
    if (confirm("Yakin ingin mereset SEMUA skor menjadi 0? Riwayat akan tetap tersimpan.")) {
        teams.forEach(team => {
            team.score = 0;
        });
        updateScoreboard();
    }
}


// 8. Inisialisasi: Panggil pertama kali saat halaman dimuat
renderNameInputs();
updateScoreboard();