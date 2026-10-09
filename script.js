/* =========================================================
   SHARED — PROJECT DESCRIPTION
========================================================= */

const DESCRIPTION_LIMIT = 100;

function renderProjectDescription(element, text, expanded) {
    element.textContent = text;

    const readMore = document.createElement("span");

    readMore.className = "read-more";
    readMore.textContent = expanded
        ? " Show less"
        : " Read more";

    element.appendChild(readMore);
}


function setupProjectDescriptions(cards) {
    cards.forEach((card) => {
        const description =
            card.querySelector(".project-description");

        if (!description) {
            return;
        }

        /*
            منع تهيئة نفس الوصف أكثر من مرة.
        */
        if (description.dataset.descriptionReady === "true") {
            return;
        }

        const fullText = description.textContent
            .replace(/\s+/g, " ")
            .trim();

        description.dataset.descriptionReady = "true";
        description.dataset.fullText = fullText;

        if (fullText.length <= DESCRIPTION_LIMIT) {
            description.dataset.shortText = fullText;
            return;
        }

        const shortText =
            fullText
                .slice(0, DESCRIPTION_LIMIT)
                .trimEnd() + "...";

        description.dataset.shortText = shortText;
        description.classList.add("has-more");

        renderProjectDescription(
            description,
            shortText,
            false
        );

        description.addEventListener("click", () => {
            const cardTop = card.offsetTop;

            const rowCards = cards.filter((rowCard) => {
                const isVisible =
                    !rowCard.hidden &&
                    rowCard.style.display !== "none";

                const isSameRow =
                    Math.abs(
                        rowCard.offsetTop - cardTop
                    ) < 10;

                return isVisible && isSameRow;
            });

            const shouldExpand =
                !card.classList.contains("is-expanded");

            rowCards.forEach((rowCard) => {
                const rowDescription =
                    rowCard.querySelector(
                        ".project-description"
                    );

                if (!rowDescription) {
                    return;
                }

                const rowFullText =
                    rowDescription.dataset.fullText;

                const rowShortText =
                    rowDescription.dataset.shortText;

                if (!rowFullText || !rowShortText) {
                    return;
                }

                rowCard.classList.toggle(
                    "is-expanded",
                    shouldExpand
                );

                if (
                    rowFullText.length <=
                    DESCRIPTION_LIMIT
                ) {
                    rowDescription.textContent =
                        rowFullText;

                    return;
                }

                renderProjectDescription(
                    rowDescription,
                    shouldExpand
                        ? rowFullText
                        : rowShortText,
                    shouldExpand
                );
            });
        });
    });
}


/* =========================================================
   HOME PAGE — FEATURED PROJECTS
========================================================= */

