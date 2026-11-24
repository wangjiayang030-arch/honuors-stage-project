// Main application logic
const form = document.getElementById("workout-form");
const workoutList = document.getElementById("workout-list");
const statsSummary = document.getElementById("stats-summary");
const chartCanvas = document.getElementById("weightChart");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFileInput = document.getElementById("importFileInput");

const sections = document.querySelectorAll(".section");
const navLinks = document.querySelectorAll(".navbar a");
let workoutChart = null;

// ---------- Navigation section switch ----------
function showSection(id) {
    sections.forEach(s => (s.style.display = "none"));
    document.getElementById(id).style.display = "block";
    if (id === "analytics-section") renderAnalytics();
}

navLinks.forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        showSection(link.dataset.target);
    });
});

// ---------- Render workout cards ----------
async function renderWorkouts() {
    await dbReadyPromise;
    const workouts = await getAllWorkouts();
    workoutList.innerHTML = "";

    if (workouts.length === 0) {
        workoutList.innerHTML = "<p>No workouts recorded yet.</p>";
        return;
    }

    workouts.forEach(item => {
        const card = document.createElement("div");
        card.className = "workout-card";
        card.innerHTML = `
            <h3>${item.exerciseName}</h3>
            <p>Sets: ${item.sets} | Reps: ${item.reps} | Weight: ${item.weight} kg</p>
            <p>Date: ${item.date}</p>
            <button class="edit-btn" data-id="${item.id}" style="margin-right:8px;">Edit</button>
            <button class="delete-btn" data-id="${item.id}">Delete</button>
        `;
        workoutList.appendChild(card);
    });

    document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = Number(btn.dataset.id);
            await deleteWorkout(id);
            await renderWorkouts();
            await renderAnalytics();
        });
    });
}

// ---------- Analytics: stats + line chart ----------
async function renderAnalytics() {
    await dbReadyPromise;
    const workouts = await getAllWorkouts();

    if (workouts.length === 0) {
        statsSummary.innerHTML = "<p>No workout data yet. Please add workout records.</p>";
        if (workoutChart) {
            workoutChart.destroy();
            workoutChart = null;
        }
        return;
    }

    const totalRecords = workouts.length;
    const totalSets = workouts.reduce((sum, w) => sum + Number(w.sets), 0);
    const maxWeight = Math.max(...workouts.map(w => Number(w.weight)));

    statsSummary.innerHTML = `
        <div class="stats-box">
            <p>Total workout entries: <strong>${totalRecords}</strong></p>
            <p>Total sets completed: <strong>${totalSets}</strong></p>
            <p>Max weight lifted (kg): <strong>${maxWeight}</strong></p>
        </div>
    `;

    const sorted = [...workouts].sort((a, b) => new Date(a.date) - new Date(b.date));
    const labels = sorted.map(i => i.date);
    const weightData = sorted.map(i => Number(i.weight));

    if (workoutChart) workoutChart.destroy();

    workoutChart = new Chart(chartCanvas, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Weight (kg)",
                data: weightData,
                borderColor: "#27ae60",
                backgroundColor: "rgba(39,174,96,0.1)",
                fill: true,
                tension: 0.2
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, title: { display: true, text: "Weight (kg)" } },
                x: { title: { display: true, text: "Date" } }
            }
        }
    });
}

// ---------- Export JSON backup ----------
async function exportWorkoutBackup() {
    await dbReadyPromise;
    const list = await getAllWorkouts();
    const jsonStr = JSON.stringify(list, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workout_backup.json";
    a.click();
    URL.revokeObjectURL(url);
}

// ---------- Import JSON backup ----------
async function importWorkoutBackup() {
    importFileInput.click();

    importFileInput.onchange = async (ev) => {
        const file = ev.target.files[0];
        if (!file) return;
        try {
            const text = await file.text();
            const importedArray = JSON.parse(text);
            if (!Array.isArray(importedArray)) {
                alert("Invalid backup file format");
                return;
            }
            await dbReadyPromise;
            for (const item of importedArray) {
                await saveWorkout({
                    exerciseName: item.exerciseName,
                    sets: Number(item.sets),
                    reps: Number(item.reps),
                    weight: Number(item.weight),
                    date: item.date
                });
            }
            alert(`Successfully imported ${importedArray.length} workout records`);
            await renderWorkouts();
            await renderAnalytics();
        } catch (err) {
            console.error(err);
            alert("Failed to import file, check JSON format");
        }
        importFileInput.value = "";
    };
}

// ---------- Form submit ----------
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const setsVal = Number(document.getElementById("sets").value);
    const repsVal = Number(document.getElementById("reps").value);
    const weightVal = Number(document.getElementById("weight").value);

    if (setsVal < 1 || repsVal < 1 || weightVal < 0) {
        alert("Sets and reps must be at least 1. Weight cannot be negative.");
        return;
    }

    await dbReadyPromise;
    const workoutEntry = {
        exerciseName: document.getElementById("exercise-name").value.trim(),
        sets: setsVal,
        reps: repsVal,
        weight: weightVal,
        date: document.getElementById("workout-date").value
    };

    await saveWorkout(workoutEntry);
    form.reset();
    await renderWorkouts();
    await renderAnalytics();
});

exportBtn.addEventListener("click", exportWorkoutBackup);
importBtn.addEventListener("click", importWorkoutBackup);

// ---------- Edit feature ----------
const editModal = document.getElementById("editModal");
const editIdInput = document.getElementById("edit-id");
const editExerciseName = document.getElementById("edit-exercise-name");
const editSets = document.getElementById("edit-sets");
const editReps = document.getElementById("edit-reps");
const editWeight = document.getElementById("edit-weight");
const editDate = document.getElementById("edit-date");
const btnSaveEdit = document.getElementById("saveEdit");
const btnCancelEdit = document.getElementById("cancelEdit");

document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("edit-btn")) {
        const id = Number(e.target.dataset.id);
        const all = await getAllWorkouts();
        const record = all.find(r => r.id === id);
        if (!record) return;

        editIdInput.value = record.id;
        editExerciseName.value = record.exerciseName;
        editSets.value = record.sets;
        editReps.value = record.reps;
        editWeight.value = record.weight;
        editDate.value = record.date;
        editModal.style.display = "block";
    }
});

btnCancelEdit.addEventListener("click", () => {
    editModal.style.display = "none";
});

btnSaveEdit.addEventListener("click", async () => {
    const setsVal = Number(editSets.value);
    const repsVal = Number(editReps.value);
    const weightVal = Number(editWeight.value);

    if (setsVal < 1 || repsVal < 1 || weightVal < 0) {
        alert("Sets and reps must be at least 1. Weight cannot be negative.");
        return;
    }

    const updated = {
        id: Number(editIdInput.value),
        exerciseName: editExerciseName.value.trim(),
        sets: setsVal,
        reps: repsVal,
        weight: weightVal,
        date: editDate.value
    };

    if (!updated.exerciseName) {
        alert("Please fill exercise name");
        return;
    }

    await updateWorkout(updated);
    editModal.style.display = "none";
    await renderWorkouts();
    await renderAnalytics();
});

// ---------- Initial load ----------
window.onload = async () => {
    await dbReadyPromise;
    await renderWorkouts();
    showSection("log-section");
};
