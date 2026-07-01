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
        .plugin(tauri_plugin_store::init())
        .manage(SidecarState {
            child: Mutex::new(None),
        })
        .setup(|app| {
            // ── Windows Job Object: ensure sidecar dies when parent exits ──
            #[cfg(target_os = "windows")]
            let _job = {
                use job_object::{Job, LimitFlags};
                let job = Job::new().expect("Failed to create Job Object");
                job.set_limit_flags(LimitFlags::JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE)
                    .expect("Failed to set Job Object limit");
                job
            };

            // Spawn the Django sidecar
            let shell = app.shell();
            let sidecar_command = shell.sidecar("fiadoapp-backend")
                .expect("Failed to create sidecar command");

            let spawn_result = sidecar_command.spawn();

            match spawn_result {
                Err(e) => {
                    // El sidecar no pudo iniciar — antivirus, permisos, _internal faltante, etc.
                    eprintln!("[tauri] ERROR: No se pudo iniciar el backend: {}", e);
                    // La UI mostrará el error de conexión y el usuario puede revisar los logs
                    // en %APPDATA%\FiadoApp\backend.log
                }
                Ok((mut rx, child)) => {
                    // ── Assign sidecar to Windows Job Object ──
                    #[cfg(target_os = "windows")]
                    _job.assign_process(child.pid() as u32)
                        .expect("Failed to assign sidecar to Job Object");

                    // Guardar el handle del proceso para limpiar al cerrar
                    let state = app.state::<SidecarState>();
                    *state.child.lock().unwrap() = Some(child);

                    // Registrar output del sidecar en background para diagnóstico
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
                                    eprintln!(
                                        "[django] Proceso terminado — código: {:?}, señal: {:?}",
                                        status.code,
                                        status.signal
                                    );
                                }
                                _ => {}
                            }
                        }
                    });
                }
            }

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
