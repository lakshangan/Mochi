import { exec } from 'child_process';
import { promisify } from 'util';
import { SystemActivityEvent, AppActivityCategory, PetAnimationState } from '../../shared/types';

const execAsync = promisify(exec);

let electronScreen: typeof import('electron').screen | null = null;
let electronPowerMonitor: typeof import('electron').powerMonitor | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const electron = require('electron');
  electronScreen = electron.screen;
  electronPowerMonitor = electron.powerMonitor;
} catch {
  // Safe in non-electron test environments
}

export interface AppClassification {
  formattedName: string;
  category: AppActivityCategory;
  state: PetAnimationState;
  title: string;
  subtitles: string[];
}

const DEV_SUBTITLES = [
  "You're in the zone ✨",
  'Loving this code momentum!',
  'Clean code, one function at a time 🚀',
  'Deep focus mode online ✨',
  'Take a deep breath and keep building 🌿',
  'Zero distractions — you got this!',
  'Crafting something great today ✨',
];

const TYPING_SUBTITLES = [
  "You're locked in 🎯",
  'Loving your pace today ✨',
  'Thoughts turning into reality 💡',
  'In a great flow state ✨',
  'Brilliant focus right now 🚀',
  'Great typing rhythm!',
  'Steady progress, step by step ✨',
];

