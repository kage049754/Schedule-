package com.schedule.studentplanner;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ScheduleWidget")
public class ScheduleWidgetPlugin extends Plugin {
    @PluginMethod
    public void updateSnapshot(PluginCall call) {
        Context context = getContext();
        SharedPreferences preferences = context.getSharedPreferences("schedule_widget", Context.MODE_PRIVATE);
        String classTitle = call.getString("classTitle", "No upcoming class");
        String classDetails = call.getString("classDetails", "Your timetable is clear");
        long classStartAt = call.getLong("classStartAt", 0L);
        String taskTitle = call.getString("taskTitle", "No pending deadline");
        String taskDueDate = call.getString("taskDueDate", "");
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
        call.resolve();
    }
}
