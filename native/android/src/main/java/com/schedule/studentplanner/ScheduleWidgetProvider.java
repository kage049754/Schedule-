package com.schedule.studentplanner;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import java.util.Locale;

public class ScheduleWidgetProvider extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] widgetIds) {
        SharedPreferences preferences = context.getSharedPreferences("schedule_widget", Context.MODE_PRIVATE);
        String classTitle = preferences.getString("classTitle", "No upcoming class");
        String classDetails = preferences.getString("classDetails", "Add classes in Schedule");
        long classStartAt = preferences.getLong("classStartAt", 0L);
        String taskTitle = preferences.getString("taskTitle", "No pending deadline");
        String taskDueDate = preferences.getString("taskDueDate", "");

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.schedule_widget);
        views.setTextViewText(R.id.widget_class_title, classTitle);
        views.setTextViewText(R.id.widget_class_details, classDetails);
        views.setTextViewText(R.id.widget_class_countdown, countdown(classStartAt));
        views.setTextViewText(R.id.widget_task_title, taskTitle);
        views.setTextViewText(R.id.widget_task_due, taskDueDate.isEmpty() ? "No upcoming deadline" : taskDueDate);

        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launchIntent != null) {
            PendingIntent pendingIntent = PendingIntent.getActivity(
                context, 0, launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.schedule_widget_root, pendingIntent);
        }
        for (int widgetId : widgetIds) manager.updateAppWidget(widgetId, views);
    }

    private String countdown(long startAt) {
        if (startAt <= 0L) return "No upcoming class";
        long remaining = startAt - System.currentTimeMillis();
        if (remaining <= 0L) return "Starting now";
        long minutes = remaining / 60000L;
        if (minutes < 60L) return String.format(Locale.getDefault(), "Starts in %d min", minutes);
        long hours = minutes / 60L;
        long remainder = minutes % 60L;
        return remainder == 0L
            ? String.format(Locale.getDefault(), "Starts in %d hr", hours)
            : String.format(Locale.getDefault(), "Starts in %d hr %d min", hours, remainder);
    }
}
