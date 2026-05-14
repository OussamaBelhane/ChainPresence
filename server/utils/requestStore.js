const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/requests.json');

// Ensure directory and file exist
if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify([]));
}

const getRequests = () => {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
};

const saveRequests = (requests) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(requests, null, 2));
};

const addRequest = (address, name, studentId, role) => {
  const requests = getRequests();
  
  // Update if exists, or add new
  const index = requests.findIndex(r => r.address.toLowerCase() === address.toLowerCase());
  const newReq = {
    address: address.toLowerCase(),
    name,
    studentId,
    role,
    status: 'pending',
    timestamp: Date.now()
  };

  if (index > -1) {
    requests[index] = newReq;
  } else {
    requests.push(newReq);
  }
  
  saveRequests(requests);
  return newReq;
};

const updateRequestStatus = (address, status) => {
  const requests = getRequests();
  const index = requests.findIndex(r => r.address.toLowerCase() === address.toLowerCase());
  if (index > -1) {
    requests[index].status = status;
    saveRequests(requests);
    return true;
  }
  return false;
};

module.exports = { getRequests, addRequest, updateRequestStatus };
