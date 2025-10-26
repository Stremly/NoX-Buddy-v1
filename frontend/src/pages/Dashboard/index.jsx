// Dashboard.jsx - Modern AI Startup Dashboard
// Integrated chat interface with clean sidebar navigation

import React, { useState, useEffect } from 'react';
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion';
import VoiceRecording from '../VoiceRecording';
import MinimizedScreen from '../../components/MinimizedScreen';
import noxServiceManager from '../../services/noxServiceManager';
import StremlyBlack from '../../../public/images/Stremly_black.png'


const Dashboard = ({profileData, setProfileData, userData, setUserData}) => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('engage');
  const [profileSubTab, setProfileSubTab] = useState('personal');
  //const [userData, setUserData] = useState(null);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([]);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [showVoiceRecording, setShowVoiceRecording] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [minimizedMessages, setMinimizedMessages] = useState([]);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [isScreenRecording, setIsScreenRecording] = useState(false);
  // Chat mode - backend should handle different message routing based on mode
  const [chatMode, setChatMode] = useState('nox'); // 'nox' or 'normal'
  const [activeContact, setActiveContact] = useState(null); // Currently chatting contact
  
  const API_BASE = 'http://localhost:8000';

  // Profile photo editor state
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
  const storedUserStr = localStorage.getItem('nox-buddy-user');
  if (!storedUserStr) return; // not signed in yet
  const storedUser = JSON.parse(storedUserStr);
  setUserData(storedUser);
}, []);


  // Reset expanded state when minimizing
  const resetMinimizedState = () => {
    setIsExpanded(false);
    setMinimizedMessages([]);
  };

  // Auto-resize window when messages change
  const autoResizeWindow = async (messageCount) => {
    if (isMinimized && isExpanded && window.electronAPI && window.electronAPI.expandWindowForConversation) {
      await window.electronAPI.expandWindowForConversation(messageCount);
    }
  };

  // Toggle voice recording
  const toggleVoiceRecording = () => {
    setIsVoiceRecording(prev => {
      const newState = !prev;
      console.log('Voice recording:', newState ? 'Started' : 'Stopped');
      // TODO: Implement actual voice recording logic
      return newState;
    });
  };

  // Toggle screen recording
  const toggleScreenRecording = () => {
    setIsScreenRecording(prev => {
      const newState = !prev;
      console.log('Screen recording:', newState ? 'Started' : 'Stopped');
      // TODO: Implement actual screen recording logic
      return newState;
    });
  };

  // Auto-start recordings when minimized
  useEffect(() => {
    // Add a small delay to ensure window resize completes first
    const recordingTimer = setTimeout(() => {
      if (isMinimized) {
        // Auto-start voice recording when minimized
        setIsVoiceRecording(true);
        // Auto-start screen recording when minimized
        setIsScreenRecording(true);
        console.log('Auto-started recordings for minimized mode');
      } else {
        // Stop recordings when not minimized
        setIsVoiceRecording(false);
        setIsScreenRecording(false);
        console.log('Stopped recordings - not in minimized mode');
      }
    }, 100)
    return () => clearTimeout(recordingTimer);
  }, [isMinimized]);

  // Effect to auto-resize when minimized messages change
  useEffect(() => {
    if (isMinimized && isExpanded && minimizedMessages.length > 0) {
      // Debounce resize to prevent excessive calls
      const resizeTimer = setTimeout(() => {
        autoResizeWindow(minimizedMessages.length);
      }, 50);
      
      // Auto-scroll to bottom when new message is added
      const scrollTimer = setTimeout(() => {
        const messagesContainer = document.querySelector('.messages-container');
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }, 150);

      return () => {
        clearTimeout(resizeTimer);
        clearTimeout(scrollTimer);
      };
    }
  }, [minimizedMessages.length, isMinimized, isExpanded]);

  //Refresh Integartions
  useEffect(() => {
  const fetchData = async () => {
    const storedUserStr = localStorage.getItem('nox-buddy-user');
    const storedUser = JSON.parse(storedUserStr);
    try {
      const data = await getIntegrations(storedUser.secretCode); // fetch from backend
      console.log("Backend integrations:", data); // DEBUG: log raw response

      const connectedFromBackend = data.integrations || {};
      console.log("Processed backend integrations:", connectedFromBackend); // DEBUG

      // Merge backend connected apps with default integrations
      const merged = integrations.map((intg) => {
        const config = connectedFromBackend[intg.name];
        console.log(`Merging ${intg.name}:`, config); // DEBUG: see each merge
        return {
          ...intg,
          connected: !!config,
          config: config || {}
        };
      });

      console.log("Final merged integrations:", merged); // DEBUG: final state before set
      setIntegrations(merged);
      fetchContacts(storedUser.secretCode)
    } catch (err) {
      console.error("Failed to fetch integrations:", err);
    }
  };

  fetchData();
}, []); // runs once on startup
  
  //Key Shortcut - DEMO
  useEffect(() => {
  if (window.electronAPI) {
    window.electronAPI.onMinimizeShortcut(() => {
      console.log('⌨️ Shortcut event received in React');
      handleMinimize();
    });
  }
}, []);




  // Handle minimize with Electron window resize
    const handleMinimize = async () => {
    console.log('Minimize button clicked');
    try {
      // Transfer main messages to minimized messages before minimizing
      if (messages.length > 0) {
        setMinimizedMessages(prev => [...prev, ...messages]);
        setMessages([]); // Clear main messages after transfer
      }
      
      // Check if we're in Electron environment
      if (typeof window !== 'undefined' && window.electronAPI) {
        console.log('Electron API available, calling resizeWindowForMinimize');
        const result = await window.electronAPI.resizeWindowForMinimize();
        console.log('Resize result:', result);
        
        if (result.success) {
          console.log('Window resized successfully');
          // Only change state if window resize succeeded
          resetMinimizedState();
          setIsMinimized(true);
        } else {
          console.error('Failed to resize window:', result.error);
          alert('Failed to minimize window. Please try again.');
          return; // Don't change state if resize failed
        }
      } else {
        // Browser mode - no actual window resize, just change state
        console.log('Electron API not available, running in browser mode');
        resetMinimizedState();
        setIsMinimized(true);
      }
    } catch (error) {
      console.error('Error minimizing window:', error);
      alert('Error minimizing window: ' + error.message);
      // Don't change state on error
    }
  };

  // Handle restore from minimize
  const handleRestore = async () => {
    console.log('Restore button clicked');
    try {
      // Check if we're in Electron environment
      if (typeof window !== 'undefined' && window.electronAPI) {
        console.log('Electron API available, calling restoreWindowFromMinimize');
        const result = await window.electronAPI.restoreWindowFromMinimize();
        console.log('Restore result:', result);
        
        if (result.success) {
          console.log('Window restored successfully');
        } else {
          console.error('Failed to restore window:', result.error);
        }
      } else {
        console.log('Electron API not available, running in browser mode');
      }
      
      // Set the restored state
      setIsMinimized(false);
    } catch (error) {
      console.error('Error restoring window:', error);
      // Fallback to just setting state
      setIsMinimized(false);
    }
  };
  // Contacts data - backend should provide GET /api/contacts
  const [showNewContactForm, setShowNewContactForm] = useState(false);
  const [showNewMemoryForm, setShowNewMemoryForm] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  const [currentUser, setCurrentUser] = useState(null);
