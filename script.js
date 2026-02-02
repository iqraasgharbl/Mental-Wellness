// Authentication System
let currentUser = null;
let breathingInterval = null;
let breathingPhase = 'in';
let breathingCycle = 0;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    setupEventListeners();
});

// Check if user is logged in
function checkAuthStatus() {
    const user = localStorage.getItem('currentUser');
    if (user) {
        currentUser = JSON.parse(user);
        showUserFeatures();
    } else {
        hideUserFeatures();
    }
}

// Show user-specific features
function showUserFeatures() {
    document.getElementById('auth-buttons').style.display = 'none';
    document.getElementById('user-menu').style.display = 'block';
    document.getElementById('dashboard-nav').style.display = 'block';
    document.getElementById('journal-nav').style.display = 'block';
    document.getElementById('breathing-nav').style.display = 'block';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('journal').style.display = 'block';
    document.getElementById('breathing').style.display = 'block';
    document.getElementById('username-display').textContent = currentUser.name;
    document.getElementById('dashboard-username').textContent = currentUser.name;
    updateDashboard();
    loadJournalEntries();
    loadChecklistState();
}

// Hide user-specific features
function hideUserFeatures() {
    document.getElementById('auth-buttons').style.display = 'block';
    document.getElementById('user-menu').style.display = 'none';
    document.getElementById('dashboard-nav').style.display = 'none';
    document.getElementById('journal-nav').style.display = 'none';
    document.getElementById('breathing-nav').style.display = 'none';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('journal').style.display = 'none';
    document.getElementById('breathing').style.display = 'none';
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('signupForm').addEventListener('submit', handleSignup);
}

// Open login modal
function openLoginModal() {
    const signupModal = bootstrap.Modal.getInstance(document.getElementById('signupModal'));
    if (signupModal) signupModal.hide();
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    loginModal.show();
}

// Open signup modal
function openSignupModal() {
    const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
    if (loginModal) loginModal.hide();
    const signupModal = new bootstrap.Modal(document.getElementById('signupModal'));
    signupModal.show();
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        currentUser = { name: user.name, email: user.email };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
        showUserFeatures();
        errorDiv.style.display = 'none';
        document.getElementById('loginForm').reset();
    } else {
        errorDiv.textContent = 'Invalid email or password';
        errorDiv.style.display = 'block';
    }
}

// Handle signup
function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const errorDiv = document.getElementById('signup-error');

    let users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.find(u => u.email === email)) {
        errorDiv.textContent = 'Email already registered';
        errorDiv.style.display = 'block';
        return;
    }

    users.push({ name, email, password });
    localStorage.setItem('users', JSON.stringify(users));
    
    currentUser = { name, email };
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Initialize user data
    localStorage.setItem(`user_${email}_moods`, JSON.stringify([]));
    localStorage.setItem(`user_${email}_journal`, JSON.stringify([]));
    localStorage.setItem(`user_${email}_checklist`, JSON.stringify([]));

    bootstrap.Modal.getInstance(document.getElementById('signupModal')).hide();
    showUserFeatures();
    errorDiv.style.display = 'none';
    document.getElementById('signupForm').reset();
}

// Logout
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    hideUserFeatures();
    window.location.href = '#hero';
}

