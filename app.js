// Main application logic
const form = document.getElementById("workout-form");
const workoutList = document.getElementById("workout-list");

// Render workout cards to history section
async function renderWorkouts() {
    await dbReadyPromise;
    const workouts = await getAllWorkouts();
    workoutList.innerHTML = "";

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

    // Bind delete button events
    document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            const id = Number(btn.dataset.id);
            await deleteWorkout(id);
            renderWorkouts();
        });
    });
}

// Handle form submit
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    await dbReadyPromise;

    const workoutEntry = {
        exerciseName: document.getElementById("exercise-name").value,
        sets: Number(document.getElementById("sets").value),
        reps: Number(document.getElementById("reps").value),
        weight: Number(document.getElementById("weight").value),
        date: document.getElementById("workout-date").value
    };

    await saveWorkout(workoutEntry);
    form.reset();
    await renderWorkouts();
});

// ---------------- Edit Feature ----------------
const editModal = document.getElementById("editModal");
const editIdInput = document.getElementById("edit-id");
const editExerciseName = document.getElementById("edit-exercise-name");
const editSets = document.getElementById("edit-sets");
const editReps = document.getElementById("edit-reps");
const editWeight = document.getElementById("edit-weight");
const editDate = document.getElementById("edit-date");
const btnSaveEdit = document.getElementById("saveEdit");
const btnCancelEdit = document.getElementById("cancelEdit");

// Open edit modal
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

// Cancel edit
btnCancelEdit.addEventListener("click", () => {
    editModal.style.display = "none";
});

// Save edited record
btnSaveEdit.addEventListener("click", async () => {
    const updated = {
        id: Number(editIdInput.value),
        exerciseName: editExerciseName.value.trim(),
        sets: Number(editSets.value),
        reps: Number(editReps.value),
        weight: Number(editWeight.value),
        date: editDate.value
    };

    if (!updated.exerciseName) {
        alert("Please fill exercise name");
        return;
    }
    await updateWorkout(updated);
    editModal.style.display = "none";
    await renderWorkouts();
});

// Load saved workouts after db ready
window.onload = async () => {
    await dbReadyPromise;
    await renderWorkouts();
};
