import { build } from '@docusaurus/core/lib';
import { ExecutorContext, joinPathFragments } from '@nrwl/devkit';
import { info, startGroup } from '@nx-tools/core';
import { DocusaurusBuildSchema } from './schema';

export default async function runExecutor(
  options: DocusaurusBuildSchema,
  context?: ExecutorContext,
): Promise<{ success: true }> {
  startGroup('Building docs...', 'Nx Docusaurus');

  info('options --> ' + JSON.stringify(options, null, 2));

  info('context --> ' + JSON.stringify(context, null, 2));

  const projectRoot = context?.workspace.projects[context.projectName].root;

  await build(projectRoot, {
    bundleAnalyzer: options.bundleAnalyzer,
    outDir: joinPathFragments(context.root, options.outputPath),
    minify: options.minify,
  });

  return { success: true };
}