// Update Dashboard
function updateDashboard() {
    if (!currentUser) return;
    
    const moods = JSON.parse(localStorage.getItem(`user_${currentUser.email}_moods`) || '[]');
    const journal = JSON.parse(localStorage.getItem(`user_${currentUser.email}_journal`) || '[]');
    const checklist = JSON.parse(localStorage.getItem(`user_${currentUser.email}_checklist`) || '[]');

    document.getElementById('mood-count').textContent = moods.length;
    document.getElementById('journal-count').textContent = journal.length;
    document.getElementById('checklist-count').textContent = checklist.length;

    // Calculate progress
    const totalActivities = moods.length + journal.length + checklist.length;
    const progress = Math.min(100, (totalActivities / 30) * 100);
    document.getElementById('overall-progress').style.width = progress + '%';

    // Display mood history
    const moodHistoryList = document.getElementById('mood-history-list');
    if (moods.length > 0) {
        const recentMoods = moods.slice(-5).reverse();
        moodHistoryList.innerHTML = recentMoods.map(mood => `
            <div class="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
                <span><i class="bi bi-emoji-${getMoodIcon(mood.mood)} me-2"></i>${mood.mood.charAt(0).toUpperCase() + mood.mood.slice(1)}</span>
                <small class="text-muted">${new Date(mood.date).toLocaleDateString()}</small>
            </div>
        `).join('');
    } else {
        moodHistoryList.innerHTML = '<p class="text-muted">No mood entries yet</p>';
    }

    // Personalized tips
    const tipsDiv = document.getElementById('personalized-tips');
    if (moods.length === 0) {
        tipsDiv.innerHTML = '<p class="text-muted">Start tracking your mood to get personalized tips!</p>';
    } else {
        const lastMood = moods[moods.length - 1].mood;
        const tips = getPersonalizedTips(lastMood);
        tipsDiv.innerHTML = '<ul class="list-unstyled">' + tips.map(tip => `<li class="mb-2"><i class="bi bi-check-circle text-success me-2"></i>${tip}</li>`).join('') + '</ul>';
    }
}

function getMoodIcon(mood) {
    const icons = {
        happy: 'heart-eyes-fill',
        calm: 'smile-fill',
        anxious: 'neutral-fill',
        sad: 'frown-fill',
        energetic: 'lightning-charge-fill',
        tired: 'moon-fill'
    };
    return icons[mood] || 'smile-fill';
}

function getPersonalizedTips(mood) {
    const tips = {
        happy: [
            "Keep doing what brings you joy!",
            "Share your positive energy with others.",
            "Document what made you happy today."
        ],
        calm: [
            "Maintain this peaceful state with meditation.",
            "Practice gratitude to enhance your calm.",
            "Take time for activities you enjoy."
        ],
        anxious: [
            "Try the breathing exercise to calm your mind.",
            "Take a walk in nature if possible.",
            "Write in your journal about your feelings."
        ],
        sad: [
            "Remember, it's okay to feel sad sometimes.",
            "Reach out to someone you trust.",
            "Try a self-care activity from your checklist."
        ],
        energetic: [
            "Channel this energy into something creative!",
            "Go for a walk or exercise.",
            "Help someone or start a new project."
        ],
        tired: [
            "Rest is important - listen to your body.",
            "Ensure you're getting enough sleep.",
            "Take breaks and don't overexert yourself."
        ]
    };
    return tips[mood] || ["Keep tracking your mood daily!", "Stay consistent with your self-care routine."];
}

const quotes = [
    "You are enough, just as you are. Every small step you take towards self-care is a victory.",
    "Self-care is not selfish. It's essential. You cannot pour from an empty cup.",
    "Be gentle with yourself. You're doing the best you can, and that's more than enough.",
    "Your mental health is a priority. Your happiness is essential. Your self-care is a necessity.",
    "Take time to do what makes your soul happy. You deserve moments of peace and joy.",
    "Progress, not perfection. Every day is a new opportunity to care for yourself.",
    "You are stronger than you think. You've survived every difficult day so far.",
    "It's okay to not be okay. What matters is that you're taking steps to feel better.",
    "Self-care is giving the world the best of you, instead of what's left of you.",
    "Your feelings are valid. Your experiences matter. You matter.",
    "Rest is not a reward for finishing your work. Rest is part of the work.",
    "You don't have to be perfect to be worthy of love and care, including your own.",
    "Small steps every day lead to big changes over time. Be patient with yourself.",
    "Your peace of mind is worth more than any material possession. Protect it fiercely.",
    "Remember: healing is not linear. It's okay to have good days and bad days."
];

let currentQuoteIndex = 0;

function getNewQuote() {
    
    currentQuoteIndex++;
    
    if (currentQuoteIndex >= quotes.length) {
        currentQuoteIndex = 0;
    }

    const quoteText = document.getElementById('quote-text');

    // Fade out
    quoteText.style.opacity = '0';
    quoteText.style.transform = 'translateY(-10px)';

    setTimeout(() => {
        // Update text
        quoteText.textContent = `"${quotes[currentQuoteIndex]}"`;
        // Fade in
        quoteText.style.opacity = '1';
        quoteText.style.transform = 'translateY(0)';
    }, 300);
}

