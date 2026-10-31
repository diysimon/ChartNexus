import type { ChartAccessibility } from '@chartnexus/schema';

/** Owned sibling UI: native elements provide keyboard access without custom key handling. */
export function createAccessibleView(container: HTMLElement) {
  const panel = document.createElement('section');
  panel.dataset.chartnexusAccessible = '';
  panel.style.cssText =
    'font:14px/1.5 sans-serif;max-width:100%;overflow-wrap:anywhere';
  container.after(panel);
  return {
    theme(dark: boolean) {
      panel.style.color = dark ? '#f3f4f6' : '#172033';
      panel.style.setProperty(
        '--chartnexus-control-surface',
        dark ? '#111827' : '#ffffff',
      );
    },
    update(
      data: ChartAccessibility | undefined,
      legends: { name: string; label: string }[],
      selected: Record<string, boolean>,
      toggle: (name: string) => void,
    ) {
      panel.replaceChildren();
      if (!data) return;
      const summary = document.createElement('p');
      summary.textContent = data.summary;
      panel.append(summary);
      if (legends.length) {
        const group = document.createElement('div');
        group.setAttribute('role', 'group');
        group.setAttribute('aria-label', 'Chart legend');
        for (const { name, label } of legends) {
          const button = document.createElement('button');
          button.style.cssText =
            'font:inherit;color:inherit;background:var(--chartnexus-control-surface);border:1px solid currentColor;padding:4px 8px;margin:2px;cursor:pointer';
          button.type = 'button';
          button.textContent = label;
          button.dataset.legendName = name;
          button.setAttribute('aria-pressed', String(selected[name] !== false));
          button.addEventListener('click', () => toggle(name));
          group.append(button);
        }
        panel.append(group);
      }
      const details = document.createElement('details');
      const label = document.createElement('summary');
      label.textContent = `Full data (${data.rows.length} rows)`;
      details.append(label);
      const content = document.createElement('div');
      content.style.overflowX = 'auto';
      details.append(content);
      let page = 0;
      const perPage = 50;
      const draw = () => {
        content.replaceChildren();
        const table = document.createElement('table');
        const caption = document.createElement('caption');
        caption.textContent = `Rows ${data.rows.length ? page * perPage + 1 : 0}–${Math.min((page + 1) * perPage, data.rows.length)} of ${data.rows.length}. Null means missing, not zero.`;
        table.append(caption);
        const head = document.createElement('thead'),
          tr = document.createElement('tr');
        for (const name of ['Source', ...data.columns]) {
          const th = document.createElement('th');
          th.scope = 'col';
          th.textContent = name;
          tr.append(th);
        }
        head.append(tr);
        table.append(head);
        const body = document.createElement('tbody');
        for (const [offset, row] of data.rows
          .slice(page * perPage, (page + 1) * perPage)
          .entries()) {
          const index = page * perPage + offset;
          const tr = document.createElement('tr');
          for (const value of [data.sourceKeys?.[index] ?? index, ...row]) {
            const td = document.createElement('td');
            td.textContent = value === null ? 'null' : String(value);
            tr.append(td);
          }
          body.append(tr);
        }
        table.append(body);
        content.append(table);
        for (const [name, delta, disabled] of [
          ['Previous', -1, page === 0],
          ['Next', 1, (page + 1) * perPage >= data.rows.length],
        ] as const) {
          const button = document.createElement('button');
          button.style.cssText =
            'font:inherit;color:inherit;background:var(--chartnexus-control-surface);border:1px solid currentColor;padding:4px 8px;margin:2px;cursor:pointer';
          button.textContent = name;
          button.type = 'button';
          button.disabled = disabled;
          button.addEventListener('click', () => {
            page += delta;
            draw();
            content
              .querySelector<HTMLButtonElement>(
                delta > 0 ? 'button:last-child' : 'button',
              )
              ?.focus();
          });
          content.append(button);
        }
      };
      draw();
      panel.append(details);
      for (const extra of [
        ...(data.rendered
          ? [{ title: 'Rendered values', ...data.rendered }]
          : []),
        ...(data.tables ?? []),
      ]) {
        const rendered = document.createElement('details');
        const heading = document.createElement('summary');
        heading.textContent = `${extra.title} (${extra.rows.length} ${extra.title === 'Rendered values' ? 'marks' : 'rows'})`;
        rendered.append(heading);
        const pre = document.createElement('pre');
        pre.style.cssText = 'white-space:pre-wrap;overflow-wrap:anywhere';
        const rows = extra.rows;
        let offset = 0;
        const next = document.createElement('button');
        next.type = 'button';
        const drawMarks = () => {
          pre.textContent =
            extra.columns.join(' | ') +
            '\n' +
            rows
              .slice(offset, offset + 50)
              .map((row) =>
                row
                  .map((value) => (value === null ? 'null' : String(value)))
                  .join(' | '),
              )
              .join('\n');
          next.textContent = `Next marks (${offset + 1}–${Math.min(offset + 50, rows.length)} of ${rows.length})`;
        };
        next.addEventListener('click', () => {
          offset = offset + 50 < rows.length ? offset + 50 : 0;
          drawMarks();
        });
        drawMarks();
        rendered.append(pre, next);
        panel.append(rendered);
      }
    },
    select(selected: Record<string, boolean>) {
      for (const button of Array.from(
        panel.querySelectorAll<HTMLButtonElement>('[data-legend-name]'),
      ))
        button.setAttribute(
          'aria-pressed',
          String(selected[button.dataset.legendName!] !== false),
        );
    },
    dispose() {
      panel.remove();
    },
  };
}
