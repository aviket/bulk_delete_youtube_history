// ==========================================
// 1. Setup & Global Variables
// ==========================================

// ==========================================
// 1. Setup & Global Variables
// ==========================================

let observer = null;

// Last checkbox clicked by the user.
// Used as the anchor for Shift+Click / Ctrl+Click range selection.
let lastClickedCheckbox = null;

// Listen for YouTube's custom SPA navigation event
document.addEventListener('yt-navigate-finish', () => {
    if (window.location.pathname === '/feed/history') {
        initBulkDeleter();
    } else {
        cleanup(); 
    }
});

// Run on initial load
if (window.location.pathname === '/feed/history') {
    initBulkDeleter();
}

// ==========================================
// 2. Core Logic
// ==========================================

function initBulkDeleter() {
    
    
    // Watch for infinite scroll loading
    if (observer) observer.disconnect();
    observer = new MutationObserver(injectCheckboxes);
    observer.observe(document.body, { childList: true, subtree: true });
    injectFloatingButton();
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
    // Target both old (renderer) and new (lockup) YouTube layouts
    const selectors = [
        'ytd-video-renderer:not(.has-yt-checkbox)',
        'ytd-reel-item-renderer:not(.has-yt-checkbox)',
        'yt-lockup-view-model:not(.has-yt-checkbox)'
    ].join(', ');

    const videoRows = document.querySelectorAll(selectors);
    
    videoRows.forEach(row => {
        row.classList.add('has-yt-checkbox');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'yt-bulk-checkbox';
        
        // Floating it over the thumbnail fixes the Shorts layout shift!
        Object.assign(checkbox.style, {
            position: 'absolute',
            top: '8px',
            left: '8px',
            width: '24px',
            height: '24px',
            cursor: 'pointer',
            zIndex: '9999', 
            boxShadow: '0 0 0 2px white', 
            borderRadius: '4px'
        });

        // Prevent opening the video when checking the box
        // ------------------------------------------
// Checkbox selection behavior
// ------------------------------------------

// Prevent the checkbox click from opening the YouTube video.
checkbox.addEventListener("click", (e) => {
    e.stopPropagation();

    const allCheckboxes = Array.from(
        document.querySelectorAll(".yt-bulk-checkbox")
    );

    // Shift+Click or Ctrl+Click = select the entire range
    if ((e.shiftKey || e.ctrlKey) && lastClickedCheckbox) {
        const startIndex = allCheckboxes.indexOf(lastClickedCheckbox);
        const endIndex = allCheckboxes.indexOf(checkbox);

        if (startIndex !== -1 && endIndex !== -1) {
            const from = Math.min(startIndex, endIndex);
            const to = Math.max(startIndex, endIndex);

            for (let i = from; i <= to; i++) {
                allCheckboxes[i].checked = true;
            }
        }
    } else {
        // Normal click:
        // Browser performs the normal checkbox toggle automatically.
        checkbox.checked = checkbox.checked;
    }

    // Current checkbox becomes the new range anchor.
    lastClickedCheckbox = checkbox;
});

        // Target old thumbnails or the new image view models
        const thumbnail = row.querySelector('ytd-thumbnail, yt-image-view-model, a#thumbnail');
        
        if (thumbnail) {
            thumbnail.style.position = 'relative';
            thumbnail.appendChild(checkbox);
        } else {
            row.style.position = 'relative';
            row.appendChild(checkbox);
        }
    });
}

// ==========================================
// 4. Deletion Logic (Two-Step Popup)
// ==========================================

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function processDeletions() {
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
        
        // Find the parent row
        const row = checkbox.closest('ytd-video-renderer, ytd-reel-item-renderer, yt-lockup-view-model'); 
        if (!row) continue;
        
        // STEP 1: Click the 3-dot "Action Menu"
        const actionMenuBtn = row.querySelector('[aria-label="Action menu"], [aria-label="More actions"]');
        
        if (actionMenuBtn) {
            actionMenuBtn.click(); 
            
            // Wait for YouTube to render the popup menu
            await sleep(300); 
            
            // STEP 2: Find the popup container
            const popupContainer = document.querySelector('ytd-popup-container');
            
            if (popupContainer) {
                // Look for the removal text
                const spans = Array.from(
    popupContainer.querySelectorAll(
        'span.yt-core-attributed-string, span.ytAttributedStringHost'
    )
);
                const removeSpan = spans.find(span => span.textContent.trim() === 'Remove from watch history');
                
                if (removeSpan) {
                    const removeBtn = removeSpan.closest('button, tp-yt-paper-item');
                    if (removeBtn) {
                        removeBtn.click();
                        await sleep(500); // Safety delay to prevent rate-limiting
                    }
                } else {
                    document.body.click(); // Close menu if option not found
                    await sleep(200);
                }
            }
        }
    }

    btn.innerText = '✅ Done!';
    
    // Uncheck boxes and remove the deleted rows from the DOM visually
    checkedBoxes.forEach(box => {
        box.checked = false;
        const row = box.closest('ytd-video-renderer, ytd-reel-item-renderer, yt-lockup-view-model');
        if(row) row.style.display = 'none'; // Hide it to confirm deletion visually
    });

    setTimeout(() => {
        btn.innerText = '🗑️ Delete Selected';
        btn.disabled = false;
    }, 2000);
}