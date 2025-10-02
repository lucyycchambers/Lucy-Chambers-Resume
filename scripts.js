// Navigation bar behavior
document.addEventListener('DOMContentLoaded', () => {
    function updateStickyHeader() {
        const header = document.getElementById("navbar");
        header.classList.toggle("sticky", window.pageYOffset > header.offsetHeight);
    }

    function scrollToSection(event) {
        event.preventDefault();
        const targetId = event.currentTarget.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        const navbarHeight = document.querySelector('header').offsetHeight;
        window.scrollTo({
            top: targetSection.offsetTop - navbarHeight,
            behavior: 'smooth'
        });
    }

    function observeSections() {
        const sections = document.querySelectorAll('section');
        const observerOptions = {
            root: null,
            rootMargin: `-${document.querySelector('header').offsetHeight}px 0px 0px 0px`,
            threshold: 0.1
        };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const navLink = document.querySelector(`nav#navbar ul li a[href="#${entry.target.id}"]`);
                navLink?.classList.toggle('active', entry.isIntersecting);
            });
        }, observerOptions);

        sections.forEach(section => observer.observe(section));
    }

    window.onscroll = updateStickyHeader;
    document.querySelectorAll('a[href^="#"]').forEach(anchor => anchor.addEventListener('click', scrollToSection));
    observeSections();
});

// Image lightbox behaviour
(function () {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    const imgEl = lightbox.querySelector('.lightbox__img');
    const closeBtn = lightbox.querySelector('.lightbox__close');

    function openLightbox(src, alt) {
        imgEl.src = src;
        imgEl.alt = alt || 'Project image preview';
        lightbox.hidden = false;
        document.body.classList.add('no-scroll');
        closeBtn.focus();
    }

    function closeLightbox() {
        lightbox.hidden = true;
        imgEl.removeAttribute('src');
        imgEl.removeAttribute('alt');
        document.body.classList.remove('no-scroll');
    }

    // Open when clicking any project image
    document.querySelectorAll('.project-image').forEach(img => {
        img.addEventListener('click', () => openLightbox(img.src, img.alt));
    });
    
    // Close interactions
    closeBtn.addEventListener('click', closeLightbox);
    imgEl.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
    });
    
    document.addEventListener('keydown', (e) => {
    if (!lightbox.hidden && (e.key === 'Escape' || e.key === 'Esc')) closeLightbox();
    });
})();