const APP_DATABASE: Record<string, AppClassification> = {
  // Development - Core Editors
  code: {
    formattedName: 'VS Code',
    category: 'development',
    state: 'coding',
    title: 'VS Code Dev Mode',
    subtitles: DEV_SUBTITLES,
  },
  'visual studio code': {
    formattedName: 'VS Code',
    category: 'development',
    state: 'coding',
    title: 'VS Code Dev Mode',
    subtitles: DEV_SUBTITLES,
  },
  vscode: {
    formattedName: 'VS Code',
    category: 'development',
    state: 'coding',
    title: 'VS Code Dev Mode',
    subtitles: DEV_SUBTITLES,
  },
  antigravity: {
    formattedName: 'Antigravity IDE',
    category: 'development',
    state: 'coding',
    title: 'Antigravity Workspace',
    subtitles: DEV_SUBTITLES,
  },
  'antigravity ide': {
    formattedName: 'Antigravity IDE',
    category: 'development',
    state: 'coding',
    title: 'Antigravity Workspace',
    subtitles: DEV_SUBTITLES,
  },
  vscodium: {
    formattedName: 'VSCodium',
    category: 'development',
    state: 'coding',
    title: 'Code Editor',
    subtitles: DEV_SUBTITLES,
  },
  cursor: {
    formattedName: 'Cursor AI',
    category: 'development',
    state: 'coding',
    title: 'Cursor AI Workspace',
    subtitles: [
      'AI-assisted coding session in progress!',
      'Writing software with AI precision.',
      'Prompting & coding in Cursor.',
    ],
  },
  zed: {
    formattedName: 'Zed Editor',
    category: 'development',
    state: 'coding',
    title: 'Zed High-Performance Code',
    subtitles: ['Lightning-fast coding in Zed.', 'High-performance editor active.'],
  },
  'sublime text': {
    formattedName: 'Sublime Text',
    category: 'development',
    state: 'coding',
    title: 'Sublime Text Studio',
    subtitles: ['Crafting code in Sublime Text.', 'Blazing fast text editing.'],
  },
  sublime_text: {
    formattedName: 'Sublime Text',
    category: 'development',
    state: 'coding',
    title: 'Sublime Text Studio',
    subtitles: ['Crafting code in Sublime Text.', 'Blazing fast text editing.'],
  },
  subl: {
    formattedName: 'Sublime Text',
    category: 'development',
    state: 'coding',
    title: 'Sublime Text Studio',
    subtitles: ['Crafting code in Sublime Text.'],
  },
  xcode: {
    formattedName: 'Xcode',
    category: 'development',
    state: 'coding',
    title: 'Apple Development',
    subtitles: [
      'Building for Apple platforms in Xcode.',
      'Compiling Swift & SwiftUI magic.',
      'Shipping iOS & macOS features.',
    ],
  },

  // Terminals & Shells
  terminal: {
    formattedName: 'Terminal',
    category: 'development',
    state: 'coding',
    title: 'CLI Console',
    subtitles: ['Running shell commands & scripts.', 'Terminal power user at work.'],
  },
  iterm: {
    formattedName: 'iTerm2',
    category: 'development',
    state: 'coding',
    title: 'iTerm2 Console',
    subtitles: ['Running shell commands & builds.', 'Hacking in the terminal.'],
  },
  warp: {
    formattedName: 'Warp',
    category: 'development',
    state: 'coding',
    title: 'Warp Terminal',
    subtitles: ['Modern CLI session active.', 'Running AI commands smoothly.'],
  },
  ghostty: {
    formattedName: 'Ghostty',
    category: 'development',
    state: 'coding',
    title: 'Ghostty Terminal',
    subtitles: ['Fast GPU terminal in action.', 'Compiling & running commands.'],
  },
  kitty: {
    formattedName: 'Kitty',
    category: 'development',
    state: 'coding',
    title: 'Kitty Terminal',
    subtitles: ['Fast terminal rendering active.', 'CLI development flow.'],
  },
  alacritty: {
    formattedName: 'Alacritty',
    category: 'development',
    state: 'coding',
    title: 'Alacritty Terminal',
    subtitles: ['GPU-accelerated terminal.', 'Terminal flow state.'],
  },
  wezterm: {
    formattedName: 'WezTerm',
    category: 'development',
    state: 'coding',
    title: 'WezTerm Terminal',
    subtitles: ['Multiplexed terminal session.', 'CLI productivity.'],
  },

  // JetBrains IDEs
  webstorm: {
    formattedName: 'WebStorm',
    category: 'development',
    state: 'coding',
    title: 'WebStorm IDE',
    subtitles: ['Crafting web applications.', 'Full-stack development flow.'],
  },
  intellij: {
    formattedName: 'IntelliJ IDEA',
    category: 'development',
    state: 'coding',
    title: 'IntelliJ IDE',
    subtitles: ['Heavyweight engineering session.', 'Deep in backend code.'],
  },
  pycharm: {
    formattedName: 'PyCharm',
    category: 'development',
    state: 'coding',
    title: 'PyCharm IDE',
    subtitles: ['Writing Python solutions.', 'Data & Python development.'],
  },
  clion: {
    formattedName: 'CLion',
    category: 'development',
    state: 'coding',
    title: 'CLion C/C++ Studio',
    subtitles: ['System-level C++ engineering.', 'Optimizing performance.'],
  },
  goland: {
    formattedName: 'GoLand',
    category: 'development',
    state: 'coding',
    title: 'GoLand Studio',
    subtitles: ['Building concurrent Go services.', 'Writing idiomatic Go.'],
  },
  rider: {
    formattedName: 'JetBrains Rider',
    category: 'development',
    state: 'coding',
    title: 'Rider .NET Studio',
    subtitles: ['C# and game development.', 'Engineering with Rider.'],
  },
  'android studio': {
    formattedName: 'Android Studio',
    category: 'development',
    state: 'coding',
    title: 'Android Studio',
    subtitles: ['Building Android apps & Kotlin.', 'Mobile engineering flow.'],
  },

  // Console Editors
  neovim: {
    formattedName: 'Neovim',
    category: 'development',
    state: 'coding',
    title: 'Neovim Modal Flow',
    subtitles: ['Vim motions at lightspeed!', 'Modal editing mastery.'],
  },
  nvim: {
    formattedName: 'Neovim',
    category: 'development',
    state: 'coding',
    title: 'Neovim Modal Flow',
    subtitles: ['Vim motions at lightspeed!', 'Modal editing mastery.'],
  },
  vim: {
    formattedName: 'Vim',
    category: 'development',
    state: 'coding',
    title: 'Vim Editor',
    subtitles: ['Modal keyboard editing.', 'Quick terminal edits.'],
  },
  emacs: {
    formattedName: 'Emacs',
    category: 'development',
    state: 'coding',
    title: 'GNU Emacs',
    subtitles: ['The extensible editor.', 'Hacking in lisp & text.'],
  },

  // Dev Tools & DBs
  postman: {
    formattedName: 'Postman',
    category: 'development',
    state: 'focused',
    title: 'API Testing',
    subtitles: ['Testing endpoints & payloads.', 'Refining REST/GraphQL APIs.'],
  },
  insomnia: {
    formattedName: 'Insomnia',
    category: 'development',
    state: 'focused',
    title: 'API Client',
    subtitles: ['Debugging HTTP requests.', 'Testing API schemas.'],
  },
  tableplus: {
    formattedName: 'TablePlus',
    category: 'development',
    state: 'focused',
    title: 'Database Management',
    subtitles: ['Querying database records.', 'Optimizing SQL queries.'],
  },
  dbeaver: {
    formattedName: 'DBeaver',
    category: 'development',
    state: 'focused',
    title: 'Database Studio',
    subtitles: ['Exploring data schemas.', 'Running SQL scripts.'],
  },
  docker: {
    formattedName: 'Docker',
    category: 'development',
    state: 'focused',
    title: 'Docker Containers',
    subtitles: ['Managing container clusters.', 'Orchestrating microservices.'],
  },
  github: {
    formattedName: 'GitHub',
    category: 'development',
    state: 'focused',
    title: 'Version Control',
    subtitles: ['Reviewing commits and PRs.', 'Shipping code updates.'],
  },

  // Design
  figma: {
    formattedName: 'Figma',
    category: 'design',
    state: 'curious',
    title: 'Figma Design',
    subtitles: ['Designing interfaces & components.', 'Crafting sleek UI & UX magic.'],
  },
  sketch: {
    formattedName: 'Sketch',
    category: 'design',
    state: 'curious',
    title: 'Sketch Vector Studio',
    subtitles: ['Vector design in progress.', 'Refining typography & icons.'],
  },
  photoshop: {
    formattedName: 'Adobe Photoshop',
    category: 'design',
    state: 'curious',
    title: 'Photoshop Studio',
    subtitles: ['Retouching & creating visuals.', 'Art in the making.'],
  },
  illustrator: {
    formattedName: 'Adobe Illustrator',
    category: 'design',
    state: 'curious',
    title: 'Illustrator Studio',
    subtitles: ['Vector artwork & typography.', 'Precision vector craft.'],
  },
  blender: {
    formattedName: 'Blender 3D',
    category: 'design',
    state: 'curious',
    title: 'Blender 3D Studio',
    subtitles: ['Modeling & rendering 3D scenes.', '3D creation in flow.'],
  },
  canva: {
    formattedName: 'Canva',
    category: 'design',
    state: 'curious',
    title: 'Canva Design',
    subtitles: ['Creating graphic assets.', 'Visual layout design.'],
  },

  // Browsers
  'google chrome': {
    formattedName: 'Google Chrome',
    category: 'browser',
    state: 'thinking',
    title: 'Web Research',
    subtitles: ['Exploring docs & web resources.', 'Researching solutions online.'],
  },
  chrome: {
    formattedName: 'Chrome',
    category: 'browser',
    state: 'thinking',
    title: 'Web Research',
    subtitles: ['Browsing documentation.', 'Researching online.'],
  },
  arc: {
    formattedName: 'Arc Browser',
    category: 'browser',
    state: 'thinking',
    title: 'Arc Web Space',
    subtitles: ['Browsing thoughtfully with Arc.', 'Researching in your spaces.'],
  },
  safari: {
    formattedName: 'Safari',
    category: 'browser',
    state: 'thinking',
    title: 'Safari Research',
    subtitles: ['Apple Safari browsing.', 'Reading documentation & articles.'],
  },
  firefox: {
    formattedName: 'Firefox',
    category: 'browser',
    state: 'thinking',
    title: 'Firefox Browser',
    subtitles: ['Browsing with Firefox.', 'Testing web standards.'],
  },
  brave: {
    formattedName: 'Brave',
    category: 'browser',
    state: 'thinking',
    title: 'Brave Browser',
    subtitles: ['Privacy browsing with Brave.', 'Searching solutions.'],
  },
  edge: {
    formattedName: 'Microsoft Edge',
    category: 'browser',
    state: 'thinking',
    title: 'Edge Browser',
    subtitles: ['Browsing with Microsoft Edge.', 'Exploring documentation.'],
  },

  // Communication & Messaging
  slack: {
    formattedName: 'Slack',
    category: 'communication',
    state: 'happy',
    title: 'Slack Workspace 💬',
    subtitles: ['Syncing with team channels 💬', 'Collaborating in Slack ✨', 'Catching up on workspace chats 💬'],
  },
  discord: {
    formattedName: 'Discord',
    category: 'communication',
    state: 'happy',
    title: 'Discord Community 💬',
    subtitles: ['Hanging out on Discord 💬', 'Catching up with community chats ✨', 'Chatting with friends 💬'],
  },
  teams: {
    formattedName: 'Microsoft Teams',
    category: 'communication',
    state: 'happy',
    title: 'Teams Meeting & Chat 💬',
    subtitles: ['Collaborating with team members 💬', 'Checking meetings and chats ✨'],
  },
  messages: {
    formattedName: 'Messages',
    category: 'communication',
    state: 'happy',
    title: 'iMessage Chat 💬',
    subtitles: ['Exchanging messages with friends 💬', 'Catching up on chats ✨', 'Keeping conversations flowing 💬'],
  },
  imessage: {
    formattedName: 'iMessage',
    category: 'communication',
    state: 'happy',
    title: 'iMessage Chat 💬',
    subtitles: ['Exchanging messages with friends 💬', 'Catching up on chats ✨'],
  },
  whatsapp: {
    formattedName: 'WhatsApp',
    category: 'communication',
    state: 'happy',
    title: 'WhatsApp Chat 💬',
    subtitles: ['Catching up on WhatsApp messages 💬', 'Chatting with friends & family ✨', 'Sending quick notes 💬'],
  },
  telegram: {
    formattedName: 'Telegram',
    category: 'communication',
    state: 'happy',
    title: 'Telegram Chats 💬',
    subtitles: ['Messaging in Telegram 💬', 'Checking channels and groups ✨'],
  },
  signal: {
    formattedName: 'Signal',
    category: 'communication',
    state: 'happy',
    title: 'Signal Private Chat 💬',
    subtitles: ['Secure chatting on Signal 💬', 'Catching up with close contacts ✨'],
  },
  wechat: {
    formattedName: 'WeChat',
    category: 'communication',
    state: 'happy',
    title: 'WeChat Chat 💬',
    subtitles: ['Messaging on WeChat 💬', 'Connecting with friends ✨'],
  },
  messenger: {
    formattedName: 'Messenger',
    category: 'communication',
    state: 'happy',
    title: 'Messenger Chat 💬',
    subtitles: ['Chatting on Messenger 💬', 'Exchanging notes with friends ✨'],
  },
  zoom: {
    formattedName: 'Zoom',
    category: 'communication',
    state: 'happy',
    title: 'Zoom Call 📹',
    subtitles: ['In a Zoom video call 📹', 'Meeting in progress ✨'],
  },
  skype: {
    formattedName: 'Skype',
    category: 'communication',
    state: 'happy',
    title: 'Skype Chat 💬',
    subtitles: ['Connecting on Skype 💬'],
  },

  // Social Media
  twitter: {
    formattedName: 'X (Twitter)',
    category: 'communication',
    state: 'curious',
    title: 'Browsing X (Twitter) 📱',
    subtitles: ['Scrolling through the timeline 📱', 'Catching up on trending posts ✨', 'Checking what the world is saying 🐦'],
  },
  x: {
    formattedName: 'X (Twitter)',
    category: 'communication',
    state: 'curious',
    title: 'Browsing X 📱',
    subtitles: ['Scrolling through the timeline 📱', 'Catching up on trending posts ✨'],
  },
  instagram: {
    formattedName: 'Instagram',
    category: 'communication',
    state: 'curious',
    title: 'Scrolling Instagram 📱',
    subtitles: ['Enjoying visual stories & reels 📸', 'Browsing posts on Instagram ✨', 'Taking a social scroll break 💫'],
  },
  reddit: {
    formattedName: 'Reddit',
    category: 'communication',
    state: 'curious',
    title: 'Reading Reddit 📱',
    subtitles: ['Exploring community discussions 📱', 'Reading the front page of the internet 🌟', 'Diving into interesting threads ✨'],
  },
  tiktok: {
    formattedName: 'TikTok',
    category: 'entertainment',
    state: 'curious',
    title: 'Watching TikTok 📱',
    subtitles: ['Scrolling through short clips 📱', 'Enjoying fun video highlights ✨'],
  },
  pinterest: {
    formattedName: 'Pinterest',
    category: 'design',
    state: 'curious',
    title: 'Browsing Pinterest 📌',
    subtitles: ['Finding aesthetic inspiration 📌', 'Pinning visual creative ideas ✨'],
  },
  threads: {
    formattedName: 'Threads',
    category: 'communication',
    state: 'curious',
    title: 'Browsing Threads 📱',
    subtitles: ['Catching conversations on Threads 📱'],
  },
  linkedin: {
    formattedName: 'LinkedIn',
    category: 'productivity',
    state: 'working',
    title: 'Browsing LinkedIn 💼',
    subtitles: ['Professional networking on LinkedIn 💼', 'Checking career updates & industry news ✨'],
  },
  facebook: {
    formattedName: 'Facebook',
    category: 'communication',
    state: 'curious',
    title: 'Browsing Facebook 📱',
    subtitles: ['Checking feed and updates 📱', 'Catching up with groups ✨'],
  },

  // Productivity & Office
  notion: {
    formattedName: 'Notion',
    category: 'productivity',
    state: 'focused',
    title: 'Notion Workspace 📝',
    subtitles: ['Organizing thoughts & project docs 📝', 'Structuring knowledge hub ⚡'],
  },
  obsidian: {
    formattedName: 'Obsidian',
    category: 'productivity',
    state: 'focused',
    title: 'Obsidian Vault 📝',
    subtitles: ['Connecting ideas & second brain 📝', 'Deep note-taking session ⚡'],
  },
  linear: {
    formattedName: 'Linear',
    category: 'productivity',
    state: 'focused',
    title: 'Linear Issue Tracking ⚡',
    subtitles: ['Tracking sprint cycles and issues ⚡', 'Planning the next release ✨'],
  },
  notes: {
    formattedName: 'Notes',
    category: 'productivity',
    state: 'focused',
    title: 'Quick Notes 📝',
    subtitles: ['Jotting down quick ideas 📝', 'Writing thoughts & plans ✨'],
  },
  reminders: {
    formattedName: 'Reminders',
    category: 'productivity',
    state: 'focused',
    title: 'Reminders & Tasks 📋',
    subtitles: ['Organizing your checklist 📋', 'Checking off daily goals ✨'],
  },
  calendar: {
    formattedName: 'Calendar',
    category: 'productivity',
    state: 'focused',
    title: 'Calendar Schedule 📅',
    subtitles: ['Reviewing meetings and schedule 📅', 'Planning out your day 🌟'],
  },
  mail: {
    formattedName: 'Mail',
    category: 'productivity',
    state: 'focused',
    title: 'Inbox Review ✉️',
    subtitles: ['Catching up on emails ✉️', 'Keeping your inbox tidy ✨'],
  },
  outlook: {
    formattedName: 'Outlook',
    category: 'productivity',
    state: 'focused',
    title: 'Outlook Email ✉️',
    subtitles: ['Managing messages and meetings ✉️'],
  },
  word: {
    formattedName: 'Microsoft Word',
    category: 'productivity',
    state: 'working',
    title: 'Word Document 📄',
    subtitles: ['Drafting and writing in Word 📄', 'Document authoring in flow ✨'],
  },
  excel: {
    formattedName: 'Microsoft Excel',
    category: 'productivity',
    state: 'focused',
    title: 'Excel Spreadsheet 📊',
    subtitles: ['Working with spreadsheets & models 📊', 'Crunching numbers in Excel ⚡'],
  },
  powerpoint: {
    formattedName: 'PowerPoint',
    category: 'productivity',
    state: 'working',
    title: 'PowerPoint Presentation 📽️',
    subtitles: ['Designing presentation slides 📽️'],
  },
  pages: {
    formattedName: 'Pages',
    category: 'productivity',
    state: 'working',
    title: 'Pages Document 📄',
    subtitles: ['Writing documents with Apple Pages 📄'],
  },
  keynote: {
    formattedName: 'Keynote',
    category: 'productivity',
    state: 'working',
    title: 'Keynote Presentation 📽️',
    subtitles: ['Crafting sleek keynote slides 📽️'],
  },
  numbers: {
    formattedName: 'Numbers',
    category: 'productivity',
    state: 'focused',
    title: 'Numbers Spreadsheet 📊',
    subtitles: ['Working in Apple Numbers 📊'],
  },

  // Creative & Media
  premiere: {
    formattedName: 'Premiere Pro',
    category: 'design',
    state: 'curious',
    title: 'Video Editing 🎬',
    subtitles: ['Editing video cuts & timeline 🎬', 'Crafting cinematic content ✨'],
  },
  'final cut': {
    formattedName: 'Final Cut Pro',
    category: 'design',
    state: 'curious',
    title: 'Final Cut Pro 🎬',
    subtitles: ['Editing video timeline 🎬', 'Video post-production in progress ✨'],
  },
  davinci: {
    formattedName: 'DaVinci Resolve',
    category: 'design',
    state: 'curious',
    title: 'DaVinci Resolve 🎬',
    subtitles: ['Color grading & video editing 🎬'],
  },
  capcut: {
    formattedName: 'CapCut',
    category: 'design',
    state: 'curious',
    title: 'CapCut Video 🎬',
    subtitles: ['Editing video clips in CapCut 🎬'],
  },
  lightroom: {
    formattedName: 'Lightroom',
    category: 'design',
    state: 'curious',
    title: 'Lightroom Photography 📸',
    subtitles: ['Color grading and photo editing 📸'],
  },
  garageband: {
    formattedName: 'GarageBand',
    category: 'entertainment',
    state: 'listening',
    title: 'GarageBand Studio 🎵',
    subtitles: ['Composing tracks & music 🎵'],
  },
  'logic pro': {
    formattedName: 'Logic Pro',
    category: 'entertainment',
    state: 'listening',
    title: 'Logic Pro Studio 🎵',
    subtitles: ['Music production in Logic Pro 🎵'],
  },

  // Entertainment / Audio / Video
  spotify: {
    formattedName: 'Spotify',
    category: 'entertainment',
    state: 'listening',
    title: 'Spotify Audio 🎧',
    subtitles: ['Vibing to tunes 🎧', 'Soundtrack powering your flow 🎵'],
  },
  music: {
    formattedName: 'Apple Music',
    category: 'entertainment',
    state: 'listening',
    title: 'Apple Music 🎧',
    subtitles: ['Jamming to Apple Music 🎧', 'Great soundtrack for productivity 🎵'],
  },
  podcasts: {
    formattedName: 'Apple Podcasts',
    category: 'entertainment',
    state: 'listening',
    title: 'Podcasts 🎙️',
    subtitles: ['Listening to an insightful podcast 🎙️'],
  },
  tv: {
    formattedName: 'Apple TV',
    category: 'entertainment',
    state: 'listening',
    title: 'Apple TV 🎬',
    subtitles: ['Watching movies and shows 🎬'],
  },
  netflix: {
    formattedName: 'Netflix',
    category: 'entertainment',
    state: 'listening',
    title: 'Watching Netflix 🎬',
    subtitles: ['Movie time! Relaxing on Netflix 🍿', 'Streaming shows & unwinding 🎬'],
  },
  youtube: {
    formattedName: 'YouTube',
    category: 'entertainment',
    state: 'listening',
    title: 'Watching YouTube 🍿',
    subtitles: ['Watching videos and relaxing 🍿', 'Enjoying content on YouTube ✨'],
  },
  vlc: {
    formattedName: 'VLC Media Player',
    category: 'entertainment',
    state: 'listening',
    title: 'Media Playback 🎬',
    subtitles: ['Watching media in VLC 🎬'],
  },
  photos: {
    formattedName: 'Photos',
    category: 'design',
    state: 'curious',
    title: 'Photo Library 📸',
    subtitles: ['Browsing photo memories 📸'],
  },

  // Gaming
  steam: {
    formattedName: 'Steam',
    category: 'entertainment',
    state: 'happy',
    title: 'Steam Gaming 🎮',
    subtitles: ['Game time! Leveling up 🎮', 'Having fun gaming 🏆'],
  },
  minecraft: {
    formattedName: 'Minecraft',
    category: 'entertainment',
    state: 'happy',
    title: 'Minecraft ⛏️',
    subtitles: ['Building worlds in Minecraft ⛏️', 'Crafting and exploring ✨'],
  },
  roblox: {
    formattedName: 'Roblox',
    category: 'entertainment',
    state: 'happy',
    title: 'Roblox 🎮',
    subtitles: ['Playing on Roblox 🎮'],
  },

  // System & Utilities
  finder: {
    formattedName: 'Finder',
    category: 'system',
    state: 'curious',
    title: 'macOS Finder 📁',
    subtitles: ['Organizing files & folders 📁', 'Browsing desktop directory ✨'],
  },
  'system settings': {
    formattedName: 'System Settings',
    category: 'system',
    state: 'focused',
    title: 'System Settings ⚙️',
    subtitles: ['Customizing macOS preferences ⚙️'],
  },
  preview: {
    formattedName: 'Preview',
    category: 'productivity',
    state: 'curious',
    title: 'Document Preview 📄',
    subtitles: ['Reading PDF or viewing images 📄'],
  },
  textedit: {
    formattedName: 'TextEdit',
    category: 'productivity',
    state: 'working',
    title: 'TextEdit Document 📝',
    subtitles: ['Editing plain text documents 📝'],
  },
};

