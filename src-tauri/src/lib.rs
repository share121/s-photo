// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command(async)]
fn move_file(from: &str, to: &str) -> Result<(), String> {
    std::fs::rename(from, to).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![move_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
