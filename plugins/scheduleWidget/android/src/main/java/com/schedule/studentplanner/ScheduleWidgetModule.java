package com.schedule.studentplanner;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;

public final class ScheduleWidgetModule extends ReactContextBaseJavaModule {
    public ScheduleWidgetModule(ReactApplicationContext context) {
        super(context);
    }

    @Override
    public String getName() {
        return "ScheduleWidget";
    }

    @ReactMethod
    public void updateSnapshot(ReadableMap values, Promise promise) {
        try {
            Context context = getReactApplicationContext();
            SharedPreferences preferences = context.getSharedPreferences("schedule_widget", Context.MODE_PRIVATE);
            String classTitle = readString(values, "classTitle", "No upcoming class");
            String classDetails = readString(values, "classDetails", "Your timetable is clear");
            long classStartAt = values.hasKey("classStartAt") && !values.isNull("classStartAt")
                ? (long) values.getDouble("classStartAt") : 0L;
            String taskTitle = readString(values, "taskTitle", "No pending deadline");
            String taskDueDate = readString(values, "taskDueDate", "");

            preferences.edit()
                .putString("classTitle", classTitle)
                .putString("classDetails", classDetails)
                .putLong("classStartAt", classStartAt)
                .putString("taskTitle", taskTitle)
                .putString("taskDueDate", taskDueDate)
                .apply();

            AppWidgetManager manager = AppWidgetManager.getInstance(context);
            ComponentName provider = new ComponentName(context, ScheduleWidgetProvider.class);
            int[] widgetIds = manager.getAppWidgetIds(provider);
            if (widgetIds != null && widgetIds.length > 0) {
                new ScheduleWidgetProvider().onUpdate(context, manager, widgetIds);
            }
            promise.resolve(true);
        } catch (Exception error) {
            promise.reject("SCHEDULE_WIDGET_UPDATE_FAILED", error);
        }
    }

    private String readString(ReadableMap values, String key, String fallback) {
        return values.hasKey(key) && !values.isNull(key) ? values.getString(key) : fallback;
    }
}
