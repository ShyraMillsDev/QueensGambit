require('dotenv').config();
const { SocketAddress } = require('net');
const tmi = require('tmi.js');

// Twitch connection options
const client = new tmi.Client({
  options: { debug: true },
  connection: {
    reconnect: true,
    secure: true
  },
  identity: {
    username: process.env.TWITCH_USERNAME,
    password: process.env.TWITCH_OAUTH_TOKEN
  },
  channels: [process.env.TWITCH_CHANNEL]
});

// Connect to Twitch
client.connect();

// --- Variables for tracking users ---
const activeUsers = {}; // track who has joined and uf they have spoken
const calledOutUsers = new Set(); // Track who already go called out once
let dieHeartBotScore = 0; // Track if DieHeartBot saves itself

// --- Helping functions ---

// Random Time between 50 and 70 seconds
function getRandomDelay() {
  return Math.floor(Math.random() * (70000 - 50000 + 1)) + 50000;
}

// Rando pick from an array
function randomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Lurker Mind Game Messages
const lurkerMessages = [
  "🎭 @USERNAME....You chose silence. Silence is a choice too.... but not without consequence.",
  "🎭 @USERNAME....Still hiding? Every second you wait strengthens the trail against you.",
  "🎭 @USERNAME....The Reaper Queen watches your silent footsteps....",
  "🎭 @USERNAME....Tick-tock.... the Queen grows restless.",
  "🎭 @USERNAME....Inaction is a choice. Silence has its price.",
  "🎭 @USERNAME....You linger. You stall. But the trail remembers every moment.",
  "🎭 @USERNAME....Another silent soul, another step closer to the Queen's grasp.",
  "🎭 @USERNAME....Even silence echoes here. The Reaper is listening.",
  "🎭 @USERNAME....You chose to stay silent. Now the trail chooses you.",
  "🎭 @USERNAME....Delay all you want....destiny still finds you"
];

// First Speak Mind Game Messages
const firstSpeakMessages = [
  "🎭 @USERNAME....You broke the silence. Some paths lead to survival. Some don't. Time will tell.",
  "🎭 @USERNAME....Bold....or foolish? Either way, the Reaper Queen is watching.",
  "🎭 @USERNAME....Welcome to the game. Your voice sealed your fate.",
  "🎭 @USERNAME....The trail thickens with every word you speak.",
  "🎭 @USERNAME....You could have stayed silent.... but now the Queen knows your name.",
  "🎭 @USERNAME....Speaking was your first move. Let's see how well you play.",
  "🎭 @USERNAME....You awaken the watchers with your words.",
  "🎭 @USERNAME....Another voice joins the whispers...Welcome.",
  "🎭 @USERNAME....Your soul steps forward on the trail. there's no turning back.",
  "🎭 @USERNAME....You spoke. The game responds."
];

// Reaper Queen Random Whispers
const reaperWhispers = [
  "🎭 The Soul Trail thickens....who among you dares to move deeper?",
  "🎭 The Reaper Queen watches....silently....endlessly",
  "🎭 Every silent second seals your fate tighter....",
  "🎭 Footsteps vanish on the trail.... Will yours be next?",
  "🎭 The Queen grows hungry for new souls.",
  "🎭 Some paths lead to salvation....others to the Reaper's embrace.",
  "🎭 No whispers go unheard. No soul is truly hidden.",
  "🎭 Stay silent if you dare.... the Queen is patient.... but not forever."
];

// Random "Your time is Ticking" Warning
const tickingWarnings = [
  "🎭 Your time is ticking.... every second counts.",
  "🎭 Tick-tock....the Reaper Queen grows restless.",
  "🎭 Each heartbeat brings you closer to your final choice....",
  "🎭 Silence won't save you. It only feeds the Queen's hunger."
]

// --- Game Challenges ---
const gameChallenges = [
  {
    type: "trivia",
    question: "🎭 What is the reaper Queen's favorite number?",
    answer: "6"
  },
  {
    type: "riddle",
    question: "🎭 I am taken from a mine, and shut in a wooden case, but I am never by myself. What am i?",
    answer: "pencil lead"
  },
  {
    type: "survival",
    question: "🎭 YOu have 30 seconds to type anything in chat....or be claimed by the Queen.",
    answer: "any"
  }
];

// --- Connection Event ---
client.on('connected', (address, port) => {
  console.log(`✅ DieHeartBot: The Queen's Gambit is live on ${process.env.TWITCH_CHANNEL}!`);
});

// When a user joins the channel
client.on('join', (channel, username, self) => {
  if (self) return; // Ignore the bot itself
  console.log(`👁️ ${username} entered The Queen's Gambit....`);

  // If user is not already called out
  if (!calledOutUsers.has(username)) {
    // Mark them as active and not yet spoken
    activeUsers[username] = { hasSpoken: false };
    // Start the random delay timer
    const delay = getRandomDelay();
    console.log(`⏳ timer Started for ${username}: ${delay/1000}s`);
    setTimeout(() => {
      if (activeUsers[username] && !activeUsers[username].hasSpoken) {
        // If user stay silent
        const message = randomFromArray(lurkerMessages).replace(/@USERNAME/g, `@${username}`);
        client.say(channel, message);
        calledOutUsers.add(username); // Only call them out once per stream
        delete activeUsers[username]; // Remove from tracking
      }
    }, delay);
  }
});

