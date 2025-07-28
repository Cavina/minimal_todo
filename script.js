// script.js

// 1) Import the authn library as an ES module (Skypack CDN serves correct CORS headers)
import { Session } from "https://cdn.skypack.dev/@inrupt/solid-client-authn-browser";

// 2) Create a new session instance
const session = new Session();

let tasks = [];
let fileUrl = "";

// 3) Grab UI elements
const loginSection  = document.getElementById("login-section");
const btnLogin      = document.getElementById("btn-login");
const appShell      = document.getElementById("app");
const configDiv     = document.getElementById("config");
const btnLoad       = document.getElementById("btn-load");
const todoApp       = document.getElementById("todo-app");
const newTaskForm   = document.getElementById("new-task-form");
const newTaskInput  = document.getElementById("new-task");
const taskList      = document.getElementById("task-list");

// 4) Wire up the login button with your registered clientId
btnLogin.addEventListener("click", () =>
  session.login({
    oidcIssuer:  "https://login.inrupt.com",
    redirectUrl: "https://cavina.github.io/minimal_todo/",    // your exact GitHub Pages URL
    clientName:  "Solid To‑Do",
    clientId:    "551b9b8f-a3ed-4f6e-91bc-a76e3bc33b8e"        // your registered client ID
  })
);

// 5) Initialize: handle redirects and show/hide UI
async function init() {
  await session.handleIncomingRedirect({ restorePreviousSession: true });

  if (!session.info.isLoggedIn) {
    // still logged out
    loginSection.hidden = false;
  } else {
    // logged in
    loginSection.hidden = true;
    appShell.hidden     = false;
    btnLoad.addEventListener("click", onLoad);
  }
}

// 6) Load tasks from the Pod (or start with empty array)
async function onLoad() {
  fileUrl = document.getElementById("file-url").value.trim();
  if (!fileUrl) {
    return alert("Enter the full URL for tasks.json");
  }
  configDiv.hidden = true;
  todoApp.hidden   = false;
  await loadTasks();
}

async function loadTasks() {
  try {
    const res = await session.fetch(fileUrl);
    if (res.status === 404) {
      tasks = [];
    } else if (res.ok) {
      tasks = await res.json();
    } else {
      throw new Error(`Status ${res.status}`);
    }
  } catch (err) {
    console.error("Error loading tasks:", err);
    tasks = [];
  }
  renderTasks();
}

// 7) Save tasks back to the Pod
async function saveTasks() {
  await session.fetch(fileUrl, {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(tasks),
  });
}

// 8) Render the list and wire up interactions
function renderTasks() {
  taskList.innerHTML = "";
  tasks.forEach((task) => {
    const li = document.createElement("li");

    // checkbox
    const cb = document.createElement("input");
    cb.type    = "checkbox";
    cb.checked = task.done;
    cb.addEventListener("change", async () => {
      task.done = cb.checked;
      await saveTasks();
      renderTasks();
    });
    li.appendChild(cb);

    // label
    const span = document.createElement("span");
    span.textContent = task.description;
    if (task.done) span.style.textDecoration = "line-through";
    li.appendChild(span);

    // delete button
    const del = document.createElement("button");
    del.textContent = "×";
    del.addEventListener("click", async () => {
      tasks = tasks.filter((t) => t.id !== task.id);
      await saveTasks();
      renderTasks();
    });
    li.appendChild(del);

    taskList.appendChild(li);
  });
}

// 9) Handle new-task submissions
newTaskForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const desc = newTaskInput.value.trim();
  if (!desc) return;
  tasks.push({ id: Date.now().toString(), description: desc, done: false });
  newTaskInput.value = "";
  await saveTasks();
  renderTasks();
});

// 10) Start the app
init();

