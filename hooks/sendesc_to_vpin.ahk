Sleep 100

if WinExist("ahk_exe VPinballX.exe") {
    WinActivate "ahk_exe VPinballX.exe"
    WinWaitActive "ahk_exe VPinballX.exe",, 1
    SendInput "{Esc}"
}

ExitApp