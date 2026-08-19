import { loader } from 'fumadocs-core/source';
import { docs } from '@/.source/server';

// Code Hike is wired into the MDX pipeline in source.config.ts — compiler-side
// plugins must not be imported from app code.
export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
});