(async function initFeaturedProjects() {
    const container =
        document.querySelector(
            "#featured-projects"
        );

    /*
        #featured-projects موجود فقط
        في الصفحة الرئيسية.
    */
    if (!container) {
        return;
    }

    const section =
        container.closest("#projects");

    if (!section) {
        return;
    }

    const buttons =
        section.querySelectorAll(
            ".filter-btn"
        );

    let allProjects = [];


    function getProjectLimit() {
        const isTabletPortrait =
            window.innerWidth >= 768 &&
            window.innerWidth <= 1024 &&
            window.matchMedia(
                "(orientation: portrait)"
            ).matches;

        return isTabletPortrait
            ? 4
            : 3;
    }


    function showProjects(filter) {
        const matchingProjects =
            allProjects.filter((project) => {
                const categories =
                    (
                        project.dataset.category ||
                        ""
                    )
                        .trim()
                        .split(/\s+/);

                return (
                    filter === "all" ||
                    categories.includes(filter)
                );
            });

        const projectLimit =
            getProjectLimit();

        const visibleProjects =
            matchingProjects
                .slice(0, projectLimit)
                .map((project) => {
                    const card =
                        project.cloneNode(true);

                    card.style.removeProperty(
                        "display"
                    );

                    card.hidden = false;

                    card.classList.add(
                        "show"
                    );

                    return card;
                });

        container.replaceChildren(
            ...visibleProjects
        );

        setupProjectDescriptions(
            visibleProjects
        );

        if (visibleProjects.length === 0) {
            const message =
                document.createElement("p");

            message.textContent =
                "No projects in this category yet.";

            message.style.gridColumn =
                "1 / -1";

            container.appendChild(
                message
            );
        }
    }


    try {
        container.setAttribute(
            "aria-busy",
            "true"
        );

        const response =
            await fetch("projects.html");

        if (!response.ok) {
            throw new Error(
                `Failed to load projects: ${response.status}`
            );
        }

        const html =
            await response.text();

        const projectsDocument =
            new DOMParser().parseFromString(
                html,
                "text/html"
            );

        allProjects = Array.from(
            projectsDocument.querySelectorAll(
                "#projects .projects-container .project-card"
            )
        );


        /* -------------------------
           HOME FILTERS
        ------------------------- */

        buttons.forEach((button) => {
            button.addEventListener(
                "click",
                () => {
                    buttons.forEach((item) => {
                        const active =
                            item === button;

                        item.classList.toggle(
                            "active",
                            active
                        );

                        item.setAttribute(
                            "aria-pressed",
                            String(active)
                        );
                    });

                    showProjects(
                        button.dataset.filter ||
                        "all"
                    );
                }
            );
        });


        const activeButton =
            section.querySelector(
                ".filter-btn.active"
            ) || buttons[0];

        buttons.forEach((button) => {
            button.setAttribute(
                "aria-pressed",
                String(
                    button === activeButton
                )
            );
        });

        showProjects(
            activeButton?.dataset.filter ||
            "all"
        );


        /* -------------------------
           TABLET ORIENTATION
        ------------------------- */

        window.addEventListener(
            "orientationchange",
            () => {
                window.setTimeout(
                    () => {
                        const currentFilter =
                            section.querySelector(
                                ".filter-btn.active"
                            )?.dataset.filter ||
                            "all";

                        showProjects(
                            currentFilter
                        );
                    },
                    200
                );
            }
        );

    } catch (error) {
        console.error(
            "Failed to load projects:",
            error
        );

        container.innerHTML = `
            <div
                class="projects-error"
                role="alert"
                style="grid-column: 1 / -1;"
            >
                <p>
                    Projects couldn't be loaded right now.
                </p>

                <div class="projects-error-links">
                    <a href="projects.html">
                        View Projects
                    </a>

                    <a
                        href="https://github.com/ShaimaAlbokhari"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        View GitHub
                    </a>
                </div>
            </div>
        `;

    } finally {
        container.removeAttribute(
            "aria-busy"
        );
    }
})();


/* =========================================================
   PROJECTS PAGE — FILTERS
========================================================= */

(function setupProjectsPage() {
    const projectsSection =
        document.querySelector("#projects");

    if (!projectsSection) {
        return;
    }

    /*
        إذا كان #featured-projects موجودًا،
        فنحن في الصفحة الرئيسية وليس projects.html.
    */
    const featuredContainer =
        projectsSection.querySelector(
            "#featured-projects"
        );

    if (featuredContainer) {
        return;
    }

    const projectsContainer =
        projectsSection.querySelector(
            ".projects-container"
        );

    if (!projectsContainer) {
        return;
    }

    const projectCards =
        Array.from(
            projectsContainer.querySelectorAll(
                ".project-card"
            )
        );

    if (projectCards.length === 0) {
        return;
    }

    const filterButtons =
        projectsSection.querySelectorAll(
            ".filter-btn"
        );


    /* -------------------------
       FILTER BUTTONS
    ------------------------- */

    filterButtons.forEach((button) => {
        button.addEventListener(
            "click",
            () => {
                const filter =
                    button.dataset.filter ||
                    "all";


                /*
                    تحديد الزر النشط.
                */
                filterButtons.forEach(
                    (item) => {
                        const isActive =
                            item === button;

                        item.classList.toggle(
                            "active",
                            isActive
                        );

                        item.setAttribute(
                            "aria-pressed",
                            String(isActive)
                        );
                    }
                );


                /*
                    إظهار وإخفاء المشاريع.
                */
                projectCards.forEach(
                    (card) => {
                        const categories =
                            (
                                card.dataset.category ||
                                ""
                            )
                                .trim()
                                .split(/\s+/);

                        const shouldShow =
                            filter === "all" ||
                            categories.includes(
                                filter
                            );

                        if (shouldShow) {
                            card.style.removeProperty(
                                "display"
                            );

                            card.hidden = false;

                        } else {
                            card.style.display =
                                "none";

                            card.hidden = true;

                            card.classList.remove(
                                "is-expanded"
                            );
                        }
                    }
                );
            }
        );
    });


    /* -------------------------
       DESCRIPTION READ MORE
    ------------------------- */

    setupProjectDescriptions(
        projectCards
    );
})();


