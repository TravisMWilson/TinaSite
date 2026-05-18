const siteConfig = {
    websiteUrl: "https://hamaouimortgages.ca",
    applyUrl: "https://breezeful.com/brokerage-agent/catherine-hamaoui",
    personalPageUrl: "https://breezeful.com/brokerage-agent/catherine-hamaoui",
    bookingUrl: ""
};

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const currencyFormatter = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0
});

function formatCurrency(value) {
    const safeValue = Number.isFinite(value) ? value : 0;
    return currencyFormatter.format(Math.max(safeValue, 0));
}

function animateValue(element, targetValue, formatter, duration = 500) {
    if (!element) {
        return;
    }

    const nextValue = Number.isFinite(targetValue) ? targetValue : 0;

    if (prefersReducedMotion) {
        element.dataset.value = String(nextValue);
        element.textContent = formatter(nextValue);
        return;
    }

    const startingValue = Number(element.dataset.value || 0);
    const startTime = performance.now();

    if (element._frameId) {
        cancelAnimationFrame(element._frameId);
    }

    const tick = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const currentValue = startingValue + ((nextValue - startingValue) * eased);

        element.textContent = formatter(currentValue);

        if (progress < 1) {
            element._frameId = requestAnimationFrame(tick);
            return;
        }

        element.dataset.value = String(nextValue);
        element.textContent = formatter(nextValue);
    };

    element._frameId = requestAnimationFrame(tick);
}

function calculateMortgagePayment(principal, annualRate, amortizationYears) {
    const monthlyRate = annualRate / 100 / 12;
    const totalPayments = amortizationYears * 12;

    if (principal <= 0 || totalPayments <= 0) {
        return 0;
    }

    if (monthlyRate === 0) {
        return principal / totalPayments;
    }

    const factor = Math.pow(1 + monthlyRate, totalPayments);
    return principal * ((monthlyRate * factor) / (factor - 1));
}

function calculateAffordableMortgage(monthlyBudget, annualRate, amortizationYears) {
    const monthlyRate = annualRate / 100 / 12;
    const totalPayments = amortizationYears * 12;

    if (monthlyBudget <= 0 || totalPayments <= 0) {
        return 0;
    }

    if (monthlyRate === 0) {
        return monthlyBudget * totalPayments;
    }

    const factor = Math.pow(1 + monthlyRate, totalPayments);
    return monthlyBudget * ((factor - 1) / (monthlyRate * factor));
}

function updateApplyExperience() {
    const applyButtons = [
        document.getElementById("applyHeaderCta"),
        document.getElementById("applyHeroCta")
    ];
    const bookingButtons = [
        document.getElementById("bookingHeroCta")
    ];
    const bookingCardLink = document.getElementById("bookingCardLink");
    const bookingStatus = document.getElementById("bookingStatus");
    const bookingSummary = document.getElementById("bookingSummary");

    const resolvedApplyUrl = siteConfig.applyUrl || siteConfig.personalPageUrl || siteConfig.websiteUrl;
    const hasApplyUrl = Boolean(siteConfig.applyUrl || siteConfig.personalPageUrl);
    const hasBookingUrl = Boolean(siteConfig.bookingUrl);

    applyButtons.forEach((button) => {
        if (!button) {
            return;
        }

        button.href = resolvedApplyUrl;
        button.target = "_blank";
        button.rel = "noreferrer";
        button.classList.toggle("is-pending", !hasApplyUrl);
    });

    bookingButtons.forEach((button) => {
        if (!button) {
            return;
        }

        button.href = hasBookingUrl ? siteConfig.bookingUrl : "#booking";
        button.target = hasBookingUrl ? "_blank" : "_self";
        button.rel = hasBookingUrl ? "noreferrer" : "";
        button.classList.toggle("is-pending", !hasBookingUrl);
    });

    if (hasBookingUrl && bookingStatus && bookingSummary && bookingCardLink) {
        bookingStatus.textContent = "Live booking enabled";
        bookingSummary.textContent = "Choose a time directly through the live consultation calendar.";
        bookingCardLink.href = siteConfig.bookingUrl;
        bookingCardLink.target = "_blank";
        bookingCardLink.rel = "noreferrer";
        bookingCardLink.textContent = "Open Booking Calendar";
    }
}

