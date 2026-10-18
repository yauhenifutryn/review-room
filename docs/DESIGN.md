# Interface defaults

Start with the reviewer's task. Use a restrained type scale, readable body text, consistent compact controls, aligned grids and tabular numbers. Use spacing, thin rules and a small number of surfaces to distinguish application evidence, AI reading aids, original answers and team comments.

Prefer progressive disclosure to showing every detail at once. Keep summaries short, uncertainties explicit and original evidence accessible. Distinguish recent activity from completed submissions. Preserve keyboard focus and make empty, loading, error and closed states understandable.

This is a default, not a universal monochrome template. Expressive typography, color, illustration and motion are appropriate when they serve a different product's purpose. Avoid decorative dashboard cards, oversized controls and arbitrary scale changes merely to make a generated interface look designed.

## Responsive interface contract

Use one mobile-first stylesheet rather than successive compactness overrides. The common interface uses the platform sans-serif family and a 12/14/16/20 px scale expressed in rem: metadata, UI labels, input/reading text, headings and numeric emphasis. Font weight communicates hierarchy without arbitrary size jumps.

On phones, criterion labels and their weights sit above a full-width score strip. The visual strip is restrained; score targets remain 44 px tall. Department controls stack below 360 px. Text-entry controls retain 16 px input text, while short prompts use the UI scale. Results reflow into readable label/value groups; do not shrink five desktop columns into tiny mobile labels. Long names and application text must wrap without page-level horizontal scrolling.

The rubric notice is expandable. Reading and scoring remain separate stages, and candidate identity stays visible when entering the score form. Existing evidence, historical-rubric labeling and data behavior are preserved.

Research references inform the mechanics, not the visual identity:

- [GOV.UK type scale](https://design-system.service.gov.uk/styles/type-scale/): coherent typography and vertical rhythm. This app uses its own denser product-UI scale.
- [WCAG 2.2 target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum): usable controls and spacing.
- [WCAG reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html): preserve content and functionality at 320 CSS px without horizontal page scrolling.

Verify reading, scoring, selected and incomplete states, Results, long content and keyboard focus at phone widths plus desktop. Browser emulation cannot establish real-device Safari keyboard behavior.

Use at most four type sizes throughout this interface. Department and verdict selectors use the 14 px UI size, matching score controls and actions; text-entry and application-reading text retain 16 px. Compact visible styling must preserve usable native hit areas.
