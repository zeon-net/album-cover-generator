import { canvasMeasure, generateLabel } from '../src/index';

// The social card's artwork: a sleeve with its record half out. ?title= and ?seed= try other designs.
const params = new URLSearchParams(location.search);
const { svg } = generateLabel({
  title: params.get('title') ?? 'Golden Hour',
  seed: params.get('seed') ?? 'og-1',
  shape: 'sleeve',
  measure: canvasMeasure(),
});
document.querySelector('#art')!.innerHTML = svg;
document.body.dataset.ready = 'true';