/* =========================================================
   CERTIFICATIONS DATA
========================================================= */

const certifications = [
    {
        logo: "microsoft.jpg",
        badge: "EXCEL",
        title:
            "Microsoft Office Specialist: Excel 2019 Associate",
        organization: "Microsoft",
        issued: "Jul 2024",
        credential: "dbmA-uTLC",
        link: ""
    },

    {
        logo: "cisco.jpg",
        badge: "DATA",
        title:
            "Introduction to Data Science",
        organization: "Cisco",
        issued: "Jul 2026",
        credential: "",
        link:
            "https://www.credly.com/badges/98250c4a-05d4-4ffd-a180-287029060c4e/public_url"
    },

    {
        logo:
            "deeplearning.ai logo.jpg",
        badge: "MATH",
        title:
            "Linear Algebra for Machine Learning and Data Science",
        organization:
            "DeepLearning.AI",
        issued: "Nov 2025",
        credential: "",
        link:
            "https://www.coursera.org/account/accomplishments/verify/JGZ1CNLTJSGI"
    },

    {
        logo: "michigan.png",
        badge: "PYTHON",
        title: "Python Basics",
        organization:
            "University of Michigan",
        issued: "Nov 2025",
        credential: "",
        link:
            "https://www.coursera.org/account/accomplishments/verify/ZAE0GS7DSNIA"
    },
    {
        logo: "Tuwaiq-Academy.png",
        badge: "R",
        title: "Data Analysis Using R",
        organization: "Tuwaiq Academy",
        issued: "Oct 2026",
        credential: "YGDra5L",
        link: ""
    },
    {
        logo: "Satr-Tuwaiq-Academy.svg",
        badge: "POWER BI",
        title: "Power BI 103",
        organization: "Satr (Tuwaiq Academy)",
        issued: "Oct 2026",
        credential: "",
        link: "power-bi-103.pdf"
    }
];


/* =========================================================
   CREATE CERTIFICATION CARDS
========================================================= */

const certificationsContainer =
    document.querySelector(
        "#certifications-container"
    );

if (certificationsContainer) {
    certifications.forEach((cert) => {
        const slide =
            document.createElement("div");

        slide.classList.add(
            "swiper-slide"
        );

        const credentialHTML =
            cert.credential
                ? `
                    <div>
                        <i class="bx bx-check-shield"></i>
                        <span>Credential</span>
                        <strong>
                            ${cert.credential}
                        </strong>
                    </div>
                `
                : "";

        const linkHTML =
            cert.link
                ? `
                    <a
                        href="${cert.link}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        View Credential
                        <i class="fas fa-arrow-right"></i>
                    </a>
                `
                : "";

        slide.innerHTML = `
            <div class="certificate-card">

                <img
                    src="${cert.logo}"
                    class="certificate-logo"
                    alt="${cert.organization}"
                >

                <span class="certificate-badge">
                    ${cert.badge}
                </span>

                <h3>
                    ${cert.title}
                </h3>

                <p>
                    ${cert.organization}
                </p>

                <hr>

                <div class="certificate-details">

                    <div>
                        <i class="bx bx-calendar"></i>

                        <span>
                            Issued
                        </span>

                        <strong>
                            ${cert.issued}
                        </strong>
                    </div>

                    ${credentialHTML}

                </div>

                ${linkHTML}

            </div>
        `;

        certificationsContainer.appendChild(
            slide
        );
    });
}