function resetChecklist(event) {
    const checkboxes = document.querySelectorAll('#checklist input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });

    // Save checklist state
    if (currentUser) {
        const checklistData = Array.from(checkboxes).map(cb => ({ id: cb.id, checked: false }));
        localStorage.setItem(`user_${currentUser.email}_checklist`, JSON.stringify(checklistData));
        updateDashboard();
    }

    // Confirmation
    const btn = event ? event.target.closest('button') : document.querySelector('#checklist button');
    if (btn) {
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i>Reset!';
        btn.classList.add('btn-success');
        btn.classList.remove('btn-outline-secondary');

        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('btn-success');
            btn.classList.add('btn-outline-secondary');
        }, 2000);
    }
}

// Save checklist state
document.addEventListener('DOMContentLoaded', function() {
    loadChecklistState();
    const checkboxes = document.querySelectorAll('#checklist input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (currentUser) {
                const checklistData = Array.from(checkboxes).map(cb => ({ id: cb.id, checked: cb.checked }));
                localStorage.setItem(`user_${currentUser.email}_checklist`, JSON.stringify(checklistData));
                updateDashboard();
            }
        });
    });
});

function loadChecklistState() {
    if (!currentUser) return;
    
    const savedData = JSON.parse(localStorage.getItem(`user_${currentUser.email}_checklist`) || '[]');
    if (savedData.length > 0) {
        savedData.forEach(item => {
            const checkbox = document.getElementById(item.id);
            if (checkbox) {
                checkbox.checked = item.checked;
            }
        });
    }
}

// Mood Selection
const moodMessages = {
    happy: "That's wonderful! Keep doing what brings you joy. Remember to celebrate these moments.",
    calm: "Peace and tranquility are beautiful states. Enjoy this sense of balance and serenity.",
    anxious: "It's okay to feel anxious. Take deep breaths, try the breathing exercise, and remember this feeling will pass.",
    sad: "Your feelings are valid. It's okay to feel sad. Consider reaching out to someone you trust or trying a self-care activity.",
    energetic: "Great energy! Channel it into something positive - maybe a walk, creative project, or helping someone.",
    tired: "Rest is important. Listen to your body and give yourself permission to slow down and recharge."
};

