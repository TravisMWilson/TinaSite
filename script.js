const siteConfig = {
    websiteUrl: "https://hamaouimortgages.com",
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

const percentFormatter = new Intl.NumberFormat("en-CA", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
});

function formatPercent(value) {
    const safeValue = Number.isFinite(value) ? value : 0;
    return percentFormatter.format(Math.max(safeValue, 0) / 100);
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

function initBookingPicker() {
    const picker = document.getElementById("bookingPicker");
    const monthLabel = document.getElementById("bookingMonthLabel");
    const dayGrid = document.getElementById("bookingDayGrid");
    const timeSection = document.getElementById("bookingTimeSection");
    const timeGrid = document.getElementById("bookingTimeGrid");
    const selectedDateLabel = document.getElementById("bookingSelectedDateLabel");
    const confirm = document.getElementById("bookingConfirm");
    const confirmValue = document.getElementById("bookingConfirmValue");
    const sendRequest = document.getElementById("bookingSendRequest");
    const reset = document.getElementById("bookingReset");
    const prevBtn = document.getElementById("bookingPrevMonth");
    const nextBtn = document.getElementById("bookingNextMonth");

    // Form fields
    const form = document.getElementById("bookingForm");
    const nameInput = document.getElementById("bookingName");
    const fromEmailHidden = document.getElementById("bookingFromEmail");
    const emailUserInput = document.getElementById("bookingEmailUser");
    const emailDomainInput = document.getElementById("bookingEmailDomain");
    const emailCustomInput = document.getElementById("bookingEmailCustom");
    const phoneInput = document.getElementById("bookingPhone");
    const meetingTypeInput = document.getElementById("bookingMeetingType");

    if (!picker || !monthLabel || !dayGrid) {
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Lock the calendar to 2026 per the project request.
    const allowedYear = 2026;
    const allowedStart = new Date(allowedYear, 0, 1);
    const allowedEnd = new Date(allowedYear, 11, 31);

    let viewMonth = today.getFullYear() === allowedYear ? today.getMonth() : 0;
    let selectedDate = null;
    let selectedTime = null;

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const timeSlots = [
        "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
        "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
        "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
        "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM"
    ];

    const formatLongDate = (date) => {
        const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
        return `${weekday}, ${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    };

    const isSelectable = (date) => {
        if (date < today) return false;
        if (date < allowedStart || date > allowedEnd) return false;
        const day = date.getDay();
        return day !== 0 && day !== 6; // exclude weekends
    };

    const renderCalendar = () => {
        const year = allowedYear;
        const month = viewMonth;
        const firstDay = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startWeekday = firstDay.getDay();

        monthLabel.textContent = `${monthNames[month]} ${year}`;
        dayGrid.innerHTML = "";

        // Pad with empty cells for the start of the week
        for (let i = 0; i < startWeekday; i++) {
            const empty = document.createElement("button");
            empty.type = "button";
            empty.className = "booking-picker__day is-empty";
            empty.tabIndex = -1;
            empty.disabled = true;
            dayGrid.appendChild(empty);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const button = document.createElement("button");
            button.type = "button";
            button.className = "booking-picker__day";
            button.textContent = String(day);
            button.setAttribute("role", "gridcell");
            button.dataset.date = date.toISOString().slice(0, 10);

            if (!isSelectable(date)) {
                button.disabled = true;
            }

            if (date.toDateString() === today.toDateString()) {
                button.classList.add("is-today");
            }

            if (selectedDate && date.toDateString() === selectedDate.toDateString()) {
                button.classList.add("is-selected");
            }

            button.addEventListener("click", () => {
                selectedDate = date;
                selectedTime = null;
                renderCalendar();
                renderTimes();
            });

            dayGrid.appendChild(button);
        }

        // Disable prev button if at or before today
        const firstOfMonth = new Date(year, month, 1);
        prevBtn.disabled = firstOfMonth <= today;
        // Disable next button if at December
        nextBtn.disabled = month === 11;
    };

    const renderTimes = () => {
        if (!selectedDate) {
            timeSection.hidden = true;
            return;
        }
        timeSection.hidden = false;
        selectedDateLabel.textContent = formatLongDate(selectedDate);
        timeGrid.innerHTML = "";

        timeSlots.forEach((slot) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "booking-picker__time";
            button.textContent = slot;
            button.setAttribute("role", "option");
            button.dataset.time = slot;

            if (selectedTime === slot) {
                button.classList.add("is-selected");
                button.setAttribute("aria-selected", "true");
            }

            button.addEventListener("click", () => {
                selectedTime = slot;
                renderTimes();
                showConfirm();
            });

            timeGrid.appendChild(button);
        });
    };

    const updateEmailCustomVisibility = () => {
        if (!emailDomainInput || !emailCustomInput) return;
        const isCustom = emailDomainInput.value === "__custom__";
        emailCustomInput.hidden = !isCustom;
        if (isCustom) {
            emailCustomInput.value = "";
        }
    };

    const getFromEmail = () => {
        let user = (emailUserInput?.value || "").trim();
        let domain = (emailDomainInput?.value || "").trim();

        // If the user typed an "@" in the username field, split it into
        // user + domain automatically and keep the field values in sync.
        if (user.includes("@")) {
            const atIndex = user.indexOf("@");
            const typedDomain = user.slice(atIndex + 1).trim();
            user = user.slice(0, atIndex).trim();
            if (typedDomain) {
                domain = typedDomain;
            }
        }

        // Resolve the domain: if "__custom__" is selected, use the custom input value
        if (domain === "__custom__") {
            domain = (emailCustomInput?.value || "").trim();
        }

        if (!user || !domain) return "";
        return `${user}@${domain}`;
    };

    const syncEmailFields = () => {
        if (!emailUserInput || !emailDomainInput) return;
        const userValue = emailUserInput.value.trim();
        if (userValue.includes("@")) {
            const atIndex = userValue.indexOf("@");
            emailUserInput.value = userValue.slice(0, atIndex);
            // Auto-set the domain if it matches a known one
            const typedDomain = userValue.slice(atIndex + 1);
            const datalist = document.getElementById("bookingEmailDomains");
            if (datalist) {
                const match = Array.from(datalist.querySelectorAll("option")).find(
                    (o) => o.value.toLowerCase() === typedDomain.toLowerCase()
                );
                if (match) {
                    emailDomainInput.value = match.value;
                    updateEmailCustomVisibility();
                } else if (typedDomain) {
                    emailDomainInput.value = "__custom__";
                    updateEmailCustomVisibility();
                    if (emailCustomInput) emailCustomInput.value = typedDomain;
                }
            }
        }
        if (selectedDate && selectedTime) showConfirm();
    };

    if (emailDomainInput) {
        emailDomainInput.addEventListener("change", () => {
            updateEmailCustomVisibility();
            if (selectedDate && selectedTime) showConfirm();
        });
    }

    [emailUserInput, emailCustomInput, nameInput, phoneInput, meetingTypeInput].forEach((input) => {
        if (!input) return;
        input.addEventListener("input", () => {
            if (input === emailUserInput) {
                syncEmailFields();
            } else if (selectedDate && selectedTime) {
                showConfirm();
            }
        });
    });

    const showConfirm = () => {
        if (!selectedDate || !selectedTime) {
            confirm.hidden = true;
            return;
        }

        // Validate required form fields before showing the confirmation
        if (form && !form.checkValidity()) {
            if (typeof form.reportValidity === "function") {
                form.reportValidity();
            }
            confirm.hidden = true;
            return;
        }

        const name = (nameInput?.value || "").trim();
        const fromEmail = getFromEmail();
        const phone = (phoneInput?.value || "").trim();
        const meetingType = (meetingTypeInput?.value || "").trim();
        const toEmail = "catherine.hamaoui@teambreezeful.com";

        if (fromEmailHidden) {
            fromEmailHidden.value = fromEmail;
        }

        confirm.hidden = false;
        confirmValue.textContent = `${formatLongDate(selectedDate)} at ${selectedTime} — ${meetingType}`;

        // Build a mailto link with the chosen date, time, and contact details pre-filled
        const subject = encodeURIComponent(
            `Consultation Request — ${formatLongDate(selectedDate)} ${selectedTime} (${meetingType})`
        );
        const bodyLines = [
            `Hi Catherine,`,
            ``,
            `I'd like to book a consultation for:`,
            `  ${formatLongDate(selectedDate)} at ${selectedTime}`,
            `  Meeting type: ${meetingType}`,
            ``,
            `My details:`,
            `  Name: ${name}`,
            `  Email: ${fromEmail}`,
            `  Phone: ${phone || "Not provided"}`,
            ``,
            `Looking forward to speaking with you.`,
            ``,
            `Thank you,`,
            name
        ];
        const body = encodeURIComponent(bodyLines.join("\n"));
        sendRequest.href = `mailto:${toEmail}?subject=${subject}&body=${body}`;
    };

    prevBtn.addEventListener("click", () => {
        if (viewMonth > 0) {
            viewMonth -= 1;
            renderCalendar();
        }
    });

    nextBtn.addEventListener("click", () => {
        if (viewMonth < 11) {
            viewMonth += 1;
            renderCalendar();
        }
    });

    reset.addEventListener("click", () => {
        selectedDate = null;
        selectedTime = null;
        confirm.hidden = true;
        timeSection.hidden = true;
        renderCalendar();
    });

    renderCalendar();
}

function initContactForm() {
    const contactForm = document.getElementById("contactForm");
    const contactFormStatus = document.getElementById("contactFormStatus");
    const emailUserInput = document.getElementById("contactEmailUser");
    const emailDomainInput = document.getElementById("contactEmailDomain");
    const emailCustomInput = document.getElementById("contactEmailCustom");
    const fullEmailInput = document.getElementById("contactFullEmail");

    if (!contactForm) {
        return;
    }

    const updateContactEmailCustomVisibility = () => {
        if (!emailDomainInput || !emailCustomInput) return;
        const isCustom = emailDomainInput.value === "__custom__";
        emailCustomInput.hidden = !isCustom;
        if (isCustom) {
            emailCustomInput.value = "";
        }
    };

    const composeContactEmail = () => {
        if (!emailUserInput || !emailDomainInput) return "";

        let user = emailUserInput.value.trim();
        let domain = emailDomainInput.value.trim();

        // If the user typed an "@" in the username field, split it into
        // user + domain automatically and update the visible field values.
        if (user.includes("@")) {
            const atIndex = user.indexOf("@");
            const typedDomain = user.slice(atIndex + 1).trim();
            user = user.slice(0, atIndex).trim();
            // Update the visible username field to just show the user part
            emailUserInput.value = user;
            if (typedDomain) {
                domain = typedDomain;
                const knownDomains = ["gmail.com", "hotmail.com", "outlook.com", "live.ca", "yahoo.com", "icloud.com"];
                if (knownDomains.includes(domain.toLowerCase())) {
                    emailDomainInput.value = domain;
                    updateContactEmailCustomVisibility();
                } else {
                    emailDomainInput.value = "__custom__";
                    updateContactEmailCustomVisibility();
                    if (emailCustomInput) emailCustomInput.value = domain;
                }
            }
        }

        if (domain === "__custom__") {
            domain = (emailCustomInput?.value || "").trim();
        }

        const fullEmail = user && domain ? `${user}@${domain}` : "";
        if (fullEmailInput) {
            fullEmailInput.value = fullEmail;
        }
        return fullEmail;
    };

    if (emailDomainInput) {
        emailDomainInput.addEventListener("change", () => {
            updateContactEmailCustomVisibility();
            composeContactEmail();
        });
    }

    [emailUserInput, emailCustomInput].forEach((input) => {
        if (!input) return;
        input.addEventListener("input", composeContactEmail);
    });

    contactForm.addEventListener("submit", (event) => {
        event.preventDefault();

        // Compose and sync the full email before validation
        composeContactEmail();

        if (!contactForm.checkValidity()) {
            contactForm.reportValidity();
            return;
        }

        const formData = new FormData(contactForm);
        const name = String(formData.get("name") || "").trim();
        const email = composeContactEmail();
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

function updateGdsCalculator() {
    const annualIncome = Math.max(Number(document.getElementById("gdsAnnualIncome")?.value), 0);
    const mortgagePayment = Math.max(Number(document.getElementById("gdsMortgagePayment")?.value), 0);
    const propertyTax = Math.max(Number(document.getElementById("gdsPropertyTax")?.value), 0);
    const heating = Math.max(Number(document.getElementById("gdsHeating")?.value), 0);
    const condoFees = Math.max(Number(document.getElementById("gdsCondoFees")?.value), 0);
    const ratioValue = document.getElementById("gdsRatioValue");
    const status = document.getElementById("gdsStatus");
    const output = document.getElementById("gdsOutput");
    const fill = document.getElementById("gdsLimitFill");

    const monthlyHousing = mortgagePayment + propertyTax + heating + (condoFees * 0.5);
    const annualHousing = monthlyHousing * 12;
    const ratio = annualIncome > 0 ? (annualHousing / annualIncome) * 100 : 0;

    animateValue(ratioValue, ratio, formatPercent);

    // Update the limit bar fill width — scale runs from 0% to the qualifying limit
    if (fill) {
        const max = Number(output?.dataset.limit) || 39;
        const fillPct = Math.min(100, Math.max(0, (ratio / max) * 100));
        fill.style.width = `${fillPct}%`;
    }

    // Apply ok/over state to the output container
    if (output) {
        output.classList.remove("calculator-output--ok", "calculator-output--over");
        if (annualIncome > 0) {
            const limit = Number(output.dataset.limit) || 39;
            if (ratio > limit) {
                output.classList.add("calculator-output--over");
            } else {
                output.classList.add("calculator-output--ok");
            }
        }
    }

    if (status) {
        if (annualIncome <= 0) {
            status.textContent = "Enter your annual income to calculate GDS.";
        } else if (ratio <= 35) {
            status.textContent = "Comfortable: well within the 35% target.";
        } else if (ratio <= 39) {
            status.textContent = "Within standard limits (≤ 39%).";
        } else if (ratio <= 45) {
            status.textContent = "Above standard limits — we have lender partners that may still work.";
        } else {
            status.textContent = "High — consider a larger down payment or paying down debts.";
        }
    }
}

function updateTdsCalculator() {
    const annualIncome = Math.max(Number(document.getElementById("tdsAnnualIncome")?.value), 0);
    const housingCosts = Math.max(Number(document.getElementById("tdsHousingCosts")?.value), 0);
    const otherDebts = Math.max(Number(document.getElementById("tdsOtherDebts")?.value), 0);
    const ratioValue = document.getElementById("tdsRatioValue");
    const status = document.getElementById("tdsStatus");
    const output = document.getElementById("tdsOutput");
    const fill = document.getElementById("tdsLimitFill");

    const monthlyTotal = housingCosts + otherDebts;
    const annualTotal = monthlyTotal * 12;
    const ratio = annualIncome > 0 ? (annualTotal / annualIncome) * 100 : 0;

    animateValue(ratioValue, ratio, formatPercent);

    // Update the limit bar fill width — scale runs from 0% to the qualifying limit
    if (fill) {
        const max = Number(output?.dataset.limit) || 44;
        const fillPct = Math.min(100, Math.max(0, (ratio / max) * 100));
        fill.style.width = `${fillPct}%`;
    }

    // Apply ok/over state to the output container
    if (output) {
        output.classList.remove("calculator-output--ok", "calculator-output--over");
        if (annualIncome > 0) {
            const limit = Number(output.dataset.limit) || 44;
            if (ratio > limit) {
                output.classList.add("calculator-output--over");
            } else {
                output.classList.add("calculator-output--ok");
            }
        }
    }

    if (status) {
        if (annualIncome <= 0) {
            status.textContent = "Enter your annual income to calculate TDS.";
        } else if (ratio <= 42) {
            status.textContent = "Comfortable: well within the 42% target.";
        } else if (ratio <= 44) {
            status.textContent = "Within standard limits (≤ 44%).";
        } else if (ratio <= 47) {
            status.textContent = "Above standard limits — we have lender partners that may still work.";
        } else {
            status.textContent = "High — consider a larger down payment or paying down debts.";
        }
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

    ["gdsAnnualIncome", "gdsMortgagePayment", "gdsPropertyTax", "gdsHeating", "gdsCondoFees"].forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener("input", updateGdsCalculator);
        }
    });

    ["tdsAnnualIncome", "tdsHousingCosts", "tdsOtherDebts"].forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener("input", updateTdsCalculator);
        }
    });

    const paymentForm = document.getElementById("paymentForm");
    const affordabilityForm = document.getElementById("affordabilityForm");
    const gdsForm = document.getElementById("gdsForm");
    const tdsForm = document.getElementById("tdsForm");

    paymentForm?.addEventListener("submit", (event) => event.preventDefault());
    affordabilityForm?.addEventListener("submit", (event) => event.preventDefault());
    gdsForm?.addEventListener("submit", (event) => event.preventDefault());
    tdsForm?.addEventListener("submit", (event) => event.preventDefault());

    updatePaymentCalculator();
    updateAffordabilityCalculator();
    updateGdsCalculator();
    updateTdsCalculator();
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

