const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/active_sessions.json');

// Ensure directory and file exist
if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({}));
}

const loadStore = () => {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {
    return {};
  }
};

const saveStore = (data) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

const activeSessions = {
  get: (id) => loadStore()[id],
  set: (id, data) => {
    const store = loadStore();
    store[id] = data;
    saveStore(store);
  },
  has: (id) => !!loadStore()[id],
  delete: (id) => {
    const store = loadStore();
    delete store[id];
    saveStore(store);
  },
  entries: () => Object.entries(loadStore())
};

module.exports = { activeSessions };
