use tauri::Manager;

pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      #[cfg(debug_assertions)]
      println!("Tauri app starting up...");

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Warn) // Only show warnings and errors
            .build(),
        )?;
      }

      // Get the main window
      let main_window = app.get_webview_window("main").unwrap();
      #[cfg(debug_assertions)]
      println!("Main window created successfully");

      // Force the window to be visible and focused
      main_window.show()?;
      main_window.set_focus()?;
      #[cfg(debug_assertions)]
      println!("Window should now be visible");

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