/* ============================================
   Phase 1 motion: Lenis smooth scroll + GSAP cinematic reveals + magnetic CTAs
   ============================================ */

// Lenis smooth scroll: replaces the jumpy default scroll with smooth inertia.
// Falls back gracefully when Lenis isn't loaded (e.g. CDN blocked).
function enableSmoothScroll() {
    if (prefersReducedMotion) return;
    if (typeof Lenis === "undefined") return;

    const lenis = new Lenis({
        duration: 1.05,         // scroll animation duration (seconds)
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // smooth ease-out
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.4,
    });

    // Expose lenis for debugging
    window.__lenis = lenis;

    // Standard Lenis + GSAP integration: GSAP's ticker is the master clock.
// GSAP ticks normally (driving all tweens), and on each tick we also
// pump Lenis. ScrollTrigger listens to Lenis's scroll event so it
// updates trigger positions whenever the user scrolls.
    if (typeof gsap !== "undefined") {
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
    }

    if (typeof ScrollTrigger !== "undefined") {
        lenis.on("scroll", ScrollTrigger.update);
    }

    // Force ScrollTrigger to recalculate now that the page is fully loaded
    if (typeof ScrollTrigger !== "undefined") {
        ScrollTrigger.refresh();
    }

    // Make in-page anchor links (e.g. <a href="#contact">) scroll smoothly
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener("click", (event) => {
            const href = link.getAttribute("href");
            if (!href || href === "#") return;
            const target = document.querySelector(href);
            if (!target) return;
            event.preventDefault();
            lenis.scrollTo(target, { offset: -80, duration: 1.1 });
        });
    });

    // Recalculate ScrollTrigger positions once everything is laid out
    if (typeof ScrollTrigger !== "undefined") {
        setTimeout(() => ScrollTrigger.refresh(), 100);
    }

    return lenis;
}

