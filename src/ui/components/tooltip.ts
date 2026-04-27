export function initTooltips(): void {
  document.addEventListener('mouseover', (e) => {
    const el = (e.target as HTMLElement).closest('.brutal-tooltip') as HTMLElement;
    if (!el) return;

    const rect = el.getBoundingClientRect();

    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;

    const tooltipHeight = 60;

    if (spaceAbove < tooltipHeight && spaceBelow > tooltipHeight) {
      el.classList.add('tooltip-bottom');
    } else {
      el.classList.remove('tooltip-bottom');
    }
  });
}