/* =========================================================
   CERTIFICATIONS SWIPER
========================================================= */

const swiperElement =
    document.querySelector(
        "#certifications .swiper"
    );

if (
    swiperElement &&
    typeof Swiper !== "undefined"
) {
    /*
        منع تشغيل أكثر من نسخة
        من Swiper على نفس العنصر.
    */
    if (swiperElement.swiper) {
        swiperElement.swiper.destroy(
            true,
            true
        );
    }

    const swiper =
        new Swiper(
            swiperElement,
            {
                slidesPerView: 1.2,
                slidesPerGroup: 1,
                centeredSlides: true,
                spaceBetween: 16,

                loop: true,
                speed: 500,

                preventClicks: false,
                preventClicksPropagation:
                    false,

                autoplay: {
                    delay: 2500,
                    disableOnInteraction:
                        true,
                    pauseOnMouseEnter:
                        true
                },

                effect: "coverflow",

                coverflowEffect: {
                    rotate: 0,
                    stretch: 140,
                    depth: 70,
                    modifier: 1,
                    scale: 0.94,
                    slideShadows: false
                },

                breakpoints: {
                    640: {
                        slidesPerView: 2,
                        spaceBetween: 20
                    },

                    1000: {
                        slidesPerView: 3,
                        spaceBetween: 24
                    },

                    1900: {
                        slidesPerView: 4,
                        spaceBetween: 24
                    }
                },

                pagination: {
                    el:
                        swiperElement.querySelector(
                            ".swiper-pagination"
                        ),
                    clickable: true
                },

                navigation: {
                    nextEl:
                        swiperElement.querySelector(
                            ".swiper-button-next"
                        ),

                    prevEl:
                        swiperElement.querySelector(
                            ".swiper-button-prev"
                        )
                },

                keyboard: {
                    enabled: false,
                    onlyInViewport: false,
                    pageUpDown: false
                }
            }
        );


    /* -------------------------
       KEYBOARD CONTROL
    ------------------------- */

    if (
        "IntersectionObserver" in window
    ) {
        const keyboardObserver =
            new IntersectionObserver(
                ([entry]) => {
                    if (
                        entry.isIntersecting
                    ) {
                        swiper.keyboard.enable();
                    } else {
                        swiper.keyboard.disable();
                    }
                },
                {
                    threshold: 0.2
                }
            );

        keyboardObserver.observe(
            swiperElement
        );
    }
}


/* =========================================================
   CERTIFICATION LINKS
========================================================= */

(function fixCredentialLinks() {
    const certificationSection =
        document.querySelector(
            "#certifications"
        );

    if (!certificationSection) {
        return;
    }

    let startX = 0;
    let startY = 0;

    document.addEventListener(
        "pointerdown",
        (event) => {
            startX = event.clientX;
            startY = event.clientY;
        },
        true
    );

    document.addEventListener(
        "click",
        (event) => {
            const movedX =
                Math.abs(
                    event.clientX -
                    startX
                );

            const movedY =
                Math.abs(
                    event.clientY -
                    startY
                );

            /*
                إذا كان المستخدم يسحب
                السلايدر، لا نفتح الرابط.
            */
            if (
                movedX > 6 ||
                movedY > 6
            ) {
                return;
            }

            const link =
                document
                    .elementsFromPoint(
                        event.clientX,
                        event.clientY
                    )
                    .find((element) =>
                        element.matches?.(
                            '#certifications .certificate-card a[href]:not([href=""])'
                        )
                    );

            if (!link) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            window.open(
                link.href,
                "_blank",
                "noopener"
            );
        },
        true
    );
})();


/* =========================================================
   CERTIFICATION LINK CURSOR
========================================================= */

(function setupCredentialLinkCursor() {
    const swiper =
        document.querySelector(
            "#certifications .swiper"
        );

    if (!swiper) {
        return;
    }

    swiper.addEventListener(
        "mousemove",
        (event) => {
            const overLink =
                document
                    .elementsFromPoint(
                        event.clientX,
                        event.clientY
                    )
                    .some((element) =>
                        element.matches?.(
                            '#certifications .certificate-card a[href]:not([href=""])'
                        )
                    );

            swiper.style.cursor =
                overLink
                    ? "pointer"
                    : "";
        }
    );

    swiper.addEventListener(
        "mouseleave",
        () => {
            swiper.style.cursor = "";
        }
    );
})();


