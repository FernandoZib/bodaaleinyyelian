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

  function updateCountdown(){
    const now = Date.now();
    const diff = weddingDate - now;

    if (diff <= 0){
      elDays.textContent = '00';
      elHours.textContent = '00';
      elMin.textContent = '00';
      elSec.textContent = '00';
      return;
    }

    const days  = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins  = Math.floor((diff / (1000 * 60)) % 60);
    const secs  = Math.floor((diff / 1000) % 60);

    elDays.textContent  = pad(days);
    elHours.textContent = pad(hours);
    elMin.textContent   = pad(mins);
    elSec.textContent   = pad(secs);
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

  function typewriterSequence(){
    if(twStarted) return;
    twStarted = true;

    // cursor compartido
    const cursor = document.createElement('span');
    cursor.className = 'tw-cursor';

    let lineIndex = 0;

    function typeLine(lineEl, text, onDone){
      lineEl.classList.add('typing');
      lineEl.textContent = '';
      lineEl.appendChild(cursor);

      // líneas de espacio: mostrar de inmediato sin escribir
      if(text.trim() === ''){
        lineEl.textContent = ' ';
        setTimeout(onDone, 300);
        return;
      }

      let charIndex = 0;
      const speed = 28; // ms por carácter

      function typeChar(){
        if(charIndex < text.length){
          lineEl.insertBefore(document.createTextNode(text[charIndex]), cursor);
          charIndex++;
          setTimeout(typeChar, speed);
        } else {
          // pausa al final de línea antes de pasar a la siguiente
          setTimeout(onDone, 420);
        }
      }
      typeChar();
    }

    function nextLine(){
      if(lineIndex >= twLines.length){
        // quitar cursor al terminar
        if(cursor.parentNode) cursor.parentNode.removeChild(cursor);
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
    if (!music.querySelector('source').src){
      // No hay pista configurada todavía
      iconMuted.style.display = 'none';
      iconSound.style.display = 'none';
      soundToggle.style.opacity = '0.4';
      soundToggle.title = 'Agrega tu canción en script.js / index.html';
      return;
    }

    if (isPlaying){
      music.pause();
      iconSound.style.display = 'none';
      iconMuted.style.display = 'block';
    } else {
      music.play().catch(() => {});
      iconMuted.style.display = 'none';
      iconSound.style.display = 'block';
    }
    isPlaying = !isPlaying;
  });

});
