import { build } from '@docusaurus/core/lib';
import { ExecutorContext, joinPathFragments } from '@nrwl/devkit';
import { startGroup } from '@nx-tools/core';
import { DocusaurusBuildSchema } from './schema';

export default async function runExecutor(
  options: DocusaurusBuildSchema,
  context?: ExecutorContext,
): Promise<{ success: true }> {
  startGroup(`Building ${context.projectName}...`, 'Nx Docusaurus');

  const projectRoot = joinPathFragments(context.root, context.workspace.projects[context.projectName].root);

  await build(projectRoot, {
    bundleAnalyzer: options.bundleAnalyzer,
    outDir: joinPathFragments(context.root, options.outputPath),
    minify: options.minify,
  });

  return { success: true };
}
