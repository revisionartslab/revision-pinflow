document.addEventListener('DOMContentLoaded', () => {

    // 0. Theme Toggle
    const themeBtn = document.getElementById('theme-toggle');
    const iconSun = document.querySelector('.icon-sun');
    const iconMoon = document.querySelector('.icon-moon');

    // 로컬스토리지에서 기존 테마 확인, 없으면 OS 기본 설정 확인, 둘 다 실패 시 다크모드 기본
    const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const defaultTheme = systemPrefersDark ? 'dark' : 'light';
    const savedTheme = localStorage.getItem('revision_landing_theme') || defaultTheme;

    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcons(savedTheme);

    themeBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('revision_landing_theme', newTheme);
        updateThemeIcons(newTheme);

        // [Fix] 모바일 테마 변경 시 배경색 렉 해결: 강제 리플로우 유도
        void document.body.offsetHeight;
    });

    function updateThemeIcons(theme) {
        if (theme === 'light') {
            iconSun.style.display = 'none';
            iconMoon.style.display = 'block';
        } else {
            iconSun.style.display = 'block';
            iconMoon.style.display = 'none';
        }
    }

    // 0-1. Language Selector & i18n
    const langBtn = document.getElementById('lang-btn');
    const langDropdown = document.getElementById('lang-dropdown');
    const currentLangText = document.getElementById('current-lang');

    // Improved language detection (Safer)
    let rawLang = localStorage.getItem('revision_landing_lang') || (navigator.language || 'en').toLowerCase();
    let currentLang = 'en';

    if (rawLang.startsWith('ko')) currentLang = 'ko';
    else if (rawLang.startsWith('ja')) currentLang = 'ja';
    else if (rawLang.includes('zh-tw') || rawLang.includes('zh-hk') || rawLang.includes('zh-hant')) currentLang = 'zh-hant';
    else if (rawLang.startsWith('zh')) currentLang = 'zh-hans';
    else if (rawLang.startsWith('es')) currentLang = 'es';
    else if (rawLang.startsWith('pt')) currentLang = 'pt';
    else if (rawLang.startsWith('fr')) currentLang = 'fr';
    else if (rawLang.startsWith('de')) currentLang = 'de';
    else if (rawLang.startsWith('it')) currentLang = 'it';
    else if (rawLang.startsWith('ru')) currentLang = 'ru';
    else currentLang = 'en';

    let translations = {};

    async function loadTranslations(lang) {
        try {
            const response = await fetch(`./locales/${lang}.json`);
            if (!response.ok) throw new Error('Failed to load translations');
            translations = await response.json();
            applyTranslations();
            updateLangUI(lang);
            // Hide loading overlay only after translations are applied
            document.body.classList.remove('lang-loading');
        } catch (error) {
            console.error('Error loading translations:', error);
            // Safety: show content even if loading fails
            setTimeout(() => document.body.classList.remove('lang-loading'), 500);
            // Fallback to English if current lang fails (avoid infinite loop)
            if (lang !== 'en') {
                loadTranslations('en');
            } else {
                // If even English fails, force display
                document.body.classList.remove('lang-loading');
            }
        }
    }

    // Fail-safe: Always show content after 1.5s regardless of JSON status
    setTimeout(() => {
        if (document.body.classList.contains('lang-loading')) {
            console.warn('IETF fail-safe: Forcing site display');
            document.body.classList.remove('lang-loading');
        }
    }, 1500);

    function applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const value = getNestedValue(translations, key);
            if (value) el.innerHTML = value;
        });
    }

    function getNestedValue(obj, key) {
        return key.split('.').reduce((p, c) => p && p[c], obj);
    }

    function updateLangUI(lang) {
        const labels = {
            'en': 'EN',
            'ko': 'KO',
            'ja': 'JA',
            'zh-hans': 'ZH',
            'zh-hant': 'ZHT',
            'es': 'ES',
            'pt': 'PT',
            'fr': 'FR',
            'de': 'DE',
            'it': 'IT',
            'ru': 'RU'
        };
        currentLangText.textContent = labels[lang] || lang.toUpperCase();
        langDropdown.classList.remove('show');
        localStorage.setItem('revision_landing_lang', lang);

        // Dynamic Dropdown Rendering with specific order
        renderLangDropdown();
    }

    function renderLangDropdown() {
        const langOrder = ['en', 'ko', 'ja', 'zh-hans', 'zh-hant', 'de', 'es', 'fr', 'it', 'pt', 'ru'];
        const langNames = {
            'en': 'English',
            'ko': '한국어',
            'ja': '日本語',
            'zh-hans': '简体中文',
            'zh-hant': '繁體中文',
            'de': 'Deutsch',
            'es': 'Español',
            'fr': 'Français',
            'it': 'Italiano',
            'pt': 'Português',
            'ru': 'Русский'
        };

        langDropdown.innerHTML = '';

        // Sort: current on top, then the rest follows the master order
        const sortedLangs = [currentLang, ...langOrder.filter(l => l !== currentLang)];

        sortedLangs.forEach(lang => {
            const btn = document.createElement('button');
            btn.setAttribute('data-lang', lang);
            btn.textContent = langNames[lang];

            if (lang === currentLang) {
                btn.classList.add('active-lang');
            }

            btn.addEventListener('click', () => {
                if (lang !== currentLang) {
                    currentLang = lang;
                    loadTranslations(currentLang);
                }
            });

            langDropdown.appendChild(btn);
        });
    }

    // Initial load
    loadTranslations(currentLang);

    langBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        langDropdown.classList.toggle('show');
    });

    // Removal of static button logic as it's now handled by renderLangDropdown()
    /*
    langDropdown.querySelectorAll('button').forEach(btn => {
        ...
    });
    */

    document.addEventListener('click', () => {
        langDropdown.classList.remove('show');
    });

    // 1. FAQ Accordion Interaction
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const toggle = item.querySelector('.faq-toggle');
        toggle.addEventListener('click', () => {
            // 다른 열려있는 아이템 닫기 (선택 사항)
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });

            // 현재 아이템 토글
            item.classList.toggle('active');
        });
    });

    // 2. Optimized Global Scroll Manager
    const header = document.querySelector('header');
    const ring = document.querySelector('.wireframe-ring');
    const backToTopBtn = document.getElementById('back-to-top');

    let lastScrollY = window.pageYOffset;
    let ticking = false;

    function onScrollUpdate() {
        // Header logic
        if (lastScrollY > 50) {
            header.classList.add('header-scrolled');
        } else {
            header.classList.remove('header-scrolled');
        }

        // Back to top logic
        if (lastScrollY > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }

        // Parallax logic
        if (ring) {
            ring.style.transform = `rotate(-15deg) translateY(${lastScrollY * 0.15}px)`;
        }

        ticking = false;
    }

    window.addEventListener('scroll', () => {
        lastScrollY = window.pageYOffset;
        if (!ticking) {
            window.requestAnimationFrame(onScrollUpdate);
            ticking = true;
        }
    }, { passive: true });

    // 3. Simple Reveal Animation Removal (Removed due to user request for zero-animation reliability)
    /* 
    The IntersectionObserver revealed elements such as .u-item, .step-v, etc.
    Deleting this section ensures all content is visible immediately and fixes 
    display issues on some systems.
    */





    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });



    // 7. Email Copy Logic
    const footerEmail = document.getElementById('footer-email');
    const copyTooltip = document.getElementById('copy-tooltip');

    if (footerEmail) {
        footerEmail.addEventListener('click', (e) => {
            e.preventDefault();
            const emailText = document.getElementById('footer-email-text').textContent;
            navigator.clipboard.writeText(emailText).then(() => {
                // Show tooltip
                copyTooltip.classList.add('show');

                // Hide tooltip after 1.5s
                setTimeout(() => {
                    copyTooltip.classList.remove('show');
                }, 1500);
            }).catch(err => {
                console.error('Failed to copy: ', err);
            });
        });
    }

    // 8. Hero Video Playback (Simple & Stable)
    // 파일 크기: webm=918KB, mp4=1.54MB → 즉시 로드 가능 수준
    // 이전의 stalled 핸들러, Watchdog, 중복 play() 호출이 서로 충돌하여 끊김이 발생했음
    // 해결책: 브라우저의 네이티브 loop 기능에 위임 + 뷰포트 이탈 시만 스마트 일시정지
    const heroVideo = document.getElementById('hero-video');

    if (heroVideo) {
        // [Simple & Strong] 뷰포트 핸들러
        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    heroVideo.play().catch(() => { });
                } else {
                    heroVideo.pause();
                }
            });
        }, { threshold: 0 }); // 0%만 보여도 즉시 재생 시도

        videoObserver.observe(heroVideo);

        // [Global Event] 정책 대응 및 강제 시작
        const playVideo = () => {
            if (heroVideo.paused) heroVideo.play().catch(() => { });
        };

        document.addEventListener('click', playVideo, { once: true });
        document.addEventListener('touchstart', playVideo, { once: true });

        // 페이지 로딩 완료(lang-loading 제거) 시점에 한번 더 트리거
        const checkInterval = setInterval(() => {
            if (!document.body.classList.contains('lang-loading')) {
                playVideo();
                clearInterval(checkInterval);
            }
        }, 100);
        setTimeout(() => clearInterval(checkInterval), 3000); // 최대 3초만 시도
    }

});
