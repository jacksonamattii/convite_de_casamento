const cover = document.getElementById("cover");
const invite = document.getElementById("invite");
const backToCover = document.getElementById("backToCover");

const pages = [...document.querySelectorAll(".page")];
const counter = document.getElementById("counter");

const rsvpForm = document.getElementById("rsvpForm");
const rsvpReturn = document.getElementById("rsvpReturn");

const shareBtn = document.getElementById("shareBtn");
const musicBtn = document.getElementById("musicBtn");
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

// Inject a small 'Voltar' button into pages (except first) to go to previous page
function injectBackButtons() {
  const pageEls = document.querySelectorAll(".page");
  pageEls.forEach((page, idx) => {
    // remove existing to avoid duplicates
    const existing = page.querySelector('.page-back-btn');
    if (existing) existing.remove();

    if (idx === 0) return; // first page has no previous

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'page-back-btn';
    btn.textContent = 'Voltar';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (book) book.prev();
      else prevPage();
    });

    page.appendChild(btn);
  });
}

// Previously injected top 'Voltar' buttons removed per user request.

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
    // Auto-play música quando o convite abre
    try {
      bgMusic.play();
      musicBtn.textContent = "⏸";
    } catch (e) {
      console.log("Autoplay bloqueado pelo navegador");
    }
  }, 850);
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

function backCover() {
  invite.classList.add("hidden");
  cover.classList.remove("hidden", "opening");
  pageIndex = 0;
  if (book) {
    book.goTo(0);
  }
  updatePages();
}

function updatePages() {
  pageIndex = book ? book.currentPage : 0;
  pages.forEach((page, index) => {
    page.classList.toggle("active", index === pageIndex);
  });

  counter.textContent = `${pageIndex + 1} / ${pages.length}`;
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

backToCover.addEventListener("click", backCover);

document.addEventListener("keydown", (event) => {
  if (invite.classList.contains("hidden")) return;
  if (event.key === "ArrowRight") nextPage();
  if (event.key === "ArrowLeft") prevPage();
  if (event.key === "Escape") backCover();
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

musicBtn.addEventListener("click", async () => {
  try {
    if (bgMusic.paused) {
      await bgMusic.play();
      musicBtn.textContent = "⏸";
    } else {
      bgMusic.pause();
      musicBtn.textContent = "♪";
    }
  } catch {
    alert("Para ativar a música, coloque um arquivo em assets/musica.mp3 e descomente a tag <source> no index.html.");
  }
});

shareBtn.addEventListener("click", async () => {
  const shareData = {
    title: "Convite Milena & Bento",
    text: "Veja nosso convite interativo!",
    url: window.location.href
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (_) {}
    return;
  }

  try {
    await navigator.clipboard.writeText(window.location.href);
    alert("Link copiado!");
  } catch {
    alert("Copie manualmente o link do navegador.");
  }
});

updatePages();
