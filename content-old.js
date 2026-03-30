// ==========================================
// 1. Setup & Navigation Handling
// ==========================================

// YouTube doesn't reload the page, so we listen for its custom navigation event
document.addEventListener('yt-navigate-finish', () => {
    if (window.location.pathname === '/feed/history') {
        initBulkDeleter();
    } else {
        cleanup(); // Remove our UI if we leave the history page
    }
});

// Run once on initial load just in case we start directly on the history page
if (window.location.pathname === '/feed/history') {
    initBulkDeleter();
}

// ==========================================
// 2. Core Logic
// ==========================================

let observer = null;


document.addEventListener('yt-navigate-finish', () => {
    if (window.location.pathname === '/feed/history') {
        initBulkDeleter();
    } else {
        cleanup(); // Remove our UI if we leave the history page
    }
});

if (window.location.pathname === '/feed/history') {
    initBulkDeleter();
}

function initBulkDeleter() {
    const observer = new MutationObserver(injectCheckboxes);
    observer.observe(document.body, { childList: true, subtree: true });
    injectFloatingButton();
    
    // Start watching the DOM for new videos loading in (Infinite Scroll)
    // observer = new MutationObserver(injectCheckboxes);
    // observer.observe(document.body, { childList: true, subtree: true });
    
    // Run an initial pass for videos already on screen
    injectCheckboxes();
}

function cleanup() {
    if (observer) observer.disconnect();
    const btn = document.getElementById('yt-bulk-delete-btn');
    if (btn) btn.remove();
}

// ==========================================
// 3. UI Injection
// ==========================================

function injectFloatingButton() {
    if (document.getElementById('yt-bulk-delete-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'yt-bulk-delete-btn';
    btn.innerText = '🗑️ Delete Selected';
    
    // Styling the floating button
    Object.assign(btn.style, {
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        padding: '12px 24px',
        backgroundColor: '#cc0000',
        color: 'white',
        border: 'none',
        borderRadius: '24px',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        zIndex: '9999',
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
    });

    btn.onclick = processDeletions;
    document.body.appendChild(btn);
}

function injectCheckboxes() {
    // Find all video rows that don't have our checkbox yet
    const videoRows = document.querySelectorAll('ytd-video-renderer:not(.has-yt-checkbox)');
    
    videoRows.forEach(row => {
        // Mark this row so we don't inject twice
        row.classList.add('has-yt-checkbox');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'yt-bulk-checkbox';
        
        // Make the checkbox large and visible
        Object.assign(checkbox.style, {
            width: '24px',
            height: '24px',
            marginRight: '15px',
            marginTop: '25px', // Aligns it nicely with the thumbnail
            cursor: 'pointer'
        });

        // Inject the checkbox right before the thumbnail container
        const thumbnail = row.querySelector('ytd-thumbnail');
        if (thumbnail && thumbnail.parentNode) {
            thumbnail.parentNode.insertBefore(checkbox, thumbnail);
        }
    });
}

// ==========================================
// 4. Deletion Logic (With built-in safety delays)
// ==========================================

// A helper function to force JavaScript to "pause" so we don't get blocked by YouTube
// A helper function to force JavaScript to "pause" so we don't get blocked
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function processDeletions() {
    // Find every row where the custom checkbox is ticked
    const checkedBoxes = document.querySelectorAll('.yt-bulk-checkbox:checked');
    
    if (checkedBoxes.length === 0) {
        alert("Please select at least one video to delete.");
        return;
    }

    const btn = document.getElementById('yt-bulk-delete-btn');
    btn.innerText = `Deleting ${checkedBoxes.length} items...`;
    btn.disabled = true;

    for (let i = 0; i < checkedBoxes.length; i++) {
        const checkbox = checkedBoxes[i];
        const row = checkbox.closest('ytd-video-renderer'); // Get the video row
        
        // STEP 1: Find and click the 3-dot "Action Menu" button on this row
        // YouTube usually labels this button "Action menu" for screen readers
        const actionMenuBtn = row.querySelector('[aria-label="Action menu"]');
        
        if (actionMenuBtn) {
            actionMenuBtn.click(); // Open the menu
            
            // Wait 300ms for YouTube's engine to render the popup menu on the screen
            await sleep(300); 
            
            // STEP 2: Find the global popup container where YouTube renders menus
            const popupContainer = document.querySelector('ytd-popup-container');
            
            if (popupContainer) {
                // Look for the exact text you found in your HTML snippet
                const spans = Array.from(popupContainer.querySelectorAll('span.yt-core-attributed-string'));
                const removeSpan = spans.find(span => span.textContent.trim() === 'Remove from watch history');
                
                if (removeSpan) {
                    // Navigate up to the parent <button> tag you showed me, and click it!
                    const removeBtn = removeSpan.closest('button');
                    if (removeBtn) {
                        removeBtn.click();
                        
                        // Wait 500ms before doing the next video to avoid spam filters
                        await sleep(500); 
                    }
                } else {
                    // Fallback: If the menu opened but we couldn't find the text, 
                    // click the body to close the menu so it doesn't get stuck.
                    document.body.click(); 
                }
            }
        }
    }

    // Finish up and reset the UI
    btn.innerText = '✅ Done!';
    
    // Uncheck all the boxes that were processed
    checkedBoxes.forEach(box => box.checked = false);

    setTimeout(() => {
        btn.innerText = '🗑️ Delete Selected';
        btn.disabled = false;
    }, 2000);
}