/**
 * Classifies active web content based on URL and page title
 */
function classifyWebContent(url: string, title: string): AppClassification | null {
  const normUrl = (url || '').toLowerCase();
  const normTitle = (title || '').toLowerCase();

  // 1. Streaming & Video Entertainment
  if (normUrl.includes('youtube.com') || normUrl.includes('youtu.be') || normTitle.includes('youtube')) {
    return {
      formattedName: 'YouTube',
      category: 'entertainment',
      state: 'listening',
      title: 'Watching YouTube 🍿',
      subtitles: ['Watching videos and relaxing 🍿', 'Enjoying content on YouTube ✨', 'Vibing with video & music 🍿'],
    };
  }
  if (normUrl.includes('netflix.com') || normTitle.includes('netflix')) {
    return {
      formattedName: 'Netflix',
      category: 'entertainment',
      state: 'listening',
      title: 'Watching Netflix 🎬',
      subtitles: ['Movie time! Chilling on Netflix 🎬', 'Streaming shows and relaxing 🍿'],
    };
  }
  if (normUrl.includes('twitch.tv') || normTitle.includes('twitch')) {
    return {
      formattedName: 'Twitch',
      category: 'entertainment',
      state: 'listening',
      title: 'Watching Twitch 🎮',
      subtitles: ['Tuned in to the live stream 🎮', 'Watching live on Twitch ✨'],
    };
  }
  if (normUrl.includes('spotify.com') || normTitle.includes('spotify')) {
    return {
      formattedName: 'Spotify',
      category: 'entertainment',
      state: 'listening',
      title: 'Listening to Spotify 🎧',
      subtitles: ['Vibing to tunes on Spotify 🎧', 'Soundtrack powering your flow 🎵'],
    };
  }
  if (normUrl.includes('soundcloud.com') || normTitle.includes('soundcloud')) {
    return {
      formattedName: 'SoundCloud',
      category: 'entertainment',
      state: 'listening',
      title: 'SoundCloud Music 🎧',
      subtitles: ['Discovering music on SoundCloud 🎧'],
    };
  }

  // 2. Messaging & Communication
  if (normUrl.includes('whatsapp.com') || normTitle.includes('whatsapp')) {
    return {
      formattedName: 'WhatsApp',
      category: 'communication',
      state: 'happy',
      title: 'Chatting on WhatsApp 💬',
      subtitles: ['Catching up on WhatsApp messages 💬', 'Chatting with friends & family ✨', 'Staying in touch 💬'],
    };
  }
  if (normUrl.includes('telegram.org') || normTitle.includes('telegram')) {
    return {
      formattedName: 'Telegram',
      category: 'communication',
      state: 'happy',
      title: 'Telegram Chats 💬',
      subtitles: ['Messaging on Telegram 💬', 'Checking channels and chats ✨'],
    };
  }
  if (normUrl.includes('discord.com') || normTitle.includes('discord')) {
    return {
      formattedName: 'Discord',
      category: 'communication',
      state: 'happy',
      title: 'Discord Community 💬',
      subtitles: ['Hanging out on Discord 💬', 'Chatting in community servers ✨'],
    };
  }
  if (normUrl.includes('slack.com') || normTitle.includes('slack')) {
    return {
      formattedName: 'Slack',
      category: 'communication',
      state: 'happy',
      title: 'Slack Workspace 💬',
      subtitles: ['Syncing with team channels 💬', 'Collaborating in Slack ✨'],
    };
  }
  if (normUrl.includes('messenger.com') || normTitle.includes('messenger')) {
    return {
      formattedName: 'Messenger',
      category: 'communication',
      state: 'happy',
      title: 'Messenger Chat 💬',
      subtitles: ['Chatting with friends on Messenger 💬'],
    };
  }

  // 3. Social Media
  if (normUrl.includes('x.com') || normUrl.includes('twitter.com') || normTitle.includes('x /') || normTitle.includes('twitter')) {
    return {
      formattedName: 'X (Twitter)',
      category: 'communication',
      state: 'curious',
      title: 'Browsing X (Twitter) 📱',
      subtitles: ['Scrolling through the timeline 📱', 'Catching up on trending posts ✨', 'Checking what the world is saying 🐦'],
    };
  }
  if (normUrl.includes('instagram.com') || normTitle.includes('instagram')) {
    return {
      formattedName: 'Instagram',
      category: 'communication',
      state: 'curious',
      title: 'Scrolling Instagram 📱',
      subtitles: ['Enjoying visual stories & reels 📸', 'Browsing posts on Instagram ✨', 'Taking a social scroll break 💫'],
    };
  }
  if (normUrl.includes('reddit.com') || normTitle.includes('reddit')) {
    return {
      formattedName: 'Reddit',
      category: 'communication',
      state: 'curious',
      title: 'Reading Reddit 📱',
      subtitles: ['Exploring community discussions 📱', 'Reading the front page of the internet 🌟', 'Diving into interesting threads ✨'],
    };
  }
  if (normUrl.includes('tiktok.com') || normTitle.includes('tiktok')) {
    return {
      formattedName: 'TikTok',
      category: 'entertainment',
      state: 'curious',
      title: 'Watching TikTok 📱',
      subtitles: ['Scrolling through short clips 📱', 'Enjoying fun video highlights ✨'],
    };
  }
  if (normUrl.includes('pinterest.com') || normTitle.includes('pinterest')) {
    return {
      formattedName: 'Pinterest',
      category: 'design',
      state: 'curious',
      title: 'Browsing Pinterest 📌',
      subtitles: ['Finding aesthetic inspiration 📌', 'Pinning visual creative ideas ✨'],
    };
  }
  if (normUrl.includes('threads.net') || normTitle.includes('threads')) {
    return {
      formattedName: 'Threads',
      category: 'communication',
      state: 'curious',
      title: 'Browsing Threads 📱',
      subtitles: ['Catching conversations on Threads 📱'],
    };
  }
  if (normUrl.includes('linkedin.com') || normTitle.includes('linkedin')) {
    return {
      formattedName: 'LinkedIn',
      category: 'productivity',
      state: 'working',
      title: 'Browsing LinkedIn 💼',
      subtitles: ['Professional networking on LinkedIn 💼', 'Checking career updates & news ✨'],
    };
  }
  if (normUrl.includes('facebook.com') || normTitle.includes('facebook')) {
    return {
      formattedName: 'Facebook',
      category: 'communication',
      state: 'curious',
      title: 'Browsing Facebook 📱',
      subtitles: ['Catching up on feed and groups 📱'],
    };
  }

  // 4. AI Assistants & Brainstorming
  if (normUrl.includes('chatgpt.com') || normUrl.includes('chat.openai.com') || normTitle.includes('chatgpt')) {
    return {
      formattedName: 'ChatGPT',
      category: 'productivity',
      state: 'thinking',
      title: 'Chatting with ChatGPT 🤖',
      subtitles: ['Brainstorming with ChatGPT 💡', 'Exploring answers and prompts 🤖', 'Collaborating with AI ✨'],
    };
  }
  if (normUrl.includes('claude.ai') || normTitle.includes('claude')) {
    return {
      formattedName: 'Claude AI',
      category: 'productivity',
      state: 'thinking',
      title: 'Thinking with Claude 🤖',
      subtitles: ['Reasoning through ideas with Claude 💡', 'Deep AI brainstorming session 🤖'],
    };
  }
  if (normUrl.includes('perplexity.ai') || normTitle.includes('perplexity')) {
    return {
      formattedName: 'Perplexity',
      category: 'productivity',
      state: 'thinking',
      title: 'Researching on Perplexity 🔍',
      subtitles: ['Finding fast AI-backed answers 🔍', 'Synthesizing knowledge on Perplexity ✨'],
    };
  }
  if (normUrl.includes('gemini.google.com') || normTitle.includes('gemini')) {
    return {
      formattedName: 'Google Gemini',
      category: 'productivity',
      state: 'thinking',
      title: 'Exploring with Gemini 🤖',
      subtitles: ['Prompting Google Gemini 🤖', 'Brainstorming creative solutions ✨'],
    };
  }

  // 5. Productivity & Creative Cloud
  if (normUrl.includes('notion.so') || normTitle.includes('notion')) {
    return {
      formattedName: 'Notion',
      category: 'productivity',
      state: 'focused',
      title: 'Notion Workspace 📝',
      subtitles: ['Organizing docs & project notes 📝', 'Building your knowledge hub ⚡'],
    };
  }
  if (normUrl.includes('figma.com') || normTitle.includes('figma')) {
    return {
      formattedName: 'Figma',
      category: 'design',
      state: 'curious',
      title: 'Designing in Figma 🎨',
      subtitles: ['Crafting components & layouts 🎨', 'Pixel-perfect UI design flow ✨'],
    };
  }
  if (normUrl.includes('canva.com') || normTitle.includes('canva')) {
    return {
      formattedName: 'Canva',
      category: 'design',
      state: 'curious',
      title: 'Designing in Canva 🎨',
      subtitles: ['Creating graphic designs 🎨', 'Visual layout in flow ✨'],
    };
  }
  if (normUrl.includes('docs.google.com/document') || normTitle.includes('google docs')) {
    return {
      formattedName: 'Google Docs',
      category: 'productivity',
      state: 'working',
      title: 'Google Docs 📄',
      subtitles: ['Writing and editing documents 📄', 'Productive drafting in Docs ⚡'],
    };
  }
  if (normUrl.includes('docs.google.com/spreadsheets') || normTitle.includes('google sheets')) {
    return {
      formattedName: 'Google Sheets',
      category: 'productivity',
      state: 'focused',
      title: 'Google Sheets 📊',
      subtitles: ['Crunching numbers & spreadsheets 📊', 'Organizing data in Sheets ⚡'],
    };
  }
  if (normUrl.includes('docs.google.com/presentation') || normTitle.includes('google slides')) {
    return {
      formattedName: 'Google Slides',
      category: 'productivity',
      state: 'working',
      title: 'Google Slides 📽️',
      subtitles: ['Designing presentation slides 📽️'],
    };
  }

  // 6. Developer & Learning
  if (normUrl.includes('github.com') || normUrl.includes('gitlab.com')) {
    return {
      formattedName: 'GitHub',
      category: 'development',
      state: 'coding',
      title: 'Reviewing Code on GitHub </>',
      subtitles: ['Checking pull requests & commits </>', 'Exploring repositories & code 💻'],
    };
  }
  if (normUrl.includes('stackoverflow.com')) {
    return {
      formattedName: 'Stack Overflow',
      category: 'development',
      state: 'thinking',
      title: 'Stack Overflow Research </>',
      subtitles: ['Finding programming solutions 💡', 'Resolving technical bugs 🔍'],
    };
  }
  if (normUrl.includes('leetcode.com')) {
    return {
      formattedName: 'LeetCode',
      category: 'development',
      state: 'coding',
      title: 'Practicing on LeetCode </>',
      subtitles: ['Solving algorithmic challenges 🧠', 'Sharpening coding skills </>'],
    };
  }

  // 7. Shopping
  if (normUrl.includes('amazon.com') || normUrl.includes('ebay.com') || normUrl.includes('etsy.com')) {
    return {
      formattedName: 'Online Shopping',
      category: 'productivity',
      state: 'curious',
      title: 'Shopping Online 🛍️',
      subtitles: ['Browsing products & wishlist 🛍️', 'Finding great items online 🎁'],
    };
  }

  // 8. Knowledge & Reading
  if (normUrl.includes('wikipedia.org')) {
    return {
      formattedName: 'Wikipedia',
      category: 'productivity',
      state: 'thinking',
      title: 'Reading Wikipedia 📚',
      subtitles: ['Exploring fascinating articles 📚', 'Learning interesting facts 🌟'],
    };
  }

  return null;
}

