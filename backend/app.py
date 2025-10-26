import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
import aiohttp
import asyncio
from PyPDF2 import PdfReader

app = Flask(__name__)
CORS(app)
ACTIVEPIECES_ENDPOINT = "https://cloud.activepieces.com/api/v1/webhooks/jUFecMo9SCS0d5lt600EW"
# Async function to post resume text (not binary) to Activepieces
async def send_resume_to_activepieces(request, resume_text):
    job_id = request.form.get("job_id", "")
    job_description = request.form.get("job_description", "")
    email = request.form.get("email", "")
    app_id = request.form.get("app_id", "")

    payload = {
        "app_id": app_id,
        "job_id": job_id,
        "job_description": job_description,
        "email": email,
        "resume_text": resume_text
    }

    print(f"📤 Sending to ActivePieces: {payload}")

    async with aiohttp.ClientSession() as session:
        async with session.post(ACTIVEPIECES_ENDPOINT, json=payload) as resp:
            try:
                data = await resp.json()
            except Exception:
                data = await resp.text()
            return {"status": resp.status, "data": data}
@app.route("/upload_resume", methods=["POST"])
def upload_resume():
    try:
        if "resume" not in request.files:
            return jsonify({"error": "No resume uploaded"}), 400
        resume_file = request.files["resume"]
        # Read and extract text from PDF file
        pdf_reader = PdfReader(resume_file)
        resume_text = "\n".join([page.extract_text() or '' for page in pdf_reader.pages]) # Simple text extraction
        # If resume is empty, fallback/notify
        if not resume_text.strip():
            return jsonify({"error": "Resume seems empty or could not be read."}), 400
        # Send extracted text asynchronously to Activepieces endpoint
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(send_resume_to_activepieces(request, resume_text))
        print(result['data'])
        return jsonify(result)
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": "Server error", "details": str(e)}), 500
@app.route("/", methods=["GET"])
def home():
    return "Resume Upload API running"
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)