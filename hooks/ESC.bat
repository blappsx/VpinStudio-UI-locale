@echo off
:: Envoie un appui sur la touche Échap
powershell -command "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys('{ESC}')"