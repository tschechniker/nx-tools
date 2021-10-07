import {
  addDependenciesToPackageJson,
  addProjectConfiguration,
  convertNxGenerator,
  formatFiles,
  generateFiles,
  GeneratorCallback,
  getWorkspaceLayout,
  joinPathFragments,
  names,
  NxJsonProjectConfiguration,
  offsetFromRoot,
  ProjectConfiguration,
  readWorkspaceConfiguration,
  TargetConfiguration,
  Tree,
  updateJson,
  updateWorkspaceConfiguration,
} from '@nrwl/devkit';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
import { startGroup } from '@nx-tools/core';
import { docusaurusVersion } from '../../versions';
import { DocusaurusGeneratorExecutor } from './schema';

interface NormalizedSchema extends DocusaurusGeneratorExecutor {
  appProjectRoot: string;
  parsedTags: string[];
}

function normalizeOptions(tree: Tree, options: DocusaurusGeneratorExecutor): NormalizedSchema {
  const { appsDir } = getWorkspaceLayout(tree);

  const appDirectory = options.directory
    ? `${names(options.directory).fileName}/${names(options.name).fileName}`
    : names(options.name).fileName;

  const appProjectName = appDirectory.replace(new RegExp('/', 'g'), '-');
  const appProjectRoot = joinPathFragments(appsDir, appDirectory);
  const parsedTags = options.tags ? options.tags.split(',').map((s) => s.trim()) : [];

  return {
    ...options,
    name: names(appProjectName).fileName,
    appProjectRoot,
    parsedTags,
    // linter: options.linter ?? Linter.EsLint,
  };
}

function getBuildConfig(project: ProjectConfiguration, options: NormalizedSchema): TargetConfiguration {
  return {
    executor: '@nx-tools/nx-docusaurus:build',
    outputs: ['{options.outputPath}'],
    options: {
      outputPath: joinPathFragments('dist', options.appProjectRoot),
      // main: joinPathFragments(project.sourceRoot, 'main' + (options.js ? '.js' : '.ts')),
      // tsConfig: joinPathFragments(options.appProjectRoot, 'tsconfig.app.json'),
      // assets: [joinPathFragments(project.sourceRoot, 'assets')],
    },
    // configurations: {
    //   production: {
    //     optimization: true,
    //     extractLicenses: true,
    //     inspect: false,
    //     fileReplacements: [
    //       {
    //         replace: joinPathFragments(project.sourceRoot, 'environments/environment' + (options.js ? '.js' : '.ts')),
    //         with: joinPathFragments(project.sourceRoot, 'environments/environment.prod' + (options.js ? '.js' : '.ts')),
    //       },
    //     ],
    //   },
    // },
  };
}

function getServeConfig(options: NormalizedSchema): TargetConfiguration {
  return {
    executor: '@nrwl/node:execute',
    options: {
      buildTarget: `${options.name}:build`,
    },
  };
}

function addProject(tree: Tree, options: NormalizedSchema) {
  const project: ProjectConfiguration & NxJsonProjectConfiguration = {
    root: options.appProjectRoot,
    sourceRoot: joinPathFragments(options.appProjectRoot, 'src'),
    projectType: 'application',
    targets: {},
    tags: options.parsedTags,
  };
  project.targets.build = getBuildConfig(project, options);
  project.targets.serve = getServeConfig(options);

  addProjectConfiguration(tree, options.name, project, options.standaloneConfig);

  const workspace = readWorkspaceConfiguration(tree);

  if (!workspace.defaultProject) {
    workspace.defaultProject = options.name;
    updateWorkspaceConfiguration(tree, workspace);
  }
}

function updateIgnoreFile(tree: Tree, filePath: string, ignorePatterns: string[]) {
  if (!tree.exists(filePath)) return;
  let contents = tree.read(filePath).toString('utf8').trimRight();
  const patterns = ignorePatterns.filter((pattern) => !contents.includes(pattern));
  if (!patterns.length) {
    return;
  }
  contents = [contents, '# Generated Docusaurus files', ...patterns].join('\n');
  tree.write(filePath, contents);
}

function addAppFiles(tree: Tree, options: NormalizedSchema) {
  generateFiles(tree, joinPathFragments(__dirname, 'files'), options.appProjectRoot, {
    tmpl: '',
    name: options.name,
    root: options.appProjectRoot,
    offset: offsetFromRoot(options.appProjectRoot),
  });
}

function updateDependencies(tree: Tree) {
  updateJson(tree, 'package.json', (json) => {
    delete json.dependencies['@nx-tools/nx-docusaurus'];
    return json;
  });

  return addDependenciesToPackageJson(
    tree,
    {
      '@docusaurus/core': docusaurusVersion,
      '@docusaurus/preset-classic': docusaurusVersion,
      '@mdx-js/react': '^1.6.21',
      clsx: '^1.1.1',
      'file-loader': '^6.2.0',
      'prism-react-renderer': '^1.2.1',
      react: '^17.0.1',
      'react-dom': '^17.0.1',
      'url-loader': '^4.1.1',
    },
    {
      '@docusaurus/module-type-aliases': docusaurusVersion,
      '@tsconfig/docusaurus': '^1.0.4',
      '@types/react': '^17.0.14',
      '@types/react-helmet': '^6.1.2',
      '@types/react-router-dom': '^5.1.8',
    },
  );
}

export async function applicationGenerator(tree: Tree, schema: DocusaurusGeneratorExecutor) {
  startGroup('Generating Docusaurus application', 'Nx Docusaurus');

  const options = normalizeOptions(tree, schema);

  const tasks: GeneratorCallback[] = [];
  const initTask = await updateDependencies(tree);
  tasks.push(initTask);

  addAppFiles(tree, options);
  addProject(tree, options);

  updateIgnoreFile(tree, '.gitignore', ['.docusaurus/']);
  updateIgnoreFile(tree, '.prettierignore', ['.docusaurus/']);

  // if (options.linter !== Linter.None) {
  //   const lintTask = await addLintingToApplication(tree, {
  //     ...options,
  //     skipFormat: true,
  //   });
  //   tasks.push(lintTask);
  // }

  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  return runTasksInSerial(...tasks);
}

export default applicationGenerator;
export const applicationSchematic = convertNxGenerator(applicationGenerator);
