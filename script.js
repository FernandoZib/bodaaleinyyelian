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

  /* ---------- Galería en grid + zoom centrado secuencial + modal ---------- */
  const galleryGrid = document.getElementById('galleryGrid');
  const galleryDotsWrap = document.getElementById('galleryDots');
  const spotlightBackdrop = document.getElementById('gallerySpotlightBackdrop');
  const pauseBtn = document.getElementById('galleryPauseBtn');

  if (galleryGrid && galleryDotsWrap && spotlightBackdrop){
    const galleryItems = Array.from(galleryGrid.querySelectorAll('.gallery-item'));
    const ZOOM_DURATION = 5000;     // 5 segundos de protagonismo por foto
    const TRAVEL_DURATION = 900;    // duración del viaje hacia/desde el centro
    let galleryIndex = 0;
    let galleryTimer = null;
    let galleryRunning = false;
    let isPaused = true;            // true cuando el recorrido no está en marcha (aún no iniciado o pausado por el usuario)
    let currentSpotlighted = null;  // { item, polaroid, placeholder }

    // Crear los puntos indicadores (uno por foto, muestran cuál está en turno)
    galleryItems.forEach((_, i) => {
      const dot = document.createElement('span');
      dot.className = 'gdot' + (i === 0 ? ' is-active' : '');
      galleryDotsWrap.appendChild(dot);
    });
    const galleryDots = Array.from(galleryDotsWrap.children);

    // Mueve la polaroid al <body> y la traslada/escala hasta el centro de la pantalla
    function spotlightItem(item){
      const polaroid = item.querySelector('.polaroid');
      if (!polaroid) return;

      const rect = polaroid.getBoundingClientRect();

      // Reservar el espacio en el grid mientras la foto está fuera de su lugar
      item.style.minHeight = rect.height + 'px';

      // Marcador invisible que indica dónde regresar la polaroid al terminar
      const placeholder = document.createComment('gallery-placeholder');
      polaroid.parentNode.insertBefore(placeholder, polaroid);

      // Reubicar la polaroid directamente en <body> para que el position:fixed
      // sea relativo a la ventana (y no a un ancestro con transform, como .section)
      document.body.appendChild(polaroid);

      polaroid.style.position = 'fixed';
      polaroid.style.top = rect.top + 'px';
      polaroid.style.left = rect.left + 'px';
      polaroid.style.width = rect.width + 'px';
      polaroid.style.height = rect.height + 'px';
      polaroid.style.margin = '0';
      polaroid.style.zIndex = '500';
      polaroid.style.transition = 'none';
      polaroid.style.transform = 'translate(0px, 0px) scale(1)';
      polaroid.classList.add('is-spotlighted');

      // Forzar reflow antes de animar
      void polaroid.offsetWidth;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const targetWidth = Math.min(vw * 0.84, 440);
      const scaleByWidth = targetWidth / rect.width;
      const scaleByHeight = (vh * 0.78) / rect.height;
      const scale = Math.min(scaleByWidth, scaleByHeight, 2.6);

      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = vw / 2 - cx;
      const dy = vh / 2 - cy;

      spotlightBackdrop.classList.add('is-visible');

      requestAnimationFrame(() => {
        polaroid.style.transition = `transform ${TRAVEL_DURATION}ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.6s ease`;
        polaroid.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
      });

      currentSpotlighted = { item, polaroid, placeholder, fallbackTimer: null };
    }

    // Regresa la polaroid actualmente centrada a su lugar original en el grid
    function unspotlightCurrent(animate){
      if (!currentSpotlighted) return;
      const { item, polaroid, placeholder } = currentSpotlighted;
      currentSpotlighted = null;
      let restored = false;

      function restoreToGrid(){
        if (restored) return; // evita restaurar dos veces si transitionend y el respaldo coinciden
        restored = true;
        polaroid.classList.remove('is-spotlighted');
        polaroid.style.position = '';
        polaroid.style.top = '';
        polaroid.style.left = '';
        polaroid.style.width = '';
        polaroid.style.height = '';
        polaroid.style.margin = '';
        polaroid.style.zIndex = '';
        polaroid.style.transform = '';
        polaroid.style.transition = '';
        if (placeholder.parentNode){
          placeholder.parentNode.insertBefore(polaroid, placeholder);
          placeholder.parentNode.removeChild(placeholder);
        } else {
          item.appendChild(polaroid);
        }
        item.style.minHeight = '';
      }

      if (!animate){
        restoreToGrid();
        return;
      }

      polaroid.style.transition = `transform ${TRAVEL_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.5s ease`;
      polaroid.style.transform = 'translate(0px, 0px) scale(1)';

      const onDone = () => {
        polaroid.removeEventListener('transitionend', onDone);
        restoreToGrid();
      };
      polaroid.addEventListener('transitionend', onDone);
      // Respaldo por si transitionend no dispara (p.ej. elemento oculto)
      setTimeout(onDone, TRAVEL_DURATION + 150);
    }

    function highlightGalleryItem(i){
      unspotlightCurrent(true);
      galleryItems.forEach((item, idx) => item.classList.toggle('is-zooming', idx === i));
      galleryDots.forEach((dot, idx) => dot.classList.toggle('is-active', idx === i));
      spotlightItem(galleryItems[i]);
    }

    function nextGalleryItem(){
      // Al llegar a la última foto, el recorrido se pausa solo en vez de
      // reiniciar el ciclo; queda listo para arrancar desde el principio
      // la próxima vez que se reanude.
      if (galleryIndex >= galleryItems.length - 1){
        galleryIndex = 0;
        pauseTour();
        return;
      }
      galleryIndex++;
      highlightGalleryItem(galleryIndex);
    }

    function startGallery(){
      if (galleryRunning || isPaused) return;
      galleryRunning = true;
      highlightGalleryItem(galleryIndex);
      galleryTimer = setInterval(nextGalleryItem, ZOOM_DURATION);
    }

    function stopGallery(){
      galleryRunning = false;
      clearInterval(galleryTimer);
      unspotlightCurrent(true);
      spotlightBackdrop.classList.remove('is-visible');
      galleryItems.forEach(item => item.classList.remove('is-zooming'));
    }

    // Detiene de inmediato, sin animación (para casos donde no debe verse el viaje de regreso)
    function stopGalleryInstant(){
      galleryRunning = false;
      clearInterval(galleryTimer);
      unspotlightCurrent(false);
      spotlightBackdrop.classList.remove('is-visible');
      galleryItems.forEach(item => item.classList.remove('is-zooming'));
    }

    // Iniciar el ciclo de zoom solo cuando la sección entra en pantalla,
    // y mostrar el botón de pausa (fijo a la pantalla) en ese mismo momento
    const gallerySection = document.getElementById('galeria');
    if (gallerySection){
      const galleryObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting){
            // Ya no se inicia el recorrido automáticamente al llegar a la
            // sección; solo se muestra el botón para que el usuario decida
            // cuándo iniciarlo.
            if (pauseBtn) pauseBtn.classList.add('is-visible');
            updatePauseButtonUI();
          } else {
            // Al salir de la sección se detiene y se vuelve a dejar en
            // estado "no iniciado", para que la próxima vez que el usuario
            // llegue a la Galería deba tocar el botón otra vez.
            isPaused = true;
            stopGalleryInstant();
            updatePauseButtonUI();
            if (pauseBtn) pauseBtn.classList.remove('is-visible');
          }
        });
      }, { threshold: 0.2 });
      galleryObserver.observe(gallerySection);
    }

    /* ----- Botón "Iniciar / Pausar recorrido" ----- */
    const pauseIconPause = pauseBtn ? pauseBtn.querySelector('.gp-icon-pause') : null;
    const pauseIconPlay = pauseBtn ? pauseBtn.querySelector('.gp-icon-play') : null;
    const pauseLabel = pauseBtn ? pauseBtn.querySelector('.gp-label') : null;

    function updatePauseButtonUI(){
      if (!pauseBtn) return;
      pauseBtn.classList.toggle('is-paused', isPaused);
      pauseBtn.setAttribute('aria-pressed', String(isPaused));
      if (pauseIconPause) pauseIconPause.style.display = isPaused ? 'none' : 'block';
      if (pauseIconPlay) pauseIconPlay.style.display = isPaused ? 'block' : 'none';
      if (pauseLabel) pauseLabel.textContent = isPaused ? 'Iniciar recorrido' : 'Pausar recorrido';
    }

    // Sincronizar el botón con el estado inicial (pausado / no iniciado)
    updatePauseButtonUI();

    function pauseTour(){
      if (isPaused) return;
      isPaused = true;
      stopGallery();
      updatePauseButtonUI();
    }

    function resumeTour(){
      if (!isPaused) return;
      isPaused = false;
      updatePauseButtonUI();
      startGallery();
    }

    if (pauseBtn){
      pauseBtn.addEventListener('click', () => {
        isPaused ? resumeTour() : pauseTour();
      });
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
      // Restaurar primero la foto a su lugar en el grid (sin animar) para
      // poder leer su <img> de forma segura, sin importar si estaba centrada
      stopGalleryInstant();
      renderModalSlide();
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeModal(){
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      // Reanudar el ciclo de zoom a partir de la foto que se estaba viendo
      // (no hace nada si el usuario había pausado el recorrido manualmente)
      galleryIndex = modalIndex;
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

    // Cualquier foto se puede abrir en el modal al hacer clic (el listener va
    // en la polaroid, no en el item, porque al estar centrada se reubica en <body>)
    galleryItems.forEach((item, i) => {
      const polaroid = item.querySelector('.polaroid');
      if (polaroid) polaroid.addEventListener('click', () => openModal(i));
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

  // ===================== RSVP / Confirmación de asistencia =====================
  // IMPORTANTE: reemplaza el número de abajo por tu WhatsApp real.
  // Formato: código de país + número, SIN "+", SIN espacios ni guiones.
  // Ejemplo México (Yucatán): 52 + 1 + número a 10 dígitos → "5219991234567"
  const RSVP_WHATSAPP_NUMBER = "56 4164 0594"; // <-- reemplazar

  const rsvpForm = document.getElementById('rsvpForm');
  if (rsvpForm) {
    const rsvpToggle = document.getElementById('rsvpToggle');
    const rsvpError = document.getElementById('rsvpError');
    let rsvpConfirmValue = '';

    rsvpToggle.querySelectorAll('.rsvp-toggle-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        rsvpToggle.querySelectorAll('.rsvp-toggle-btn').forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        rsvpConfirmValue = btn.dataset.value;
        rsvpError.classList.remove('is-visible');
      });
    });

    rsvpForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('rsvpName').value.trim();
      const guests = document.getElementById('rsvpGuests').value.trim();

      if (!name || guests === '' || !rsvpConfirmValue) {
        rsvpError.classList.add('is-visible');
        return;
      }

      const lines = [
        '¡Hola! Soy ' + name + ' 👋',
        '',
        'Confirmo mi asistencia a la boda de Aleiny & César Elián:',
        '• Asistencia: ' + rsvpConfirmValue,
        '• Acompañantes (sin contarme a mí): ' + guests
      ];
      const message = encodeURIComponent(lines.join('\n'));
      const url = 'https://wa.me/' + RSVP_WHATSAPP_NUMBER + '?text=' + message;
      window.open(url, '_blank');
    });
  }

});


