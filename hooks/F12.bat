@echo off
:: Envoie un appui sur la touche F12
powershell -command "$wshell = New-Object -ComObject wscript.shell; $wshell.SendKeys('{F12}')"