const cover = document.getElementById("cover");
const invite = document.getElementById("invite");

const pages = [...document.querySelectorAll(".page")];

const rsvpForm = document.getElementById("rsvpForm");
const rsvpReturn = document.getElementById("rsvpReturn");
const backToStartButton = document.querySelector(".back-to-start");
const bgMusic = document.getElementById("bgMusic");

let pageIndex = 0;
let isOpening = false;

const book = window.PageTurnBook ? new window.PageTurnBook("#book", {
  loop: false,
  counter: false,
  keyboard: true,
  swipe: true
}) : null;

// Apply card-like class to all page inners so they share RSVP visual
document.querySelectorAll(".page .page-inner").forEach((inner) => {
  inner.classList.add("page-card");
});

function openInvite() {
  if (isOpening) return;

  isOpening = true;
  cover.classList.add("opening");

  window.setTimeout(() => {
    cover.classList.add("hidden");
    invite.classList.remove("hidden");
    isOpening = false;
    pageIndex = 0;
    if (book) {
      book.goTo(0);
    }
    updatePages();
  }, 850);
}

function startMusic() {
  if (!bgMusic) return;
  bgMusic.currentTime = 0;
  bgMusic.play().catch(() => {});
}

let dragStartX = 0;
let dragStartY = 0;
let dragActive = false;

cover.addEventListener("pointerdown", (event) => {
  if (invite.classList.contains("hidden")) {
    dragActive = true;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    cover.setPointerCapture?.(event.pointerId);
  }
});

cover.addEventListener("pointermove", (event) => {
  if (!dragActive) return;
  const dx = event.clientX - dragStartX;
  const dy = event.clientY - dragStartY;

  if (Math.abs(dx) > 24 || Math.abs(dy) > 24) {
    if (dx < -40 || dy < -40) {
      openInvite();
      dragActive = false;
    }
  }
});

cover.addEventListener("pointerup", () => {
  dragActive = false;
});

cover.addEventListener("pointercancel", () => {
  dragActive = false;
});

function updatePages() {
  pageIndex = book ? book.currentPage : 0;
  pages.forEach((page, index) => {
    page.classList.toggle("active", index === pageIndex);
  });

  if (backToStartButton) {
    backToStartButton.classList.toggle("is-visible", pageIndex === pages.length - 1);
  }

  if (bgMusic) {
    if (pageIndex === pages.length - 1) {
      bgMusic.pause();
    } else if (invite.classList.contains("hidden") === false) {
      bgMusic.play().catch(() => {});
    }
  }
}


function nextPage() {
  if (book) {
    book.next();
  } else if (pageIndex < pages.length - 1) {
    pageIndex++;
    updatePages();
  }
}

function prevPage() {
  if (book) {
    book.prev();
  } else if (pageIndex > 0) {
    pageIndex--;
    updatePages();
  }
}

cover.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") openInvite();
});

if (book) {
  book.root.addEventListener("page-turn:change", updatePages);
}

document.addEventListener("keydown", (event) => {
  if (invite.classList.contains("hidden")) return;
  if (event.key === "ArrowRight") nextPage();
  if (event.key === "ArrowLeft") prevPage();
});

if (backToStartButton) {
  backToStartButton.addEventListener("click", () => {
    invite.classList.add("hidden");
    cover.classList.remove("hidden", "opening");
    pageIndex = 0;
    if (book) {
      book.goTo(0);
    }
    updatePages();
    startMusic();
  });
}

window.addEventListener("load", () => {
  startMusic();
});

let touchStartX = 0;
document.addEventListener("touchstart", (event) => {
  touchStartX = event.changedTouches[0].screenX;
}, { passive: true });

document.addEventListener("touchend", (event) => {
  if (invite.classList.contains("hidden")) return;
  const touchEndX = event.changedTouches[0].screenX;
  const diff = touchStartX - touchEndX;

  if (Math.abs(diff) > 60) {
    if (diff > 0) nextPage();
    else prevPage();
  }
}, { passive: true });

rsvpForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = Object.fromEntries(new FormData(rsvpForm).entries());
  const saved = JSON.parse(localStorage.getItem("confirmacoes_convite") || "[]");

  saved.push({
    ...formData,
    confirmadoEm: new Date().toISOString()
  });

  localStorage.setItem("confirmacoes_convite", JSON.stringify(saved));
  rsvpReturn.textContent = "Presença confirmada com sucesso!";
  rsvpForm.reset();
});

updatePages();