// Split text into words (preserves spacing) so each word can be animated individually.
// Used for the hero h1 word-by-word reveal.
function splitWordsIntoSpans(element) {
    if (!element || element.dataset.splitDone === "true") return;

    const text = element.textContent;
    const html = text
        .split(/(\s+)/)
        .map((segment) => {
            if (/^\s+$/.test(segment)) return segment; // preserve spaces
            return `<span class="word"><span class="word__inner">${segment}</span></span>`;
        })
        .join("");

    element.innerHTML = html;
    element.dataset.splitDone = "true";
}

// GSAP-powered cinematic reveals + hero word reveal.
// Replaces (and supersedes) the previous IntersectionObserver fade-in for elements
// that opt-in via [data-reveal] or [data-reveal-stagger]. The old fallback CSS
// still runs as a no-JS safety net.
function enableGsapAnimations() {
    if (typeof gsap === "undefined") return;
    if (prefersReducedMotion) {
        // For reduced motion, just show everything immediately
        document.querySelectorAll("[data-reveal], [data-reveal-stagger]")
            .forEach((el) => el.classList.add("is-visible"));
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // --- Hero word reveal ---
    document.querySelectorAll(".split-words").forEach((heading) => {
        splitWordsIntoSpans(heading);
        const words = heading.querySelectorAll(".word__inner");
        gsap.fromTo(words, 
            { yPercent: 110, opacity: 0, rotateX: -35 },
            {
                yPercent: 0,
                opacity: 1,
                rotateX: 0,
                duration: 0.85,
                ease: "power4.out",
                stagger: 0.06,
                delay: 0.15,
            }
        );
    });

    // --- Generic single-element reveal (replaces old IntersectionObserver for [data-reveal]) ---
    const singleReveal = document.querySelectorAll("[data-reveal]");
    singleReveal.forEach((element) => {
        // Skip elements that are inside a stagger group; they're handled below
        if (element.closest("[data-reveal-stagger]")) return;

        gsap.fromTo(element,
            { y: 32, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.9,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: element,
                    start: "top 88%",
                    toggleActions: "play none none none",
                },
                onStart: () => element.classList.add("is-visible"),
            }
        );
    });

    // --- Staggered reveal for groups (cards, list items, etc.) ---
    const staggerGroups = document.querySelectorAll("[data-reveal-stagger]");
    staggerGroups.forEach((group) => {
        const children = group.children;
        gsap.fromTo(children,
            { y: 28, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 0.7,
                ease: "power3.out",
                stagger: 0.08,
                scrollTrigger: {
                    trigger: group,
                    start: "top 85%",
                    toggleActions: "play none none none",
                },
                onStart: () => {
                    Array.from(children).forEach((child) => child.classList.add("is-visible"));
            },
        });
    });
}

