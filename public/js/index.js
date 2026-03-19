"use strict";

document.addEventListener("DOMContentLoaded", () => {
  // =========================================================
  // REGISTER PAGE ONLY: Member Registration (POST /api/members)
  // =========================================================
  const memberForm = document.getElementById("member-form");

  if (memberForm) {
    const memberMsg =
      memberForm.querySelector("#member-message") ||
      document.getElementById("member-message");

    function setMemberMessage(text, isError = false) {
      if (!memberMsg) return;
      memberMsg.textContent = text;
      memberMsg.style.color = isError ? "crimson" : "green";
      memberMsg.style.display = "block";
    }

    memberForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const payload = {
        fullName: document.getElementById("fullName")?.value?.trim(),
        email: document.getElementById("email")?.value?.trim(),
        phone: document.getElementById("phone")?.value?.trim() || undefined,
        ageRange: document.getElementById("ageRange")?.value,
        county: document.getElementById("county")?.value?.trim(),
        country: document.getElementById("country")?.value?.trim() || "Kenya",
        chapter: document.getElementById("chapter")?.value?.trim() || undefined,
        source: "website",
      };

      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

      setMemberMessage("Submitting...");

      try {
        const res = await fetch("/api/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          if (res.status === 400 && Array.isArray(data?.details) && data.details.length) {
            const msg = data.details.map((d) => `${d.field}: ${d.message}`).join(" | ");
            setMemberMessage(msg, true);
            return;
          }
          setMemberMessage(data?.error || "Registration failed.", true);
          return;
        }

        setMemberMessage("✅ Registration successful!");
        memberForm.reset();
      } catch (err) {
        console.error("Member submit error:", err);
        setMemberMessage("Network/server error. Please try again.", true);
      }
    });

    return;
  }

  // =========================================================
  // HOME PAGE ONLY: Everything below runs on index.html
  // =========================================================

  const ebookApiUrl = "/api/ebooks";

  // Greeting
  const greetingEl = document.getElementById("greeting");
  if (greetingEl) {
    const currentHour = new Date().getHours();
    let greetingMessage = "Good Day!";

    if (currentHour < 12) greetingMessage = "Good Morning!";
    else if (currentHour < 18) greetingMessage = "Good Afternoon!";
    else greetingMessage = "Good Evening!";

    greetingEl.textContent =
      greetingMessage +
      " Welcome to Light Bearers website where we empower Youth for Social, Economic, and Academic Growth";
  }

  // Program buttons
  const programDetails = {
    academic: "Our Academic Support program helps students with tutoring, study groups, and test prep.",
    career: "Our Career Development program offers workshops on resumes, interviews, and job search strategies.",
    community: "We organize community outreach programs to help students give back and engage with their local area.",
    mentorship: "Our Mentorship program pairs students with industry professionals to guide their career paths.",
  };

  const programDetailsEl = document.getElementById("program-details");
  document.querySelectorAll(".program-btn").forEach((button) => {
    button.addEventListener("click", function () {
      if (!programDetailsEl) return;
      const programType = this.getAttribute("data-program");
      const programText = programDetails[programType] || "Details not found.";
      programDetailsEl.textContent = programText;
    });
  });

  // Daily Bible verse
  async function getBibleVerse() {
    const verseEl = document.getElementById("bible-verse");
    const refEl = document.getElementById("bible-reference");
    if (!verseEl || !refEl) return;

    try {
      const response = await fetch("/api/bible-verse");
      const data = await response.json();

      if (data && data.verse) {
        verseEl.textContent = `"${data.verse}"`;
        refEl.textContent = data.reference || "";
      } else {
        verseEl.textContent = "No verse found.";
        refEl.textContent = "";
      }
    } catch (error) {
      console.error("Error fetching Bible verse:", error);
      verseEl.textContent = "Failed to load verse.";
      refEl.textContent = "";
    }
  }
  getBibleVerse();

  // =========================================================
  // LOAD MORE STATE
  // =========================================================
  const videoState = {
    "playlist-1": {
      items: [],
      visibleCount: 2,
      step: 2,
      containerId: "playlist-1",
      buttonId: "load-more-playlist-1",
    },
    "playlist-2": {
      items: [],
      visibleCount: 2,
      step: 2,
      containerId: "playlist-2",
      buttonId: "load-more-playlist-2",
    },
  };

  const ebookState = {
    items: [],
    visibleCount: 2,
    step: 2,
    containerId: "ebook-list",
    buttonId: "load-more-ebooks",
  };

  // =========================================================
  // RENDER HELPERS
  // =========================================================
  function renderVideos(stateKey) {
    const state = videoState[stateKey];
    const container = document.getElementById(state.containerId);
    const button = document.getElementById(state.buttonId);

    if (!container || !button) return;

    container.innerHTML = "";

    const visibleItems = state.items.slice(0, state.visibleCount);

    if (visibleItems.length === 0) {
      container.innerHTML = "<p>No videos available.</p>";
      button.classList.add("hidden");
      return;
    }

    visibleItems.forEach((video) => {
      const videoLink = document.createElement("a");
      videoLink.className = "video-item";
      videoLink.href = `https://www.youtube.com/watch?v=${video.videoId}`;
      videoLink.target = "_blank";
      videoLink.rel = "noopener noreferrer";

      videoLink.innerHTML = `
        <img src="${video.thumbnail}" alt="${video.title}" />
        <div class="title">${video.title}</div>
      `;

      container.appendChild(videoLink);
    });

    if (state.visibleCount >= state.items.length) {
      button.classList.add("hidden");
    } else {
      button.classList.remove("hidden");
    }
  }

  function renderEbooks() {
    const container = document.getElementById(ebookState.containerId);
    const button = document.getElementById(ebookState.buttonId);

    if (!container || !button) return;

    container.innerHTML = "";

    const visibleItems = ebookState.items.slice(0, ebookState.visibleCount);

    if (visibleItems.length === 0) {
      container.innerHTML = "<li>No eBooks found.</li>";
      button.classList.add("hidden");
      return;
    }

    visibleItems.forEach((book) => {
      const bookItem = document.createElement("li");
      const bookLink = document.createElement("a");

      bookLink.href = `https://www.gutenberg.org/ebooks/${book.id}`;
      bookLink.textContent = book.title;
      bookLink.target = "_blank";
      bookLink.rel = "noopener noreferrer";

      bookItem.appendChild(bookLink);
      container.appendChild(bookItem);
    });

    if (ebookState.visibleCount >= ebookState.items.length) {
      button.classList.add("hidden");
    } else {
      button.classList.remove("hidden");
    }
  }

  // =========================================================
  // LOAD MORE BUTTONS
  // =========================================================
  function setupLoadMoreButtons() {
    const playlist1Btn = document.getElementById("load-more-playlist-1");
    const playlist2Btn = document.getElementById("load-more-playlist-2");
    const ebooksBtn = document.getElementById("load-more-ebooks");

    if (playlist1Btn) {
      playlist1Btn.addEventListener("click", () => {
        videoState["playlist-1"].visibleCount += videoState["playlist-1"].step;
        renderVideos("playlist-1");
      });
    }

    if (playlist2Btn) {
      playlist2Btn.addEventListener("click", () => {
        videoState["playlist-2"].visibleCount += videoState["playlist-2"].step;
        renderVideos("playlist-2");
      });
    }

    if (ebooksBtn) {
      ebooksBtn.addEventListener("click", () => {
        ebookState.visibleCount += ebookState.step;
        renderEbooks();
      });
    }
  }

  setupLoadMoreButtons();

  // =========================================================
  // EBOOKS
  // =========================================================
  async function loadEbooks() {
    try {
      const response = await fetch(ebookApiUrl);
      const data = await response.json();

      if (data && Array.isArray(data.ebooks)) {
        ebookState.items = data.ebooks;
        renderEbooks();
      } else {
        const ebookList = document.getElementById("ebook-list");
        if (ebookList) ebookList.innerHTML = "<li>No eBooks found.</li>";
      }
    } catch (error) {
      console.error("Error fetching eBooks:", error);
      const ebookList = document.getElementById("ebook-list");
      if (ebookList) ebookList.innerHTML = "<li>Failed to load eBooks.</li>";
    }
  }

  loadEbooks();

  // =========================================================
  // VIDEOS / PLAYLISTS
  // =========================================================
  async function loadVideos() {
    try {
      const res = await fetch("/api/videos");
      const playlists = await res.json();

      if (!Array.isArray(playlists)) return;

      if (playlists[0]) {
        videoState["playlist-1"].items = playlists[0].videos || [];
        renderVideos("playlist-1");
      }

      if (playlists[1]) {
        videoState["playlist-2"].items = playlists[1].videos || [];
        renderVideos("playlist-2");
      }
    } catch (err) {
      console.error("Error loading videos:", err);

      const container1 = document.getElementById("playlist-1");
      const container2 = document.getElementById("playlist-2");
      const btn1 = document.getElementById("load-more-playlist-1");
      const btn2 = document.getElementById("load-more-playlist-2");

      if (container1) container1.innerHTML = "<p>Failed to load videos.</p>";
      if (container2) container2.innerHTML = "<p>Failed to load videos.</p>";
      if (btn1) btn1.classList.add("hidden");
      if (btn2) btn2.classList.add("hidden");
    }
  }

  loadVideos();

  // Urgent banner
  const urgentBanner = document.getElementById("urgent-banner");
  const urgentText = document.getElementById("urgent-text");
  const closeUrgent = document.getElementById("close-urgent");

  const urgentAnnouncement = "Registration closes this Friday! Hurry and sign up now.";

  if (urgentBanner && urgentText && urgentAnnouncement) {
    urgentText.textContent = urgentAnnouncement;
    urgentBanner.style.display = "flex";
  }

  if (closeUrgent && urgentBanner) {
    closeUrgent.addEventListener("click", () => {
      urgentBanner.style.display = "none";
    });
  }

  // Events & Announcements
  const events = [
    {
      title: "Student Leadership Summit",
      date: "2025-08-20",
      description: "A day-long workshop to build leadership skills and network with peers.",
      type: "event",
    },
    {
      title: "Mentorship Program Kickoff",
      date: "2025-08-20",
      description: "Meet your mentors and set your goals for the semester.",
      type: "event",
    },
    {
      title: "📢 Final Call for Registration",
      date: "2025-08-10",
      description: "Today is the last day to register for summer programs.",
      type: "announcement",
    },
  ];

  const itemsList = document.getElementById("announcement-list");
  const filterButtons = document.querySelectorAll(".filter-btn");

  function calculateDaysLeft(dateString) {
    const today = new Date();
    const eventDate = new Date(dateString);
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    const diffTime = eventDate - today;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  function renderItems(type) {
    if (!itemsList) return;

    itemsList.innerHTML = "";
    const filtered = type === "all" ? events : events.filter((e) => e.type === type);

    if (filtered.length === 0) {
      itemsList.innerHTML = "<p>No items to show.</p>";
      return;
    }

    filtered.forEach((item) => {
      const li = document.createElement("li");

      const daysRemaining = calculateDaysLeft(item.date);
      const countdownText =
        item.type === "event"
          ? daysRemaining >= 0
            ? `<span style="color: #d35400; font-weight: bold;">${daysRemaining} day${
                daysRemaining !== 1 ? "s" : ""
              } remaining</span>`
            : `<span style="color: #999;">Event has passed</span>`
          : "";

      let content = `
        <strong>${item.title}</strong><br/>
        <small>${item.date}</small> ${countdownText}<br/>
        <p>${item.description}</p>
      `;

      if (item.type === "event") {
        const today = new Date();
        const eventDate = new Date(item.date);

        if (eventDate >= today) {
          const startDate = item.date.replace(/-/g, "");
          const calendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
            item.title
          )}&dates=${startDate}/${startDate}&details=${encodeURIComponent(item.description)}`;
          content += `<br/><a href="${calendarUrl}" target="_blank" rel="noopener noreferrer">📅 Add to Google Calendar</a>`;
        }
      }

      li.innerHTML = content;
      itemsList.appendChild(li);
    });
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const filterType = btn.getAttribute("data-filter");
      renderItems(filterType);
    });
  });

  // Contact smooth scroll
  const contactLink = document.getElementById("nav-contact");
  const contactSection = document.getElementById("contact-section");

  if (contactLink && contactSection) {
    contactLink.addEventListener("click", (e) => {
      e.preventDefault();
      contactSection.scrollIntoView({ behavior: "smooth", block: "start" });

      contactSection.classList.add("highlight-contact");
      setTimeout(() => {
        contactSection.classList.remove("highlight-contact");
      }, 4000);
    });
  }

  // Default events tab
  if (itemsList) {
    renderItems("event");
    document.querySelector('.filter-btn[data-filter="event"]')?.classList.add("active");
  }
});