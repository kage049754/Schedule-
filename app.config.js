export default {
  expo: {
    name: "Schedule",
    slug: "schedule-student-planner",
    version: "0.2.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    scheme: "schedule",
    android: { package: "com.schedule.studentplanner", versionCode: 2, permissions: ["POST_NOTIFICATIONS", "SCHEDULE_EXACT_ALARM", "VIBRATE"] },
    plugins: [
      ["expo-notifications", { sounds: ["./assets/schedule_chime.wav"], defaultChannel: "schedule-reminders" }],
      "expo-sqlite"
    ],
    extra: { architecture: "react-native-expo-sqlite" }
  }
}
