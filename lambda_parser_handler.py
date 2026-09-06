import json
import base64
import os
import tempfile
import subprocess
import sys


def lambda_handler(event, context):
    """
    AWS Lambda entry point.

    Input event:  { "pdf_base64": "<base64-encoded PDF bytes>" }
    Output:       { "statusCode": 200, "body": "<JSON string of parsed CV>" }
    """
    try:
        # 1. Validate input
        if "pdf_base64" not in event:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Missing pdf_base64 in event"})
            }

        # 2. Decode the base64 PDF bytes sent from Vercel
        pdf_bytes = base64.b64decode(event["pdf_base64"])

        # 3. Write PDF to /tmp (Lambda's only writable directory, up to 512 MB)
        with tempfile.NamedTemporaryFile(suffix=".pdf", dir="/tmp", delete=False) as tmp:
            tmp.write(pdf_bytes)
            tmp_path = tmp.name

        # 4. Run the Python parser script
        script_path = os.path.join(os.environ["LAMBDA_TASK_ROOT"], "pdf_parser_improved.py")

        result = subprocess.run(
            [sys.executable, script_path, tmp_path],
            capture_output=True,
            text=True,
            timeout=25,  # 25s timeout (Lambda total timeout is 30s)
            env={**os.environ, "PYTHONIOENCODING": "utf-8"}
        )

        # 5. Cleanup temp file (best-effort)
        try:
            os.unlink(tmp_path)
        except Exception:
            pass

        # 6. Return result
        if result.returncode != 0:
            return {
                "statusCode": 500,
                "body": json.dumps({
                    "error": "Parser script failed",
                    "details": result.stderr
                })
            }

        return {
            "statusCode": 200,
            "body": result.stdout  # Already a JSON string
        }

    except subprocess.TimeoutExpired:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": "Parser timed out after 25 seconds"})
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }