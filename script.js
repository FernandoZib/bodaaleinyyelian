// ===========================================================
// Aleiny & César Elián — Invitación de boda
// Countdown, scroll-reveal y control de música
// ===========================================================

document.addEventListener('DOMContentLoaded', () => {

  
  /* ---------- Countdown ---------- */
  const weddingDate = new Date('2026-09-18T17:00:00-05:00').getTime();

  const elDays  = document.getElementById('cd-days');
  const elHours = document.getElementById('cd-hours');
  const elMin   = document.getElementById('cd-min');
  const elSec   = document.getElementById('cd-sec');

  function pad(n){ return n.toString().padStart(2, '0'); }

  function setWithFade(el, value){
    if(el.textContent === value) return;
    el.classList.remove('is-changing');
    // forzar reflow para reiniciar la animación
    void el.offsetWidth;
    el.textContent = value;
    el.classList.add('is-changing');
  }

  function updateCountdown(){
    const now = Date.now();
    const diff = weddingDate - now;

    if (diff <= 0){
      [elDays, elHours, elMin, elSec].forEach(el => setWithFade(el, '00'));
      return;
    }

    const days  = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins  = Math.floor((diff / (1000 * 60)) % 60);
    const secs  = Math.floor((diff / 1000) % 60);

    setWithFade(elDays,  pad(days));
    setWithFade(elHours, pad(hours));
    setWithFade(elMin,   pad(mins));
    setWithFade(elSec,   pad(secs));
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  /* ---------- Scroll reveal ---------- */
  const sections = document.querySelectorAll('.section');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  sections.forEach(section => observer.observe(section));

  // Hero is visible immediately
  document.getElementById('hero').classList.add('in-view');

  /* ---------- Máquina de escribir ---------- */
  const twLines = document.querySelectorAll('.tw-line');
  let twStarted = false;

  // Insertamos el texto completo invisible en cada línea para que el
  // navegador calcule y pinte el layout real ANTES de la animación.
  twLines.forEach(el => {
    const text = el.dataset.text || '\u00A0';
    const ghost = document.createElement('span');
    ghost.className = 'tw-ghost';
    ghost.textContent = text.trim() === '' ? '\u00A0' : text;
    el.appendChild(ghost);
    el.style.opacity = '1';
  });

  function typewriterSequence(){
    if(twStarted) return;
    twStarted = true;

    // Fijar la altura exacta de cada línea AHORA que el ghost ya fue
    // renderizado, para que no cambie durante la escritura.
    twLines.forEach(el => {
      const h = el.getBoundingClientRect().height;
      el.style.height = h + 'px';
      el.style.overflow = 'hidden';
    });

    const cursor = document.createElement('span');
    cursor.className = 'tw-cursor';

    let lineIndex = 0;

    function typeLine(lineEl, text, onDone){
      const ghost = lineEl.querySelector('.tw-ghost');
      if(ghost) lineEl.removeChild(ghost);

      if(text.trim() === ''){
        lineEl.textContent = '\u00A0';
        setTimeout(onDone, 300);
        return;
      }

      lineEl.textContent = '';
      lineEl.appendChild(cursor);

      let charIndex = 0;
      const speed = 28;

      function typeChar(){
        if(charIndex < text.length){
          lineEl.insertBefore(document.createTextNode(text[charIndex]), cursor);
          charIndex++;
          setTimeout(typeChar, speed);
        } else {
          setTimeout(onDone, 420);
        }
      }
      typeChar();
    }

    function nextLine(){
      if(lineIndex >= twLines.length){
        if(cursor.parentNode) cursor.parentNode.removeChild(cursor);
        // Liberar alturas fijas al terminar
        twLines.forEach(el => { el.style.height = ''; el.style.overflow = ''; });
        return;
      }
      const el = twLines[lineIndex];
      const text = el.dataset.text || '';
      lineIndex++;
      typeLine(el, text, nextLine);
    }

    nextLine();
  }

  // Arrancar cuando la sección mensaje entra en pantalla
  const msgSection = document.getElementById('mensaje');
  const twObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        typewriterSequence();
        twObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  if(msgSection) twObserver.observe(msgSection);

  /* ---------- Itinerario: recorrido automático con retroceso rápido ---------- */
  const itineraryScroll = document.querySelector('.itinerary-scroll');
  const itineraryTrack = document.querySelector('.itinerary-track');

  if (itineraryTrack && itineraryScroll){
    const PIXELS_PER_SECOND = 36;  // velocidad del recorrido de ida (lento)
    const PAUSE_SECONDS = 0.9;     // pausa breve al llegar al último elemento
    const REWIND_SECONDS = 1.1;    // duración del retroceso rápido al inicio

    let styleTag = document.getElementById('itinerary-dynamic-keyframes');
    if (!styleTag){
      styleTag = document.createElement('style');
      styleTag.id = 'itinerary-dynamic-keyframes';
      document.head.appendChild(styleTag);
    }

    function setupItineraryAnimation(){
      // Distancia necesaria para que el último elemento llegue al borde derecho
      const distance = Math.max(itineraryTrack.scrollWidth - itineraryScroll.clientWidth, 0);

      if (distance <= 0){
        itineraryTrack.style.animation = 'none';
        return;
      }

      itineraryTrack.style.setProperty('--scroll-distance', distance + 'px');

      const forwardDuration = distance / PIXELS_PER_SECOND;
      const totalDuration = forwardDuration + PAUSE_SECONDS + REWIND_SECONDS;

      const forwardEndPct = (forwardDuration / totalDuration) * 100;
      const pauseEndPct = ((forwardDuration + PAUSE_SECONDS) / totalDuration) * 100;

      styleTag.textContent = `
        @keyframes itinerary-auto-scroll {
          0% { transform: translateX(0); }
          ${forwardEndPct.toFixed(3)}% { transform: translateX(calc(-1 * var(--scroll-distance))); }
          ${pauseEndPct.toFixed(3)}% { transform: translateX(calc(-1 * var(--scroll-distance))); }
          100% { transform: translateX(0); }
        }
      `;

      itineraryTrack.style.animationDuration = totalDuration + 's';
    }

    setupItineraryAnimation();
    window.addEventListener('resize', setupItineraryAnimation);

    // Pausar al interactuar (touch/mouse) y reanudar al soltar
    const pause = () => itineraryTrack.classList.add('is-paused');
    const resume = () => itineraryTrack.classList.remove('is-paused');

    itineraryScroll.addEventListener('mouseenter', pause);
    itineraryScroll.addEventListener('mouseleave', resume);
    itineraryScroll.addEventListener('touchstart', pause, { passive: true });
    itineraryScroll.addEventListener('touchend', resume);
    itineraryScroll.addEventListener('touchcancel', resume);

    // Solo iniciar el recorrido cuando la sección es visible (ahorra recursos)
    const itinerarySection = document.getElementById('itinerario');
    if (itinerarySection){
      const itineraryObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting){
            resume();
          } else {
            pause();
          }
        });
      }, { threshold: 0.05 });
      itineraryObserver.observe(itinerarySection);
      // pausado hasta que entre en vista por primera vez
      pause();
    }
  }

  /* ---------- Galería automática + modal ---------- */
  const galleryStage = document.getElementById('galleryStage');
  const galleryDotsWrap = document.getElementById('galleryDots');

  if (galleryStage && galleryDotsWrap){
    const galleryItems = Array.from(galleryStage.querySelectorAll('.gallery-item'));
    const GALLERY_INTERVAL = 5000; // 5 segundos por imagen
    let galleryIndex = 0;
    let galleryTimer = null;
    let galleryRunning = false;

    // Ajustar el tamaño/forma del marco polaroid según la orientación real de cada foto
    galleryItems.forEach(item => {
      const img = item.querySelector('img');
      const polaroid = item.querySelector('.polaroid');
      if (!img || !polaroid) return;

      function applyOrientation(){
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (!w || !h) return;
        const ratio = w / h;
        polaroid.classList.remove('is-portrait', 'is-landscape', 'is-square');
        if (ratio > 1.12){
          polaroid.classList.add('is-landscape');
        } else if (ratio < 0.88){
          polaroid.classList.add('is-portrait');
        } else {
          polaroid.classList.add('is-square');
        }
      }

      if (img.complete && img.naturalWidth){
        applyOrientation();
      } else {
        img.addEventListener('load', applyOrientation);
      }
    });

    // Crear los puntos indicadores
    galleryItems.forEach((_, i) => {
      const dot = document.createElement('span');
      dot.className = 'gdot' + (i === 0 ? ' is-active' : '');
      galleryDotsWrap.appendChild(dot);
    });
    const galleryDots = Array.from(galleryDotsWrap.children);

    function showGallerySlide(i){
      galleryItems.forEach((item, idx) => {
        item.classList.toggle('is-active', idx === i);
      });
      galleryDots.forEach((dot, idx) => {
        dot.classList.toggle('is-active', idx === i);
      });
    }

    function nextGallerySlide(){
      galleryIndex = (galleryIndex + 1) % galleryItems.length;
      showGallerySlide(galleryIndex);
    }

    function startGallery(){
      if (galleryRunning) return;
      galleryRunning = true;
      galleryTimer = setInterval(nextGallerySlide, GALLERY_INTERVAL);
    }

    function stopGallery(){
      galleryRunning = false;
      clearInterval(galleryTimer);
    }

    // Iniciar solo cuando la sección entra en pantalla; pausar al salir
    const gallerySection = document.getElementById('galeria');
    if (gallerySection){
      const galleryObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting){
            startGallery();
          } else {
            stopGallery();
          }
        });
      }, { threshold: 0.3 });
      galleryObserver.observe(gallerySection);
    }

    /* ----- Modal de galería con navegación ----- */
    const modal = document.getElementById('galleryModal');
    const modalImg = document.getElementById('galleryModalImg');
    const modalCaption = document.getElementById('galleryModalCaption');
    const modalCounter = document.getElementById('galleryModalCounter');
    const modalClose = document.getElementById('galleryModalClose');
    const modalBackdrop = document.getElementById('galleryModalBackdrop');
    const modalPrev = document.getElementById('galleryModalPrev');
    const modalNext = document.getElementById('galleryModalNext');

    let modalIndex = 0;

    function renderModalSlide(){
      const item = galleryItems[modalIndex];
      const img = item.querySelector('img');
      modalImg.src = img.src;
      modalImg.alt = img.alt || '';
      modalCaption.textContent = item.dataset.caption || '';
      modalCounter.textContent = (modalIndex + 1) + ' / ' + galleryItems.length;
    }

    function openModal(index){
      modalIndex = index;
      renderModalSlide();
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      stopGallery();
    }

    function closeModal(){
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      // Sincronizar la galería de fondo con la foto en la que se quedó el modal
      galleryIndex = modalIndex;
      showGallerySlide(galleryIndex);
      startGallery();
    }

    function modalPrevSlide(){
      modalIndex = (modalIndex - 1 + galleryItems.length) % galleryItems.length;
      renderModalSlide();
    }

    function modalNextSlide(){
      modalIndex = (modalIndex + 1) % galleryItems.length;
      renderModalSlide();
    }

    // Abrir modal al hacer clic en la foto activa
    galleryItems.forEach((item, i) => {
      item.addEventListener('click', () => {
        if (!item.classList.contains('is-active')) return;
        openModal(i);
      });
    });

    modalClose.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', closeModal);
    modalPrev.addEventListener('click', modalPrevSlide);
    modalNext.addEventListener('click', modalNextSlide);

    document.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft') modalPrevSlide();
      if (e.key === 'ArrowRight') modalNextSlide();
    });

    // Deslizar con el dedo en móvil para navegar dentro del modal
    let touchStartX = null;
    modal.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });

    modal.addEventListener('touchend', (e) => {
      if (touchStartX === null) return;
      const diff = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(diff) > 40){
        diff > 0 ? modalPrevSlide() : modalNextSlide();
      }
      touchStartX = null;
    }, { passive: true });
  }

  /* ---------- Música de fondo ---------- */
  const music = document.getElementById('bgMusic');
  const soundToggle = document.getElementById('soundToggle');
  const iconMuted = document.getElementById('iconMuted');
  const iconSound = document.getElementById('iconSound');
  let isPlaying = false;

  // Para activar música: agrega la URL/ruta de tu canción en el atributo
  // src del elemento <source> dentro de <audio id="bgMusic"> en index.html.
  // Por políticas del navegador, el audio solo puede iniciar tras una
  // interacción del usuario (por eso el botón de sonido).

  soundToggle.addEventListener('click', () => {
    // Usar music.paused para detectar estado real (incluso si la música
    // fue iniciada desde fuera, al abrir el sobre)
    if (music.paused){
      music.play().catch(() => {});
      iconMuted.style.display = 'none';
      iconSound.style.display = 'block';
      isPlaying = true;
    } else {
      music.pause();
      iconSound.style.display = 'none';
      iconMuted.style.display = 'block';
      isPlaying = false;
    }
  });

});


