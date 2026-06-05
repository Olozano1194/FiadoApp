use tauri::{
    Manager,
    WindowEvent,
};
use tauri_plugin_shell::ShellExt;
use std::sync::Mutex;

struct SidecarState {
    child: Mutex<Option<tauri_plugin_shell::process::CommandChild>>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .manage(SidecarState {
            child: Mutex::new(None),
        })
        .setup(|app| {
            // Spawn the Django sidecar
            let shell = app.shell();
            let sidecar_command = shell.sidecar("fiadoapp-backend")
                .expect("Failed to create sidecar command");

            let (mut rx, child) = sidecar_command
                .spawn()
                .expect("Failed to spawn sidecar");

            // Store the child handle for cleanup
            let state = app.state::<SidecarState>();
            *state.child.lock().unwrap() = Some(child);

            // Log sidecar output in background
            tauri::async_runtime::spawn(async move {
                while let Some(event) = rx.recv().await {
                    match event {
                        tauri_plugin_shell::process::CommandEvent::Stdout(line) => {
                            println!("[django] {}", String::from_utf8_lossy(&line));
                        }
                        tauri_plugin_shell::process::CommandEvent::Stderr(line) => {
                            eprintln!("[django:err] {}", String::from_utf8_lossy(&line));
                        }
                        tauri_plugin_shell::process::CommandEvent::Terminated(status) => {
                            eprintln!("[django] Process terminated: {:?}", status);
                        }
                        _ => {}
                    }
                }
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { .. } = event {
                let app = window.app_handle();
                let state = app.state::<SidecarState>();
                let mut guard = state.child.lock().unwrap();
                if let Some(child) = guard.take() {
                    let _ = child.kill();
                    println!("[tauri] Sidecar process killed");
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
