import { ExecutorContext } from '@nrwl/devkit';
import { runCommand } from '../../run-commands';
import { getDefaultScheme } from '../../utils';
import { PushExecutorSchema } from './schema';

export default async function run(options: PushExecutorSchema, ctx: ExecutorContext): Promise<{ success: true }> {
  return runCommand(options, ctx, {
    description: 'Pushing Database',
    command: 'prisma db push',
    getArgs,
  });
}

const getArgs = (options: PushExecutorSchema, ctx: ExecutorContext): string[] => {
  const args = [];
  const schema = options?.schema ?? getDefaultScheme(ctx);

  args.push(`--schema=${schema}`);

  if (options?.['accept-data-loss']) {
    args.push('--accept-data-loss');
  }

  if (options?.['force-reset']) {
    args.push('--force-reset');
  }

  if (options?.['skip-generate']) {
    args.push('--skip-generate');
  }

  return args;
};
