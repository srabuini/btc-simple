#include <pebble.h>

static Window *window;
static TextLayer *time_layer;
static TextLayer *date_layer;
static TextLayer *timestamp_layer;
static TextLayer *btc_layer;
static Layer *rounded_layer;

static AppSync sync;
static uint8_t sync_buffer[64];

enum BtcKey {
  BTC_PRICE_KEY = 0x0,
  BTC_TIMESTAMP_KEY = 0x1
};

static void send_cmd(void) {
  Tuplet price = TupletCString(BTC_PRICE_KEY, "Loading...");
  Tuplet timestamp = TupletCString(BTC_TIMESTAMP_KEY, "-:-");

  DictionaryIterator *iter;
  app_message_outbox_begin(&iter);

  if (iter == NULL) {
    return;
  }

  dict_write_tuplet(iter, &price);
  dict_write_tuplet(iter, &timestamp);
  dict_write_end(iter);

  app_message_outbox_send();
}

static void sync_error_callback(DictionaryResult dict_error,
                                AppMessageResult app_message_error,
                                void *context) {
  APP_LOG(APP_LOG_LEVEL_DEBUG, "App Message Sync Error: %d", app_message_error);
}

static void sync_tuple_changed_callback(const uint32_t key,
                                        const Tuple *new_tuple,
                                        const Tuple *old_tuple, void *context) {
  switch (key) {
    case BTC_PRICE_KEY:
      text_layer_set_text(btc_layer, new_tuple->value->cstring);
      break;
    case BTC_TIMESTAMP_KEY:
      text_layer_set_text(timestamp_layer, new_tuple->value->cstring);
      break;
  }
}

static void handle_timechanges(struct tm *tick_time, TimeUnits units_changed) {
  static char time_buffer[6];
  static char date_buffer[15];
  int minutes = tick_time->tm_min;

  strftime(time_buffer, sizeof(time_buffer), "%k:%M", tick_time);
  strftime(date_buffer, sizeof(date_buffer), "%A %e", tick_time);

  text_layer_set_text(time_layer, time_buffer);
  text_layer_set_text(date_layer, date_buffer);

  if(minutes % 5 == 0) {
    APP_LOG(APP_LOG_LEVEL_DEBUG, "I'm refreshing BTC price");
    send_cmd();
  }
}

static void select_click_handler(ClickRecognizerRef recognizer, void *context) {
  text_layer_set_text(btc_layer, "Loading...");
  send_cmd();
}

static void click_config_provider(void *context) {
  window_single_click_subscribe(BUTTON_ID_SELECT, select_click_handler);
}

static void rounded_layer_update_callback(Layer *me, GContext *ctx) {
  graphics_context_set_fill_color(ctx, GColorWhite);
  graphics_context_set_stroke_color(ctx, GColorBlack);
  graphics_fill_rect(ctx, GRect(6, 112, 132, 50), 10, GCornersAll);
}

static void create_time_layer(Layer *root_layer) {
  time_layer = text_layer_create(GRect(0, 0, 144, 56));
  text_layer_set_text_alignment(time_layer, GTextAlignmentCenter);
  text_layer_set_font(time_layer,
                      fonts_get_system_font(FONT_KEY_ROBOTO_BOLD_SUBSET_49));
  text_layer_set_background_color(time_layer, GColorBlack);
  text_layer_set_text_color(time_layer, GColorWhite);
  layer_add_child(root_layer, text_layer_get_layer(time_layer));
}

static void create_date_layer(Layer *root_layer) {
  date_layer = text_layer_create(GRect(0, 56, 144, 56));
  text_layer_set_text_alignment(date_layer, GTextAlignmentCenter);
  text_layer_set_font(date_layer,
                      fonts_get_system_font(FONT_KEY_GOTHIC_28_BOLD));
  text_layer_set_background_color(date_layer, GColorBlack);
  text_layer_set_text_color(date_layer, GColorWhite);
  layer_add_child(root_layer, text_layer_get_layer(date_layer));
}

static void create_timestamp_layer(Layer *root_layer) {
  timestamp_layer = text_layer_create(GRect(10, 113, 124, 14));
  text_layer_set_text_alignment(timestamp_layer, GTextAlignmentCenter);
  text_layer_set_font(timestamp_layer,
                      fonts_get_system_font(FONT_KEY_GOTHIC_14));
  layer_add_child(root_layer, text_layer_get_layer(timestamp_layer));
  text_layer_set_text(timestamp_layer, "-:-");
}

static void create_btc_layer(Layer *root_layer) {
  btc_layer = text_layer_create(GRect(10, 128, 124, 33));
  text_layer_set_text_alignment(btc_layer, GTextAlignmentCenter);
  text_layer_set_font(btc_layer,
                      fonts_get_system_font(FONT_KEY_GOTHIC_28_BOLD));
  layer_add_child(root_layer, text_layer_get_layer(btc_layer));
}

static void create_rounded_layer(Layer *root_layer) {
  GRect frame = layer_get_frame(root_layer);

  rounded_layer = layer_create(frame);
  layer_set_update_proc(rounded_layer, rounded_layer_update_callback);
  layer_add_child(root_layer, rounded_layer);
}

static void window_load(Window *window) {
  const int inbound_size = 128;
  const int outbound_size = 128;

  Layer *root_layer = window_get_root_layer(window);

  create_time_layer(root_layer);
  create_date_layer(root_layer);
  create_rounded_layer(root_layer);
  create_timestamp_layer(root_layer);
  create_btc_layer(root_layer);

  tick_timer_service_subscribe(MINUTE_UNIT, handle_timechanges);

  app_message_open(inbound_size, outbound_size);

  Tuplet initial_values[] = {
    TupletCString(BTC_PRICE_KEY, "Loading..."),
    TupletCString(BTC_TIMESTAMP_KEY, "-:-")
  };

  app_sync_init(&sync, sync_buffer, sizeof(sync_buffer), initial_values,
                ARRAY_LENGTH(initial_values), sync_tuple_changed_callback,
                sync_error_callback, NULL);

  window_set_click_config_provider(window, click_config_provider);

  send_cmd();
}

static void window_unload(Window *window) {
  app_sync_deinit(&sync);

  layer_destroy(rounded_layer);

  text_layer_destroy(time_layer);
  text_layer_destroy(timestamp_layer);
  text_layer_destroy(btc_layer);
  text_layer_destroy(date_layer);
}

static void init(void) {
  window = window_create();
  window_set_background_color(window, GColorBlack);
  window_set_fullscreen(window, true);

  window_set_window_handlers(window, (WindowHandlers) {
    .load = window_load,
    .unload = window_unload,
  });

  window_stack_push(window, true);
}

static void deinit(void) {
  window_destroy(window);
}

int main(void) {
  init();
  app_event_loop();
  deinit();
}
