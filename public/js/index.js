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

    // IMPORTANT: stop here so homepage logic doesn't run on register page
    return;
  }

  // =========================================================
  // HOME PAGE ONLY: Everything below runs on index.html
  // =========================================================

  const ebookApiUrl = "/api/ebooks";

  // Greeting (guarded)
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

  // Program buttons (guarded)
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

  // Daily Bible verse (guarded)
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

  // eBooks (guarded)
  const ebookList = document.getElementById("ebook-list");
  const loadingMsg = document.getElementById("loading-msg");

  if (ebookList) {
    fetch(ebookApiUrl)
      .then((response) => response.json())
      .then((data) => {
        if (loadingMsg) loadingMsg.remove();

        if (data && data.ebooks && Array.isArray(data.ebooks)) {
          data.ebooks.forEach((book) => {
            const bookItem = document.createElement("li");
            const bookLink = document.createElement("a");

            bookLink.href = `https://www.gutenberg.org/ebooks/${book.id}`;
            bookLink.textContent = book.title;
            bookLink.target = "_blank";
            bookLink.rel = "noopener noreferrer";

            bookItem.appendChild(bookLink);
            ebookList.appendChild(bookItem);
          });
        } else {
          ebookList.innerHTML = "<li>No eBooks found.</li>";
        }
      })
      .catch((error) => {
        console.error("Error fetching eBooks:", error);
        if (loadingMsg) loadingMsg.textContent = "Failed to load eBooks.";
      });
  }

  // Videos/playlists (already mostly guarded)
  fetch("/api/videos")
    .then((res) => res.json())
    .then((playlists) => {
      playlists.forEach((playlist, index) => {
        const containerId = `playlist-${index + 1}`;
        const container = document.getElementById(containerId);
        if (!container) return;

        playlist.videos.forEach((video) => {
          const videoLink = document.createElement("a");
          videoLink.href = `https://www.youtube.com/watch?v=${video.videoId}`;
          videoLink.target = "_blank";
          videoLink.rel = "noopener noreferrer";

          videoLink.innerHTML = `
            <img src="${video.thumbnail}" alt="${video.title}" style="width: 100%; max-width: 300px;" />
            <p>${video.title}</p>
          `;

          container.appendChild(videoLink);
        });
      });
    })
    .catch((err) => {
      console.error("Error loading videos:", err);
    });

  // Urgent banner (guarded)
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

  // Events & Announcements (guarded)
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

  // Contact smooth scroll (guarded)
  const contactLink = document.getElementById("nav-contact");
  const contactSection = document.getElementById("contact-section");

  if (contactLink && contactSection) {
    contactLink.addEventListener("click", (e) => {
      e.preventDefault();
      contactSection.scrollIntoView({ behavior: "smooth", block: "start" });

      contactSection.classList.add("highlight-contact");
      setTimeout(() => {
        contactSection.classList.remove("highlight-contact");
      }, 100000);
    });
  }

  // Default: show events (guarded)
  if (itemsList) {
    renderItems("event");
    document.querySelector('.filter-btn[data-filter="event"]')?.classList.add("active");
  }
});