export interface ModalOptions {
  badgeText?: string;
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
}

export function showModal(options: ModalOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'limitra-modal-overlay';

    const card = document.createElement('div');
    card.className = 'limitra-modal-card';

    if (options.badgeText) {
      const badgeEl = document.createElement('div');
      badgeEl.className = 'limitra-badge limitra-modal-badge';
      badgeEl.textContent = options.badgeText;
      card.appendChild(badgeEl);
    }

    const titleEl = document.createElement('h3');
    titleEl.className = 'limitra-modal-title';
    titleEl.textContent = options.title;

    const messageEl = document.createElement('p');
    messageEl.className = 'limitra-modal-message';
    messageEl.textContent = options.message;

    const actionsEl = document.createElement('div');
    actionsEl.className = 'limitra-modal-actions';

    const closeModal = (result: boolean) => {
      overlay.classList.remove('active');
      setTimeout(() => {
        overlay.remove();
        resolve(result);
      }, 200);
    };

    if (options.cancelText) {
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'btn-primary btn-secondary limitra-modal-btn';
      cancelBtn.textContent = options.cancelText;
      cancelBtn.onclick = () => closeModal(false);
      actionsEl.appendChild(cancelBtn);
    }

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn-primary limitra-modal-btn';
    confirmBtn.textContent = options.confirmText;
    confirmBtn.onclick = () => closeModal(true);
    actionsEl.appendChild(confirmBtn);

    card.appendChild(titleEl);
    card.appendChild(messageEl);
    card.appendChild(actionsEl);
    overlay.appendChild(card);

    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.classList.add('active');
    });
  });
}