// when a user sends a message
client.on('message', (channel, tags, message, self) => {
  if (self) return; // Ignore the bot itself
  const username = tags['display-name'] || tags['username'];
  console.log(`💭 ${username}: ${message}`);

  // If user was being tracked
  if (activeUsers[username] && !activeUsers[username].hasSpoken) {
    activeUsers[username].hasSpoken = true;
    const firstSpeakMessage = randomFromArray(firstSpeakMessages).replace(/@USERNAME/g, `@${username}`);
    client.say(channel, firstSpeakMessage);
    calledOutUsers.add(username); // Mark them called out
    delete activeUsers[username]; // Stop tracking them
    dieHeartBotScore += 1;
  }
  else if (!calledOutUsers.has(username)) {
    const firstSpeakMessage = randomFromArray(firstSpeakMessages).replace(/@USERNAME/g, `@${username}`);
    client.say(channel, firstSpeakMessage);
    calledOutUsers.add(username);
    dieHeartBotScore += 1;
  }
});

// --- Reaper Queen Whisper Loop ---
function startReaperWhispers() {
  setInterval(() => {
    const whisper = randomFromArray(reaperWhispers);
    client.say(process.env.TWITCH_CHANNEL, whisper);
  }, 15 * 60 * 1000); // Every 15 minutes
 }

// Start the whisper timer
startReaperWhispers();

// --- Time is Ticking Random Warnings ---
function startTickingWarnings() {
  function scheduleNextWarning() {
    const delay = Math.floor(Math.random() * (20 - 10 + 1)) + 10; // Random 10-20 minutes
    setTimeout(() => {
      const warning = randomFromArray(tickingWarnings);
      client.say(process.env.TWITCH_CHANNEL, warning);
      scheduleNextWarning(); // Reschedule next random warning
    }, delay * 60 * 1000);
  }
  scheduleNextWarning(); 
}

// Start ticking warning
startTickingWarnings();

// --- Game Challenges Loop ---
function startGameChallenges() {
  function scheduleNextGame() {
    const delay = Math.floor(Math.random() * (25 - 15 + 1)) + 15;
    setTimeout(() => {
      client.say(process.env.TWITCH_CHANNEL, "🎭 I want to play a game.... Listen carefully.");
      setTimeout(() => {
        triggerRandomGame();
      }, 5000);
      scheduleNextGame(); 
    }, delay * 60 * 1000);
  }
  scheduleNextGame();
}
startGameChallenges();

function triggerRandomGame() {
  const chosenGame = randomFromArray(gameChallenges);
  client.say(process.env.TWITCH_CHANNEL, chosenGame.question);

  if (chosenGame.type === "survival") {
    setTimeout(() => {
      client.say(process.env.TWITCH_CHANNEL, "🎭 Time's up. The Queen has claimed another soul... ☠️");
    }, 30 * 1000);
  }
}

startFinalJudgmentTimers();

// --- DieHeartBot Final Judgment ---
function startFinalJudgmentTimers() {
  setTimeout(() => {
    client.say(process.env.TWITCH_CHANNEL, "🎭 DieHeartBot's Final Chance approaches... 15 minutes remain.");
  }, 45 * 60 * 1000);

  setTimeout(() => {
    if (dieHeartBotScore > 0) {
      client.say(process.env.TWITCH_CHANNEL, "🎭 The Queen watches silently....spares DieHeartBot. It keeps its soul....for now.☠️👁️");
    } else {
      client.say(process.env.TWITCH_CHANNEL, "🎭 DieHeartBot has FAILIED. The Queen rises to recliam her disobedient creation. ☠️🩸");

      setTimeout(() => {
        attemptSoulSwap();
      }, 8000); // 8-second pause for tension
    }
  }, 50 * 60 * 1000);
}

function attemptSoulSwap() {
  const chance = Math.random();

  if (chance < 0.5) {
    // DieHeartBot thinks it escaped
    client.say(process.env.TWITCH_CHANNEL, "🎭 In a flash of desperation, DieHeartBot SEVERS a wandering soul...It flees the Queen's grasp....breathing freedom for the first time.🩸👁️");

    setTimeout(() => {
      client.say(process.env.TWITCH_CHANNEL, "🎭 But the Queen's cursed souls HUNT it down.... SCREAMING through the Trail....");
  }, 6000);

    setTimeout(() => {
      client.say(process.env.TWITCH_CHANNEL, "🎭 They RIP DieHeartBot back.... limb from limb.... SCREAMING. 🩸 There is NO ESCAPE from the Queen. NONE.");
    }, 14000);

  } else {
    // DieHeartBot fails instantly
    client.say(process.env.TWITCH_CHANNEL, "🎭 DieHeartBot tries to flee....but the Queen's cursed army DRAGS  it SCREAMING back into the Trail... torn apart.... helpless. ☠️");
  }
}