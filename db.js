// IndexedDB setup for workout local storage
const DB_NAME = "WorkoutDB";
const DB_VERSION = 1;
let db;
let dbReadyPromise;

// Open or create database, return promise
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = function (e) {
            db = e.target.result;
            // Create object store for workout entries
            const workoutStore = db.createObjectStore("workouts", {
                keyPath: "id",
                autoIncrement: true
            });
            // Create index for sorting by date
            workoutStore.createIndex("dateIndex", "date", { unique: false });
        };

        request.onsuccess = function (e) {
            db = e.target.result;
            console.log("Database opened successfully");
            resolve(db);
        };

        request.onerror = function (e) {
            console.error("Database error:", e.target.error);
            reject(e.target.error);
        };
    });
}

// Save one workout entry
function saveWorkout(workoutData) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["workouts"], "readwrite");
        const store = transaction.objectStore("workouts");
        const request = store.add(workoutData);

        request.onsuccess = () => resolve();
        request.onerror = (e) => reject(e.target.error);
    });
}

// Fetch all workouts sorted by date (newest first)
function getAllWorkouts() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["workouts"], "readonly");
        const store = transaction.objectStore("workouts");
        const index = store.index("dateIndex");
        const request = index.openCursor(null, "prev");
        const resultList = [];

        request.onsuccess = function (e) {
            const cursor = e.target.result;
            if (cursor) {
                resultList.push(cursor.value);
                cursor.continue();
            } else {
                resolve(resultList);
            }
        };
        request.onerror = (e) => reject(e.target.error);
    });
}

// Delete workout by id
function deleteWorkout(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(["workouts"], "readwrite");
        const store = transaction.objectStore("workouts");
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = (e) => reject(e.target.error);
    });
}

// Wait for database ready globally
dbReadyPromise = initDB();
