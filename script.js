(function () {
  'use strict';

  function initialize() {
    var config = window.GANOCRED_CONFIG || {};
    var dialog = document.getElementById('contact-dialog');
    var previousFocus = null;
    var menuToggle = document.querySelector('.menu-toggle');
    var siteNav = document.getElementById('site-nav');
    var menuLabel = menuToggle && menuToggle.querySelector('.menu-label');
    var originalMenuLabel = menuLabel ? menuLabel.textContent : 'Menu';

    document.querySelectorAll('[data-year]').forEach(function (element) {
      element.textContent = String(new Date().getFullYear());
    });

    // Só substitui os textos reservados quando há um dado oficial configurado.
    document.querySelectorAll('[data-config]').forEach(function (element) {
      var key = element.getAttribute('data-config');
      if (!Object.prototype.hasOwnProperty.call(config, key)) return;
      var value = config[key];
      if (value !== null && value !== undefined && String(value).trim()) {
        element.textContent = String(value).trim();
      }
    });

    function setMenuOpen(isOpen) {
      if (!menuToggle || !siteNav) return;
      menuToggle.setAttribute('aria-controls', 'site-nav');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      menuToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
      siteNav.classList.toggle('is-open', isOpen);
      if (menuLabel) menuLabel.textContent = isOpen ? 'Fechar' : originalMenuLabel;
    }

    if (menuToggle && siteNav) {
      setMenuOpen(false);
      menuToggle.addEventListener('click', function () {
        setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true');
      });
      siteNav.querySelectorAll('a[href]').forEach(function (link) {
        link.addEventListener('click', function () { setMenuOpen(false); });
      });

      var desktop = window.matchMedia('(min-width: 821px)');
      var closeMenuOnDesktop = function (event) {
        if (event.matches) setMenuOpen(false);
      };
      if (desktop.addEventListener) desktop.addEventListener('change', closeMenuOnDesktop);
      else if (desktop.addListener) desktop.addListener(closeMenuOnDesktop);
    }

    function restoreDialogFocus() {
      document.body.classList.remove('dialog-open');
      if (previousFocus && previousFocus.isConnected && typeof previousFocus.focus === 'function') {
        if (previousFocus.getClientRects().length) previousFocus.focus();
        // O link do menu fica oculto quando a navegação mobile é recolhida.
        else if (menuToggle && menuToggle.getClientRects().length) menuToggle.focus();
      }
      previousFocus = null;
    }

    function closeDialog() {
      if (!dialog || !dialog.hasAttribute('open')) return;
      if (typeof dialog.close === 'function') {
        dialog.close();
      } else {
        dialog.removeAttribute('open');
        restoreDialogFocus();
      }
    }

    function openDialog(trigger) {
      if (!dialog || dialog.hasAttribute('open')) return;
      previousFocus = trigger || document.activeElement;
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        // Alternativa para navegadores sem suporte ao elemento dialog.
        dialog.setAttribute('open', '');
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
      }
      document.body.classList.add('dialog-open');
      var focusTarget = dialog.querySelector('[autofocus], [data-dialog-close], button, a[href], input, [tabindex="0"]');
      if (focusTarget) focusTarget.focus();
      else {
        dialog.setAttribute('tabindex', '-1');
        dialog.focus();
      }
    }

    if (dialog) {
      dialog.querySelectorAll('[data-dialog-close]').forEach(function (button) {
        button.addEventListener('click', closeDialog);
      });
      dialog.addEventListener('close', restoreDialogFocus);
      dialog.addEventListener('cancel', function (event) {
        event.preventDefault();
        closeDialog();
      });
      dialog.addEventListener('click', function (event) {
        if (event.target !== dialog) return;
        var bounds = dialog.getBoundingClientRect();
        var isOutside = event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom;
        if (isOutside) closeDialog();
      });
      dialog.addEventListener('keydown', function (event) {
        // O dialog nativo já mantém o foco dentro da janela; a alternativa faz o mesmo.
        if (typeof dialog.showModal === 'function' || event.key !== 'Tab') return;
        var focusable = Array.from(dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
          .filter(function (element) { return element.getClientRects().length > 0; });
        if (!focusable.length) {
          event.preventDefault();
          return;
        }
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      });
    }

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      if (dialog && dialog.hasAttribute('open')) {
        event.preventDefault();
        closeDialog();
      } else if (menuToggle && menuToggle.getAttribute('aria-expanded') === 'true') {
        setMenuOpen(false);
        menuToggle.focus();
      }
    });

    var phone = String(config.whatsapp || '').replace(/[\s()+.-]/g, '');
    var hasWhatsapp = /^55\d{10,11}$/.test(phone);
    var form = document.getElementById('lead-form');
    var status = document.getElementById('lead-status');
    document.querySelectorAll('[data-whatsapp]').forEach(function (link) {
      link.setAttribute('href', '#contato');
      link.removeAttribute('target');
      link.setAttribute('aria-haspopup', 'dialog');
      link.addEventListener('click', function (event) {
        event.preventDefault();
        openDialog(link);
        document.getElementById('lead-name').focus();
      });
    });
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var name = form.elements.name.value.trim();
      form.elements.name.setCustomValidity(name ? '' : 'Informe seu nome.');
      if (!form.reportValidity()) return;
      if (!hasWhatsapp) {
        status.textContent = 'Nosso WhatsApp estará disponível em breve. Suas respostas não foram enviadas.';
        return;
      }
      status.textContent = '';
      var amount = Number(form.elements.amount.value).toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
      var message = String(config.whatsappMessage || 'Olá! Gostaria de solicitar crédito.') +
        '\n\nNome: ' + name + '\nValor desejado: ' + amount + '\nObjetivo: ' + form.elements.purpose.value;
      window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(message), '_blank', 'noopener,noreferrer');
    });
    form.elements.name.addEventListener('input', function () { this.setCustomValidity(''); });

    // O conteúdo permanece visível sem JavaScript ou com movimento reduzido.
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if ('IntersectionObserver' in window && !reducedMotion.matches) {
      var revealElements = document.querySelectorAll('[data-reveal]');
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });

      revealElements.forEach(function (element) {
        element.classList.add('reveal-ready');
        observer.observe(element);
      });

      var revealWithoutMotion = function (event) {
        if (!event.matches) return;
        observer.disconnect();
        revealElements.forEach(function (element) {
          element.classList.remove('reveal-ready');
          element.classList.add('is-revealed');
        });
      };
      if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', revealWithoutMotion);
      else if (reducedMotion.addListener) reducedMotion.addListener(revealWithoutMotion);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
})();
