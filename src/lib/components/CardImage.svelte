<script lang="ts">
  import { base } from '$app/paths';
  import {
    cardAltText,
    cardBackPath,
    cardFacePath,
    cardOrientation,
    type StudioCityCard,
  } from '$lib/game/card-art';

  const { card, faceUp = true } = $props<{
    card: StudioCityCard;
    faceUp?: boolean;
  }>();

  const src = $derived(faceUp ? cardFacePath(card) : cardBackPath(card.type));
  const alt = $derived(faceUp ? cardAltText(card) : `${card.type} card back`);
  const orientation = $derived(cardOrientation(card.type));
</script>

<img
  class="card-art {orientation}"
  src="{base}{src}"
  alt={alt}
  loading="lazy"
  decoding="async"
/>