function initContactForm() {
    const contactForm = document.getElementById("contactForm");
    const contactFormStatus = document.getElementById("contactFormStatus");

    if (!contactForm) {
        return;
    }

    contactForm.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!contactForm.checkValidity()) {
            contactForm.reportValidity();
            return;
        }

        const formData = new FormData(contactForm);
        const name = String(formData.get("name") || "").trim();
        const email = String(formData.get("email") || "").trim();
        const phone = String(formData.get("phone") || "").trim();
        const goal = String(formData.get("goal") || "").trim();
        const message = String(formData.get("message") || "").trim();
        const subject = `${goal || "Mortgage"} inquiry from ${name}`;
        const body = [
            `Name: ${name}`,
            `Email: ${email}`,
            `Phone: ${phone || "Not provided"}`,
            `Mortgage goal: ${goal || "Not specified"}`,
            "",
            "Message:",
            message
        ].join("\n");
        const mailtoUrl = `mailto:catherine.hamaoui@teambreezeful.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        if (contactFormStatus) {
            contactFormStatus.textContent = "Opening your email app with your message.";
        }

        window.location.href = mailtoUrl;
    });
}

function updatePaymentCalculator() {
    const mortgageAmount = Number(document.getElementById("mortgageAmount")?.value);
    const interestRate = Number(document.getElementById("interestRate")?.value);
    const amortizationYears = Number(document.getElementById("amortizationYears")?.value);
    const monthlyPaymentValue = document.getElementById("monthlyPaymentValue");

    const payment = calculateMortgagePayment(mortgageAmount, interestRate, amortizationYears);
    animateValue(monthlyPaymentValue, payment, formatCurrency);
}

function updateAffordabilityCalculator() {
    const annualIncome = Number(document.getElementById("annualIncome")?.value);
    const monthlyDebts = Number(document.getElementById("monthlyDebts")?.value);
    const downPayment = Number(document.getElementById("downPayment")?.value);
    const qualifyingRate = Number(document.getElementById("qualifyingRate")?.value);
    const affordableHomeValue = document.getElementById("affordableHomeValue");
    const housingBudgetValue = document.getElementById("housingBudgetValue");

    const grossMonthlyIncome = annualIncome / 12;
    const monthlyHousingBudget = Math.max((grossMonthlyIncome * 0.39) - monthlyDebts, 0);
    const mortgageAmount = calculateAffordableMortgage(monthlyHousingBudget, qualifyingRate, 25);
    const estimatedHomePrice = mortgageAmount + Math.max(downPayment, 0);

    animateValue(affordableHomeValue, estimatedHomePrice, formatCurrency);

    if (housingBudgetValue) {
        housingBudgetValue.textContent = `Estimated housing budget: ${formatCurrency(monthlyHousingBudget)} / month`;
    }
}

function bindCalculatorEvents() {
    ["mortgageAmount", "interestRate", "amortizationYears"].forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener("input", updatePaymentCalculator);
        }
    });

    ["annualIncome", "monthlyDebts", "downPayment", "qualifyingRate"].forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener("input", updateAffordabilityCalculator);
        }
    });

    const paymentForm = document.getElementById("paymentForm");
    const affordabilityForm = document.getElementById("affordabilityForm");

    paymentForm?.addEventListener("submit", (event) => event.preventDefault());
    affordabilityForm?.addEventListener("submit", (event) => event.preventDefault());

    updatePaymentCalculator();
    updateAffordabilityCalculator();
}

function enableRevealAnimations() {
    const revealedElements = document.querySelectorAll("[data-reveal]");

    if (!("IntersectionObserver" in window)) {
        revealedElements.forEach((element) => element.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.18,
        rootMargin: "0px 0px -40px 0px"
    });

    revealedElements.forEach((element) => observer.observe(element));
}

function enableHeroPointerGlow() {
    const hero = document.querySelector(".hero");

    if (!hero || prefersReducedMotion) {
        return;
    }

    const resetPointer = () => {
        hero.style.setProperty("--pointer-x", "72%");
        hero.style.setProperty("--pointer-y", "20%");
    };

    hero.addEventListener("pointermove", (event) => {
        const rect = hero.getBoundingClientRect();
        const pointerX = ((event.clientX - rect.left) / rect.width) * 100;
        const pointerY = ((event.clientY - rect.top) / rect.height) * 100;

        hero.style.setProperty("--pointer-x", `${pointerX.toFixed(2)}%`);
        hero.style.setProperty("--pointer-y", `${pointerY.toFixed(2)}%`);
    });

    hero.addEventListener("pointerleave", resetPointer);
    resetPointer();
}

function enableTiltInteractions() {
    if (prefersReducedMotion) {
        return;
    }

    document.querySelectorAll(".portrait-panel").forEach((surface) => {
        let frameId = 0;

        const reset = () => {
            cancelAnimationFrame(frameId);
            surface.style.transform = "";
            surface.classList.remove("is-tilting");
        };

        surface.addEventListener("pointermove", (event) => {
            const rect = surface.getBoundingClientRect();
            const offsetX = ((event.clientX - rect.left) / rect.width) - 0.5;
            const offsetY = ((event.clientY - rect.top) / rect.height) - 0.5;

            cancelAnimationFrame(frameId);
            frameId = requestAnimationFrame(() => {
                const rotateY = offsetX * 12;
                const rotateX = offsetY * -12;
                surface.style.transform = `perspective(1200px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
                surface.classList.add("is-tilting");
            });
        });

        surface.addEventListener("pointerleave", reset);
    });
}

function enableScrollIndicators() {
    const root = document.documentElement;
    const navLinks = Array.from(document.querySelectorAll('.site-nav a[href^="#"]:not(.site-nav__apply)'));
    const sections = navLinks
        .map((link) => ({ link, section: document.querySelector(link.getAttribute("href")) }))
        .filter(({ section }) => Boolean(section));

    let ticking = false;

    const updateState = () => {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
        root.style.setProperty("--scroll-progress", progress.toFixed(4));

        let current = sections[0];
        let smallestDistance = Number.POSITIVE_INFINITY;

        sections.forEach((entry) => {
            const distance = Math.abs(entry.section.getBoundingClientRect().top - 150);
            if (distance < smallestDistance) {
                smallestDistance = distance;
                current = entry;
            }
        });

        navLinks.forEach((link) => link.classList.remove("is-active"));
        current?.link.classList.add("is-active");
        ticking = false;
    };

    const requestUpdate = () => {
        if (ticking) {
            return;
        }

        ticking = true;
        requestAnimationFrame(updateState);
    };

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    updateState();
}

function updateFooterYear() {
    const currentYear = document.getElementById("currentYear");
    if (currentYear) {
        currentYear.textContent = String(new Date().getFullYear());
    }
}

updateApplyExperience();
initContactForm();
bindCalculatorEvents();
enableRevealAnimations();
enableHeroPointerGlow();
enableTiltInteractions();
enableScrollIndicators();
updateFooterYear();