export function classifyApplication(rawAppName: string, windowTitle = '', browserUrl = ''): AppClassification {
  // First check if browser active tab or window title reveals a specific web app/site
  const webClassification = classifyWebContent(browserUrl, windowTitle);
  if (webClassification) {
    return webClassification;
  }

  const normalized = rawAppName.trim().toLowerCase();

  for (const [key, config] of Object.entries(APP_DATABASE)) {
    if (normalized.includes(key)) {
      return config;
    }
  }

  // Format capitalized fallback
  const cleanName = rawAppName.replace(/[^\w\s-]/g, '').trim() || 'System';
  const formatted = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

  return {
    formattedName: formatted,
    category: 'productivity',
    state: 'idle',
    title: `${formatted} Active`,
    subtitles: [`Working in ${formatted}.`],
  };
}

export class SystemActivityMonitor {
  private timeoutId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private lastAppName = '';
  private lastState: PetAnimationState = 'idle';
  private lastSubtitle = '';
  private lastInputActiveTime = 0;
  private typingStreak = 0;
  private lastBubbleEmitTime = 0;
  private lastCursorPos = { x: 0, y: 0 };
  private cachedRawApp = '';
  private cachedBrowserUrl = '';
  private cachedBrowserTitle = '';
  private lastAppCheckTime = 0;
  private onActivityChange: (event: SystemActivityEvent) => void;