// Magnetic CTA buttons: when the cursor gets near a .magnetic element, the
// element subtly translates toward the cursor with a soft elastic return.
// Disabled on touch devices (no hover) and when reduced motion is preferred.
function enableMagneticButtons() {
    if (prefersReducedMotion) return;
    if (window.matchMedia("(hover: none)").matches) return; // touch device

    const strength = 0.32; // 0 = no movement, 1 = full follow

    document.querySelectorAll(".magnetic").forEach((button) => {
        // Make sure the button can be transformed without layout shift
        button.style.willChange = "transform";
        button.style.transition = "transform 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.2)";

        let bounds = null;
        let rafId = 0;
        let targetX = 0;
        let targetY = 0;
        let currentX = 0;
        let currentY = 0;

        const refreshBounds = () => {
            bounds = button.getBoundingClientRect();
        };

        const animate = () => {
            // Spring smoothing toward the target
            currentX += (targetX - currentX) * 0.18;
            currentY += (targetY - currentY) * 0.18;
            button.style.transform = `translate(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px)`;

            if (Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1) {
                rafId = requestAnimationFrame(animate);
            } else {
                rafId = 0;
            }
        };

        button.addEventListener("pointerenter", () => {
            refreshBounds();
            if (!rafId) rafId = requestAnimationFrame(animate);
        });

        button.addEventListener("pointermove", (event) => {
            if (!bounds) refreshBounds();
            const centerX = bounds.left + bounds.width / 2;
            const centerY = bounds.top + bounds.height / 2;
            targetX = (event.clientX - centerX) * strength;
            targetY = (event.clientY - centerY) * strength;
            if (!rafId) rafId = requestAnimationFrame(animate);
        });

        button.addEventListener("pointerleave", () => {
            targetX = 0;
            targetY = 0;
            bounds = null;
            if (!rafId) rafId = requestAnimationFrame(animate);
        });

        // Recompute bounds on resize so the effect stays accurate
        window.addEventListener("resize", refreshBounds, { passive: true });
    });
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
initBookingPicker();
bindCalculatorEvents();
enableRevealAnimations();     // Fallback IO reveals for no-JS / reduced-motion
enableMagneticButtons();      // Magnetic effect on .magnetic CTA buttons
enableHeroPointerGlow();
enableTiltInteractions();
enableScrollIndicators();
updateFooterYear();

// Phase 1 motion (CDN-loaded libraries) — initialize once GSAP/Lenis are ready.
// The deferred CDN scripts may still be loading when script.js runs at end-of-body,
// so we poll briefly and then boot. Falls back gracefully if libraries never load.
(function bootPhase1Motion() {
    let attempts = 0;
    const maxAttempts = 20; // ~2s of polling

    const tryBoot = () => {
        const ready = typeof gsap !== "undefined" && typeof Lenis !== "undefined";
        if (ready || attempts >= maxAttempts) {
            enableSmoothScroll();
            enableGsapAnimations();
            return;
        }
        attempts++;
        setTimeout(tryBoot, 100);
    };

    if (document.readyState === "complete") {
        tryBoot();
    } else {
        window.addEventListener("load", tryBoot, { once: true });
    }
})();
// Help icon tooltips: click toggles persistent state for touch users
(function () {
    const helpIcons = document.querySelectorAll(".help-icon[data-tip]");
    if (!helpIcons.length) return;

    const closeAll = (except) => {
        helpIcons.forEach((icon) => {
            if (icon !== except) icon.classList.remove("is-open");
        });
    };

    helpIcons.forEach((icon) => {
        icon.addEventListener("click", (event) => {
            event.preventDefault();
            const wasOpen = icon.classList.contains("is-open");
            closeAll(icon);
            if (!wasOpen) {
                icon.classList.add("is-open");
            }
        });
    });

    document.addEventListener("click", (event) => {
        if (!event.target.closest(".help-icon")) {
            closeAll(null);
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeAll(null);
        }
    });
})();
// Header dropdowns (Mortgages, Calculators): click to toggle (in addition to hover)
(function () {
    const dropdowns = document.querySelectorAll(".site-nav__dropdown");
    if (!dropdowns.length) return;

    const setOpen = (dropdown, open) => {
        const trigger = dropdown.querySelector(".site-nav__dropdown-trigger");
        dropdown.classList.toggle("is-open", open);
        if (trigger) {
            trigger.setAttribute("aria-expanded", open ? "true" : "false");
        }
    };

    dropdowns.forEach((dropdown) => {
        const trigger = dropdown.querySelector(".site-nav__dropdown-trigger");
        if (!trigger) return;

        trigger.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            const willOpen = !dropdown.classList.contains("is-open");
            // Close any other open dropdowns first
            dropdowns.forEach((other) => {
                if (other !== dropdown) setOpen(other, false);
            });
            setOpen(dropdown, willOpen);
        });

        // Close after selecting a menu item (so the click reaches the anchor)
        dropdown.querySelectorAll(".site-nav__dropdown-menu a").forEach((link) => {
            link.addEventListener("click", () => {
                setOpen(dropdown, false);
            });
        });
    });

    document.addEventListener("click", (event) => {
        if (!event.target.closest(".site-nav__dropdown")) {
            dropdowns.forEach((dropdown) => setOpen(dropdown, false));
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            dropdowns.forEach((dropdown) => {
                setOpen(dropdown, false);
                const trigger = dropdown.querySelector(".site-nav__dropdown-trigger");
                if (trigger && document.activeElement && dropdown.contains(document.activeElement)) {
                    trigger.focus();
                }
            });
        }
    });
})();
// FAQ accordion: only one open at a time
(function () {
    const faqItems = document.querySelectorAll(".faq-item");
    if (!faqItems.length) return;

    faqItems.forEach((item) => {
        item.addEventListener("toggle", () => {
            if (!item.open) return;
            faqItems.forEach((other) => {
                if (other !== item) other.open = false;
            });
        });
    });
})();
