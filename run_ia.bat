@echo off
cd /d %~dp0

if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else (
    echo [AVISO] Ambiente virtual nao encontrado em venv\. Usando python do sistema.
)

cd suse-ia
python ia_engine.py
pause