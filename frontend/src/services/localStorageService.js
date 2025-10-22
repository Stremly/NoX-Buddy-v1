// Local Storage Service - Fallback when MongoDB is not configured
// Provides basic data persistence using browser localStorage

class LocalStorageService {
  constructor() {
    this.prefix = 'nox-buddy-';
  }

  // User Management
  async createUser(userData) {
    const users = this.getUsers();
    const existingUser = users.find(u => u.secret_code === userData.secret_code);
    
    if (existingUser) {
      throw new Error('User with this secret code already exists');
    }
    
    users.push({ ...userData, is_active: true });
    localStorage.setItem(`${this.prefix}users`, JSON.stringify(users));
    return userData;
  }

  async getUser(secretCode) {
    const users = this.getUsers();
    const user = users.find(u => u.secret_code === secretCode);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }

  async updateUser(secretCode, updateData) {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.secret_code === secretCode);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    users[userIndex] = { ...users[userIndex], ...updateData };
    localStorage.setItem(`${this.prefix}users`, JSON.stringify(users));
    return users[userIndex];
  }

  getUsers() {
    const data = localStorage.getItem(`${this.prefix}users`);
    return data ? JSON.parse(data) : [];
  }

  // NoX Bot Management
  async createNox(noxData) {
    const noxBots = this.getNoxBots();
    const noxId = String(Math.floor(100000 + Math.random() * 900000));
    const newNox = { ...noxData, nox_id: noxId };
    
    noxBots.push(newNox);
    localStorage.setItem(`${this.prefix}nox`, JSON.stringify(noxBots));
    return newNox;
  }

  async getNox(noxId) {
    const noxBots = this.getNoxBots();
    const nox = noxBots.find(n => n.nox_id === noxId);
    
    if (!nox) {
      throw new Error('NoX not found');
    }
    
    return nox;
  }

  getNoxBots() {
    const data = localStorage.getItem(`${this.prefix}nox`);
    return data ? JSON.parse(data) : [];
  }

  // Conversations
  async addMessage(secretCode, message) {
    const conversations = this.getConversations();
    const userConv = conversations[secretCode] || [];
    
    const newMessage = {
      message_id: String(Date.now()),
      ...message,
      datetime: new Date().toISOString()
    };
    
    userConv.push(newMessage);
    conversations[secretCode] = userConv;
    localStorage.setItem(`${this.prefix}conversations`, JSON.stringify(conversations));
    return newMessage;
  }

  async getConversation(secretCode) {
    const conversations = this.getConversations();
    return conversations[secretCode] || [];
  }

  getConversations() {
    const data = localStorage.getItem(`${this.prefix}conversations`);
    return data ? JSON.parse(data) : {};
  }

  // Memories
  async addMemory(secretCode, memory) {
    const memories = this.getMemories();
    const userMemories = memories[secretCode] || [];
    
    const newMemory = {
      memory_id: String(Date.now()),
      memory: memory.memory
    };
    
    userMemories.push(newMemory);
    memories[secretCode] = userMemories;
    localStorage.setItem(`${this.prefix}memories`, JSON.stringify(memories));
    return newMemory;
  }

  async getMemories(secretCode) {
    const memories = this.getMemories();
    return memories[secretCode] || [];
  }

  getMemories() {
    const data = localStorage.getItem(`${this.prefix}memories`);
    return data ? JSON.parse(data) : {};
  }

  // Reminders
  async addReminder(secretCode, reminder) {
    const reminders = this.getReminders();
    const userReminders = reminders[secretCode] || [];
    
    const newReminder = {
      reminder_id: String(Date.now()),
      ...reminder,
      reminder_created_at: new Date().toISOString(),
      number_of_reminders_sent: 0,
      last_reminder_sent_at: null,
      current_state: 'Active'
    };
    
    userReminders.push(newReminder);
    reminders[secretCode] = userReminders;
    localStorage.setItem(`${this.prefix}reminders`, JSON.stringify(reminders));
    return newReminder;
  }

  async getReminders(secretCode) {
    const reminders = this.getReminders();
    return reminders[secretCode] || [];
  }

  getReminders() {
    const data = localStorage.getItem(`${this.prefix}reminders`);
    return data ? JSON.parse(data) : {};
  }

  // Integrations
  async updateIntegration(secretCode, integrationName, data) {
    const integrations = this.getIntegrations();
    const userIntegrations = integrations[secretCode] || {};
    
    userIntegrations[integrationName] = data;
    integrations[secretCode] = userIntegrations;
    localStorage.setItem(`${this.prefix}integrations`, JSON.stringify(integrations));
    return userIntegrations;
  }

  async getIntegrations(secretCode) {
    const integrations = this.getIntegrations();
    return integrations[secretCode] || {};
  }

  getIntegrations() {
    const data = localStorage.getItem(`${this.prefix}integrations`);
    return data ? JSON.parse(data) : {};
  }

  // Check if using localStorage mode
  isLocalStorageMode() {
    return localStorage.getItem(`${this.prefix}mode`) === 'localStorage';
  }

  // Enable localStorage mode
  enableLocalStorageMode() {
    localStorage.setItem(`${this.prefix}mode`, 'localStorage');
  }

  // Clear all data (for testing)
  clearAll() {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }
}

// Create singleton instance
const localStorageService = new LocalStorageService();

export default localStorageService;
