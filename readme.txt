you have two folders
#for frontend
run cd documents/student_analysis/frontend
npm run dev
(optional) npm i vite@latest
(optional) npm i tailwindcss @tailwindcss/vite


#for backend
run cd documents/student_analysis/backend
npm run dev


#for ML SERVICES(Predictions, Classification, Clustering)
python -m uvicorn backend.ml_services.main:app --host 127.0.0.1 --port 8000 --reload --log-level debug
pip install fastapi uvicorn
pip install numpy pandas scikit-learn
uvicorn backend.ml_services.main:app --host 127.0.0.1 --port 8000 --reload --log-level debug



THIS PROJECT USES BROWSER LOCAL STORAGE NOTA A DATABASE FOR DATA MANIPULATION!!!!!