import { withAppBuildGradle } from 'expo/config-plugins';

export default function withEmbeddedDebugBundle(config) {
  return withAppBuildGradle(config, (config) => {
    const contents = config.modResults.contents;
    const start = contents.indexOf('react {');
    if (start < 0) {
      throw new Error('Unable to configure React Native Gradle block: react { was not found.');
    }

    const end = contents.indexOf('\n}', start);
    if (end < 0) {
      throw new Error('Unable to configure React Native Gradle block: closing brace was not found.');
    }

    let block = contents.slice(start, end);
    const assignment = /^\s*debuggableVariants\s*=.*$/m;
    if (assignment.test(block)) {
      block = block.replace(assignment, '    debuggableVariants = []');
    } else {
      block += '\n    debuggableVariants = []';
    }

    config.modResults.contents = contents.slice(0, start) + block + contents.slice(end);
    return config;
  });
}
