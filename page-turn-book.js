/*
  PageTurnBook - paginação pela ponta inferior direita
  Sem dependências.

  Uso:
    const book = new PageTurnBook("#meuLivro", {
      duration: 760,
      loop: false,
      startPage: 0
    });

    book.next();
    book.prev();
    book.goTo(2);

  Eventos:
    page-turn:start
    page-turn:change
    page-turn:complete
*/

class PageTurnBook {
  constructor(target, options = {}) {
    this.root = typeof target === "string" ? document.querySelector(target) : target;

    if (!this.root) {
      throw new Error("PageTurnBook: elemento raiz não encontrado.");
    }

    this.options = {
      duration: Number(options.duration ?? 760),
      loop: Boolean(options.loop ?? false),
      startPage: Number(options.startPage ?? 0),
      cornerSize: Number(options.cornerSize ?? 96),
      keyboard: Boolean(options.keyboard ?? true),
      swipe: Boolean(options.swipe ?? true),
      counter: Boolean(options.counter ?? false),
      ...options
    };

    this.pages = Array.from(this.root.querySelectorAll("[data-page-turn-page], .page-turn-book__page, .page"));
    this.index = Math.max(0, Math.min(this.options.startPage, this.pages.length - 1));
    this.isAnimating = false;
    this.pointerStart = null;
    this.dragState = null;

    this.setup();
    this.render();
  }

  setup() {
    this.root.classList.add("page-turn-book");
    this.root.style.setProperty("--pt-duration", `${this.options.duration}ms`);
    this.root.style.setProperty("--pt-corner-size", `${this.options.cornerSize}px`);

    this.pages.forEach((page) => {
      page.classList.add("page-turn-book__page");

      if (!page.querySelector(":scope > .page-turn-book__curl")) {
        const curl = document.createElement("span");
        curl.className = "page-turn-book__curl";
        curl.setAttribute("aria-hidden", "true");
        page.appendChild(curl);
      }
    });

    // right hotspot (next)
    this.hotspotRight = document.createElement("button");
    this.hotspotRight.type = "button";
    this.hotspotRight.className = "page-turn-book__hotspot";
    this.hotspotRight.setAttribute("aria-label", "Virar página (próxima)");
    this.hotspotRight.title = "puxe aqui";

    const hintR = document.createElement("span");
    hintR.className = "page-turn-book__hint";
    hintR.textContent = "puxe aqui";
    this.hotspotRight.appendChild(hintR);
    this.root.appendChild(this.hotspotRight);

    this.hotspotRight.addEventListener("click", (event) => {
      event.preventDefault();
      this.next();
    });

    // left hotspot (prev)
    this.hotspotLeft = document.createElement("button");
    this.hotspotLeft.type = "button";
    this.hotspotLeft.className = "page-turn-book__hotspot page-turn-book__hotspot--left";
    this.hotspotLeft.setAttribute("aria-label", "Voltar página");
    this.hotspotLeft.title = "puxe aqui";

    const hintL = document.createElement("span");
    hintL.className = "page-turn-book__hint";
    hintL.textContent = "puxe aqui";
    this.hotspotLeft.appendChild(hintL);
    this.root.appendChild(this.hotspotLeft);

    this.hotspotLeft.addEventListener("click", (event) => {
      event.preventDefault();
      this.prev();
    });

    if (this.options.counter) {
      this.counter = document.createElement("span");
      this.counter.className = "page-turn-book__counter";
      this.root.appendChild(this.counter);
    }

    if (this.options.keyboard) {
      this.keyHandler = (event) => {
        const isFocusedInside = this.root.contains(document.activeElement);
        const isHovered = this.root.matches(":hover");

        if (!isFocusedInside && !isHovered) return;

        if (event.key === "ArrowRight") this.next();
        if (event.key === "ArrowLeft") this.prev();
      };

      document.addEventListener("keydown", this.keyHandler);
    }

    if (this.options.swipe) {
      this.root.addEventListener("pointerdown", this.onPointerDown);
      this.root.addEventListener("pointermove", this.onPointerMove);
      this.root.addEventListener("pointerup", this.onPointerUp);
      this.root.addEventListener("pointercancel", this.onPointerCancel);
    }
  }

