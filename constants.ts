import { PromptBlock } from './types';

export const DEFAULT_PROMPTS: PromptBlock[] = [
  // Subject
  {
    id: 'sub-1',
    name: 'Cyber Girl',
    tag: 'Subject',
    content: '1girl, cyberpunk jacket, neon glasses, futuristic city background, glowing accessories'
  },
  {
    id: 'sub-2',
    name: 'Fantasy Warrior',
    tag: 'Subject',
    content: '1boy, muscular, intricate fantasy armor, holding greatsword, epic ruins background'
  },
  {
    id: 'sub-3',
    name: 'Forest Spirit',
    tag: 'Subject',
    content: 'ethereal forest spirit, translucent skin, glowing runes, magical ancient forest, fireflies, divine aura'
  },

  // Style
  {
    id: 'sty-1',
    name: 'Photographic',
    tag: 'Style',
    content: 'photorealistic, raw photo, 8k uhd, dslr, f/1.8, film grain, hyperrealistic'
  },
  {
    id: 'sty-2',
    name: 'Anime',
    tag: 'Style',
    content: 'anime style, key visual, studio ghibli style, vibrant colors, cel shaded, 2d'
  },
  {
    id: 'sty-3',
    name: 'Oil Painting',
    tag: 'Style',
    content: 'oil painting, thick brushstrokes, impasto, canvas texture, classical art style'
  },

  // View
  {
    id: 'view-1',
    name: 'Portrait',
    tag: 'View',
    content: 'close up, portrait, depth of field, bokeh, looking at viewer, detailed eyes'
  },
  {
    id: 'view-2',
    name: 'Full Body',
    tag: 'View',
    content: 'full body shot, wide angle, standing, establishing shot, detailed environment'
  },
  {
    id: 'view-3',
    name: 'Dynamic',
    tag: 'View',
    content: 'dynamic angle, from below, dutch angle, action shot, motion blur, intense composition'
  },

  // Lighting
  {
    id: 'lit-1',
    name: 'Cinematic',
    tag: 'Lighting',
    content: 'volumetric lighting, rim light, moody atmosphere, dramatic shadows, studio lighting'
  },
  {
    id: 'lit-2',
    name: 'Golden Hour',
    tag: 'Lighting',
    content: 'warm sunlight, golden hour, lens flare, soft natural lighting, sun rays'
  },
  {
    id: 'lit-3',
    name: 'Neon',
    tag: 'Lighting',
    content: 'neon lights, blue and purple lighting, glow effects, dark environment, cyber lighting'
  },

  // Quality
  {
    id: 'qual-1',
    name: 'Masterpiece',
    tag: 'Quality',
    content: 'masterpiece, best quality, highly detailed, ultra-detailed'
  },
  {
    id: 'qual-2',
    name: 'Sharp',
    tag: 'Quality',
    content: 'sharp focus, high resolution, 4k, detailed textures, crisp'
  },
  {
    id: 'qual-3',
    name: 'HDR',
    tag: 'Quality',
    content: 'HDR, vivid colors, perfect composition, professional, color graded'
  }
];