function selectMood(mood) {
    // Remove previous selection
    document.querySelectorAll('.mood-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Add selection to clicked item
    const selectedItem = document.querySelector(`[data-mood="${mood}"]`);
    selectedItem.classList.add('selected');
    
    // Show message
    const messageDiv = document.getElementById('mood-message');
    messageDiv.textContent = moodMessages[mood];
    messageDiv.classList.add('show');
    
    // Save mood if user is logged in
    if (currentUser) {
        const moods = JSON.parse(localStorage.getItem(`user_${currentUser.email}_moods`) || '[]');
        moods.push({
            mood: mood,
            date: new Date().toISOString()
        });
        localStorage.setItem(`user_${currentUser.email}_moods`, JSON.stringify(moods));
        updateDashboard();
    }
    
    // Scroll to message smoothly
    setTimeout(() => {
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

// Breathing Exercise Functions
let breathingAnimation = null;
let breathingStartTime = null;

function startBreathingExercise() {
    const circle = document.getElementById('breathing-circle');
    const text = document.getElementById('breathing-text');
    const startBtn = document.getElementById('start-breathing-btn');
    const stopBtn = document.getElementById('stop-breathing-btn');
    
    startBtn.style.display = 'none';
    stopBtn.style.display = 'inline-block';
    
    breathingStartTime = Date.now();
    breathingCycle = 0;
    breathingPhase = 'in';
    text.textContent = 'Breathe In';
    circle.style.transform = 'scale(1)';
    circle.style.transition = 'transform 4s ease-in-out';
    
    function animateBreathing() {
        const elapsed = (Date.now() - breathingStartTime) / 1000;
        const cycleTime = elapsed % 10; // 10 second cycle
        
        if (cycleTime < 4) {
            // Breathe in (0-4 seconds)
            breathingPhase = 'in';
            text.textContent = 'Breathe In';
            const progress = cycleTime / 4;
            const scale = 1 + (progress * 0.5);
            circle.style.transform = `scale(${scale})`;
        } else if (cycleTime < 6) {
            // Hold (4-6 seconds)
            breathingPhase = 'hold';
            text.textContent = 'Hold';
            circle.style.transform = 'scale(1.5)';
        } else {
            // Breathe out (6-10 seconds)
            breathingPhase = 'out';
            text.textContent = 'Breathe Out';
            const progress = (cycleTime - 6) / 4;
            const scale = 1.5 - (progress * 0.5);
            circle.style.transform = `scale(${scale})`;
        }
        
        breathingAnimation = requestAnimationFrame(animateBreathing);
    }
    
    animateBreathing();
}

function stopBreathingExercise() {
    if (breathingAnimation) {
        cancelAnimationFrame(breathingAnimation);
        breathingAnimation = null;
    }
    
    const circle = document.getElementById('breathing-circle');
    const text = document.getElementById('breathing-text');
    const startBtn = document.getElementById('start-breathing-btn');
    const stopBtn = document.getElementById('stop-breathing-btn');
    
    circle.style.transform = 'scale(1)';
    circle.style.transition = 'transform 0.5s ease-in-out';
    text.textContent = 'Breathe In';
    startBtn.style.display = 'inline-block';
    stopBtn.style.display = 'none';
    breathingCycle = 0;
    breathingPhase = 'in';
    breathingStartTime = null;
}

// Journal Functions
function saveJournalEntry(event) {
    if (event) event.preventDefault();
    
    if (!currentUser) {
        alert('Please login to save journal entries');
        return;
    }
    
    const title = document.getElementById('journal-title').value.trim();
    const content = document.getElementById('journal-content').value.trim();
    
    if (!title || !content) {
        alert('Please fill in both title and content');
        return;
    }
    
    const entries = JSON.parse(localStorage.getItem(`user_${currentUser.email}_journal`) || '[]');
    entries.push({
        title: title,
        content: content,
        date: new Date().toISOString()
    });
    
    localStorage.setItem(`user_${currentUser.email}_journal`, JSON.stringify(entries));
    
    document.getElementById('journal-title').value = '';
    document.getElementById('journal-content').value = '';
    
    loadJournalEntries();
    updateDashboard();
    
    // Show success message
    const btn = event ? event.target : document.querySelector('#journal button.btn-primary');
    if (btn) {
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i>Saved!';
        btn.classList.add('btn-success');
        btn.classList.remove('btn-primary');
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('btn-success');
            btn.classList.add('btn-primary');
        }, 2000);
    }
}

function loadJournalEntries() {
    if (!currentUser) return;
    
    const entries = JSON.parse(localStorage.getItem(`user_${currentUser.email}_journal`) || '[]');
    const entriesList = document.getElementById('journal-entries-list');
    
    if (entries.length === 0) {
        entriesList.innerHTML = '<p class="text-muted">No entries yet. Start writing to see your journal entries here.</p>';
        return;
    }
    
    entriesList.innerHTML = entries.reverse().map((entry, index) => `
        <div class="card shadow-sm border-0 mb-3">
            <div class="card-body p-4">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h6 class="card-title mb-0">${entry.title}</h6>
                    <small class="text-muted">${new Date(entry.date).toLocaleDateString()}</small>
                </div>
                <p class="card-text text-muted">${entry.content}</p>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteJournalEntry(${entries.length - 1 - index})">
                    <i class="bi bi-trash me-1"></i>Delete
                </button>
            </div>
        </div>
    `).join('');
}

function deleteJournalEntry(index) {
    if (!currentUser) return;
    if (!confirm('Are you sure you want to delete this entry?')) return;
    
    const entries = JSON.parse(localStorage.getItem(`user_${currentUser.email}_journal`) || '[]');
    entries.splice(index, 1);
    localStorage.setItem(`user_${currentUser.email}_journal`, JSON.stringify(entries));
    loadJournalEntries();
    updateDashboard();
}
