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

document.addEventListener('DOMContentLoaded', () => {
    let userToggledMode = false;

    function getCurrentTimeAsPercentage() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const totalMinutesInDay = 24 * 60;
        const currentTimeInMinutes = hours * 60 + minutes;
        const timeAsPercentage = (currentTimeInMinutes / totalMinutesInDay) * 100;
        if (!userToggledMode) { 
            updateMode(hours);
        }
        return timeAsPercentage;
    }
    
    function toggleMode() {
        userToggledMode = true;
        // Toggle between light and dark mode directly
        const isDarkMode = document.body.classList.contains('dark-mode');
        if (isDarkMode) {
            document.body.classList.remove('dark-mode');
            document.body.classList.add('light-mode');
            sliderIcon.style.backgroundImage = "url('image/sun.png')";
        } else {
            document.body.classList.remove('light-mode');
            document.body.classList.add('dark-mode');
            sliderIcon.style.backgroundImage = "url('image/moon.png')";
        }
    }

    function updateMode(hours) {
        const isDayTime = hours >= 6 && hours < 18;
        document.body.classList.toggle('light-mode', isDayTime);
        document.body.classList.toggle('dark-mode', !isDayTime);

        const iconUrl = isDayTime ? 'image/sun.png' : 'image/moon.png';
        sliderIcon.style.backgroundImage = `url('${iconUrl}')`;
    }

    function positionSliderIcon() {
        const sliderIcon = document.getElementById('slider-icon');
        const sliderPath = document.getElementById('slider-path');
        const percentage = getCurrentTimeAsPercentage() / 100;

        // Get the total length of the SVG path
        const pathLength = sliderPath.getTotalLength();

        // Calculate the position along the path based on the percentage
        const point = sliderPath.getPointAtLength(percentage * pathLength);

        // Adjusting for the icon's dimensions to center it on the point
        const iconOffsetX = sliderIcon.offsetWidth / 2;
        const iconOffsetY = sliderIcon.offsetHeight / 2;

        // Calculate the position relative to the page
        const rect = sliderPath.getBoundingClientRect();
        const offsetX = rect.left + window.scrollX;
        const offsetY = rect.top + window.scrollY;

        // Set the icon's position
        sliderIcon.style.left = `${point.x + offsetX - iconOffsetX}px`;
        sliderIcon.style.top = `${point.y - (sliderIcon.offsetHeight / 2)}px`;
    }
    

    const sliderIcon = document.getElementById('slider-icon');
    positionSliderIcon(); 
    window.addEventListener('resize', () => positionSliderIcon(sliderIcon));
    sliderIcon.addEventListener('click', toggleMode);
    setInterval(() => positionSliderIcon(sliderIcon), 60000);
});
