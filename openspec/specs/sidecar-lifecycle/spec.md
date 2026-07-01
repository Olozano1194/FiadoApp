# Sidecar Lifecycle Specification

## Purpose

Ensure the Django sidecar process terminates when Tauri terminates or crashes, using a Windows Job Object. Prevents zombie `fiadoapp-backend.exe` processes.

## Requirements

### Requirement: Job Object Cleanup on Windows

The system SHALL create a Windows Job Object in `lib.rs` with `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`. The Django sidecar process handle SHALL be assigned to this Job Object at spawn time. This ensures the child process is killed when the parent (Tauri) exits, crashes, or is terminated via Task Manager.

#### Scenario: Normal close kills sidecar

- GIVEN Tauri is running with the Django sidecar
- WHEN the user closes the Tauri window normally
- THEN the `fiadoapp-backend.exe` process terminates
- AND no orphan process remains in Task Manager

#### Scenario: Task Manager termination kills sidecar

- GIVEN Tauri is running with the Django sidecar
- WHEN the user kills `FiadoApp.exe` via Task Manager
- THEN `fiadoapp-backend.exe` terminates automatically
- AND no zombie process remains

#### Scenario: Tauri crash kills sidecar

- GIVEN Tauri is running with the Django sidecar
- WHEN Tauri crashes unexpectedly
- THEN `fiadoapp-backend.exe` terminates automatically

### Requirement: Non-Windows Fallback

On non-Windows platforms, the system SHALL retain the existing `on_window_event` kill behavior. The Job Object logic SHALL be gated with `#[cfg(target_os = "windows")]`.

#### Scenario: macOS/Linux cleanup

- GIVEN the app runs on macOS or Linux
- WHEN the window close event fires
- THEN the existing `child.kill()` logic terminates the sidecar