  constructor(onActivityChange: (event: SystemActivityEvent) => void) {
    this.onActivityChange = onActivityChange;
  }

  public start() {
    this.stop();
    this.isRunning = true;
    this.scheduleNextCheck(100);
  }

  public stop() {
    this.isRunning = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private scheduleNextCheck(delayMs: number) {
    if (!this.isRunning) return;
    this.timeoutId = setTimeout(async () => {
      const nextDelay = await this.checkActivityLoop();
      this.scheduleNextCheck(nextDelay);
    }, delayMs);
  }

  private async checkActivityLoop(): Promise<number> {
    try {
      const event = await this.checkActivity();
      // Adaptive polling rate:
      // If actively typing, check rapidly (450ms) for instant responsiveness.
      // If idle, slow down to 1500ms or 2500ms to conserve resources.
      if (event?.isTyping || event?.state === 'typing') {
        return 450;
      }
      if (this.lastState === 'sleeping') {
        return 2500;
      }
      if (this.lastState === 'idle') {
        return 1600;
      }
      return 650;
    } catch {
      return 1000;
    }
  }

  public async checkActivity(): Promise<SystemActivityEvent | null> {
    try {
      const now = Date.now();

      // 1. Cross-platform user idle time detection
      let idleSeconds = 0;
      if (process.platform === 'darwin') {
        try {
          const { stdout } = await execAsync(
            `ioreg -c IOHIDSystem | awk '/HIDIdleTime/ {print $NF; exit}'`
          );
          const idleNanos = parseInt(stdout.trim(), 10);
          if (!isNaN(idleNanos)) {
            idleSeconds = idleNanos / 1_000_000_000;
          }
        } catch {
          if (electronPowerMonitor) {
            idleSeconds = electronPowerMonitor.getSystemIdleTime();
          }
        }
      } else if (process.platform === 'linux') {
        try {
          const { stdout } = await execAsync('xprintidle');
          const idleMs = parseInt(stdout.trim(), 10);
          if (!isNaN(idleMs)) {
            idleSeconds = idleMs / 1000;
          }
        } catch {
          if (electronPowerMonitor) {
            idleSeconds = electronPowerMonitor.getSystemIdleTime();
          }
        }
      } else {
        // Windows and general fallback
        if (electronPowerMonitor) {
          idleSeconds = electronPowerMonitor.getSystemIdleTime();
        }
      }

      // 2. Cross-platform frontmost application & browser active tab detection (throttled to 1200ms to minimize CPU load)
      let rawApp = this.cachedRawApp;
      let browserUrl = this.cachedBrowserUrl;
      let browserTitle = this.cachedBrowserTitle;

      if (now - this.lastAppCheckTime > 1200 || !this.cachedRawApp) {
        this.lastAppCheckTime = now;
        if (process.platform === 'darwin') {
          try {
            const { stdout } = await execAsync(`lsappinfo info -only name $(lsappinfo front)`);
            const match = stdout.match(/^"([^"]+)"/);
            if (match && match[1]) {
              rawApp = match[1];
            } else {
              rawApp = stdout.split('\n')[0].replace(/"/g, '').trim();
            }
          } catch {
            try {
              const { stdout } = await execAsync(
                `osascript -e 'tell application "System Events" to get name of first application process whose frontmost is true'`
              );
              rawApp = stdout.trim();
            } catch {
              // ignore
            }
          }

          // Check if front app is a web browser to inspect active tab
          const normApp = rawApp.toLowerCase();
          const isBrowser = [
            'arc',
            'google chrome',
            'chrome',
            'safari',
            'brave browser',
            'brave',
            'microsoft edge',
            'edge',
            'opera',
            'vivaldi',
            'chromium',
          ].some((b) => normApp.includes(b));

          if (isBrowser) {
            try {
              const jxa = `(() => {
                try {
                  const se = Application("System Events");
                  const front = se.applicationProcesses.whose({ frontmost: true })[0].name();
                  let u = "", t = "";
                  if (front === "Arc") {
                    const a = Application("Arc");
                    u = a.windows[0].activeTab.url();
                    t = a.windows[0].activeTab.title();
                  } else if (front === "Google Chrome" || front === "Chromium") {
                    const a = Application(front);
                    u = a.windows[0].activeTab.url();
                    t = a.windows[0].activeTab.title();
                  } else if (front === "Safari") {
                    const a = Application("Safari");
                    u = a.windows[0].currentTab.url();
                    t = a.windows[0].currentTab.name();
                  } else if (front === "Brave Browser") {
                    const a = Application("Brave Browser");
                    u = a.windows[0].activeTab.url();
                    t = a.windows[0].activeTab.title();
                  } else if (front === "Microsoft Edge") {
                    const a = Application("Microsoft Edge");
                    u = a.windows[0].activeTab.url();
                    t = a.windows[0].activeTab.title();
                  }
                  return JSON.stringify({ u, t });
                } catch(e) {
                  return JSON.stringify({ u: "", t: "" });
                }
              })()`;
              const { stdout } = await execAsync(`osascript -l JavaScript -e '${jxa.replace(/'/g, "'\\''")}'`);
              const parsed = JSON.parse(stdout.trim());
              browserUrl = parsed.u || '';
              browserTitle = parsed.t || '';
            } catch {
              browserUrl = '';
              browserTitle = '';
            }
          } else {
            browserUrl = '';
            browserTitle = '';
          }
        } else if (process.platform === 'win32') {
          try {
            const { stdout } = await execAsync(
              `powershell -NoProfile -NonInteractive -Command "$h = (Add-Type -MemberDefinition '[DllImport(\\"user32.dll\\")] public static extern IntPtr GetForegroundWindow(); public static extern int GetWindowThreadProcessId(IntPtr hWnd, out int p);' -Name W -Namespace W -PassThru)::GetForegroundWindow(); $p = 0; [W.W]::GetWindowThreadProcessId($h, [ref]$p); $proc = Get-Process -Id $p; Write-Output ($proc.ProcessName + '|||' + $proc.MainWindowTitle)"`
            );
            const parts = stdout.trim().split('|||');
            rawApp = parts[0]?.trim() || '';
            browserTitle = parts[1]?.trim() || '';
            browserUrl = '';
          } catch {
            // ignore
          }
        } else if (process.platform === 'linux') {
          try {
            const { stdout } = await execAsync(`xdotool getactivewindow getwindowname`);
            browserTitle = stdout.trim();
          } catch {
            browserTitle = '';
          }
          try {
            const { stdout } = await execAsync(
              `xprop -id $(xprop -root -notype _NET_ACTIVE_WINDOW | awk '{print $5}') WM_CLASS`
            );
            const match = stdout.match(/WM_CLASS.*= "(?:[^"]+)", "([^"]+)"/);
            if (match && match[1]) {
              rawApp = match[1];
            }
          } catch {
            // ignore
          }
        }
        this.cachedRawApp = rawApp;
        this.cachedBrowserUrl = browserUrl;
        this.cachedBrowserTitle = browserTitle;
      }

      // 3. Audio stream detection (Content-Blind Security Feature)
      // Privacy Guarantee: NEVER captures audio data, microphone, song titles, or waveform.
      // Strictly inspects active media playback assertions, ignoring standby device sleep & Mochi Electron sounds!
      let isAudioPlaying = false;
      if (process.platform === 'darwin') {
        try {
          const { stdout } = await execAsync(
            `pmset -g assertions | grep -E '(named: "Playing audio"|named: "com.apple.Music"|named: "Spotify")' | grep -v "Electron"`
          );
          if (stdout.trim().length > 0) {
            isAudioPlaying = true;
          }
        } catch {
          // grep exit code 1 if no match -> audio is not playing
        }
      } else if (process.platform === 'win32') {
        try {
          const { stdout } = await execAsync('powercfg -requests');
          // Windows powercfg outputs active audio assertions when media plays without revealing content
          if (stdout.includes('[AUDIO]') && !stdout.match(/\[AUDIO\]\s+None/i) && !stdout.toLowerCase().includes('electron')) {
            isAudioPlaying = true;
          }
        } catch {
          // ignore
        }
      } else if (process.platform === 'linux') {
        try {
          const { stdout } = await execAsync(`pactl list sink-inputs | grep -i "state: RUNNING"`);
          if (stdout.includes('RUNNING')) {
            isAudioPlaying = true;
          }
        } catch {
          // ignore
        }
      }

      const classification = classifyApplication(rawApp, browserTitle, browserUrl);
      const isDevApp = classification.category === 'development';

      // On macOS we have high-resolution sub-second idle time (<0.75s).
      // On Windows and Linux with second-level granularity, idleSeconds === 0 indicates recent activity.
      const isRawInputActive =
        process.platform === 'darwin'
          ? idleSeconds < 0.75
          : idleSeconds === 0;

      // Check cursor motion to distinguish mouse pointing/movement from keyboard typing
      let isMouseMoving = false;
      if (electronScreen) {
        try {
          const currentCursor = electronScreen.getCursorScreenPoint();
          const dist = Math.hypot(
            currentCursor.x - this.lastCursorPos.x,
            currentCursor.y - this.lastCursorPos.y
          );
          this.lastCursorPos = currentCursor;
          if (dist > 4) {
            isMouseMoving = true;
          }
        } catch {
          // ignore
        }
      }

      // On non-macOS platforms, avoid false positive typing when the mouse is merely stationary:
      // only classify as typing if user is in an editor/terminal or already in an active streak
      const qualifiesForTyping =
        process.platform === 'darwin' || isDevApp || this.typingStreak > 0;
      const isKeyboardTyping = isRawInputActive && !isMouseMoving && qualifiesForTyping;

      if (isKeyboardTyping) {
        this.lastInputActiveTime = now;
        this.typingStreak++;
      } else if (isMouseMoving) {
        // Pointing/moving mouse - cool down typing streak
        this.typingStreak = 0;
      } else if (idleSeconds > 1.5) {
        this.typingStreak = 0;
      }

      const timeSinceLastInput = (now - this.lastInputActiveTime) / 1000;

      // 1. Idle absence handling:
      // If inactive for >= 180s (3m), go to sleep
      if (idleSeconds >= 180) {
        if (this.lastState !== 'sleeping') {
          this.lastState = 'sleeping';
          this.lastAppName = 'System';
          const event: SystemActivityEvent = {
            appName: 'System',
            category: 'idle',
            state: 'sleeping',
            title: 'Sleeping Zzz',
            subtitle: 'Resting while you are away. Tap anytime!',
            timestamp: now,
            isTyping: false,
          };
          this.onActivityChange(event);
          return event;
        }
        return null;
      }

      // If inactive for >= 60s (1m), show sad waiting reaction :(
      if (idleSeconds >= 60) {
        if (this.lastState !== 'sad') {
          this.lastState = 'sad';
          this.lastAppName = 'System';
          const event: SystemActivityEvent = {
            appName: 'System',
            category: 'idle',
            state: 'sad',
            title: 'Missing You :(',
            subtitle: 'No activity for 1 min. Waiting for you to return :(',
            timestamp: now,
            isTyping: false,
          };
          this.onActivityChange(event);
          return event;
        }
        return null;
      }

      // Returning from 1-min absence (sad)
      if (this.lastState === 'sad' && (isKeyboardTyping || isMouseMoving)) {
        this.lastState = 'happy';
        const welcomeBackEvent: SystemActivityEvent = {
          appName: classification.formattedName,
          category: classification.category,
          state: 'happy',
          title: 'Welcome Back! ✨',
          subtitle: `Yay, you're back! Let's get things done.`,
          timestamp: now,
          isTyping: false,
        };
        this.onActivityChange(welcomeBackEvent);
        return welcomeBackEvent;
      }

      // Waking up from sleep
      if (this.lastState === 'sleeping' && (isKeyboardTyping || isMouseMoving)) {
        this.lastState = 'waking';
        const wakeEvent: SystemActivityEvent = {
          appName: classification.formattedName,
          category: classification.category,
          state: 'waking',
          title: 'Welcome Back',
          subtitle: `Ready to flow in ${classification.formattedName}.`,
          timestamp: now,
          isTyping: false,
        };
        this.onActivityChange(wakeEvent);
        return wakeEvent;
      }

      let finalState: PetAnimationState = classification.state;
      let finalTitle = classification.title;
      let finalSubtitle = classification.subtitles[Math.floor(Math.random() * classification.subtitles.length)] || classification.subtitles[0];

      // Intense typing flow streak -> Fire face 🔥
      const isSuperTypingStreak = this.typingStreak >= 7;

      if (isSuperTypingStreak) {
        finalState = 'fire';
        finalTitle = 'On Fire! 🔥';
        finalSubtitle = 'Blazing typing streak! You are unstoppable 🔥';
      } else if (
        // Media/Music listening: only trigger when audio is genuinely playing AND either
        // it's an entertainment app/site or user has been idle from input for > 4.5 seconds
        isAudioPlaying &&
        (classification.category === 'entertainment' || idleSeconds > 4.5)
      ) {
        finalState = 'listening';
        finalTitle = classification.category === 'entertainment' ? classification.title : 'Listening to Music 🎧';
        finalSubtitle = 'Headphones on & vibing to the beat 🎧';
      } else {
        const isMochiOrElectron =
          rawApp.toLowerCase().includes('electron') ||
          rawApp.toLowerCase().includes('mochi') ||
          classification.formattedName.toLowerCase() === 'electron';

        if (isMochiOrElectron) {
        if (isKeyboardTyping || (timeSinceLastInput < 1.4 && this.typingStreak >= 2)) {
          finalState = 'happy';
          finalTitle = 'Always here ✨';
          finalSubtitle = 'Chatting with Mochi ✨';
        } else if (isMouseMoving && idleSeconds < 1.2) {
          finalState = 'curious';
          finalTitle = 'Right beside you 😊';
          finalSubtitle = 'Ready whenever you need me ✨';
        } else {
          finalState = 'idle';
          finalTitle = 'Peaceful Space 🌿';
          finalSubtitle = 'Take a deep breath & relax your shoulders 🌿';
        }
      } else if (isDevApp) {
        // Active in VS Code, Antigravity IDE, Cursor, Xcode, etc.
        if (isKeyboardTyping || (timeSinceLastInput < 1.4 && this.typingStreak >= 2)) {
          finalState = 'coding';
          finalTitle = 'In the zone ✨';
          finalSubtitle = 'Loving this code momentum!';
        } else if (isMouseMoving && idleSeconds < 1.2) {
          finalState = 'curious';
          finalTitle = 'Deep in code 💻';
          finalSubtitle = 'Architecting clean solutions ✨';
        } else if (idleSeconds < 30) {
          finalState = 'coding';
          finalTitle = 'Focus Flow 🚀';
          finalSubtitle = 'Clean code flow locked in.';
        } else {
          finalState = 'idle';
          finalTitle = 'Breather Time 🌿';
          finalSubtitle = 'Remember to relax your shoulders & hydrate 💧';
        }
      } else if (classification.category === 'communication') {
        // Messaging & Communication (WhatsApp, Slack, Discord, Telegram, Messages, iMessage)
        if (isKeyboardTyping || (timeSinceLastInput < 1.2 && this.typingStreak >= 2)) {
          finalState = 'typing';
          finalTitle = 'Friendly Chat 💬';
          finalSubtitle = 'Sending thoughtful words ✨';
        } else if (isMouseMoving && idleSeconds < 1.2) {
          finalState = 'curious';
          finalTitle = 'Staying in touch 💬';
          finalSubtitle = 'Reading updates and messages.';
        } else if (idleSeconds < 25) {
          finalState = 'happy';
          finalTitle = 'Connected ✨';
          finalSubtitle = 'Keeping in touch with the team.';
        } else {
          finalState = 'idle';
          finalTitle = 'Standing by ✨';
          finalSubtitle = 'Right beside you whenever you need me.';
        }
      } else if (classification.category === 'entertainment') {
        // Video & Media (YouTube, Netflix, Twitch, Spotify)
        finalState = 'listening';
        finalTitle = classification.title;
        finalSubtitle = 'Good tunes for a good mood 🎵';
      } else if (classification.category === 'design') {
        // Design & Creative (Figma, Canva, Photoshop, Blender)
        if (isKeyboardTyping || (timeSinceLastInput < 1.2 && this.typingStreak >= 2)) {
          finalState = 'typing';
          finalTitle = 'Creative Vision 🎨';
          finalSubtitle = 'Designing something beautiful ✨';
        } else if (isMouseMoving && idleSeconds < 1.2) {
          finalState = 'curious';
          finalTitle = 'Visual Craft 🎨';
          finalSubtitle = 'Every detail looking crisp & polished ✨';
        } else if (idleSeconds < 25) {
          finalState = 'curious';
          finalTitle = 'Design Flow ✨';
          finalSubtitle = 'Bringing creative ideas to life.';
        } else {
          finalState = 'idle';
          finalTitle = 'Admiring the Craft 🎨';
          finalSubtitle = 'Stepping back to admire the craft ✨';
        }
      } else if (classification.category === 'productivity') {
        // Productivity (Notion, Google Docs, Sheets, Word, Excel, Notes)
        if (isKeyboardTyping || (timeSinceLastInput < 1.2 && this.typingStreak >= 2)) {
          finalState = 'typing';
          finalTitle = 'Capturing Thoughts 📝';
          finalSubtitle = 'Organizing ideas with clarity ✨';
        } else if (isMouseMoving && idleSeconds < 1.2) {
          finalState = 'focused';
          finalTitle = 'Organizing Flow ✨';
          finalSubtitle = 'Setting everything in good order.';
        } else if (idleSeconds < 25) {
          finalState = classification.state;
          finalTitle = 'Productive Focus 🎯';
          finalSubtitle = 'Making solid progress on your goals ✨';
        } else {
          finalState = 'idle';
          finalTitle = 'Mindful Pause 🌿';
          finalSubtitle = 'Clear mind, clear workspace.';
        }
      } else {
        // General Applications & Web
        if (isKeyboardTyping || (timeSinceLastInput < 1.2 && this.typingStreak >= 2)) {
          finalState = 'typing';
          finalTitle = 'Active & Focused ✨';
          finalSubtitle = 'Thoughts turning into action ✨';
        } else if (isMouseMoving && idleSeconds < 1.2) {
          finalState = 'curious';
          finalTitle = 'Exploring 💡';
          finalSubtitle = 'Discovering new insights & ideas.';
        } else if (idleSeconds < 25) {
          finalState = classification.state;
          finalTitle = 'Focusing ✨';
          finalSubtitle = 'Floating right beside you.';
        } else {
          finalState = 'idle';
          finalTitle = 'Peaceful Space 🌿';
          finalSubtitle = 'Take a gentle breath whenever you need.';
        }
      }
      }

      const appChanged = rawApp.toLowerCase() !== this.lastAppName.toLowerCase();
      const stateChanged = finalState !== this.lastState;
      const isBurstTyping = isKeyboardTyping && this.typingStreak > 5;

      // Decide if we should notify listeners
      if (appChanged || stateChanged || (isBurstTyping && now - this.lastBubbleEmitTime > 8000)) {
        this.lastAppName = rawApp;
        this.lastState = finalState;
        this.lastSubtitle = finalSubtitle;
        if (appChanged || stateChanged) {
          this.lastBubbleEmitTime = now;
        }

        const event: SystemActivityEvent = {
          appName: classification.formattedName,
          category: classification.category,
          state: finalState,
          title: finalTitle,
          subtitle: finalSubtitle,
          timestamp: now,
          isTyping: isKeyboardTyping,
          typingBurst: isBurstTyping,
        };

        this.onActivityChange(event);
        return event;
      }

      return null;
    } catch (err) {
      console.error('[SystemActivityMonitor] error in checkActivity:', err);
      return null;
    }
  }
}
