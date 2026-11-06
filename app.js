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

// Load saved workouts after db ready
window.onload = async () => {
    await dbReadyPromise;
    await renderWorkouts();
};