/* =========================================================
   COPY CONTACT INFORMATION
========================================================= */

document
    .querySelectorAll(
        "#contact .copy-item"
    )
    .forEach((item) => {
        let feedbackTimer;

        item.addEventListener(
            "click",
            async () => {
                const value =
                    item.dataset.copy;

                const feedback =
                    item.querySelector(
                        ".copied"
                    );

                if (
                    !value ||
                    !feedback
                ) {
                    return;
                }

                clearTimeout(
                    feedbackTimer
                );

                try {
                    await navigator.clipboard
                        .writeText(value);

                    feedback.textContent =
                        "Copied!";

                } catch (error) {
                    feedback.textContent =
                        "Couldn't copy";
                }

                feedback.classList.add(
                    "show"
                );

                feedbackTimer =
                    setTimeout(
                        () => {
                            feedback.classList.remove(
                                "show"
                            );

                            feedback.textContent =
                                "";
                        },
                        1800
                    );
            }
        );
    });


/* =========================================================
   NAVBAR BACKGROUND
========================================================= */

(function setupNavbarBackground() {
    const navbar =
        document.querySelector(
            ".navbar"
        );

    if (!navbar) {
        return;
    }

    function updateBackground() {
        navbar.classList.toggle(
            "is-solid",
            window.scrollY > 300
        );
    }

    window.addEventListener(
        "scroll",
        updateBackground,
        {
            passive: true
        }
    );

    updateBackground();
})();


/* =========================================================
   NAVBAR SMOOTH SCROLL
========================================================= */

const scrollTargets = {
    "#contact": {
        selector:
            "#contact .contact-container",
        gap: 10
    }
};

document
    .querySelectorAll(
        '.menu a[href^="#"]'
    )
    .forEach((link) => {
        link.addEventListener(
            "click",
            (event) => {
                const href =
                    link.getAttribute(
                        "href"
                    );

                const config =
                    scrollTargets[href];

                if (!config) {
                    return;
                }

                const target =
                    document.querySelector(
                        config.selector
                    );

                const navbar =
                    document.querySelector(
                        ".navbar"
                    );

                if (
                    !target ||
                    !navbar
                ) {
                    return;
                }

                event.preventDefault();

                const top =
                    target
                        .getBoundingClientRect()
                        .top +
                    window.scrollY -
                    navbar.offsetHeight -
                    config.gap;

                window.scrollTo({
                    top: Math.max(
                        0,
                        top
                    ),
                    behavior: "smooth"
                });
            }
        );
    });


/* =========================================================
   CONTACT FORM
========================================================= */

const contactForm =
    document.getElementById(
        "contact-form"
    );

const formResult =
    document.getElementById(
        "form-result"
    );

if (
    contactForm &&
    formResult
) {
    contactForm.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault();

            const submitButton =
                contactForm.querySelector(
                    'button[type="submit"]'
                );

            formResult.textContent =
                "Sending...";

            if (submitButton) {
                submitButton.disabled =
                    true;
            }

            const formData =
                new FormData(
                    contactForm
                );

            const object =
                Object.fromEntries(
                    formData
                );

            const json =
                JSON.stringify(
                    object
                );

            try {
                const response =
                    await fetch(
                        "https://api.web3forms.com/submit",
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                Accept:
                                    "application/json"
                            },

                            body: json
                        }
                    );

                const result =
                    await response.json();

                if (
                    response.ok &&
                    result.success
                ) {
                    formResult.textContent =
                        "Message sent successfully. Thank you!";

                    contactForm.reset();

                } else {
                    formResult.textContent =
                        "Something went wrong. Please try again.";
                }

            } catch (error) {
                console.error(
                    "Contact form error:",
                    error
                );

                formResult.textContent =
                    "Something went wrong. Please try again.";

            } finally {
                if (submitButton) {
                    submitButton.disabled =
                        false;
                }
            }
        }
    );
}