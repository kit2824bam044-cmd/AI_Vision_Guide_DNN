from flask import Flask, request, send_file, after_this_request
import edge_tts
import asyncio
import tempfile
import os

app = Flask(__name__)


# Language → Natural Microsoft Neural Voice
VOICE_MAP = {
    "en-US": "en-US-JennyNeural",
    "ta-IN": "ta-IN-PallaviNeural",
    "hi-IN": "hi-IN-SwaraNeural",
    "fr-FR": "fr-FR-DeniseNeural",
    "es-ES": "es-ES-ElviraNeural",
}


@app.after_request
def add_cors(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


@app.route("/speak", methods=["POST"])
def speak():

    data = request.get_json()

    text = data.get("text", "").strip()
    language = data.get("language", "en-US")

    if not text:
        return {"error": "No text provided"}, 400

    voice = VOICE_MAP.get(
        language,
        "en-US-JennyNeural"
    )

    temp_file = tempfile.NamedTemporaryFile(
        suffix=".mp3",
        delete=False
    )

    audio_path = temp_file.name
    temp_file.close()

    async def generate_audio():
        communicate = edge_tts.Communicate(
            text,
            voice
        )

        await communicate.save(audio_path)

    try:

        asyncio.run(generate_audio())

        @after_this_request
        def cleanup(response):

            try:
                os.remove(audio_path)
            except Exception:
                pass

            return response

        return send_file(
            audio_path,
            mimetype="audio/mpeg"
        )

    except Exception as e:

        try:
            os.remove(audio_path)
        except Exception:
            pass

        return {
            "error": str(e)
        }, 500


@app.route("/")
def home():
    return "AI Vision Guide TTS Server Running!"


if __name__ == "__main__":

    print("====================================")
    print(" AI Vision Guide - TTS Server")
    print("====================================")
    print("Server running on http://127.0.0.1:5001")
    print("")

    app.run(
        host="127.0.0.1",
        port=5001,
        debug=False
    )