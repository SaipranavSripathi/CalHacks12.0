from data_loader import fetch_candidate_by_app_id, fetch_job_by_app_id

APP_ID = "f7960521-0395-45bd-8814-614b66f4f90c" 

cand = fetch_candidate_by_app_id(APP_ID)
print("\n=== Candidate Data ===")
print(cand)

job = fetch_job_by_app_id(APP_ID)
print("\n=== Job Data ===")
print(job)