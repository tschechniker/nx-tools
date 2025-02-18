import { ExecutorContext, getPackageManagerCommand } from '@nrwl/devkit';
import { logger } from '@nx-tools/core';
import { execSync } from 'node:child_process';
import { getDefaultScheme } from '../../utils';
import { MigrateExecutorSchema } from './schema';

export default async function run(options: MigrateExecutorSchema, ctx: ExecutorContext): Promise<{ success: true }> {
  const command = `${getPackageManagerCommand().exec} prisma migrate dev`;
  const args = getArgs(options, ctx);

  logger.group('Migrating Database', async () => {
    execSync([command, ...args].join(' '), {
      stdio: 'inherit',
    });
  });

  return { success: true };
}

const getArgs = (options: MigrateExecutorSchema, ctx: ExecutorContext): string[] => {
  const args = [];
  const schema = options?.schema ?? getDefaultScheme(ctx);

  args.push(`--schema=${schema}`);

  if (options?.name) {
    args.push(`--name=${options.name}`);
  }

  if (options?.['create-only']) {
    args.push('--create-only');
  }

  if (options?.['skip-generate']) {
    args.push('--skip-generate');
  }

  if (options?.['skip-seed']) {
    args.push('--skip-seed');
  }

  return args;
};
