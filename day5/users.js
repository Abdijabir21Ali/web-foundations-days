const USERS_URL = 'https://jsonplaceholder.typicode.com/users';

const loadBtn = document.getElementById('load-users');
const filterInput = document.getElementById('filter-input');
const statusEl = document.getElementById('status');
const usersList = document.getElementById('users-list');

let allUsers = [];

async function loadUsers() {
  loadBtn.disabled = true;
  statusEl.textContent = 'Loading users...';
  usersList.innerHTML = '';

  try {
    const response = await fetch(USERS_URL);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const users = await response.json();
    allUsers = users;
    renderUsers(allUsers);
    statusEl.textContent = `Loaded ${users.length} users.`;
  } catch (error) {
    statusEl.textContent = `Error: ${error.message}`;
  } finally {
    loadBtn.disabled = false;
  }
}

function renderUsers(list) {
  usersList.innerHTML = '';

  if (list.length === 0) {
    statusEl.textContent = 'No users match your filter.';
    return;
  }

  list.forEach((user) => {
    const li = document.createElement('li');

    const name = document.createElement('h3');
    name.textContent = user.name;

    const email = document.createElement('p');
    email.textContent = `Email: ${user.email}`;

    const city = document.createElement('p');
    city.textContent = `City: ${user.address.city}`;

    const company = document.createElement('p');
    company.textContent = `Company: ${user.company.name}`;

    li.appendChild(name);
    li.appendChild(email);
    li.appendChild(city);
    li.appendChild(company);
    usersList.appendChild(li);
  });
}

filterInput.addEventListener('input', () => {
  const term = filterInput.value.toLowerCase();
  const filtered = allUsers.filter((user) =>
    user.name.toLowerCase().includes(term)
  );
  renderUsers(filtered);
});

loadBtn.addEventListener('click', loadUsers);