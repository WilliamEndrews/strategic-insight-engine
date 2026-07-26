@echo off
cd /d %~dp0

if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else (
    echo [AVISO] Ambiente virtual nao encontrado em venv\. Usando python do sistema.
)

echo.
echo =====================================
echo SUSE v2.0 - Treinamento do Modelo RF
echo =====================================
echo.

cd suse-ia

REM Instalar dependencias se necessario
pip install -r requirements.txt

echo.
echo Iniciando treinamento...
python train_model.py

pause
