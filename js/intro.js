// Timing constants
const ANIMATION_DURATION = 3000; // Show intro for 3 seconds
const FADE_TRANSITION = 800; // Fade transition duration

// Cloud cursor settings
const CLOUD_EMOJI = '☁️';
const TRAIL_SPAWN_INTERVAL = 50; // ms between trail clouds
const MAX_TRAIL_CLOUDS = 30; // Maximum cloud trail elements
const CLOUD_LIFETIME = 1200; // Must match CSS animation duration

// State variables
let cloudCursor = null;
let lastTrailTime = 0;
let trailClouds = [];
let mouseMoveHandler = null;
let isIntroActive = true;

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initCloudCursor();
    setTimeout(fadeOutIntro, ANIMATION_DURATION);
});

// ========================================
// CLOUD CURSOR SETUP
// ========================================

function initCloudCursor() {
    const introScreen = document.getElementById("introScreen");
    if (!introScreen) return;

    // Create cloud cursor element
    cloudCursor = document.createElement('div');
    cloudCursor.className = 'cloud-cursor';
    cloudCursor.textContent = CLOUD_EMOJI;
    document.body.appendChild(cloudCursor);

    // Mouse move handler for cursor and trail
    mouseMoveHandler = (e) => {
        if (!isIntroActive) return;

        // Update cloud cursor position
        cloudCursor.style.left = e.clientX + 'px';
        cloudCursor.style.top = e.clientY + 'px';

        // Spawn trail clouds at intervals
        const currentTime = Date.now();
        if (currentTime - lastTrailTime > TRAIL_SPAWN_INTERVAL) {
            spawnTrailCloud(e.clientX, e.clientY);
            lastTrailTime = currentTime;
        }
    };

    document.addEventListener('mousemove', mouseMoveHandler);
}

// ========================================
// TRAIL CLOUD SPAWNING
// ========================================

function spawnTrailCloud(x, y) {
    // Limit number of trail clouds for performance
    if (trailClouds.length >= MAX_TRAIL_CLOUDS) {
        const oldCloud = trailClouds.shift();
        if (oldCloud && oldCloud.parentNode) {
            oldCloud.remove();
        }
    }

    // Create trail cloud element
    const trailCloud = document.createElement('div');
    trailCloud.className = 'cloud-trail';
    trailCloud.textContent = CLOUD_EMOJI;
    trailCloud.style.left = x + 'px';
    trailCloud.style.top = y + 'px';

    document.body.appendChild(trailCloud);
    trailClouds.push(trailCloud);

    // Auto-remove after animation completes
    setTimeout(() => {
        if (trailCloud.parentNode) {
            trailCloud.remove();
        }
        const index = trailClouds.indexOf(trailCloud);
        if (index > -1) {
            trailClouds.splice(index, 1);
        }
    }, CLOUD_LIFETIME);
}

// ========================================
// CLEANUP
// ========================================

function cleanupCloudCursor() {
    isIntroActive = false;

    // Remove cursor element
    if (cloudCursor && cloudCursor.parentNode) {
        cloudCursor.remove();
        cloudCursor = null;
    }

    // Remove all trail clouds
    trailClouds.forEach(cloud => {
        if (cloud && cloud.parentNode) {
            cloud.remove();
        }
    });
    trailClouds = [];

    // Remove event listener
    if (mouseMoveHandler) {
        document.removeEventListener('mousemove', mouseMoveHandler);
        mouseMoveHandler = null;
    }
}

// ========================================
// INTRO FADE OUT
// ========================================

function fadeOutIntro() {
    const introScreen = document.getElementById("introScreen");
    if (!introScreen) {
        console.error("introScreen not found!");
        return;
    }

    introScreen.style.opacity = "0";

    setTimeout(() => {
        introScreen.style.display = "none";
        cleanupCloudCursor();

        const desktop = document.querySelector(".desktop-background");
        if (desktop) {
            desktop.style.display = "block";
            console.log("✓ Transitioned to desktop");

            // Force center the browser window after desktop is visible
            setTimeout(() => {
                const browserWindow = document.getElementById("browserWindow");
                if (browserWindow && window.windowManager) {
                    window.windowManager.centerWindowNow(browserWindow);
                    console.log("✓ Browser window centered");
                }
            }, 100);
        }
    }, FADE_TRANSITION);
}