const [contacts, setContacts] = useState([]);
const [loading, setLoading] = useState(true);
const [newContactCode, setNewContactCode] = useState('');
const [newContactName, setNewContactName] = useState('');


// Fetch contacts from backend
const fetchContacts = async (secretCode) => {
  try {
    const response = await axios.get(`${API_BASE}/users/${secretCode}/contacts`);
    const contactIds = response.data.contacts; // ["NOX_1760186389862"]
    console.log('Contact IDs from backend:', contactIds);

    // Since backend doesn't give more info, just use NOX ID
    const formattedContacts = contactIds.map(noxId => ({
      id: noxId,
      name: noxId, // fallback to NOX ID as name
      noxId: noxId,
      lastMessage: 'Start a conversation...',
      timestamp: 'Just now'
    }));

    console.log('Formatted contacts:', formattedContacts);
    setContacts(formattedContacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    setContacts([]);
  }
};



const addContact = async (contactSecretCode) => {
    if (!currentUser) {
    console.error('No current user found');
    return { success: false, message: 'User not logged in' };
  }

  try {
    // First verify the contact exists
    const contactResponse = await axios.get(`${API_BASE}/users/${contactSecretCode}`);
    console.log('Contact found:', contactResponse.data);
    const contactData = contactResponse.data;

    // Add to current user's contacts
        console.log('Adding to contacts for user:', currentUser.secretCode);
    const addResponse = await axios.post(`${API_BASE}/users/${currentUser.secretCode}/contacts/${contactSecretCode}`);
    console.log('Add contact response:', addResponse.data);
    
    // Update local state
    const newContact = {
      id: contactData.secret_code,
      name: contactData.name,
      noxId: contactData.nox_id,
      email: contactData.email,
      lastMessage: 'Start a conversation...',
      timestamp: 'Just now'
    };
    
    setContacts(prev => [...prev, newContact]);
    setShowNewContactForm(false);
    
    return { success: true, message: 'Contact added successfully!' };
  } catch (error) {
    if (error.response?.status === 404) {
      return { success: false, message: 'User not found with this secret code' };
    }
    return { success: false, message: 'Failed to add contact' };
  }
};

const deleteContact = async (contactId) => {
  if (!currentUser) return;

  try {
    await axios.delete(`${API_BASE}/users/${currentUser.secretCode}/contacts/${contactId}`);
    
    // Update local state
    setContacts(prev => prev.filter(contact => contact.id !== contactId));
    
    return { success: true, message: 'Contact deleted successfully!' };
  } catch (error) {
    console.error('Error deleting contact:', error);
    return { success: false, message: 'Failed to delete contact' };
  }
};


const handleAddContact = async () => {
  if (!newContactCode.trim()) {
    alert('Please enter a secret code');
    return;
  }
  
  const userData = localStorage.getItem('nox-buddy-user');
  if (!userData) {
    alert('Please sign in first');
    return;
  }
  
  const user = JSON.parse(userData);
  const contactNoxId = newContactCode.trim();
  
  console.log('Adding contact:', contactNoxId);
  
  try {
    // Use the exact same approach that worked in the manual test
    const response = await fetch(`${API_BASE}/users/${user.secretCode}/contacts/${contactNoxId}`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Contact added successfully:', result);
    
    // Refresh the contacts list
    await fetchContacts(user.secretCode);
    
    setNewContactCode('');
    setShowNewContactForm(false);
    alert('Contact added successfully!');
    
  } catch (error) {
    console.error('Error adding contact:', error);
    alert('Failed to add contact: ' + error.message);
  }
};


//Conversation 


useEffect(() => {
  if (activeContact && chatMode === "normal") {
    handleSelectContact(activeContact);
  }
}, [activeContact]);


const addMessageToDB = async (secretCode, fromUser, toUser, message) => {
  const res = await axios.post(
    `${API_BASE}/conversations/${fromUser}/${toUser}/message?secret_code=${secretCode}`,
    null,
    { params: { message } } 
  );
  return res.data;
};

const getConversationFromDB = async (userNoxId, contactNoxId, secretCode) => {
  const res = await axios.get(
    `${API_BASE}/conversations/${currentUser.noxId}/${contactNoxId}?secret_code=${secretCode}`
  );
  return res.data.messages;
};

const handleSelectContact = async (contact) => {
  setSelectedContact(contact);
  setActiveContact(contact);
  setChatMode("normal");

  try {
    const previousMessages = await getConversationFromDB(userNoxId, contact.noxId, userSecretCode);

    const formatted = previousMessages.map(msg => ({
      id: msg.message_id,
      text: msg.message,
      isBot: msg.direction === "received", // ✅ backend uses "sent"/"received"
      timestamp: new Date(msg.datetime),
      isTyping: false,
    }));

    setMessages(formatted);
  } catch (err) {
    console.error("Error loading chat:", err);
  }
};




  // Reminders data - backend should provide GET /api/reminders
    const [reminders, setReminders] = useState([]);
  const [showNewReminderForm, setShowNewReminderForm] = useState(false);
  const [newReminderDescription, setNewReminderDescription] = useState('');
  const [newReminderDateTime, setNewReminderDateTime] = useState('');
  const [editingReminder, setEditingReminder] = useState(null);
  const [editReminderDescription, setEditReminderDescription] = useState('');
  const [editReminderDateTime, setEditReminderDateTime] = useState('');
  
  
 
  // Integration API functions
  // Replace the mock data with empty arrays
  // Legacy connected apps - can be removed when integrations are ready
  const [connectedApps, setConnectedApps] = useState([
    { id: 1, name: 'Slack', status: 'Connected', config: { webhook: 'https://hooks.slack.com/...' } },
    { id: 2, name: 'Discord', status: 'Connected', config: { token: 'BOT_TOKEN_123' } }
  ]);
  // Integrations data - backend should provide GET /api/integrations
  const defaultIntegrations = [
  { id: 1, name: 'Notion', description: 'Notes & docs', connected: false, config: {} },
  { id: 2, name: 'Slack', description: 'Team chat', connected: false, config: {} },
  { id: 3, name: 'Jira', description: 'Project tracking', connected: false, config: {} },
  { id: 4, name: 'GitHub', description: 'Code repository', connected: false, config: {} }
];

  const [integrations, setIntegrations] = useState(defaultIntegrations);
  const [connectingIntegration, setConnectingIntegration] = useState(null);
  const [integrationFormData, setIntegrationFormData] = useState({});

  const getIntegrations = async (secretCode) => {
  const res = await fetch(`${API_BASE}/integrations/${secretCode}`);
  return res.json();
  };

  const connectIntegrationAPI = async (secretCode, integrationName, config) => {
  const res = await fetch(`${API_BASE}/integrations/${secretCode}/${integrationName}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: config }),
  });
  return res.json();
  };

  const deleteIntegrationAPI = async (secretCode, integrationName) => {
  const res = await fetch(`${API_BASE}/integrations/${secretCode}/${integrationName}`, {
    method: "DELETE",
  });
  return res.json();
  };

  const startConnectIntegration = (integration) => {
    setConnectingIntegration(integration);
    setIntegrationFormData({});
  };

  const cancelConnectIntegration = () => {
    setConnectingIntegration(null);
    setIntegrationFormData({});
  };

    const handleIntegrationFormChange = (field, value) => {
    setIntegrationFormData({
      ...integrationFormData,
      [field]: value
    });
  };

const connectIntegration = async () => {
  if (!connectingIntegration) return;

  const requiredFields = getRequiredFields(connectingIntegration.name);
  const missingFields = requiredFields.filter(field => !integrationFormData[field]?.trim());
  if (missingFields.length > 0) {
    alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
    return;
  }

  try {
    const config = { ...integrationFormData, connectedAt: new Date().toISOString() };
    const res = await connectIntegrationAPI(currentUser.secretCode, connectingIntegration.name, config);

    alert(res.message);

    await refreshIntegrations(currentUser.secretCode);

    setConnectingIntegration(null);
    setIntegrationFormData({});
  } catch (err) {
    console.error("Error:", err);
    alert("Failed to connect integration");
  }
};

  const disconnectIntegration = async (integrationId) => {
  const integration = integrations.find(i => i.id === integrationId);
  if (!integration) return;

  if (window.confirm(`Are you sure you want to disconnect ${integration.name}?`)) {
    try {
      await deleteIntegrationAPI(currentUser.secretCode, integration.name);
      await refreshIntegrations(currentUser.secretCode);
    } catch (error) {
      console.error("Error disconnecting integration:", error);
      alert("Failed to disconnect integration");
    }
  }
};





// Handle integration connection
const handleConnectIntegration = async (integration) => {
  try {
    // For demo, you can add a config object with required fields
    const config = {
      connectedAt: new Date().toISOString(),
      status: 'active'
    };
    
    const result = await connectIntegration(integration.name, config);
    
    if (result.success) {
      // The integration list will automatically refresh via fetchIntegrations
      console.log(result.message);
    } else {
      alert(result.message);
    }
  } catch (error) {
    console.error('Error connecting integration:', error);
    alert('Failed to connect integration');
  }
};

// Fetch and merge integrations
const refreshIntegrations = async (secretCode) => {
  try {
    const backendRes = await getIntegrations(secretCode);
    const connectedFromBackend = backendRes.integrations || {};

    // Merge backend data with all available integrations
    const merged = integrations.map((intg) => {
      const config = connectedFromBackend[intg.name];
      return {
        ...intg,
        connected: !!config,
        config: config || {}
      };
    });

    setIntegrations(merged);
  } catch (error) {
    console.error("Failed to refresh integrations:", error);
  }
};


  // Get required fields for each integration type
  const getRequiredFields = (integrationName) => {
    const fieldMap = {
      'Notion': ['apiKey', 'databaseId'],
      'Slack': ['webhookUrl', 'botToken'],
      'Jira': ['domain', 'email', 'apiToken'],
      'GitHub': ['accessToken', 'repository']
    };
    return fieldMap[integrationName] || [];
  };

  // Get field labels for display
  const getFieldLabel = (field) => {
    const labelMap = {
      'apiKey': 'API Key',
      'databaseId': 'Database ID',
      'webhookUrl': 'Webhook URL',
      'botToken': 'Bot Token',
      'domain': 'Domain',
      'email': 'Email',
      'apiToken': 'API Token',
      'accessToken': 'Access Token',
      'repository': 'Repository'
    };
    return labelMap[field] || field;
  };


  // Memory items data - backend should provide GET /api/memory
    const [editingMemory, setEditingMemory] = useState(null);
  const [editMemoryData, setEditMemoryData] = useState('');
  const [memoryItems, setMemoryItems] = useState([
    { id: 1, data: 'User prefers morning meetings' },
    { id: 2, data: 'Project deadline is March 15th' },
    { id: 3, data: 'Favorite programming language is JavaScript' }
  ]);

  // Load user data on component mount
/*useEffect(() => {
  try {
    const storedUserStr = localStorage.getItem('nox-buddy-user');
    if (storedUserStr) {
      const storedUser = JSON.parse(storedUserStr);

      // Always update profileData.personal from storedUser
      setProfileData(prev => ({
        ...prev,
        personal: {
          name: storedUser.name || '',
          email: storedUser.email || '',
          bio: storedUser.bio || '',
          secretCode: storedUser.secretCode || '',
          photo: storedUser.photo || null
        },
        nox: prev.nox,       // keep existing Nox info intact
        usage: prev.usage    // keep usage stats intact
      }));

      setUserData(storedUser); // keep separate copy for updates

      // Load Nox info from profile if exists
      const storedProfile = localStorage.getItem('nox-buddy-profile');
      if (storedProfile) {
        const profile = JSON.parse(storedProfile);
        setProfileData(prev => ({
          ...prev,
          nox: profile.nox || prev.nox,
          usage: profile.usage || prev.usage
        }));
      }

      // Set current user & fetch contacts
      setCurrentUser(storedUser);
      fetchContacts(storedUser.secretCode);
    }
  } catch (error) {
    console.error('Error loading user data:', error);
  }
}, []);*/


    // Create new reminder function - backend should provide POST /api/reminders
  const createNewReminder = () => {
    if (!newReminderDescription.trim() || !newReminderDateTime) {
      alert('Please fill in both description and date/time');
      return;
    }

    const newReminder = {
      id: reminders.length + 1,
      description: newReminderDescription.trim(),
      reminderId: `REM-${String(reminders.length + 1).padStart(3, '0')}`,
      dateCreated: new Date().toISOString().split('T')[0],
      dateReminder: newReminderDateTime.split('T')[0],
      numberSent: 0,
      acknowledged: false,
      status: 'Active'
    };

    // Add to reminders list
    setReminders([...reminders, newReminder]);
    
    // Reset form
    setNewReminderDescription('');
    setNewReminderDateTime('');
    setShowNewReminderForm(false);
  };

  // Edit reminder function
  const startEditReminder = (reminder) => {
    setEditingReminder(reminder);
    setEditReminderDescription(reminder.description);
    // Convert date to datetime-local format
    const reminderDate = new Date(reminder.dateReminder);
    const localDateTime = reminderDate.toISOString().slice(0, 16);
    setEditReminderDateTime(localDateTime);
  };

  // Save edited reminder function
  const saveEditedReminder = () => {
    if (!editReminderDescription.trim() || !editReminderDateTime) {
      alert('Please fill in both description and date/time');
      return;
    }

    const updatedReminders = reminders.map(reminder => 
      reminder.id === editingReminder.id 
        ? {
            ...reminder,
            description: editReminderDescription.trim(),
            dateReminder: editReminderDateTime.split('T')[0]
          }
        : reminder
    );

    setReminders(updatedReminders);
    
    // Reset edit form
    setEditingReminder(null);
    setEditReminderDescription('');
    setEditReminderDateTime('');
  };

  // Cancel edit function
  const cancelEditReminder = () => {
    setEditingReminder(null);
    setEditReminderDescription('');
    setEditReminderDateTime('');
  };

  // Delete reminder function
  const deleteReminder = (reminderId) => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      setReminders(reminders.filter(reminder => reminder.id !== reminderId));
    }
  };

  // Toggle acknowledgment status
  const toggleAcknowledgment = (reminderId) => {
    const updatedReminders = reminders.map(reminder => 
      reminder.id === reminderId 
        ? {
            ...reminder,
            acknowledged: !reminder.acknowledged,
            status: !reminder.acknowledged ? 'Completed' : 'Active'
          }
        : reminder
    );
    setReminders(updatedReminders);
  };

  //Memory Tab
    // Create new memory item function - backend should provide POST /api/memory
  const createNewMemory = () => {
    if (!newMemoryData.trim()) {
      alert('Please enter memory data');
      return;
    }

    const newMemoryItem = {
      id: memoryItems.length + 1,
      data: newMemoryData.trim(),
      createdAt: new Date().toLocaleDateString(),
      lastAccessed: 'Never',
      accessCount: 0,
      category: 'General',
      priority: 'normal'
    };

    // Add to memory items list
    const updatedMemories = [...memoryItems, newMemoryItem];
    setMemoryItems(updatedMemories);
    
    // Save to localStorage
    localStorage.setItem('nox-buddy-memories', JSON.stringify(updatedMemories));
    
    // Reset form
    setNewMemoryData('');
    setShowNewMemoryForm(false);
  };

  // Edit memory item function
  const startEditMemory = (memory) => {
    setEditingMemory(memory);
    setEditMemoryData(memory.data);
  };

  // Save edited memory
  const saveEditedMemory = () => {
    if (!editMemoryData.trim()) {
      alert('Please enter memory data');
      return;
    }

    const updatedMemories = memoryItems.map(item =>
      item.id === editingMemory.id
        ? { ...item, data: editMemoryData.trim() }
        : item
    );

    setMemoryItems(updatedMemories);
    localStorage.setItem('nox-buddy-memories', JSON.stringify(updatedMemories));
    
    setEditingMemory(null);
    setEditMemoryData('');
  };

  // Cancel edit memory
  const cancelEditMemory = () => {
    setEditingMemory(null);
    setEditMemoryData('');
  };

  // Delete memory item function - backend should provide DELETE /api/memory/{id}
  const deleteMemory = (id) => {
    if (window.confirm('Are you sure you want to delete this memory?')) {
      const updatedMemories = memoryItems.filter(item => item.id !== id);
      setMemoryItems(updatedMemories);
      localStorage.setItem('nox-buddy-memories', JSON.stringify(updatedMemories));
    }
  };

  // Delete memory item function
  const deleteMemoryItem = (memoryId) => {
    if (window.confirm('Are you sure you want to delete this memory item?')) {
      setMemoryItems(memoryItems.filter(item => item.id !== memoryId));
    }
  };

    // Profile data update functions
    // Profile data state
  /*const [profileData, setProfileData] = useState({
    personal: {
      name: '',
      email: '',
      bio: '',
      secretCode: '',
      photo: null
    },
    nox: {
      noxId: '',
      noxName: 'Nox Assistant',
      noxBio: 'Your intelligent desktop companion designed to help with various tasks and conversations.',
      instructions: 'Be helpful, accurate, and concise in your responses. Maintain a professional yet friendly tone.'
    },
    usage: {
      totalHours: 0,
      memorySize: 0,
      remindersCount: 0,
      avgRuntime: 0
    }
  });
  */

  useEffect(() => {
  if (profileData?.personal?.secretCode) {
    console.log("✅ Final loaded profile:", profileData);
  }
}, [profileData.personal.secretCode]);


  const updatePersonalInfo = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      personal: {
        ...prev.personal,
        [field]: value
      }
    }));
  };

  const updateNoxInfo = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      nox: {
        ...prev.nox,
        [field]: value
      }
    }));
  };

const savePersonalInfo = async () => {
  try {
    const { name, email, bio, photo } = profileData.personal;

    // ✅ Validation
    if (!name.trim()) return alert('Please enter your name');
    if (!email.trim()) return alert('Please enter your email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return alert('Please enter a valid email address');

    const updatedUser = {
    ...userData,
    name,
    email,
    bio,
    photo
  };

  setUserData(updatedUser);
  setProfileData(prev => ({
    ...prev,
    personal: { ...updatedUser }
  }));

  

    // ✅ Save to localStorage
    localStorage.setItem('nox-buddy-user', JSON.stringify(updatedUser));
    localStorage.setItem('nox-buddy-profile', JSON.stringify(updatedProfile));

    if (updatedUser.secretCode) {
    await axios.put(`${API_BASE}/users/${updatedUser.secretCode}`, { name, email, bio, photo });
  }

    console.log('✅ Profile updated on backend:', response.data);
    alert('Personal information saved successfully!');
  } catch (error) {
    console.error('❌ Error saving personal info:', error);
    alert('Failed to save personal information');
  }
};



  const saveNoxInfo = () => {
    try {
      // Validate required fields
      if (!profileData.nox.noxName.trim()) {
        alert('Please enter a Nox name');
        return;
      }
      
      // Save to localStorage
      localStorage.setItem('nox-buddy-profile', JSON.stringify(profileData));
      
      alert('Nox information saved successfully!');
    } catch (error) {
      console.error('Error saving Nox info:', error);
      alert('Failed to save Nox information');
    }
  };

  // Calculate dynamic usage statistics
  const calculateUsageStats = () => {
    const stats = {
      totalHours: 0,
      memorySize: 0,
      remindersCount: reminders.length,
      avgRuntime: 0
    };
    
    // Calculate memory size (rough estimate based on data)
    const dataSize = JSON.stringify({
      reminders,
      contacts,
      memoryItems,
      messages
    }).length;
    stats.memorySize = (dataSize / (1024 * 1024)).toFixed(2); // Convert to MB
    
    return stats;
  };




  // Chat message handler - backend should route based on chatMode and activeContact
const handleSendMessage = async () => {
  if (!inputText.trim()) return;

  const userMessage = {
    id: Date.now().toString(),
    text: inputText,
    isBot: false,
    timestamp: new Date(),
    isTyping: false,
  };

  // Add to UI first
  setMessages(prev => [...prev, userMessage]);
  const messageText = inputText;
  setInputText('');

  // Show typing indicator for bot/contact
  const typingMessage = {
    id: Date.now() + 1,
    text: "Thinking...",
    isBot: true,
    isTyping: true,
    timestamp: new Date(),
  };
  setMessages(prev => [...prev, typingMessage]);

  if (chatMode === "normal" && activeContact) {
    // Send to contact and save in DB
        try {
      // 1️⃣ Ensure conversation exists before sending
      await axios.post(`${API_BASE}/conversations/${currentUser.noxId}/start/${activeContact.noxId}?secret_code=${currentUser.secretCode}`);
      console.log('Started Conversation')
    } catch (err) {
      // Ignore if already exists
      if (!err.response || err.response.status !== 403) console.error(err);
    }

    await addMessageToDB(currentUser.secretCode, currentUser.noxId, activeContact.noxId, messageText);
    const response = await noxServiceManager.sendMessage(messageText);

    const botResponse = {
      id: Date.now() + 2,
      text: response,
      isBot: true,
      timestamp: new Date(),
      isTyping: false,
    };

    setMessages(prev => {
      const filtered = prev.filter(msg => !msg.isTyping);
      return [...filtered, botResponse];
    });

    await addMessageToDB(currentUser.secretCode, activeContact.noxId, currentUser.noxId, botResponse.text);

  } else {
    // existing AI logic stays as is
    const response = await noxServiceManager.sendMessage(messageText);
    const botResponse = {
      id: Date.now() + 2,
      text: response || "I'm here to help!",
      isBot: true,
      timestamp: new Date(),
    };

    setMessages(prev => {
      const filtered = prev.filter(msg => !msg.isTyping);
      return [...filtered, botResponse];
    });
  }
};



  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleRestore();
    }
  };

  const handleFileAttach = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      setAttachedFiles([...attachedFiles, ...files]);
    };
    input.click();
  };

  const removeFile = (index) => {
    setAttachedFiles(attachedFiles.filter((_, i) => i !== index));
  };

  // Sidebar navigation items (Dashboard tabs)
  const sidebarItems = [
    {
      id: 'engage',
      label: 'Engage Tab',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    {
      id: 'contacts',
      label: 'Contacts Tab',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      id: 'reminders',
      label: 'Reminders Tab',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      id: 'integrations',
      label: 'Integrations Tab',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    {
      id: 'memory',
      label: 'Memory Tab',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      id: 'profile',
      label: 'Profile Tab',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <>
      {/* Minimized Window - New 3-Part Design */}
      {isMinimized && (
        <MinimizedScreen
          inputText={inputText}
          setInputText={setInputText}
          onSendMessage={handleSendMessage}
          onRestore={handleRestore}
          isVoiceRecording={isVoiceRecording}
          isScreenRecording={isScreenRecording}
          toggleVoiceRecording={toggleVoiceRecording}
          toggleScreenRecording={toggleScreenRecording}
          onKeyPress={handleKeyPress}
          isExpanded={isExpanded}
          setIsExpanded={setIsExpanded}
          minimizedMessages={minimizedMessages}
          autoResizeWindow={autoResizeWindow}
        />
      )}

      {/* Main Dashboard */}
      {!isMinimized && (
        <div className="h-screen w-full bg-white flex flex-col pb-4">
          {/* Top Navigation Bar */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <img src={StremlyBlack} alt="Logo" className="w-10 h-auto" />
                <h1 className="font-bold text-black text-lg">NoX</h1>
              </div>

              {/* Horizontal Navigation */}
              <nav className="flex items-center space-x-1">
                {sidebarItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      activeTab === item.id
                        ? 'bg-black text-white shadow-lg'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="w-4 h-4">{item.icon}</span>
                    <span className="hidden sm:inline">{item.label.replace(' Tab', '')}</span>
                  </button>
                ))}
              </nav>

              {/* User Profile */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {profileData?.personal.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-black">
                      {profileData?.personal.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {profileData?.personal.email || 'user@example.com'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Content Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-black">
                    Welcome back{userData?.name ? `, ${userData.name}` : ''}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">Ready to get productive with Nox-Buddy?</p>
                </div>
                {activeTab === 'engage' && (
                  <button
                    onClick={handleMinimize}
                    className="w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                    title="Minimize to floating window"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 p-6 bg-white">
              {activeTab === 'engage' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-full flex flex-col"
                >

              {/* Attached Files */}
              {attachedFiles.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {attachedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg text-sm"
                      >
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span className="text-gray-700">{file.name}</span>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Mode Toggle - Above Messages */}
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-gray-600">
                  {chatMode === 'nox' ? (
                    'Chatting with AI Assistant'
                  ) : (
                    activeContact ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                          {activeContact.name.charAt(0).toUpperCase()}
                        </div>
                        <span>Chatting with {activeContact.name}</span>
                        <span className="text-xs text-gray-400">({activeContact.noxId})</span>
                      </div>
                    ) : (
                      'Contact Chat Mode'
                    )
                  )}
                </div>
                <button
                  onClick={() => {
                    if (chatMode === 'nox') {
                      // Switching to contact mode - keep current contact if any
                      setChatMode('normal');
                    } else {
                      // Switching to AI mode - clear active contact
                      setChatMode('nox');
                      setActiveContact(null);
                      setMessages([]); // Clear messages when switching to AI
                    }
                  }}
                  className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full shadow-sm transition-all duration-200 hover:shadow-md ${
                    chatMode === 'nox' 
                      ? 'bg-black text-white hover:bg-gray-800' 
                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                  }`}
                  title={`Switch to ${chatMode === 'nox' ? 'Contact Chat' : 'AI Assistant'}`}
                >
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    chatMode === 'nox' ? 'bg-green-400' : 'bg-blue-400'
                  }`}></div>
                  {chatMode === 'nox' ? 'AI Mode' : 'Contact Mode'}
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 border border-gray-200 rounded-lg mb-4 overflow-y-auto p-4 bg-white">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">
                      {chatMode === 'nox' ? (
                        'Start a conversation with your AI assistant'
                      ) : (
                        activeContact ? (
                          `Start chatting with ${activeContact.name}`
                        ) : (
                          'Select a contact from the Contacts tab to start chatting'
                        )
                      )}
                    </p>
                    {chatMode === 'normal' && !activeContact && (
                      <button
                        onClick={() => setActiveTab('contacts')}
                        className="mt-4 px-4 py-2 bg-black text-white rounded-3xl hover:bg-gray-800 text-sm font-medium transition-colors"
                      >
                        Go to Contacts
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-md px-4 py-2 rounded-lg text-sm ${
                            message.isBot
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-black text-white'
                          }`}
                        >
                          {message.isTyping ? (
                            <div className="flex items-center space-x-2">
                              <span>{message.text}</span>
                              <div className="flex space-x-1">
                                <div className="w-1 h-1 bg-current rounded-full animate-pulse"></div>
                                <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                                <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                              </div>
                            </div>
                          ) : (
                            message.text
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={chatMode === 'nox' ? 'Ask me anything...' : (activeContact ? `Message ${activeContact.name}...` : 'Select a contact to chat...')}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-black text-sm"
                />
                <button
                  onClick={handleFileAttach}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Attach files"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowVoiceRecording(true)}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Voice input"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() && attachedFiles.length === 0}
                  className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                >
                  Send
                </button>
              </div>
            </motion.div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full flex flex-col"
            >
              {/* <div className="mb-6">
                <h2 className="text-2xl font-bold text-black mb-1">Profile</h2>
                <p className="text-gray-500 text-sm">Manage your account settings</p>
              </div> */}

              {/* Profile Sub-tabs */}
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-4">
                <button
                  onClick={() => setProfileSubTab('personal')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    profileSubTab === 'personal'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  Personal Information
                </button>
                <button
                  onClick={() => setProfileSubTab('nox')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    profileSubTab === 'nox'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  Nox Information
                </button>
                <button
                  onClick={() => setProfileSubTab('usage')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    profileSubTab === 'usage'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  Usage Statistics
                </button>
              </div>

              {/* Profile Sub-tab Content */}
              <div className="flex-1 overflow-hidden">
                {profileSubTab === 'personal' && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white border border-gray-200 rounded-lg p-5 h-full"
                  >
                    <h3 className="text-lg font-semibold text-black mb-4">Personal Information</h3>
                    <div className="max-w-lg grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2 flex items-center space-x-3 mb-2">
                        <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center overflow-hidden">
                          {profileData.personal.photo ? (
                            <img 
                              src={profileData.personal.photo} 
                              alt="Profile" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-white text-lg font-semibold">
                              {profileData?.personal.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = (e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  // Validate file size (max 5MB)
                                  if (file.size > 5 * 1024 * 1024) {
                                    alert('Image size should be less than 5MB');
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    setSelectedImage(event.target.result);
                                    setShowPhotoEditor(true);
                                    setImageScale(1);
                                    setImagePosition({ x: 0, y: 0 });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              };
                              input.click();
                            }}
                            className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
                          >
                            Change Photo
                          </button>
                          {profileData.personal.photo && (
                            <button 
                              onClick={() => {
                                if (window.confirm('Remove profile photo?')) {
                                  updatePersonalInfo('photo', null);
                                  const updatedProfile = {
                                    ...profileData,
                                    personal: {
                                      ...profileData.personal,
                                      photo: null
                                    }
                                  };
                                  localStorage.setItem('nox-buddy-profile', JSON.stringify(updatedProfile));
                                }
                              }}
                              className="px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium transition-colors"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Photo Editor Modal */}
                      {showPhotoEditor && selectedImage && (
                        <div className="fixed inset-0 flex items-center justify-center z-50" style={{
                          backgroundColor: 'rgba(0, 0, 0, 0.3)',
                          backdropFilter: 'blur(12px)',
                          WebkitBackdropFilter: 'blur(12px)'
                        }}>
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-3xl p-8 max-w-lg w-full mx-4 shadow-2xl"
                          >
                            {/* Image Preview - Larger and centered */}
                            <div className="relative w-80 h-80 mx-auto mb-8 bg-gray-50 rounded-full overflow-hidden shadow-inner">
                              <img 
                                src={selectedImage}
                                alt="Preview"
                                style={{
                                  transform: `scale(${imageScale}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                                  transformOrigin: 'center',
                                  transition: 'transform 0.1s ease-out'
                                }}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Zoom Control - Simplified */}
                            <div className="mb-6">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-gray-600">Zoom</span>
                                <span className="text-sm font-semibold text-black">{Math.round(imageScale * 100)}%</span>
                              </div>
                              <input
                                type="range"
                                min="0.5"
                                max="3"
                                step="0.1"
                                value={imageScale}
                                onChange={(e) => setImageScale(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-black"
                              />
                            </div>

                            {/* Position Controls - Side by side */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-sm font-medium text-gray-600">Horizontal</span>
                                </div>
                                <input
                                  type="range"
                                  min="-50"
                                  max="50"
                                  value={imagePosition.x}
                                  onChange={(e) => setImagePosition({...imagePosition, x: parseInt(e.target.value)})}
                                  className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-black"
                                />
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-sm font-medium text-gray-600">Vertical</span>
                                </div>
                                <input
                                  type="range"
                                  min="-50"
                                  max="50"
                                  value={imagePosition.y}
                                  onChange={(e) => setImagePosition({...imagePosition, y: parseInt(e.target.value)})}
                                  className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-black"
                                />
                              </div>
                            </div>

                            {/* Action Buttons - Full width */}
                            <div className="flex gap-3">
                              <button
                                onClick={() => {
                                  setShowPhotoEditor(false);
                                  setSelectedImage(null);
                                }}
                                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 font-medium transition-all duration-200"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => {
                                  // Create canvas to crop and resize image
                                  const canvas = document.createElement('canvas');
                                  const ctx = canvas.getContext('2d');
                                  const size = 400; // Output size
                                  canvas.width = size;
                                  canvas.height = size;

                                  const img = new Image();
                                  img.onload = () => {
                                    // Apply transformations
                                    ctx.save();
                                    ctx.translate(size / 2, size / 2);
                                    ctx.scale(imageScale, imageScale);
                                    ctx.translate(imagePosition.x, imagePosition.y);
                                    ctx.translate(-size / 2, -size / 2);
                                    
                                    // Draw image
                                    const aspectRatio = img.width / img.height;
                                    let drawWidth = size;
                                    let drawHeight = size;
                                    let offsetX = 0;
                                    let offsetY = 0;

                                    if (aspectRatio > 1) {
                                      drawWidth = size * aspectRatio;
                                      offsetX = -(drawWidth - size) / 2;
                                    } else {
                                      drawHeight = size / aspectRatio;
                                      offsetY = -(drawHeight - size) / 2;
                                    }

                                    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
                                    ctx.restore();

                                    // Convert to base64 and save
                                    const croppedImage = canvas.toDataURL('image/jpeg', 0.9);
                                      const updatedUser = { ...userData, photo: croppedImage };
  const updatedProfile = {
    ...profileData,
    personal: {
      ...profileData.personal,
      photo: croppedImage
    }
  };

                                    localStorage.setItem('nox-buddy-profile', JSON.stringify(updatedProfile));

                                    setUserData(updatedUser);
                                    setProfileData(prev => ({
                                      ...prev,
                                      personal: {
                                      ...prev.personal,
                                      photo: croppedImage
                                    }
                                    }));

                                    localStorage.setItem('nox-buddy-user', JSON.stringify(updatedUser)); // ❗ important
                                    localStorage.setItem('nox-buddy-profile', JSON.stringify({
                                      ...profileData,
                                      personal: {
                                      ...profileData.personal,
                                      photo: croppedImage
                                      }
                                    }));
                                    if (updatedUser?.secretCode) {
                                       axios.put(`${API_BASE}/users/${updatedUser.secretCode}`, { photo: croppedImage })
                                      .then(res => console.log('Photo updated on backend', res.data))
                                      .catch(err => console.error('Failed to update photo', err));
                                    }
                                    
                                    setShowPhotoEditor(false);
                                    setSelectedImage(null);
                                  };
                                  img.src = selectedImage;
                                }}
                                className="flex-1 px-6 py-3 bg-black text-white rounded-2xl hover:bg-gray-800 font-medium transition-all duration-200"
                              >
                                Save Photo
                              </button>
                            </div>
                          </motion.div>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          value={profileData.personal.name}
                          onChange={(e) => updatePersonalInfo('name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black text-sm"
                          placeholder="Enter your name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={profileData.personal.email}
                          onChange={(e) => updatePersonalInfo('email', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black text-sm"
                          placeholder="Enter your email"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                        <textarea
                          value={profileData.personal.bio}
                          onChange={(e) => updatePersonalInfo('bio', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black text-sm resize-none"
                          rows={3}
                          placeholder="Tell us about yourself"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Secret Code</label>
                        <input
                          type="password"
                          value={profileData.personal.secretCode}
                          readOnly
                          
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black text-sm"
                          placeholder="Enter secret code"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <button 
                        onClick={savePersonalInfo}
                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm font-medium transition-colors"
                      >
                        Save Changes
                      </button>
                      
                      {/* Logout Button */}
                      <button 
                        onClick={() => {
                          // Clear user data
                          localStorage.removeItem('nox-buddy-user');
                          setUserData(null);
                          // Redirect to login/home page
                          window.location.href = '/';
                        }}
                        className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-300 text-sm font-medium transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>Logout</span>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}

                {profileSubTab === 'nox' && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white border border-gray-200 rounded-lg p-5 h-full"
                  >
                    <h3 className="text-lg font-semibold text-black mb-4">Nox Information</h3>
                    <div className="max-w-lg grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nox ID</label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 font-mono">
                          {profileData.nox.noxId}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nox Name</label>
                        <input
                          type="text"
                          value={profileData.nox.noxName}
                          onChange={(e) => updateNoxInfo('noxName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black text-sm"
                          placeholder="Give your AI a name"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                        <textarea
                          value={profileData.nox.noxBio}
                          onChange={(e) => updateNoxInfo('noxBio', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black text-sm resize-none"
                          rows={3}
                          placeholder="Describe your AI assistant"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                        <textarea
                          value={profileData.nox.instructions}
                          onChange={(e) => updateNoxInfo('instructions', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black text-sm resize-none"
                          rows={3}
                          placeholder="Custom instructions for your AI"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <button 
                        onClick={saveNoxInfo}
                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm font-medium transition-colors"
                      >
                        Save Changes
                      </button>
                    </div>
                  </motion.div>
                )}

                {profileSubTab === 'usage' && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white border border-gray-200 rounded-lg p-5 h-full"
                  >
                    <h3 className="text-lg font-semibold text-black mb-4">Usage Statistics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-xl font-bold text-black mb-1">{profileData.usage.totalHours}h</div>
                        <div className="text-xs text-gray-600">Total Hours</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-xl font-bold text-black mb-1">{calculateUsageStats().memorySize} MB</div>
                        <div className="text-xs text-gray-600">Memory Size</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-xl font-bold text-black mb-1">{reminders.length}</div>
                        <div className="text-xs text-gray-600">Reminders</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-xl font-bold text-black mb-1">{contacts.length}</div>
                        <div className="text-xs text-gray-600">Contacts</div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-500 italic">
                        Usage statistics are calculated automatically based on your activity.
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}


          {/* Contacts Tab */}
{activeTab === 'contacts' && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="h-full flex flex-col max-w-4xl mx-auto"
  >
    {/* Header with Add Contact */}
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-3">
        <h3 className="text-lg font-semibold text-black">Contacts</h3>
        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
          {contacts.length}
        </span>
      </div>
      <button
        onClick={() => setShowNewContactForm(true)}
        className="px-4 py-2 bg-black text-white rounded-3xl hover:bg-gray-800 text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
      >
        Add Contact
      </button>
    </div>

    {/* Add Contact Form Modal */}
    {showNewContactForm && (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-6 bg-gray-50 border border-gray-200 rounded-2xl p-6"
      >
        <h4 className="font-medium text-black mb-4">Add New Contact</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            className="px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
            onChange={(e) => setNewContactName(e.target.value)}
            placeholder="Full Name"
          />
          <input
            type="text"
            value={newContactCode}
            className="px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm font-mono"
            onChange={(e) => setNewContactCode(e.target.value)}
            placeholder="Enter NoX ID"
          />
        </div>
        <div className="flex justify-end space-x-3 mt-4">
          <button
          onClick={() => {
          setShowNewContactForm(false);
          setNewContactName('');
          setNewContactCode('');
        }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-3xl text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAddContact}
            className="px-6 py-2 bg-black text-white rounded-3xl hover:bg-gray-800 text-sm font-medium transition-all duration-200"
          >
            Save Contact
          </button>
        </div>
      </motion.div>
    )}

    {/* Contacts Grid */}
    <div className="flex-1">
      {contacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((contact) => (
            <motion.div
              key={contact.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelectContact(contact)}
              className={`p-4 border-2 rounded-2xl cursor-pointer transition-all duration-200 ${
                selectedContact?.id === contact.id 
                  ? 'border-black bg-black text-white shadow-lg' 
                  : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
              }`}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-medium ${
                  selectedContact?.id === contact.id ? 'bg-white text-black' : 'bg-gray-100 text-gray-700'
                }`}>
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{contact.name}</h4>
                  <p className={`text-xs font-mono ${
                    selectedContact?.id === contact.id ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    {contact.noxId}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className={selectedContact?.id === contact.id ? 'text-gray-300' : 'text-gray-500'}>
                  {contact.lastMessage}
                </span>
                <span className={selectedContact?.id === contact.id ? 'text-gray-300' : 'text-gray-400'}>
                  {contact.timestamp}
                </span>
              </div>
              
              {selectedContact?.id === contact.id && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Set active contact and switch to contact chat mode
                    setActiveContact(contact);
                    setChatMode('normal'); // Use 'normal' mode for contact chat
                    setActiveTab('engage');
                    
                    // Clear previous messages when switching contacts
                    setMessages([]);
          
                  }}
                  className="w-full mt-3 px-4 py-2 bg-white text-black rounded-3xl text-sm font-medium hover:bg-gray-100 transition-colors"
                >
                  Start Chat
                </motion.button>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No contacts yet</h4>
          <p className="text-gray-500 text-sm mb-4">Add your first contact to start chatting</p>
          <button
            onClick={() => setShowNewContactForm(true)}
            className="px-6 py-2 bg-black text-white rounded-3xl hover:bg-gray-800 text-sm font-medium transition-all duration-200"
          >
            Add Contact
          </button>
        </div>
      )}
    </div>
  </motion.div>
)}

          {/* Reminders Tab */}
          {activeTab === 'reminders' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full flex flex-col max-w-5xl mx-auto"
            >
              {/* Header with Add Reminder */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold text-black">Reminders</h3>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                    {reminders.length}
                  </span>
                </div>
                <button
                  onClick={() => setShowNewReminderForm(true)}
                  className="px-4 py-2 bg-black text-white rounded-3xl hover:bg-gray-800 text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Add Reminder
                </button>
              </div>

              {/* Add Reminder Form Modal */}
              {showNewReminderForm && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 bg-gray-50 border border-gray-200 rounded-2xl p-6"
                >
                  <h4 className="font-medium text-black mb-4">Create New Reminder</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={newReminderDescription}
                      onChange={(e) => setNewReminderDescription(e.target.value)}
                      className="px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                      placeholder="Reminder description"
                    />
                    <input
                      type="datetime-local"
                      value={newReminderDateTime}
                      onChange={(e) => setNewReminderDateTime(e.target.value)}
                      className="px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                    />
                  </div>
                  <div className="flex justify-end space-x-3 mt-4">
                    <button
                      onClick={() => {
                        // Reset form when canceling
                        setNewReminderDescription('');
                        setNewReminderDateTime('');
                        setShowNewReminderForm(false);
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-3xl text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createNewReminder}
                      className="px-6 py-2 bg-black text-white rounded-3xl hover:bg-gray-800 text-sm font-medium transition-all duration-200"
                    >
                      Create Reminder
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Edit Reminder Form Modal */}
              {editingReminder && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 bg-gray-50 border border-gray-200 rounded-2xl p-6"
                >
                  <h4 className="font-medium text-black mb-4">Edit Reminder</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={editReminderDescription}
                      onChange={(e) => setEditReminderDescription(e.target.value)}
                      className="px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                      placeholder="Reminder description"
                    />
                    <input
                      type="datetime-local"
                      value={editReminderDateTime}
                      onChange={(e) => setEditReminderDateTime(e.target.value)}
                      className="px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                    />
                  </div>
                  <div className="flex justify-end space-x-3 mt-4">
                    <button
                      onClick={cancelEditReminder}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-3xl text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveEditedReminder}
                      className="px-6 py-2 bg-black text-white rounded-3xl hover:bg-gray-800 text-sm font-medium transition-all duration-200"
                    >
                      Save Changes
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Reminders Grid */}
              <div className="flex-1">
                {reminders.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {reminders.map((reminder) => (
                      <motion.div
                        key={reminder.id}
                        whileHover={{ scale: 1.01 }}
                        className="bg-white border-2 border-gray-200 rounded-2xl p-5 hover:border-gray-300 hover:shadow-md transition-all duration-200"
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="font-medium text-black text-base mb-1">{reminder.description}</h4>
                            <p className="text-xs font-mono text-gray-500">{reminder.reminderId}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ml-3 ${
                            reminder.status === 'Active' 
                              ? 'bg-black text-white' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {reminder.status}
                          </span>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                          <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-gray-500 text-xs mb-1">Date</p>
                            <p className="font-medium text-gray-900">{reminder.dateReminder}</p>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-gray-500 text-xs mb-1">Notifications</p>
                            <p className="font-medium text-gray-900">Sent: {reminder.numberSent}</p>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="mb-4">
                          <button
                            onClick={() => toggleAcknowledgment(reminder.id)}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer hover:opacity-80 ${
                              reminder.acknowledged 
                                ? 'bg-black text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {reminder.acknowledged ? '✓ Acknowledged' : 'Pending'}
                          </button>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => startEditReminder(reminder)}
                            className="flex-1 px-3 py-2 bg-black text-white rounded-3xl hover:bg-gray-800 text-sm font-medium transition-colors"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => deleteReminder(reminder.id)}
                            className="px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-3xl text-sm font-medium transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No reminders yet</h4>
                    <p className="text-gray-500 text-sm mb-4">Create your first reminder to stay organized</p>
                    <button
                      onClick={() => setShowNewReminderForm(true)}
                      className="px-6 py-2 bg-black text-white rounded-3xl hover:bg-gray-800 text-sm font-medium transition-all duration-200"
                    >
                      Add Reminder
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}


          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full flex flex-col max-w-4xl mx-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold text-black">Integrations</h3>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                    {integrations.filter(app => app.connected).length} connected
                  </span>
                </div>
              </div>

              {/* Connection Modal */}
              {connectingIntegration && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 bg-gray-50 border border-gray-200 rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-black">Connect to {connectingIntegration.name}</h4>
                    <button
                      onClick={cancelConnectIntegration}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    Enter your {connectingIntegration.name} credentials to establish the connection.
                  </p>

                  <div className="grid grid-cols-1 gap-4">
                    {getRequiredFields(connectingIntegration.name).map((field) => (
                      <div key={field}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {getFieldLabel(field)}
                        </label>
                        <input
                          type={field.toLowerCase().includes('token') || field.toLowerCase().includes('key') ? 'password' : 'text'}
                          value={integrationFormData[field] || ''}
                          onChange={(e) => handleIntegrationFormChange(field, e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                          placeholder={`Enter ${getFieldLabel(field).toLowerCase()}`}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={cancelConnectIntegration}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-3xl text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={connectIntegration}
                      className="px-6 py-2 bg-black text-white rounded-3xl hover:bg-gray-800 text-sm font-medium transition-all duration-200"
                    >
                      Connect
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Integrations Grid - Simple 4 cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {integrations.map((integration) => (
                  <motion.div
                    key={integration.id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white border-2 border-gray-200 rounded-2xl p-5 hover:border-gray-300 hover:shadow-md transition-all duration-200 text-center"
                  >
                    {/* App Icon */}
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-lg font-medium text-gray-700">
                        {integration.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* App Info */}
                    <h5 className="font-medium text-black text-base mb-1">{integration.name}</h5>
                    <p className="text-xs text-gray-500 mb-4">{integration.description}</p>

                    {/* Connection Status */}
                    {integration.connected ? (
                      <div>
                        <div className="flex items-center justify-center space-x-2 mb-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-green-600 font-medium">Connected</span>
                        </div>
                        <button 
                          onClick={() => disconnectIntegration(integration.id)}
                          className="w-full px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-3xl text-xs font-medium transition-colors"
                        >
                          Disconnect
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => startConnectIntegration(integration)}
                        className="w-full px-4 py-2 bg-black text-white rounded-3xl hover:bg-gray-800 text-sm font-medium transition-colors"
                      >
                        Connect
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Memory Tab */}
          {activeTab === 'memory' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full flex flex-col max-w-5xl mx-auto"
            >
              {/* Header with Add Memory */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <h3 className="text-lg font-semibold text-black">Memory</h3>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                    {memoryItems.length} stored
                  </span>
                </div>
                <button
                  onClick={() => setShowNewMemoryForm(true)}
                  className="px-4 py-2 bg-black text-white rounded-3xl hover:bg-gray-800 text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Add Memory
                </button>
              </div>

              {/* Add Memory Form Modal */}
                            {showNewMemoryForm && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 bg-gray-50 border border-gray-200 rounded-2xl p-6"
                >
                  <h4 className="font-medium text-black mb-4">Store New Memory</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Memory Content</label>
                      <textarea
                        value={newMemoryData}
                        onChange={(e) => setNewMemoryData(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm resize-none"
                        rows={4}
                        placeholder="Enter information to remember..."
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => {
                        setShowNewMemoryForm(false);
                        setNewMemoryData('');
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-3xl text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createNewMemory}
                      className="px-6 py-2 bg-black text-white rounded-3xl hover:bg-gray-800 text-sm font-medium transition-all duration-200"
                    >
                      Store Memory
                    </button>
                  </div>
                </motion.div>
              )}
              {/* Edit Memory Form Modal */}
              {editingMemory && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-6"
                >
                  <h4 className="font-medium text-black mb-4">Edit Memory</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Memory Content</label>
                      <textarea
                        value={editMemoryData}
                        onChange={(e) => setEditMemoryData(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm resize-none"
                        rows={4}
                        placeholder="Enter information to remember..."
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={cancelEditMemory}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-3xl text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveEditedMemory}
                      className="px-6 py-2 bg-black text-white rounded-3xl hover:bg-gray-800 text-sm font-medium transition-all duration-200"
                    >
                      Save Changes
                    </button>
                  </div>
                </motion.div>
              )}

              
              {/* Memory Grid */}
              <div className="flex-1">
                {memoryItems.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {memoryItems.map((item) => (
                      <motion.div
                        key={item.id}
                        whileHover={{ scale: 1.01 }}
                        className="bg-white border-2 border-gray-200 rounded-2xl p-5 hover:border-gray-300 hover:shadow-md transition-all duration-200"
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                {item.category || 'General'}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item.priority === 'high' ? 'bg-red-100 text-red-700' :
                                item.priority === 'low' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {item.priority || 'Normal'}
                              </span>
                            </div>
                            <p className="text-xs font-mono text-gray-500">MEM-{item.id.toString().padStart(3, '0')}</p>
                          </div>
                          <div className="text-xs text-gray-400">
                            {item.createdAt || 'Recently'}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="mb-4">
                          <p className="text-sm text-gray-900 leading-relaxed">
                            {item.data}
                          </p>
                        </div>

                        {/* Metadata */}
                        <div className="bg-gray-50 rounded-xl p-3 mb-4">
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="text-gray-500">Last accessed:</span>
                              <p className="font-medium text-gray-900">{item.lastAccessed || 'Never'}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Access count:</span>
                              <p className="font-medium text-gray-900">{item.accessCount || 0}</p>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => startEditMemory(item)}
                            className="flex-1 px-3 py-2 bg-black text-white rounded-3xl hover:bg-gray-800 text-sm font-medium transition-colors"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => deleteMemory(item.id)}
                            className="px-4 py-2 text-gray-600 hover:text-red-600 rounded-3xl text-sm font-medium transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No memories stored</h4>
                    <p className="text-gray-500 text-sm mb-4">Store information for your AI to remember</p>
                    <button
                      onClick={() => setShowNewMemoryForm(true)}
                      className="px-6 py-2 bg-black text-white rounded-3xl hover:bg-gray-800 text-sm font-medium transition-all duration-200"
                    >
                      Add Memory
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

          {/* Voice Recording Modal */}
          <VoiceRecording
            isOpen={showVoiceRecording}
            onClose={() => setShowVoiceRecording(false)}
            isDarkMode={false}
            onTranscriptComplete={(transcript) => {
              if (transcript && transcript.trim()) {
                setInputText(transcript.trim());
              }
            }}
          />
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