  onPointerDown = (event) => {
    if (this.isAnimating || !this.options.swipe) return;
    if (event.target.closest("a, button, input, textarea, select, [data-no-drag]")) return;

    const rect = this.root.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const isBottomRight =
      x > rect.width - this.options.cornerSize * 1.4 &&
      y > rect.height - this.options.cornerSize * 1.4;

    const isBottomLeft =
      x < this.options.cornerSize * 1.4 &&
      y > rect.height - this.options.cornerSize * 1.4;

    const isTouchGesture = event.pointerType !== "mouse" || event.button === 0;
    const shouldStart = isTouchGesture && (event.pointerType !== "mouse" || isBottomRight || isBottomLeft);

    if (!shouldStart) return;

    event.preventDefault();
    this.dragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      startedAt: performance.now(),
      startCorner: isBottomLeft ? 'left' : 'right'
    };

    this.root.classList.add("is-dragging");
  };

  onPointerMove = (event) => {
    if (!this.dragState || this.dragState.pointerId !== event.pointerId || this.isAnimating) return;

    const dx = event.clientX - this.dragState.startX;
    const dy = event.clientY - this.dragState.startY;

    if (!this.dragState.moved && Math.abs(dx) < 8 && Math.abs(dy) < 8) return;

    this.dragState.moved = true;
    event.preventDefault();

    const currentPage = this.pages[this.index];
    if (!currentPage) return;

    // direction inference: negative dx or negative dy tends to mean next (turn forward)
    let direction = dx < 0 || dy < 0 ? "next" : "prev";
    // if user started at left corner, invert horizontal influence so dragging right becomes 'prev'
    const corner = this.dragState.startCorner || 'right';
    const signMultiplier = corner === 'left' ? 1 : -1;
    const strength = Math.min(1, Math.max(0, (Math.abs(dx) + Math.abs(dy)) / Math.max(this.root.clientWidth, this.root.clientHeight) * 1.25));
    const raw = dx * 0.55 + dy * 0.35;
    const rotation = signMultiplier * Math.max(-120, Math.min(120, raw));
    const translateX = signMultiplier * Math.min(70, Math.max(0, (Math.abs(dx) + Math.abs(dy)) * 0.10));
    const translateY = direction === "next"
      ? Math.max(-12, -Math.abs(dy) * 0.04)
      : Math.max(12, Math.abs(dy) * 0.04);

    currentPage.classList.add("is-being-dragged");
    currentPage.style.transform = `rotateY(${rotation}deg) rotateZ(${rotation * 0.04}deg) translateX(${translateX}px) translateY(${translateY}px)`;
    currentPage.style.opacity = `${Math.max(0.76, 1 - strength * 0.24)}`;
  };

  onPointerUp = (event) => {
    if (!this.dragState || this.dragState.pointerId !== event.pointerId) return;

    const dx = event.clientX - this.dragState.startX;
    const dy = event.clientY - this.dragState.startY;
    const distance = Math.abs(dx) + Math.abs(dy);
    const direction = dx < 0 || dy < 0 ? "next" : "prev";
    const elapsed = performance.now() - this.dragState.startedAt;
    const shouldTurn = this.dragState.moved && (distance > 70 || elapsed > 220 && distance > 40);

    this.resetDragVisuals();
    this.dragState = null;
    this.root.classList.remove("is-dragging");

    if (shouldTurn) {
      if (direction === "next") this.next();
      else this.prev();
    }
  };

  onPointerCancel = () => {
    this.resetDragVisuals();
    this.dragState = null;
    this.root.classList.remove("is-dragging");
  };

  get currentPage() {
    return this.index;
  }

  get totalPages() {
    return this.pages.length;
  }

  next() {
    if (this.isAnimating || this.pages.length <= 1) return false;

    const nextIndex = this.index + 1;

    if (nextIndex >= this.pages.length) {
      if (!this.options.loop) return false;
      return this.goTo(0, "next");
    }

    return this.goTo(nextIndex, "next");
  }

  prev() {
    if (this.isAnimating || this.pages.length <= 1) return false;

    const prevIndex = this.index - 1;

    if (prevIndex < 0) {
      if (!this.options.loop) return false;
      return this.goTo(this.pages.length - 1, "prev");
    }

    return this.goTo(prevIndex, "prev");
  }

  goTo(targetIndex, direction = null) {
    targetIndex = Number(targetIndex);

    if (
      Number.isNaN(targetIndex) ||
      targetIndex < 0 ||
      targetIndex >= this.pages.length ||
      targetIndex === this.index ||
      this.isAnimating
    ) {
      return false;
    }

    const oldIndex = this.index;
    const nextIndex = targetIndex;
    const resolvedDirection = direction || (nextIndex > oldIndex ? "next" : "prev");

    const current = this.pages[oldIndex];
    const incoming = this.pages[nextIndex];

    this.isAnimating = true;
    this.root.classList.add("is-animating");

    this.clearTransientClasses();
    this.resetDragVisuals();

    incoming.classList.add("is-active", "is-under");

    this.emit("start", {
      from: oldIndex,
      to: nextIndex,
      direction: resolvedDirection
    });

    if (resolvedDirection === "next") {
      current.classList.add("is-turning-next");
    } else {
      current.classList.add("is-under");
      incoming.classList.add("is-returning-prev");
    }

    window.setTimeout(() => {
      this.index = nextIndex;
      this.isAnimating = false;

      this.clearTransientClasses();
      this.root.classList.remove("is-animating");

      this.render();

      const detail = {
        previous: oldIndex,
        current: this.index,
        direction: resolvedDirection
      };

      this.emit("change", detail);
      this.emit("complete", detail);
    }, this.options.duration);

    return true;
  }

  render() {
    this.pages.forEach((page, index) => {
      page.classList.toggle("is-active", index === this.index);

      page.style.zIndex = index === this.index
        ? "4"
        : String(Math.max(0, this.pages.length - index));
    });

    this.root.classList.toggle("is-first", this.index === 0);
    this.root.classList.toggle("is-last", this.index === this.pages.length - 1);

    if (this.counter) {
      this.counter.textContent = `${this.index + 1} / ${this.pages.length}`;
    }
  }

  clearTransientClasses() {
    this.pages.forEach((page) => {
      page.classList.remove(
        "is-under",
        "is-turning-next",
        "is-returning-prev"
      );
    });
  }

  resetDragVisuals() {
    this.pages.forEach((page) => {
      page.classList.remove("is-being-dragged");
      page.style.transform = "";
      page.style.opacity = "";
    });
  }

  emit(name, detail) {
    this.root.dispatchEvent(new CustomEvent(`page-turn:${name}`, {
      bubbles: true,
      detail
    }));
  }

  destroy() {
    this.hotspotRight?.remove();
    this.hotspotLeft?.remove();
    this.counter?.remove();

    if (this.keyHandler) {
      document.removeEventListener("keydown", this.keyHandler);
    }

    this.root.removeEventListener("pointerdown", this.onPointerDown);
    this.root.removeEventListener("pointermove", this.onPointerMove);
    this.root.removeEventListener("pointerup", this.onPointerUp);
    this.root.removeEventListener("pointercancel", this.onPointerCancel);

    this.pages.forEach((page) => {
      page.classList.remove(
        "page-turn-book__page",
        "is-active",
        "is-under",
        "is-turning-next",
        "is-returning-prev"
      );

      page.querySelector(":scope > .page-turn-book__curl")?.remove();
    });

    this.root.classList.remove(
      "page-turn-book",
      "is-animating",
      "is-first",
      "is-last"
    );
  }
}

window.PageTurnBook = PageTurnBook;
