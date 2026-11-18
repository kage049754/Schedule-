import fs from 'node:fs';
import path from 'node:path';
import {
  withAndroidManifest,
  withDangerousMod,
  withMainApplication,
} from 'expo/config-plugins';

const RECEIVER_NAME = 'com.schedule.studentplanner.ScheduleWidgetProvider';

export default function withScheduleWidget(config) {
  config = withMainApplication(config, (mod) => {
    let contents = mod.modResults.contents;
    const packageList = 'PackageList(this).packages.apply {';
    if (!contents.includes('ScheduleWidgetPackage()')) {
      if (!contents.includes(packageList)) {
        throw new Error('Schedule widget setup could not find the MainApplication ReactPackage list.');
      }
      contents = contents.replace(packageList, packageList + '\n        add(ScheduleWidgetPackage())');
    }
    mod.modResults.contents = contents;
    return mod;
  });

  config = withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    const application = manifest.application?.[0];
    if (!application) throw new Error('Schedule widget setup could not find the Android application manifest.');

    manifest['uses-permission'] = manifest['uses-permission'] || [];
    if (!manifest['uses-permission'].some((item) => item.$?.['android:name'] === 'android.permission.RECEIVE_BOOT_COMPLETED')) {
      manifest['uses-permission'].push({
        $: { 'android:name': 'android.permission.RECEIVE_BOOT_COMPLETED' },
      });
    }

    application.receiver = application.receiver || [];
    const existing = application.receiver.find((item) => item.$?.['android:name'] === RECEIVER_NAME);
    const receiver = {
      $: {
        'android:name': RECEIVER_NAME,
        'android:label': '@string/schedule_widget_label',
        'android:exported': 'true',
      },
      'intent-filter': [{
        action: [
          { $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } },
          { $: { 'android:name': 'android.intent.action.BOOT_COMPLETED' } },
        ],
      }],
      'meta-data': [{
        $: {
          'android:name': 'android.appwidget.provider',
          'android:resource': '@xml/schedule_widget_info',
        },
      }],
    };
    if (existing) Object.assign(existing, receiver);
    else application.receiver.push(receiver);
    return mod;
  });

  config = withDangerousMod(config, ['android', async (mod) => {
    const source = path.join(mod.modRequest.projectRoot, 'plugins', 'scheduleWidget', 'android', 'src', 'main');
    const target = path.join(mod.modRequest.platformProjectRoot, 'app', 'src', 'main');
    for (const folder of ['java', 'res']) {
      const sourcePath = path.join(source, folder);
      if (!fs.existsSync(sourcePath)) throw new Error('Missing Schedule widget native source folder: ' + sourcePath);
      fs.mkdirSync(path.join(target, folder), { recursive: true });
      fs.cpSync(sourcePath, path.join(target, folder), { recursive: true, force: true });
    }
    return mod;
  }]);

  return config;
}