// Time slider and Mode
(function() {
    const container = document.querySelector('.svg-container');
    if (!container) return;

    const svg  = container.querySelector('svg');
    const path = container.querySelector('#slider-path');
    const icon = container.querySelector('#slider-icon');
    if (!svg || !path || !icon) return;

    const nowPercent = () => {
        const d = new Date();
        return (d.getHours() * 60 + d.getMinutes()) / (24 * 60);
    };

    const isDarkMode = () => document.body.classList.contains('dark-mode');
    const syncIconWithMode = () => {
        icon.style.backgroundImage = `url('${isDarkMode() ? 'image/moon.png' : 'image/sun.png'}')`;
    };
    const applyDark = () => {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
        syncIconWithMode();
    };
    const applyLight = () => {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
        syncIconWithMode();
    };
    const applyModeBySection = (section) => {
        if (section === 'sun') applyLight(); else applyDark();
    };

    const BASELINE_Y = 50;
    const sectionFromY = (y) => (y <= BASELINE_Y ? 'sun' : 'dark');

    // Positioning
    function placeIconAtPoint(px, py) {
        const vb = svg.viewBox.baseVal;
        icon.style.left = `${(px / vb.width)  * container.clientWidth}px`;
        icon.style.top  = `${(py / vb.height) * container.clientHeight}px`;
    }
    function setIconAt(progress) {
        progress = Math.max(0, Math.min(1, progress));
        const L = path.getTotalLength();
        const p = path.getPointAtLength(progress * L);
        placeIconAtPoint(p.x, p.y);
        return { progress, point: p };
    }

    // State
    let userToggledMode = false;  // set true after icon tap
    let userDragged = false;      // disables minute-follow once true
    let t = nowPercent();
    ({ progress: t } = setIconAt(t));

    // Initial mode by clock 
    const applyModeByClock = () => {
        const hour = new Date().getHours();
        (hour >= 6 && hour < 18) ? applyLight() : applyDark();
    };
    applyModeByClock();

    new MutationObserver(syncIconWithMode).observe(document.body, {
        attributes: true, attributeFilter: ['class']
    });

    // Keep icon on curve on resize
    const ro = new ResizeObserver(() => setIconAt(t));
    ro.observe(container);

    // Follow current time every minute unless user dragged or manually toggled
    const minuteTimer = setInterval(() => {
        if (!userDragged) {
        ({ progress: t } = setIconAt(nowPercent()));
        }
        if (!userToggledMode) applyModeByClock(); else syncIconWithMode();
    }, 60_000);

    // Drag vs Click handling
    const DRAG_THRESHOLD = 5;
    let startX = 0, startY = 0, dragging = false, activePointerId = null;
    let startedOnIcon = false;

    let startSection = null;      
    let followingBySection = false;

    function onPointerDown(e) {
        if (activePointerId !== null) return;
        activePointerId = e.pointerId;

        e.preventDefault();
        startedOnIcon = (e.target === icon);
        container.setPointerCapture(activePointerId);

        startX = e.clientX; startY = e.clientY; dragging = false;

        const { point, progress } = moveToEventX(e);
        t = progress;
        startSection = sectionFromY(point.y);
        followingBySection = false;

        container.addEventListener('pointermove', onPointerMove, { passive: false });
        container.addEventListener('pointerup', onPointerUp, { once: true });
        container.addEventListener('pointercancel', onPointerUp, { once: true });
    }

    function onPointerMove(e) {
        if (e.pointerId !== activePointerId) return;

        if (!dragging) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.hypot(dx, dy) >= DRAG_THRESHOLD) dragging = true;
        }

        e.preventDefault();
        userDragged = true;

        const { point, progress } = moveToEventX(e);
        t = progress;

        const currentSection = sectionFromY(point.y);

        if (!followingBySection && currentSection !== startSection) {
        followingBySection = true;
        }

        if (followingBySection) {
        applyModeBySection(currentSection);
        } else {
        syncIconWithMode();
        }
    }

    function onPointerUp(e) {
        if (e.pointerId !== activePointerId) return;
        try { container.releasePointerCapture(activePointerId); } catch {}
        activePointerId = null;

        container.removeEventListener('pointermove', onPointerMove);

        if (!dragging) {
        const lastSection = sectionFromY(
            path.getPointAtLength(t * path.getTotalLength()).y
        );
        if (startedOnIcon) {
            // Tap on icon => explicit toggle (lock)
            userToggledMode = true;
            isDarkMode() ? applyLight() : applyDark();
        } else {
            // Tap on path => snap & set to that section; unlock
            userToggledMode = false;
            applyModeBySection(lastSection);
        }
        } else {
        // After a drag, unlock manual mode so future time/drag can manage mode
        userToggledMode = false;
        }

        startedOnIcon = false;
    }

    // Map event X to progress along path, return both point and progress
    function moveToEventX(e) {
        const rect = container.getBoundingClientRect();
        const xPx = Math.min(Math.max(e.clientX - rect.left, 0), rect.width);
        const vb  = svg.viewBox.baseVal;
        const xInVb = (xPx / rect.width) * vb.width;

        const L = path.getTotalLength();
        let lo = 0, hi = L;
        for (let i = 0; i < 20; i++) {
        const mid = (lo + hi) / 2;
        const p = path.getPointAtLength(mid);
        if (p.x < xInVb) lo = mid; else hi = mid;
        }
        const point = path.getPointAtLength(hi);
        placeIconAtPoint(point.x, point.y);
        return { point, progress: hi / L };
    }

    container.addEventListener('pointerdown', onPointerDown, { passive: false });
    icon.addEventListener('pointerdown', onPointerDown, { passive: false });

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        clearInterval(minuteTimer);
        ro.disconnect();
    });
})();
