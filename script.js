// Use the global from the authn bundle:
const session = solidClientAuthentication.getDefaultSession();

let tasks = [];
let fileUrl = "";

// UI elements
const loginSection = document.getElementById("login-section");
const btnLogin = document.getElementById("btn-login");
const appShell = document.getElementById("app");
const configDiv = document.getElementById("config");
const btnLoad = document.getElementById("btn-load");
const todoApp = document.getElementById("todo-app");
const newTaskForm = document.getElementById("new-task-form");
const newTaskInput = document.getElementById("new-task");
const taskList = document.getElementById("task-list");

async function init() {
  // Handle redirect and restore session if returning
  await session.handleIncomingRedirect({ restorePreviousSession: true });

  if (!session.info.isLoggedIn) {
    // show login button
    loginSection.hidden = false;
    btnLogin.addEventListener("click", () =>
      session.login({
        oidcIssuer: "https://login.inrupt.net",
        redirectUrl: window.location.href,
        clientName: "Solid To‑Do",
      })
    );
  } else {
    // logged in!
    loginSection.hidden = true;
    appShell.hidden = false;
    btnLoad.addEventListener("click", onLoad);
  }
}

async function onLoad() {
  fileUrl = document.getElementById("file-url").value.trim();
  if (!fileUrl) return alert("Enter the full URL for tasks.json");
  configDiv.hidden = true;
  todoApp.hidden = false;
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
    console.error(err);
    tasks = [];
  }
  renderTasks();
}

async function saveTasks() {
  await session.fetch(fileUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tasks),
  });
}

function renderTasks() {
  taskList.innerHTML = "";
  tasks.forEach((task) => {
    const li = document.createElement("li");

    // checkbox
    const cb = document.createElement("input");
    cb.type = "checkbox";
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

    // delete
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

// new-task form
newTaskForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const desc = newTaskInput.value.trim();
  if (!desc) return;
  tasks.push({ id: Date.now().toString(), description: desc, done: false });
  newTaskInput.value = "";
  await saveTasks();
  renderTasks();
});

// Start the app
init();

