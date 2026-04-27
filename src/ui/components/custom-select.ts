export function initCustomSelects(): void {
  const selects = document.querySelectorAll<HTMLSelectElement>('select.brutal-select');

  selects.forEach((select) => {
    if (select.classList.contains('brutal-select-hidden')) return;

    select.classList.add('brutal-select-hidden');

    const wrapper = document.createElement('div');
    wrapper.className = 'custom-brutal-select';

    const trigger = document.createElement('div');
    trigger.className = 'custom-brutal-trigger';

    const selectedText = document.createElement('span');
    selectedText.className = 'custom-select-value';

    const activeOption = select.options[select.selectedIndex];
    selectedText.textContent = activeOption ? activeOption.text : '';

    const icon = document.createElement('div');

    const svgNS = 'http://www.w3.org/2000/svg';

    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke-width', '2');

    const polyline = document.createElementNS(svgNS, 'polyline');
    polyline.setAttribute('points', '6 9 12 15 18 9');

    svg.appendChild(polyline);
    icon.appendChild(svg);

    trigger.appendChild(selectedText);
    trigger.appendChild(icon);

    const optionsList = document.createElement('ul');
    optionsList.className = 'custom-brutal-options';

    Array.from(select.options).forEach((option) => {
      const li = document.createElement('li');
      li.className = 'custom-brutal-option';
      if (option.selected) li.classList.add('selected');
      li.textContent = option.text;
      li.dataset.value = option.value;

      li.addEventListener('click', (e: MouseEvent) => {
        e.stopPropagation();

        wrapper.querySelectorAll('.custom-brutal-option').forEach((el) => {
          el.classList.remove('selected');
        });

        li.classList.add('selected');
        selectedText.textContent = option.text;
        wrapper.classList.remove('open');

        if (select.value !== option.value) {
          select.value = option.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      optionsList.appendChild(li);
    });

    trigger.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      document.querySelectorAll('.custom-brutal-select').forEach((el) => {
        if (el !== wrapper) el.classList.remove('open');
      });
      wrapper.classList.toggle('open');
    });

    wrapper.appendChild(trigger);
    wrapper.appendChild(optionsList);

    if (select.parentNode) {
      select.parentNode.insertBefore(wrapper, select.nextSibling);
    }

    select.addEventListener('change', () => {
      const newActive = Array.from(select.options).find((opt) => opt.value === select.value);
      if (newActive) {
        selectedText.textContent = newActive.text;
        wrapper.querySelectorAll<HTMLElement>('.custom-brutal-option').forEach((el) => {
          el.classList.toggle('selected', el.dataset.value === select.value);
        });
      }
    });
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.custom-brutal-select').forEach((el) => {
      el.classList.remove('open');
    });
  });
}
