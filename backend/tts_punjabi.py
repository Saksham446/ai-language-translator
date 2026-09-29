import sys
from gtts import gTTS

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 tts_punjabi.py <text> <output_file>")
        sys.exit(1)

    text = sys.argv[1]
    output_file = sys.argv[2]

    try:
        tts = gTTS(
            text=text,
            lang="pa",
            slow=False
        )

        tts.save(output_file)

        print("PUNJABI_TTS_SUCCESS")

    except Exception as error:
        print("PUNJABI_TTS_ERROR:", str(error))
        sys.exit(1)