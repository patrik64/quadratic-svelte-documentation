import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { Code } from '@/components/code';
import { Scrollycoding } from '@/components/scrollycoding';

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    // Code Hike: `Code` matches `components.code` in source.config.ts
    Code,
    Scrollycoding,
    ...components,
  };
}

export const useMDXComponents = getMDXComponents;
